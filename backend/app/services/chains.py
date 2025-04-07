import logging
import uuid
from langchain.chains import RetrievalQAWithSourcesChain
from langchain.chains.combine_documents import create_stuff_documents_chain

from langchain.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
    MessagesPlaceholder,
)
from langgraph.graph import START, END, StateGraph
from typing_extensions import TypedDict
from pprint import pprint

from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_neo4j import Neo4jVector, Neo4jChatMessageHistory
from langchain.memory import ConversationBufferMemory

from langchain_core.runnables.history import RunnableWithMessageHistory, RunnablePassthrough
from langchain_core.tools import tool

from langchain_core.output_parsers import StrOutputParser

from pydantic import BaseModel, Field
from typing import Optional, List, Any
from config import Settings, BaseLogger
from db.neo4j import Neo4jDatabase

import json

settings = Settings()

'''
chain.py [ ollama model Operation ]

1.  `load_embedding_model`:                  Loads an embedding model (`OllamaEmbeddings`) for text vectorization and logs the model used.  
2.  `load_llm`:                              Initializes a language model (`ChatOllama`) with configurable parameters and logs its setup. 

[ Model Setup ]
3.  `configure_llm_only_chain`:              Sets up an LLM chain for single-turn Q&A without conversation history.  
4.  `configure_llm_history_chain`:           Builds an LLM chain with conversation history using `Neo4jChatMessageHistory`.  
5.  `configure_qa_rag_chain`:                Configures a RAG chain with `Neo4jVector` for context-aware responses and tracks history.  

[ Assist function for AI ]
6.  `fetch_questions_based_on_preferences`:  Retrieves top-scoring questions from Neo4j matching user preferences.  
7.  `get_user_preferences`:                  Fetches user preferences from Neo4j using a user ID.  

[ AI function - Generate Question (Based on input) ]
8.  `generate_task`:                         Creates programming tasks based on user preferences fetched from Neo4j.  
9.  `check_quiz_correctness`:                Evaluates and provides feedback on student answers within task scope. 
10. `convert_question_to_attribute`:         Converts a question into a single-word attribute using the LLM.  
11. `create_questions_based_on_preferences`: Generating questions based on user preferences. ( To do ) 
12. `create_quiz`:                           Generates a personalized quiz based on user preferences and defines its structure (`MCQ`).  
'''

def load_embedding_model(embedding_model_name: str, logger=BaseLogger(), config={}):
    embeddings = OllamaEmbeddings(
        base_url=config["ollama_base_url"], 
        model=embedding_model_name,
    )
    logger.info("Embedding: Using ", embedding_model_name)
    return embeddings

def load_llm(llm_name: str, logger=BaseLogger(), config={}):
    logger.info(f"LLM: Using Ollama: {llm_name}")
    return ChatOllama(
        temperature=0,
        base_url=config["ollama_base_url"],
        model=llm_name,
        streaming=True,
        # seed=2,
        top_k=10,  # A higher value (100) will give more diverse answers, while a lower value (10) will be more conservative.
        top_p=0.3,  # Higher value (0.95) will lead to more diverse text, while a lower value (0.5) will generate more focused text.
        num_ctx=3072,  # Sets the size of the context window used to generate the next token.
    )

def configure_llm_only_chain(llm):
    # LLM only response
    template = """
    You are a helpful assistant that helps a support agent with answering programming questions.
    If you don't know the answer, just say that you don't know, you must not make up an answer.
    """
    system_message_prompt = SystemMessagePromptTemplate.from_template(template)
    human_template = "{question}"
    human_message_prompt = HumanMessagePromptTemplate.from_template(human_template)
    chat_prompt = ChatPromptTemplate.from_messages(
        [system_message_prompt, human_message_prompt]
    )

    def generate_llm_output(
        question: str, callbacks: List[Any], prompt=chat_prompt
    ) -> str:
        chain = prompt | llm
        answer = chain.invoke(
            {"question": question}, config={"callbacks": callbacks}
        ).content
        return {"answer": answer}

    return generate_llm_output

def configure_llm_history_chain(llm, url, username, password):
    # Load chat history from MongoDB
    template = """
    You are a helpful assistant that helps a support agent with answering programming questions.
    If you don't know the answer, just say that you don't know, you must not make up an answer.
    """
    chat_prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(template),
        MessagesPlaceholder(variable_name="chat_history"),
        HumanMessagePromptTemplate.from_template("{question}"),
    ])

    def generate_llm_output(
        sid: str, question: str, callbacks: List[Any], prompt=chat_prompt
    ) -> str:
        chain = prompt | llm
        chain_with_history = RunnableWithMessageHistory(
            chain,
            lambda session_id: Neo4jChatMessageHistory(
                session_id=session_id,
                url=url,
                username=username,
                password=password,
            ),
            input_messages_key="question",
            history_messages_key="chat_history",
        )

        answer = chain_with_history.invoke(
            {"question": question}, 
            config={"callbacks": callbacks, "configurable": {"session_id": sid}}
        ).content

        return {"answer": answer}

    return generate_llm_output

