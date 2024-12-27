from neo4j import GraphDatabase
import uuid

'''
neo4j.py [Database Operation]

1.  `__init__`:                 Initializes the Neo4j database connection.  
2.  `close`:                    Closes the database connection.

[ User Anw Node ]
3.  `save_answer`:              (Creates) Saves a user's answer to a question in the database.  
4.  `_create_answer_record`:    (Creates) an `Answer` node linked to a `User` node.  

[ User Node ]
5.  `update_user_model`:        (Updates) properties of a user node.  
6.  `_update_user_record`:      (Updates) properties dynamically.  
7.  `get_user_by_id`:           (Read) retirve a user node by its ID.  
8.  `_find_user_by_id`:         (Read) fetch a user node by ID. 

[ Chat History Node ]
9.  `get_all_chat_histories`:   (Read) Fetches the latest chat history for a session.  
10. `delete_chat_history`:      (Deletes) chat history associated with a session. 

[ Session Node ]
11. `get_session`:              (Read) Retrieves or creates a user session.  
12. `_get_latest_user_session`: (Read) Fetches the most recent session for a user.  
13. `_create_user_session`:     (Creates) a new session node for a user.  
14. `get_sessions_for_user`:    (Read) Retrieves all sessions associated with a user.  
15. `_find_sessions_for_user`:  (Read) fetch user sessions.  

[ ? ]
16. `create_vector_index`:      Creates vector indexes for `Question` and `Answer` nodes.  
17. `create_constraints`:       Creates uniqueness constraints for nodes (`Question`, `Answer`, `User`, `Tag`).  

'''

class Neo4jDatabase:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def save_answer(self, user_id, question, answer, is_correct):
        with self.driver.session() as session:
            session.write_transaction(self._create_answer_record, user_id, question, answer, is_correct)

    @staticmethod
    def _create_answer_record(tx, user_id, question, answer, is_correct):
        tx.run(
            """
            MERGE (u:User {id: $user_id})
            CREATE (a:Answer {question: $question, answer: $answer, isCorrect: $is_correct, timestamp: datetime()})
            CREATE (u)-[:SUBMITTED]->(a)
            """,
            user_id=user_id,
            question=question,
            answer=answer,
            is_correct=is_correct
        )

    def update_user_model(self, user_id, properties):
        with self.driver.session() as session:
            session.write_transaction(self._update_user_record, user_id, properties)

    @staticmethod
    def _update_user_record(tx, user_id, properties):
        set_clauses = [f"u.{key} = ${key}" for key in properties]
        set_clause = ", ".join(set_clauses)
        query = f"""
        MERGE (u:User {{id: $user_id}})
        SET {set_clause}
        """
        properties['user_id'] = user_id
        tx.run(query, **properties)

    def get_user_by_id(self, user_id):
        with self.driver.session() as session:
            result = session.read_transaction(self._find_user_by_id, user_id)
            return result

    @staticmethod
    def _find_user_by_id(tx, user_id):
        query = """
        MATCH (u:User {id: $user_id})
        RETURN u
        """
        result = tx.run(query, user_id=user_id)
        record = result.single()
        return record["u"] if record else None


    def get_all_chat_histories(self, session_id):
        with self.driver.session() as session:
            query = """
            MATCH (s:Session)-[:LAST_MESSAGE]->(last_message)
            WHERE s.id = $session_id
            WITH last_message
            MATCH p=(last_message)<-[:NEXT*0..6]-(previous_messages)
            WITH p, length(p) AS path_length
            ORDER BY path_length DESC
            LIMIT 1
            UNWIND reverse(nodes(p)) AS node
            RETURN {data: {content: node.content}, type: node.type} AS result
            """
            result = session.run(query, session_id=session_id)
            return [record["result"] for record in result]

    def delete_chat_history(self, session_id):
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (s:Session {id: $session_id})-[:LAST_MESSAGE]->(last_message)
                OPTIONAL MATCH (last_message)<-[:NEXT*0..]-(messages)
                WITH last_message, COLLECT(messages) AS all_messages
                // Delete relationships first
                FOREACH (msg IN all_messages | 
                    DETACH DELETE msg
                )
                // Now delete the last message
                DETACH DELETE last_message
                RETURN COUNT(all_messages) AS deleted_count
                """,
                session_id=session_id
            )
            return result

    def get_session(self, user_id):
        with self.driver.session() as session:
            existing_session = session.read_transaction(self._get_latest_user_session, user_id)
            if not existing_session:
                session_id = session.write_transaction(self._create_user_session, user_id)
                return {"message": "Session created for user", "user_id": user_id, "session_id": session_id}
            else:
                # Extract session details from the existing session record
                session_id = existing_session["s"]["id"]
                return {
                    "message": "Latest session already exists for user",
                    "user_id": user_id,
                    "session_id": session_id
                }

    @staticmethod
    def _get_latest_user_session(tx, user_id):
        query = """
        MATCH (u:User {id: $user_id})-[:HAS_SESSION]->(s:Session)
        RETURN s
        ORDER BY s.timestamp DESC
        LIMIT 1
        """
        result = tx.run(query, user_id=user_id)
        return result.single()

    @staticmethod
    def _create_user_session(tx, user_id):
        session_id = str(uuid.uuid4())  # Generate a unique session ID
        tx.run(
            """
            MERGE (u:User {id: $user_id})
            CREATE (s:Session {id: $session_id, timestamp: datetime()})
            CREATE (u)-[:HAS_SESSION]->(s)
            """,
            user_id=user_id,
            session_id=session_id
        )
        return session_id
    
    # get all sessions for a user
    def get_sessions_for_user(self, user_id):
        with self.driver.session() as session:
            sessions = session.read_transaction(self._find_sessions_for_user, user_id)
            return sessions

    @staticmethod
    def _find_sessions_for_user(tx, user_id):
        query = """
        MATCH (u:User {id: $user_id})-[:HAS_SESSION]->(s:Session)
        RETURN s.id AS session_id, s.question AS question, s.timestamp AS timestamp
        """
        result = tx.run(query, user_id=user_id)
        sessions = []
        for record in result:
            sessions.append({
                "session_id": record["session_id"],
                "question": record["question"],
                "timestamp": record["timestamp"]
            })
        return sessions


# stackoverflow questions
def create_vector_index(driver) -> None:
    index_query = "CREATE VECTOR INDEX stackoverflow IF NOT EXISTS FOR (m:Question) ON m.embedding"
    try:
        driver.query(index_query)
    except:  # Already exists
        pass
    index_query = "CREATE VECTOR INDEX top_answers IF NOT EXISTS FOR (m:Answer) ON m.embedding"
    try:
        driver.query(index_query)
    except:  # Already exists
        pass

# stackoverflow questions
def create_constraints(driver):
    driver.query(
        "CREATE CONSTRAINT question_id IF NOT EXISTS FOR (q:Question) REQUIRE (q.id) IS UNIQUE"
    )
    driver.query(
        "CREATE CONSTRAINT answer_id IF NOT EXISTS FOR (a:Answer) REQUIRE (a.id) IS UNIQUE"
    )
    driver.query(
        "CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE (u.id) IS UNIQUE"
    )
    driver.query(
        "CREATE CONSTRAINT tag_name IF NOT EXISTS FOR (t:Tag) REQUIRE (t.name) IS UNIQUE"
    )


