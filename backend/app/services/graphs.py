import operator

from typing_extensions import Annotated
from typing import List, TypedDict, Sequence, TypedDict
from bs4 import BeautifulSoup as Soup
from pydantic import BaseModel, Field

from langchain_core.messages import ToolMessage, BaseMessage
from langchain_core.documents import Document
from langchain_core.tools import tool
from typing import List, Tuple

from langchain.prompts import (
    ChatPromptTemplate,
)

from langchain_core.messages import HumanMessage
from langchain_community.document_loaders.recursive_url_loader import RecursiveUrlLoader

from langgraph.graph import END, StateGraph, START

from langgraph.prebuilt import InjectedState
from langgraph.prebuilt import ToolNode

'''
graph.py [ Ai Model Tool ]

1. self_correction_graph:   Builds a state graph workflow for generating, validating, and refining code solutions using LCEL documentation and an LLM.
2. generate:                Generates a code solution based on user input and LCEL documentation.
3. code_check:              Validates the generated code by checking imports and execution for errors.
4. reflect:                 Reflects on errors found during validation and attempts to improve the code solution.
5. decide_to_finish:        Determines whether to retry, reflect, or finish based on error status and iteration count.

6. ollama_test_tools:       Tests LLM tools for performing addition and multiplication using structured input.
7. ollama_test_graph_tools: Builds a state graph workflow for answering user queries with context retrieval, citation, and tool execution.

'''

def self_correction_graph(llm):
    # LCEL docs
    url = "https://python.langchain.com/v0.2/docs/concepts/#langchain-expression-language-lcel"
    loader = RecursiveUrlLoader(
        url=url, max_depth=20, extractor=lambda x: Soup(x, "html.parser").text
    )
    docs = loader.load()

    # Sort the list based on the URLs and get the text
    d_sorted = sorted(docs, key=lambda x: x.metadata["source"])
    d_reversed = list(reversed(d_sorted))
    concatenated_content = "\n\n\n --- \n\n\n".join(
        [doc.page_content for doc in d_reversed]
    )

    ### Anthropic

    # Prompt to enforce tool use
    code_gen_prompt_claude = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """ You are a coding assistant with expertise in LCEL, LangChain expression language. \n 
        Here is the LCEL documentation:  \n ------- \n  {context} \n ------- \n Answer the user  question based on the \n 
        above provided documentation. Ensure any code you provide can be executed with all required imports and variables \n
        defined. Structure your answer: 1) a prefix describing the code solution, 2) the imports, 3) the functioning code block. \n
        Invoke the code tool to structure the output correctly.  \n Here is the user question:""",
            ),
            ("placeholder", "{messages}"),
        ]
    )


    # Data model
    class code(BaseModel):
        """Code output"""

        prefix: str = Field(description="Description of the problem and approach")
        imports: str = Field(description="Code block import statements")
        code: str = Field(description="Code block not including import statements")
        # description = "Schema for code solutions to questions about LCEL."

    # LLM
    structured_llm_ollama = llm.bind_tools([code])

    # No re-try
    code_gen_chain = code_gen_prompt_claude | structured_llm_ollama

    class GraphState(TypedDict):
        """
        Represents the state of our graph.

        Attributes:
            error : Binary flag for control flow to indicate whether test error was tripped
            messages : With user question, error messages, reasoning
            generation : Code solution
            iterations : Number of tries
        """

        error: str
        messages: List
        generation: str
        iterations: int

    ### Parameter

    # Max tries
    max_iterations = 3
    # Reflect
    # flag = 'reflect'
    flag = "do not reflect"

    ### Nodes


    def generate(state: GraphState):
        """
        Generate a code solution

        Args:
            state (dict): The current graph state

        Returns:
            state (dict): New key added to state, generation
        """

        print("---GENERATING CODE SOLUTION---")

        # State
        messages = state["messages"]
        iterations = state["iterations"]
        error = state["error"]

        # We have been routed back to generation with an error
        if error == "yes":
            messages += [
                (
                    "user",
                    "Now, try again. Invoke the code tool to structure the output with a prefix, imports, and code block:",
                )
            ]

        # Solution
        code_solution = code_gen_chain.invoke(
            {"context": concatenated_content, "messages": messages}
        )
        messages += [
            (
                "assistant",
                f"{code_solution.prefix} \n Imports: {code_solution.imports} \n Code: {code_solution.code}",
            )
        ]

        # Increment
        iterations = iterations + 1
        return {"generation": code_solution, "messages": messages, "iterations": iterations}


    def code_check(state: GraphState):
        """
        Check code

        Args:
            state (dict): The current graph state

        Returns:
            state (dict): New key added to state, error
        """

        print("---CHECKING CODE---")

        # State
        messages = state["messages"]
        code_solution = state["generation"]
        iterations = state["iterations"]

        # Get solution components
        imports = code_solution.imports
        code = code_solution.code

        # Check imports
        try:
            exec(imports)
        except Exception as e:
            print("---CODE IMPORT CHECK: FAILED---")
            error_message = [("user", f"Your solution failed the import test: {e}")]
            messages += error_message
            return {
                "generation": code_solution,
                "messages": messages,
                "iterations": iterations,
                "error": "yes",
            }

        # Check execution
        try:
            exec(imports + "\n" + code)
        except Exception as e:
            print("---CODE BLOCK CHECK: FAILED---")
            error_message = [("user", f"Your solution failed the code execution test: {e}")]
            messages += error_message
            return {
                "generation": code_solution,
                "messages": messages,
                "iterations": iterations,
                "error": "yes",
            }

        # No errors
        print("---NO CODE TEST FAILURES---")
        return {
            "generation": code_solution,
            "messages": messages,
            "iterations": iterations,
            "error": "no",
        }


    def reflect(state: GraphState):
        """
        Reflect on errors

        Args:
            state (dict): The current graph state

        Returns:
            state (dict): New key added to state, generation
        """

        print("---GENERATING CODE SOLUTION---")

        # State
        messages = state["messages"]
        iterations = state["iterations"]
        code_solution = state["generation"]

        # Prompt reflection

        # Add reflection
        reflections = code_gen_chain.invoke(
            {"context": concatenated_content, "messages": messages}
        )
        messages += [("assistant", f"Here are reflections on the error: {reflections}")]
        return {"generation": code_solution, "messages": messages, "iterations": iterations}


    ### Edges


    def decide_to_finish(state: GraphState):
        """
        Determines whether to finish.

        Args:
            state (dict): The current graph state

        Returns:
            str: Next node to call
        """
        error = state["error"]
        iterations = state["iterations"]

        if error == "no" or iterations == max_iterations:
            print("---DECISION: FINISH---")
            return "end"
        else:
            print("---DECISION: RE-TRY SOLUTION---")
            if flag == "reflect":
                return "reflect"
            else:
                return "generate"


    workflow = StateGraph(GraphState)

    # Define the nodes
    workflow.add_node("generate", generate)  # generation solution
    workflow.add_node("check_code", code_check)  # check code
    workflow.add_node("reflect", reflect)  # reflect

    # Build graph
    workflow.add_edge(START, "generate")
    workflow.add_edge("generate", "check_code")
    workflow.add_conditional_edges(
        "check_code",
        decide_to_finish,
        {
            "end": END,
            "reflect": "reflect",
            "generate": "generate",
        },
    )
    workflow.add_edge("reflect", "generate")
    app = workflow.compile()

    question = "How can I directly pass a string to a runnable and use it to construct the input needed for my prompt?"
    app.invoke({"messages": [("user", question)], "iterations": 0})
