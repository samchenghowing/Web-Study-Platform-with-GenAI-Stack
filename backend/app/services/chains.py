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
        user_input: str, callbacks: List[Any], prompt=chat_prompt
    ) -> str:
        chain = prompt | llm
        answer = chain.invoke(
            {"question": user_input}, config={"callbacks": callbacks}
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

def configure_qa_rag_chain(llm, url, username, password, embeddings):
    # RAG response
    general_system_template = """ 
    Use the following pieces of context to answer the question at the end.
    The context contains question-answer pairs and their links from Stackoverflow.
    You should prefer information from accepted or more upvoted answers.
    Make sure to rely on information from the answers and not on questions to provide accurate responses.
    When you find particular answer in the context useful, make sure to cite it in the answer using the link.
    If you don't know the answer, just say that you don't know, don't try to make up an answer.
    ----
    {summaries}
    ----
    Each answer you generate should contain a section at the end of links to 
    Stackoverflow questions and answers you found useful, which are described under Source value.
    You can only use links to StackOverflow questions that are present in the context and always
    add links to the end of the answer in the style of citations.
    Generate concise answers with references sources section of links to 
    relevant StackOverflow questions only at the end of the answer.
    """
    general_user_template = "Question:```{question}```"
    messages = [
        SystemMessagePromptTemplate.from_template(general_system_template),
        MessagesPlaceholder(variable_name="chat_history"),
        HumanMessagePromptTemplate.from_template(general_user_template),
    ]
    qa_prompt = ChatPromptTemplate.from_messages(messages)

    def generate_llm_output(
        sid: str, question: str, callbacks: List[Any], prompt=qa_prompt
    ) -> str:

        qa_chain = create_stuff_documents_chain(llm, prompt)

        neo4j_history = Neo4jChatMessageHistory(
            session_id=sid,
            url=url,
            username=username,
            password=password,
        ),
        conversational_memory = ConversationBufferMemory(
            chat_memory=neo4j_history,
            memory_key="chat_history",
            return_messages=True,
            output_key="answer"
        )

        # Vector + Knowledge Graph response
        kg = Neo4jVector.from_existing_index(
            embedding=embeddings,
            url=url,
            username=username,
            password=password,
            database="neo4j",  # neo4j by default
            index_name="stackoverflow",  # vector by default
            text_node_property="body",  # text by default
            retrieval_query="""
        WITH node AS question, score AS similarity
        CALL  { with question
            MATCH (question)<-[:ANSWERS]-(answer)
            WITH answer
            ORDER BY answer.is_accepted DESC, answer.score DESC
            WITH collect(answer)[..2] as answers
            RETURN reduce(str='', answer IN answers | str + 
                    '\n### Answer (Accepted: '+ answer.is_accepted +
                    ' Score: ' + answer.score+ '): '+  answer.body + '\n') as answerTexts
        } 
        RETURN '##Question: ' + question.title + '\n' + question.body + '\n' 
            + answerTexts AS text, similarity as score, {source: question.link} AS metadata
        ORDER BY similarity ASC // so that best answers are the last
        """,
        )

        kg_qa = RetrievalQAWithSourcesChain(
            combine_documents_chain=qa_chain,
            memory=conversational_memory,
            retriever=kg.as_retriever(search_kwargs={"k": 2}),
            reduce_k_below_max_tokens=False,
            max_tokens_limit=3375,
        )
        answer = kg_qa.invoke(
            {"question": question}, 
            config={"callbacks": callbacks, "configurable": {"session_id": sid}}
        )
        return {"answer": answer}

    return generate_llm_output

def configure_grader_chain(llm, url, username, password, embeddings):
    # RAG response
    general_system_template = """You are a grader assessing the attributes of a generated question. \n 
    Evaluate the question based on the following criteria: difficulty, completeness, and experience points (XP)."""

    messages = [
        SystemMessagePromptTemplate.from_template(general_system_template),
        HumanMessagePromptTemplate.from_template("Generated question: \n\n {context} \n\n Evaluate the question."),
    ]
    qa_prompt = ChatPromptTemplate.from_messages(messages)

    def generate_llm_output(
        sid: str, question: str, callbacks: List[Any], prompt=qa_prompt
    ) -> str:
        
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
        rag_chain = llm.bind_tools([GradeDocuments]) | StrOutputParser()
        
        logging.info(f"Invoking grader chain with question: {question}")
        answer = rag_chain.invoke(question)
        logging.info(f"Grader chain response: {answer}")
        
        try:
            answer_dict = json.loads(answer)
            logging.info(f"Parsed grader response: {answer_dict}")
            return {"answer": answer_dict, "question_level": answer_dict["parameters"]}
        except json.JSONDecodeError as e:
            logging.error(f"Error decoding grader response: {e}")
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

#

def generate_task(user_id, neo4j_graph, llm_chain, session, grader_chain, callbacks=[]):
    preferences = get_user_preferences(neo4j_graph, user_id)
    if not preferences:
        return "User preferences not found."

    gen_system_template = f"""
        You are a programming teacher designing coding tasks for students.  
        Your task is to generate an HTML, CSS, or JavaScript code snippet **containing intentional errors** for students to fix.  

        ### **Requirements:**  
        - The question should be tailored to the student's preference:  
        {preferences}  
        - The generated code must be **syntactically incorrect or functionally flawed**.  
        - Ensure the error **aligns with the student's learning level** (beginner, intermediate, advanced).  
        - Do **not** include explanations or hints in your response.  
        - Do **not** add additional content of the response

        ### **Response Format:**  
        Provide the following details in your response:  
        1. **Title:** A concise title describing the task.  
        2. **Question:** A brief introduction to the task.  
        3. **Code Snippet:** The faulty code enclosed in triple backticks (```) with proper syntax highlighting (e.g., ```html, ```css, ```javascript).  
        4. **Difficulty:** easy / medium / hard.  
        5. **Completeness:** A percentage indicating how much of the code is correct.  
        6. **XP:** The experience points rewarded for completing the task.  
        7. **Notice**: add note if needed, dont added after the code 

        ---

        ### **Example Output:**  

        **Title:** Fix the syntax error in the JavaScript function  
        **Difficulty:** easy 
        **Completeness:** 80 % 
        **XP:** 10 
        **Question:** The following JavaScript function has a syntax error. Identify and fix it.  
        **Notice:"" Note code is missing a and the semantic the navigation menu.
        ```javascript
        function add(a, b) 
        return a + b // Missing semicolon
        
        console.log(add(3, 5);
        ```
        

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

    currentTopics = "I want to know more about these topics" , session.get("topics")

    llm_response = llm_chain(
        sid=session.get("session_id"),
        question=currentTopics,
        callbacks=callbacks,
        prompt=chat_prompt,
    )

    # Extract difficulty, completeness, and XP from the response
    response_parts = llm_response["answer"]
    question_id = str(uuid.uuid4())

    # Use the grader_chain to evaluate the generated question
    grader_response = grader_chain(
        sid=session.get("session_id"),
        question=response_parts,
        callbacks=callbacks,
    )

    evaluated_difficulty = grader_response["question_level"]["difficulty"]
    evaluated_completeness = grader_response["question_level"]["completeness"]
    evaluated_xp = grader_response["question_level"]["xp"]

    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    # Store the question in Neo4j
    neo4j_db.create_question_node(
        session_id=session.get("session_id"),
        question_id=question_id,
        question_text=response_parts,
        difficulty=evaluated_difficulty,
        completeness=evaluated_completeness,
        xp=evaluated_xp
    )
    logging.info(f"Question node created for session: {session.get('session_id')} with question ID: {question_id}")

    return llm_response

def check_quiz_correctness(user_id, llm_chain, question_node, task, answer, callbacks=[]):
    gen_system_template = f"""
    You're a programming teacher and you have created below question for student. 
    {task}
    Your evulation should only follow the scope of your question.
    You must not include response which does not in the scope of your question.
    Your coding hints should include all the original code from student.
    """
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

    llm_response = llm_chain(
        sid=question_node.get("session_id"),
        question=answer, # student's answer send to llm
        callbacks=callbacks,
        prompt=chat_prompt,
    )
    # retrieve_pdf_chunks_by_similarity(answer, embeddings, url, username, password, top_k=5)

    return llm_response

def convert_question_to_attribute(question, llm):
    # change to embedding??
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
    print(answer)
    answer_dict = json.loads(answer)
    attribute = answer_dict["parameters"]["attribute"].replace(" ", "_")
    print(attribute)
    return attribute

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

    currentTopics = "Could you suggest the learning path for me?"

    llm_response = llm_chain(
        sid=session.get("session_id"),
        question=currentTopics,
        callbacks=callbacks,
        prompt=chat_prompt,
    )
    return llm_response

def retrieve_pdf_chunks_by_similarity(query: str, embeddings, url: str, username: str, password: str, top_k: int = 5):
    vector_store = Neo4jVector(
        embedding=embeddings,
        url=url,
        username=username,
        password=password,
        index_name="pdf_bot",
        node_label="PdfBotChunk"
    )
    retriever = vector_store.as_retriever(search_kwargs={"k": top_k})
    results = retriever.get_relevant_documents(query)
    return results