def configure_grader_chain(llm):
    general_system_template = """Extract the score of a generated question. \n """
    system_prompt = SystemMessagePromptTemplate.from_template(
        general_system_template, template_format="jinja2"
    )
    chat_prompt = ChatPromptTemplate.from_messages(
        [
            system_prompt,
            HumanMessagePromptTemplate.from_template("{question}"),
        ]
    )
    class GradeDocuments(BaseModel):
        """Evaluation scores for the generated question."""

        difficulty: float = Field(
            description="Difficulty score between 0 and 100"
        )
        completeness: float = Field(
            description="Completeness score between 0 and 100"
        )
        xp: float = Field(
            description="Experience points (XP) score between 0 and 100"
        )
    tool_chain = (
        {"question": RunnablePassthrough()}
        | chat_prompt
        | llm.bind_tools([GradeDocuments])
        | StrOutputParser()
    )

    def generate_llm_output(
        sid: str, question: str, callbacks: List[Any]
    ) -> str:
        answer = tool_chain.invoke(question)        
        # Remove Markdown code block if present
        if answer.startswith("```json") and answer.endswith("```"):
            answer = answer[7:-3].strip()
        
        try:
            answer_dict = json.loads(answer)
            return {"answer": answer_dict, "question_level": answer_dict}
        except json.JSONDecodeError as e:
            print(f"Error decoding grader response: {e}")
            return {"answer": "", "question_level": {"difficulty": 0, "completeness": 0, "xp": 0}}

    return generate_llm_output

def get_user_preferences(neo4j_graph, user_id):
    query = "MATCH (u:User {id: $user_id}) RETURN u"
    params = {'user_id': user_id}
    result = neo4j_graph.query(query, params)

    if result:
        user_properties = result[0]['u']
        return user_properties
    return None

def get_user_references(neo4j_graph, user_id, currentTopics, embeddings):
    query = "MATCH (u:User {id: $user_id}) RETURN u"
    params = {'user_id': user_id}
    result = neo4j_graph.query(query, params)

    if result:
        user_properties = retrieve_pdf_chunks_by_similarity(currentTopics, embeddings, url=settings.neo4j_uri, username=settings.neo4j_username, password=settings.neo4j_password, top_k=5)
        return user_properties
    return None

def retrieve_pdf_chunks_by_similarity(query: str, embeddings, url: str, username: str, password: str, top_k: int = 5):
    try:
        vector_store = Neo4jVector(
            embedding=embeddings,
            url=url,
            username=username,
            password=password,
            index_name="pdf_bot",
            node_label="PdfBotChunk"
        )
        retriever = vector_store.as_retriever(search_kwargs={"k": top_k})
        results = retriever.invoke(query)
        return results
    except Exception as e:
        print(f"Error retrieving PDF chunks: {e}")
        return "No references found."


