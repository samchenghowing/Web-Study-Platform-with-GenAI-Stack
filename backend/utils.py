class BaseLogger:
    def __init__(self) -> None:
        self.info = print


def extract_task(input_string):
    lines = input_string.strip().split("\n")

    title = ""
    question = ""
    solution = ""
    is_question = False  # flag to know if we are inside a "Question" block
    is_solution = False  # flag to know if we are inside a "Answer" block

    for line in lines:
        if line.startswith("Title:"):
            title = line.split("Title: ", 1)[1].strip()
        elif line.startswith("Question:"):
            question = line.split("Question: ", 1)[1].strip()
            is_question = (
                True  # set the flag to True once we encounter a "Question:" line
            )
        elif is_question:
            # if the line does not start with "Question:" but we are inside a "Question" block,
            # then it is a continuation of the question
            question += "\n" + line.strip()
        elif line.startswith("Solution:"):
            solution = line.split("Solution: ", 1)[1].strip()
            is_solution = (
                True  # set the flag to True once we encounter a "Question:" line
            )
            is_question = (
                False  # set the flag to True once we encounter a "Question:" line
            )
        elif is_solution:
            # if the line does not start with "Question:" but we are inside a "Question" block,
            # then it is a continuation of the question
            solution += "\n" + line.strip()

    return title, question, solution


def create_vector_index(driver, dimension: int) -> None:
    index_query = "CALL db.index.vector.createNodeIndex('stackoverflow', 'Question', 'embedding', $dimension, 'cosine')"
    try:
        driver.query(index_query, {"dimension": dimension})
    except:  # Already exists
        pass
    index_query = "CALL db.index.vector.createNodeIndex('top_answers', 'Answer', 'embedding', $dimension, 'cosine')"
    try:
        driver.query(index_query, {"dimension": dimension})
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
