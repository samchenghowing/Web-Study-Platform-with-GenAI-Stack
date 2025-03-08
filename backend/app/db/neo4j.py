from neo4j import GraphDatabase
import uuid
import logging

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
11. `get_AIsession`:            (Read) Retrieves or creates a user AI session. 
11. `get_QUIZsession`:          (Read) Retrieves or creates a user QUIZ session. 
12. `create_session`            (Creates) creates a new Quiz session based on user prefence. 
13. `_get_latest_user_aisession`(Read) Fetches the most recent quiz session for a user.  
13. `_get_latest_user_quizsession(Read) Fetches the most recent quiz session for a user.  
14. `_create_user_session`:     (Creates) a new session node for a user. (user_id, question_count, topics, selected_pdfs, sname, score, current_question_count)

15. `get_quizsessions_for_user`:(Read) Retrieves all quiz sessions associated with a user.  
16. `_find_quizsessions_for_user(Read) fetch user quiz sessions.  
15. `get_sessions_for_user`:    (Read) Retrieves all AI sessions associated with a user.  
16. `_find_aisessions_for_user`:(Read) fetch user AI sessions.  

[ ? ]
17. `create_vector_index`:      Creates vector indexes for `Question` and `Answer` nodes.  
18. `create_constraints`:       Creates uniqueness constraints for nodes (`Question`, `Answer`, `User`, `Tag`).  

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

    def get_all_chat_histories_for_user(self, user_id):
        with self.driver.session() as session:
            query = """
            MATCH (u:User {id: $user_id})-[:HAS_SESSION]->(s:Session)-[:LAST_MESSAGE]->(last_message)
            WITH s, last_message
            MATCH p=(last_message)<-[:NEXT*0..]-(previous_messages)
            WITH s, p, length(p) AS path_length
            ORDER BY s.timestamp DESC, path_length DESC
            UNWIND reverse(nodes(p)) AS node
            WITH s.id AS session_id, COLLECT(DISTINCT {data: {content: node.content}, type: node.type}) AS results
            RETURN session_id, results
            """
            result = session.run(query, user_id=user_id)
            sessions = {}
            for record in result:
                sessions[record["session_id"]] = record["results"]
            return sessions

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