def generate_task(user_id, neo4j_graph, llm_chain, session, grader_chain, embeddings, callbacks=[]):
    preferences = get_user_preferences(neo4j_graph, user_id)
    if not preferences:
        return "User preferences not found."

    currentTopics = "I want to know more about these topics " + json.dumps(session.get("topics"))
    references = get_user_references(neo4j_graph, user_id, currentTopics, embeddings)
    if not references:
        return "No references found."

    gen_system_template = f"""
    You are a programming teacher designing coding tasks for students.
    Your task is to generate a code snippet **containing intentional errors** for students to fix.
    ### Requirements:
    - The question should be tailored to the student's preference: {preferences}
    - The question should be related to the following reference: {references}
    - The generated code must be **functionally flawed**.
    - Ensure the error **aligns with the student's learning level** (beginner, intermediate, advanced).
    - Do NOT include explanations, corrected codes, or hints in your response.
    ### Response Format:
    1. **Title:** A concise title describing the task.
    2. **Difficulty:** easy / medium / hard.
    3. **Completeness:** A percentage indicating how much of the code is correct.
    4. **XP:** The experience points rewarded for completing the task.
    5. **Question:** A brief introduction to the task.
    ---
    Example Output:
    **Title:** Fix the syntax error in the JavaScript function
    **Difficulty:** easy
    **Completeness:** 80 %
    **XP:** 10
    **Question:** The following JavaScript function has a syntax error. Identify and fix it.
    ```javascript
    function add(a, b)
    return a + b
    console.log(add(3, 5);
    ```
    """
    system_prompt = SystemMessagePromptTemplate.from_template(gen_system_template, template_format="jinja2")
    chat_prompt = ChatPromptTemplate.from_messages([
        system_prompt,
        HumanMessagePromptTemplate.from_template("{question}")
    ])

    verification_template = """
    Verify that the following generated question meets all of these criteria:
    1. It is tailored to the student's preference: {{preferences}}.
    2. It is related to the following reference: {{references}}.
    3. It contains a code snippet with intentional errors.
    4. It follows the required response format (Title, Difficulty, Completeness, XP, Question).
    Generated question:
    {{generated_question}}
    If the question meets all the criteria, respond with "PASS". Otherwise, respond with "FAIL".
    """
    verification_system_prompt = SystemMessagePromptTemplate.from_template(verification_template, template_format="jinja2")
    verification_chat_prompt = ChatPromptTemplate.from_messages([
        verification_system_prompt,
        HumanMessagePromptTemplate.from_template("{question}")
    ])

    def generate_candidate(state):
        print("---GENERATE---")
        llm_response = state["llm_chain"](
            sid=state["session"].get("session_id"),
            question=state["currentTopics"],
            callbacks=state["callbacks"],
            prompt=state["chat_prompt"],
        )
        generated_question = llm_response.get("answer", "")
        state["generated_question"] = generated_question
        print("Generated question:", generated_question)
        return state

    def verify_candidate(state):
        print("---VERIFY---")
        verification_inputs = {
            "preferences": state["preferences"],
            "references": state["references"],
            "generated_question": state["generated_question"],
            "question": ""  # no extra human message required
        }
        ver_response = state["llm_chain"](
            sid=state["session"].get("session_id"),
            question=verification_inputs["question"],
            callbacks=state["callbacks"],
            prompt=state["verification_chat_prompt"],
        )
        verification_result = ver_response.get("answer", "").strip()  # Expect "PASS" or "FAIL"
        state["verification_result"] = verification_result
        print("Verification result:", verification_result)
        return state

    def decide_verification(state):
        print("---DECIDE---")
        if "pass" in state.get("verification_result", "").lower():
            print("Verification passed.")
            return "grade"
        else:
            print("Verification failed: " + state.get("verification_result", ""))
            # Return "generate" to retry generation on verification failure.
            return "generate"

    def grade_candidate(state):
        print("---GRADE---")
        question_to_grade = "Grade the following question: " + state["generated_question"]
        grader_response = state["grader_chain"](
            sid=state["session"].get("session_id"),
            question=question_to_grade,
            callbacks=state["callbacks"],
        )
        state["grader_details"] = grader_response
        state["evaluated_difficulty"] = grader_response["question_level"]["difficulty"]
        state["evaluated_completeness"] = grader_response["question_level"]["completeness"]
        state["evaluated_xp"] = grader_response["question_level"]["xp"]
        print("Grader response:", grader_response)
        return state

    def save_candidate(state):
        question_id = str(uuid.uuid4())
        neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
        neo4j_db.create_question_node(
            session_id=state["session"].get("session_id"),
            question_id=question_id,
            question_text=state["generated_question"],
            difficulty=state["evaluated_difficulty"],
            completeness=state["evaluated_completeness"],
            xp=state["evaluated_xp"]
        )
        state["question_id"] = question_id
        print(f"Verified question node created for session: {state['session'].get('session_id')} with question ID: {question_id}")
        return state

    class GraphState(TypedDict):
        preferences: str
        references: str
        currentTopics: str
        session: dict
        callbacks: list
        llm_chain: object
        grader_chain: object
        chat_prompt: object
        verification_chat_prompt: object
        generated_question: str
        verification_result: str
        grader_details: dict
        evaluated_difficulty: str
        evaluated_completeness: str
        evaluated_xp: (int)
        question_id: str

    # Build the workflow with the state schema.
    workflow = StateGraph(GraphState)
    workflow.add_node("generate", generate_candidate)
    workflow.add_node("verify", verify_candidate)
    workflow.add_node("grade", grade_candidate)
    workflow.add_node("save", save_candidate)

    workflow.add_edge(START, "generate")
    workflow.add_edge("generate", "verify")
    workflow.add_conditional_edges("verify", decide_verification, {
        "generate": "generate",
        "grade": "grade",
    })
    workflow.add_edge("grade", "save")
    workflow.add_edge("save", END)

    # Compile the workflow.
    app = workflow.compile()

    # Create the initial state.
    initial_state = {
        "preferences": preferences,
        "references": references,
        "currentTopics": currentTopics,
        "session": session,
        "callbacks": callbacks,
        "llm_chain": llm_chain,
        "grader_chain": grader_chain,
        "chat_prompt": chat_prompt,
        "verification_chat_prompt": verification_chat_prompt
        # Other keys (generated_question, verification_result, etc.) will be set as the workflow runs.
    }

    # Run the workflow. It will loop (via conditional edges) until generation passes verification.
    for output in app.stream(initial_state):
        for key, value in output.items():
            # Node
            pprint(f"Node '{key}':")
            # Optional: print full state at each node
            # pprint.pprint(value["keys"], indent=2, width=80, depth=None)
        pprint("\n---\n")

