from neo4j import GraphDatabase

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


    def get_all_chat_histories(self):
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (m:Message)
                RETURN m.session_id AS session_id, m.content AS content, m.type AS type
                ORDER BY m.timestamp
                """
            )
            chat_histories = []
            for record in result:
                chat_histories.append({
                    "content": record["content"],
                    "type": record["type"]
                })
            return chat_histories

    def delete_chat_history(self, session_id):
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH p=(n:Session {id: $session_id})-[:LAST_MESSAGE]->()<-[:NEXT*0..3]-() 
                DELETE p
                """,
                session_id=session_id
            )
            return result


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