#####

    def get_AIsession(self, user_id):
        with self.driver.session() as session:
            existing_sessions = session.read_transaction(self._get_latest_user_aisession, user_id)

            if existing_sessions:
                # If an existing session is found, use the latest session
                session_id = existing_sessions["s"]["id"]  # Get the first session's ID
                return {
                    "message": "Latest session already exists for user",
                    "user_id": user_id,
                    "session_id": session_id
                }
            else:
                # If no session exists, create a new session
                session_id = session.write_transaction(self._create_user_session, user_id, "AI Chat", 0, [], [], None, None)
                return {
                    "message": "Session created for user", 
                    "user_id": user_id, 
                    "session_id": session_id
                }

    def get_QUIZsession(self, user_id):
        with self.driver.session() as session:
            existing_session = session.read_transaction(self._get_latest_user_quizsession, user_id)

            if not existing_session:
                session_id = session.write_transaction(self._create_user_session, user_id, "EMTPY QUIZ", 0, [], [], None, None)
                return {
                    "message": "Session created for user", 
                    "user_id": user_id, 
                    "session_id": session_id
                    }
            else:
                # Extract session details from the existing session record
                session_id = existing_session["s"]["id"]
                return {
                    "message": "Latest session already exists for user",
                    "user_id": user_id,
                    "session_id": session_id
                }
    
    def create_session(self, user_id, sname, question_count, topics, selected_pdfs):
        with self.driver.session() as session:
            session_id = session.write_transaction(self._create_user_session, user_id, sname, question_count, topics, selected_pdfs, None, None)

            sname=sname
            question_count=question_count
            topics=topics 
            selected_pdfs=selected_pdfs
            
            return {
                "message": "Session created for user", 
                "user_id": user_id, 
                "session_id": session_id,
                "session_name": sname,
                "question_count": question_count,
                "topics": topics,
                "selected_pdfs": selected_pdfs,
                }

    def update_session_name(self, session_id: str, new_name: str) -> bool:
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (s:Session {id: $session_id})
                SET s.sname = $new_name
                RETURN s
                """,
                session_id=session_id,
                new_name=new_name
            )

            return bool(result.single()) 

    def delete_session(self, session_id: str) -> dict:
        """
        Deletes a session and all its recursively related nodes downstream.
        
        Args:
            session_id (str): The ID of the session to delete.
        
        Returns:
            dict: A dictionary with 'success' (bool) and 'nodes_deleted' (int).
        
        Raises:
            ValueError: If session_id is empty or None.
            Exception: If the database operation fails.
        """
        if not session_id or not isinstance(session_id, str):
            raise ValueError("session_id must be a non-empty string")

        with self.driver.session() as session:
            try:
                result = session.run(
                    """
                    MATCH (s:Session {id: $session_id})
                    OPTIONAL MATCH (s)-[*]->(related)
                    DETACH DELETE s, related
                    WITH COUNT(s) AS session_count, COUNT(related) AS related_count
                    RETURN session_count > 0 AS success, 
                        (session_count + related_count) AS nodes_deleted
                    """,
                    session_id=session_id
                )
                record = result.single()
                return {
                    "success": record["success"],
                    "nodes_deleted": record["nodes_deleted"]
                }
            except Exception as e:
                raise Exception(f"Failed to delete session {session_id}: {str(e)}")


    @staticmethod
    def _get_latest_user_aisession(tx, user_id):
        query = """
        MATCH (u:User {id: $user_id})-[:HAS_SESSION]->(s:Session)
        WHERE s.question_count = 0 
        RETURN s
        LIMIT 1
        """
        result = tx.run(query, user_id=user_id)
        return result.single()

    @staticmethod
    def _get_latest_user_quizsession(tx, user_id):
        query = """
        MATCH (u:User {id: $user_id})-[:HAS_SESSION]->(s:Session)
        WHERE s.question_count <> 0 
        RETURN s
        LIMIT 1
        """
        result = tx.run(query, user_id=user_id)
        return result.single()

    @staticmethod
    def _create_user_session(tx, user_id, sname, question_count, topics, selected_pdfs, score, current_question_count):
        session_id = str(uuid.uuid4())  # Generate a unique session ID
        
        tx.run(
            """
            MERGE (u:User {id: $user_id})
            CREATE (s:Session {
                id: $session_id, 
                timestamp: datetime(), 
                sname: COALESCE(NULLIF($sname, ''), 'New Quiz'),
                question_count: COALESCE($question_count, 0), 
                topics: COALESCE($topics, []), 
                selected_pdfs: COALESCE($selected_pdfs, []), 
                score: COALESCE($score, 0),  
                current_question_count: COALESCE($current_question_count, 1)
            })
            CREATE (u)-[:HAS_SESSION]->(s)
 
            """,
            user_id=user_id,
            session_id=session_id,
            sname = sname,
            question_count=question_count,
            topics=topics,
            selected_pdfs=selected_pdfs,
            score = score,
            current_question_count = current_question_count
        )
        return session_id
    
    # get all quiz sessions for a user
    def get_quizsessions_for_user(self, user_id):
        with self.driver.session() as session:
            sessions = session.read_transaction(self._find_quizsessions_for_user, user_id)
            return sessions

    # get single quiz sessions for a user
    def get_quizsessions_for_sessionid(self, user_id):
        with self.driver.session() as session:
            sessions = session.read_transaction(self._find_quizsession_by_sessionid, user_id)
            return sessions

    @staticmethod
    def _find_quizsessions_for_user(tx, user_id):
        query = """
        MATCH (u:User {id: $user_id})-[:HAS_SESSION]->(s:Session)
        WHERE s.question_count <> 0 
        RETURN s.id AS session_id, s.question_count AS question_count, s.topics AS topics, s.selected_pdfs AS selected_pdfs, s.timestamp AS timestamp, s.sname AS sname, s.score AS score, s.current_question_count AS current_question_count
        """
        result = tx.run(query, user_id=user_id)
        sessions = []
        for record in result:
            sessions.append({
                "session_id": record["session_id"],
                "question_count": record["question_count"],
                "topics": record["topics"],
                "selected_pdfs": record["selected_pdfs"],
                "timestamp": record["timestamp"],
                "sname": record["sname"] ,
                "score": record["score"] ,
                "current_question_count": record["current_question_count"] 
            })
        return sessions

    @staticmethod
    def _find_quizsession_by_sessionid(tx, session_id):
        query = """
        MATCH (s:Session {id: $session_id})
        RETURN s.id AS session_id, s.question_count AS question_count, s.topics AS topics, 
            s.selected_pdfs AS selected_pdfs, s.timestamp AS timestamp, s.sname AS sname, 
            s.score AS score, s.current_question_count AS current_question_count
        """
        result = tx.run(query, session_id=session_id)
        record = result.single()  # Fetch a single record
        if record:
            return {
                "session_id": record["session_id"],
                "question_count": record["question_count"],
                "topics": record["topics"],
                "selected_pdfs": record["selected_pdfs"],
                "timestamp": record["timestamp"],
                "sname": record["sname"],
                "score": record["score"],
                "current_question_count": record["current_question_count"]
            }
        return None

    # get all AI Chat sessions for a user
    def get_sessions_for_user(self, user_id):
        with self.driver.session() as session:
            sessions = session.read_transaction(self._find_aisessions_for_user, user_id)
            return sessions

    @staticmethod
    def _find_aisessions_for_user(tx, user_id):
        query = """
        MATCH (u:User {id: $user_id})-[:HAS_SESSION]->(s:Session)
        WHERE s.question_count = 0 
        RETURN s
        RETURN s.id AS session_id, s.question_count AS question_count, s.topics AS topics, s.selected_pdfs AS selected_pdfs, s.timestamp AS timestamp
        """
        result = tx.run(query, user_id=user_id)
        sessions = []
        for record in result:
            sessions.append({
                "session_id": record["session_id"],
                "question_count": record["question_count"],
                "topics": record["topics"],
                "selected_pdfs": record["selected_pdfs"],
                "timestamp": record["timestamp"]    
            })
        return sessions

    def create_question_node(self, session_id, question_id, question_text, difficulty, completeness, xp):
        with self.driver.session() as session:
            logging.info(f"Creating question node with ID: {question_id} for session: {session_id}")
            session.write_transaction(self._create_question_node, session_id, question_id, question_text, difficulty, completeness, xp)

    @staticmethod
    def _create_question_node(tx, session_id, question_id, question_text, difficulty, completeness, xp):
        query = """
        MATCH (s:Session {id: $session_id})
        CREATE (q:Question {
            id: $question_id, 
            text: $question_text, 
            difficulty: $difficulty, 
            completeness: $completeness, 
            xp: $xp, 
            timestamp: datetime()
        })
        CREATE (s)-[:CONTAINS]->(q)
        """
        logging.info(f"Running query to create question node: {query}")
        tx.run(query, session_id=session_id, question_id=question_id, question_text=question_text, difficulty=difficulty, completeness=completeness, xp=xp)
        logging.info(f"Question node with ID: {question_id} created successfully")

    def update_current_question_count(self, session_id, current_question_count):
        with self.driver.session() as session:
            session.write_transaction(self._update_current_question_count, session_id, current_question_count)

    @staticmethod
    def _update_current_question_count(tx, session_id, current_question_count):
        query = """
        MATCH (s:Session {id: $session_id})
        SET s.current_question_count = $current_question_count
        RETURN s
        """
        tx.run(query, session_id=session_id, current_question_count=current_question_count)    

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


