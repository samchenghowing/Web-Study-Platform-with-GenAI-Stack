import re

class BaseLogger:
    def __init__(self) -> None:
        self.info = print


def extract_task(input_string):
    title_match = re.search(r"Title:\s*(.*)\s*Question:", input_string, re.DOTALL)
    question_match = re.search(r"Question:\s*(.*)\s*Solution:", input_string, re.DOTALL)
    solution_match = re.search(r"Solution:\s*(.*)", input_string, re.DOTALL)
    
    title = title_match.group(1).strip() if title_match else "No title found"
    question = question_match.group(1).strip() if question_match else "No question found"
    solution = solution_match.group(1).strip() if solution_match else "No solution found"    
    # Store the question and solution in a dictionary
    result = {
        "title": title,
        "question": question,
        "solution": solution
    }
    
    return result


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
