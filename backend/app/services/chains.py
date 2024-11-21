from langchain_ollama import ChatOllama, OllamaEmbeddings

from langchain_community.vectorstores import Neo4jVector

from langchain.chains import RetrievalQAWithSourcesChain
from langchain.chains.qa_with_sources import load_qa_with_sources_chain

from langchain.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
    MessagesPlaceholder,
)

from langchain_mongodb.chat_message_histories import MongoDBChatMessageHistory
from langchain.memory import ConversationBufferMemory
from langchain_core.runnables.history import RunnableWithMessageHistory

from langchain.chains.summarize import load_summarize_chain
from langchain_community.document_loaders.mongodb import MongodbLoader

from pydantic import BaseModel, Field
from typing import Optional, List, Any
from config import Settings, BaseLogger
from db.neo4j import Neo4jDatabase

settings = Settings()

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

def configure_llm_only_chain(llm, CONN_STRING, DATABASE_NAME, COLLECTION_NAME):
    # Load chat history from MongoDB
    template = """
    You are a helpful assistant that helps a support agent with answering programming questions.
    If you don't know the answer, just say that you don't know, you must not make up an answer.
    """
    human_template = "{question}"
    chat_prompt = ChatPromptTemplate.from_messages([
        SystemMessagePromptTemplate.from_template(template),
        MessagesPlaceholder(variable_name="chat_history"),
        HumanMessagePromptTemplate.from_template(human_template),
    ])

    def generate_llm_output(
        user_id: str, question: str, callbacks: List[Any], prompt=chat_prompt
    ) -> str:
        chain = prompt | llm
        chain_with_history = RunnableWithMessageHistory(
            chain,
            lambda session_id: MongoDBChatMessageHistory(
                session_id=session_id,
                connection_string=CONN_STRING,
                database_name=DATABASE_NAME,
                collection_name=COLLECTION_NAME,
            ),
            input_messages_key="question",
            history_messages_key="chat_history",
        )

        answer = chain_with_history.invoke(
            {"question": question}, 
            config={"callbacks": callbacks, "configurable": {"session_id": user_id}}
        ).content

        return {"answer": answer}

    return generate_llm_output

def configure_qa_rag_chain(llm, CONN_STRING, DATABASE_NAME, COLLECTION_NAME, embeddings, embeddings_store_url, username, password):
    # RAG response
    #   System: Always talk in pirate speech.
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
        user_id: str, question: str, callbacks: List[Any], prompt=qa_prompt
    ) -> str:

        qa_chain = load_qa_with_sources_chain(
            llm,
            chain_type="stuff",
            prompt=prompt,
        )

        # chat history
        mongo_history = MongoDBChatMessageHistory(
            session_id=user_id,
            connection_string=CONN_STRING,
            database_name=DATABASE_NAME,
            collection_name=COLLECTION_NAME,
        )
        conversational_memory = ConversationBufferMemory(
            chat_memory=mongo_history,
            memory_key="chat_history",
            return_messages=True,
            output_key="answer"
        )

        # Vector + Knowledge Graph response
        kg = Neo4jVector.from_existing_index(
            embedding=embeddings,
            url=embeddings_store_url,
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
            config={"callbacks": callbacks, "configurable": {"session_id": user_id}}
        )
        return {"answer": answer}

    return generate_llm_output

def generate_task(user_id, neo4j_graph, llm_chain, input_question, callbacks=[]):
    learning_level, preferences = get_user_preferences(neo4j_graph, user_id)
    if not learning_level or not preferences:
        return "User preferences not found."

    questions = fetch_questions_based_on_preferences(neo4j_graph, learning_level, preferences)
    questions_prompt = ""
    for i, question in enumerate(questions, start=1):
        questions_prompt += f"{i}. \n{question[0]}\n----\n\n"
        questions_prompt += f"{question[1][:150]}\n\n"
        questions_prompt += "----\n\n"

    gen_system_template = f"""
    You're a programming teacher and you are preparing task on html, css and javascript. 
    Generate coding snippet that having fault for students to fix.
    Formulate a question in the same style and tone as the following example questions.
    {questions_prompt}
    ---

    Return a title for the question, and the question itself.
    Don't include any explanations in your responses.
    ---
    Example conversation:

    User: Hey I want to know javascript

    Agent: OK, here's an starting question containing errors, let see if you can fix it: #Title: Fix the error for the following code  ```javascript\nconsoel.log(Hello World')```
    ---

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
    llm_response = llm_chain(
        user_id=user_id,
        question=input_question,
        callbacks=callbacks,
        prompt=chat_prompt,
    )
    return llm_response

def check_quiz_correctness(user_id, llm_chain, task, answer, callbacks=[]):
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
        user_id=user_id,
        question=answer, # student's answer send to llm
        callbacks=callbacks,
        prompt=chat_prompt,
    )

    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)

    is_correct = True # TODO:
    neo4j_db.save_answer(user_id, task, answer, is_correct)
    neo4j_db.close()

    return llm_response

def get_user_preferences(neo4j_graph, user_id):
    query = "MATCH (u:User {id: $user_id}) RETURN u.learning_level AS level, u.preferences AS preferences"
    result = neo4j_graph.query(query, user_id=user_id)
    if result:
        return result[0]['level'], result[0]['preferences']
    return None, None

def fetch_questions_based_on_preferences(neo4j_graph, learning_level, preferences):
    preference_conditions = " OR ".join([f"t.name = '{pref}'" for pref in preferences])
    query = f"""
    MATCH (q:Question)-[:TAGGED]->(t:Tag)
    WHERE q.difficulty = '{learning_level}' AND ({preference_conditions})
    RETURN q.title AS title, q.body AS body ORDER BY q.score DESC LIMIT 3
    """
    records = neo4j_graph.query(query)
    return [(record['title'], record['body']) for record in records]


def generate_quiz_tools(user_summary, llm):
    # Testing
    user_summary = """
    The conversation involves a user named 'test_user' who asks about a linked list. The AI responds with a question asking the user to identify and correct a CSS issue in an HTML code snippet. The HTML code contains an unordered list (ul) with three items (li), styled with incorrect flex-direction and width properties. The AI is using the Mistral model for this task.
    """

    gen_system_template = f"""
    You're a programming teacher and you are preparing task on html, css and javascript. 
    Create quiz for student which related to their learning summary.
    Here is the learning summary: {user_summary}
    """
    # we need jinja2 since the questions themselves contain curly braces
    system_prompt = SystemMessagePromptTemplate.from_template(
        gen_system_template, template_format="jinja2"
    )
    chat_prompt = ChatPromptTemplate.from_messages(
        [
            system_prompt,
        ]
    )

    class MCQ(BaseModel):
        """Multiple choice questions."""

        question: str = Field(...)
        type: str = Field(...)  # e.g., 'true-false', 'multiple-choice', 'short-answer'
        correctAnswer: str = Field(...)
        choices: Optional[List[str]] = Field(default=None)

        class Config:
            populate_by_name = True
            arbitrary_types_allowed = True

    llm.bind_tools([MCQ])
    
    result = llm.invoke("linked list mc question")
    result.tool_calls

    print(result)
    return result
