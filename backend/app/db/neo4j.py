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