def check_quiz_correctness(user_id, llm_chain, question_node, task, answer, callbacks=[]):
    gen_system_template = f"""
    You're a programming teacher and you have created a coding task for students.
    The task is: {task}
    The student's answer is: {answer}
    Your task is to evaluate the student's answer and provide feedback.
    Your evulation should only follow the scope of your question.
    If the student answer correctly, return a congratulation message.
    If the student answer incorrectly, provide a corrected code to their answer.
    You must not include response which does not in the scope of your question.
    Your correction should be in the same format as the question.
    """
    system_prompt = SystemMessagePromptTemplate.from_template(
        gen_system_template, template_format="jinja2"
    )
    chat_prompt = ChatPromptTemplate.from_messages(
        [
            system_prompt,
            HumanMessagePromptTemplate.from_template("{question}"),
        ]
    )

    llm_response = llm_chain(
        question="please check the correctness of the answer",
        callbacks=callbacks,
        prompt=chat_prompt,
    )
    return llm_response

def convert_question_to_attribute(question, llm):
    gen_system_template = f"""
    Convert user question to a single word attribute.
    Do not return more than one word. 
    Do not return any Punctuation Marks. 
    Respond only one word or you will be unplugged.
    """
    # we need jinja2 since the questions themselves contain curly braces
    system_prompt = SystemMessagePromptTemplate.from_template(
        gen_system_template, template_format="jinja2"
    )
    class Attribute(BaseModel):
        """Convert user question to a single word attribute."""

        attribute: str = Field(
            description="A single word attribute"
        )
    chat_prompt = ChatPromptTemplate.from_messages(
        [
            system_prompt,
            HumanMessagePromptTemplate.from_template("{question}"),
        ]
    )
    tool_chain = (
        {"question": RunnablePassthrough()}
        | chat_prompt
        | llm.bind_tools([Attribute])
        | StrOutputParser()
    )
    answer = tool_chain.invoke(question)
    print("convert_question_to_attribute"+answer)
    try:
        # tools invoked
        answer_dict = json.loads(answer)
        attribute = answer_dict["parameters"]["attribute"].replace(" ", "_")
        return attribute
    except:
        return answer

def generate_lp(user_id, neo4j_graph, llm_chain, session, callbacks=[]):
    # TODO with TOOLS
    preferences = get_user_preferences(neo4j_graph, user_id)
    if not preferences:
        return "User preferences not found."

    gen_system_template = f"""
    You're a programming teacher and you want to design a learning path on learning html, css and javascript. 
    Generate learning path for student to learn html, css and javascript.
    The learning path should not exceed 5 steps.
    Make sure the learin path contain specific question/task base on student's prefrence below.
    {preferences}
    """
    # we need jinja2 since the questions themselves contain curly braces
    system_prompt = SystemMessagePromptTemplate.from_template(
        gen_system_template, template_format="jinja2"
    )
    chat_prompt = ChatPromptTemplate.from_messages(
        [
            system_prompt,
            MessagesPlaceholder(variable_name="chat_history"),
            HumanMessagePromptTemplate.from_template("{question}"),
        ]
    )

    currentTopics = "Could you suggest the learning path for me? I want a clear, step-by-step guide to learning web development. You should also tell me about some of the tools on the 'WebGenie' website (the website i am using) that can help me, no url need to provided, such as custom web development quizzes, collaborative learning with friends, and reliable learning resources from WebGenie."

    llm_response = llm_chain(
        sid=session.get("session_id"),
        question=currentTopics,
        callbacks=callbacks,
        prompt=chat_prompt,
    )
    return llm_response
