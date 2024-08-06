import os
import io
import requests
from typing import List, Dict
from uuid import UUID, uuid4
import subprocess
from pydantic import BaseModel, Field

from chains import (
    load_embedding_model,
)
from utils import (
    insert_so_data,
    BaseLogger,
)

from langchain_community.vectorstores import Neo4jVector
from langchain_community.graphs import Neo4jGraph
from langchain.text_splitter import RecursiveCharacterTextSplitter

from PyPDF2 import PdfReader

from dotenv import load_dotenv
load_dotenv(".env")

url = os.getenv("NEO4J_URI")
username = os.getenv("NEO4J_USERNAME")
password = os.getenv("NEO4J_PASSWORD")
ollama_base_url = os.getenv("OLLAMA_BASE_URL")
embedding_model_name = os.getenv("EMBEDDING_MODEL")
# if Neo4j is local, you can go to http://localhost:7474/ to browse the database
neo4j_graph = Neo4jGraph(url=url, username=username, password=password)

SO_API_BASE_URL = "https://api.stackexchange.com/2.3/search/advanced"

embeddings, dimension = load_embedding_model(
    embedding_model_name,
    config={"ollama_base_url": ollama_base_url},
    logger=BaseLogger(),
)


class Job(BaseModel):
    uid: UUID = Field(default_factory=uuid4)
    status: str = "in_progress"
    processed_files: List[str] = Field(default_factory=list)

class Submission(BaseModel):
    jsDoc: str
    htmlDoc: str
    cssDoc: str


# Background task for PDF processing
def process_files(jobs: dict, task_id: UUID, byte_files: List[dict]):
    for filename, content in byte_files.items():
        try:
            # Create a file-like object from the content
            pdf_reader = PdfReader(io.BytesIO(content))

            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()

            # langchain_textspliter
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000, chunk_overlap=200, length_function=len
            )

            chunks = text_splitter.split_text(text=text)

            # Store the chunks part in db (vector)
            Neo4jVector.from_texts(
                chunks,
                url=url,
                username=username,
                password=password,
                embedding=embeddings,
                index_name="pdf_bot",
                node_label="PdfBotChunk",
                pre_delete_collection=True,  # Delete existing PDF data
            )
            
        except Exception as error:
            jobs[task_id].status = f"Importing {filename} fails with error: {error}"
            return
        finally:
            jobs[task_id].processed_files.append(filename)

    jobs[task_id].status = "completed"


# Background task for loading stackoverflow data to neo4j
def load_so_data(jobs: dict, task_id: UUID, tag: str = "javascript", page: int = 10) -> None:
    try:
        parameters = (
            f"?pagesize=100&page={page}&order=desc&sort=creation&answers=1&tagged={tag}"
            "&site=stackoverflow&filter=!*236eb_eL9rai)MOSNZ-6D3Q6ZKb0buI*IVotWaTb"
        )
        data = requests.get(SO_API_BASE_URL + parameters).json()
        insert_so_data(neo4j_graph, embeddings, data)
    except Exception as error:
        jobs[task_id].status = f"Importing {tag} from so fails with error: {error}"
        return
    finally:
        jobs[task_id].processed_files.append(tag)
    jobs[task_id].status = "completed"

def load_high_score_so_data() -> None:
    parameters = (
        f"?fromdate=1664150400&order=desc&sort=votes&site=stackoverflow&"
        "filter=!.DK56VBPooplF.)bWW5iOX32Fh1lcCkw1b_Y6Zkb7YD8.ZMhrR5.FRRsR6Z1uK8*Z5wPaONvyII"
    )
    data = requests.get(SO_API_BASE_URL + parameters).json()
    insert_so_data(neo4j_graph, embeddings, data)


# Background task to verify user's submission code
def verify_submission(jobs: Dict[UUID, 'Job'], task_id: UUID, task: Submission) -> str:
    js_code = task.jsDoc
    
    # 1. Syntax Validation
    if not validate_js_syntax(js_code):
        jobs[task_id].status = "JavaScript syntax errors detected."
        return

    # 2. Functional Validation
    test_results = run_js_tests(js_code)
    if not test_results['success']:
        jobs[task_id].status = f"Functional tests failed: {test_results['errors']}"
        return
    
    jobs[task_id].status = "Your submission is correct!"    
    return

def validate_js_syntax(js_code: str) -> bool:
    try:
        # Save the code to a temporary file
        with open('temp.js', 'w') as f:
            f.write(js_code)
        
        # Run eslint to check for syntax errors
        result = subprocess.run(['eslint', 'temp.js'], capture_output=True, text=True)
        if result.returncode != 0:
            return False
    except Exception as e:
        return False
    return True

def run_js_tests(js_code: str) -> Dict[str, any]:
    # Save the code to a temporary file
    with open('temp.js', 'w') as f:
        f.write(js_code)
    
    # Define the test code (TODO: generated from AI)
    test_code = """
    const LinkedList = require('./temp.js'); // Import the submitted code
    const list = new LinkedList();

    // Test cases
    try {
        // Test appending nodes
        list.append(1);
        list.append(2);
        list.append(3);
        if (list.toArray().join(',') !== '1,2,3') throw new Error('Append test failed');

        // Test deleting nodes
        list.delete(2);
        if (list.toArray().join(',') !== '1,3') throw new Error('Delete test failed');

        // Test finding nodes
        if (list.find(1) === null || list.find(2) !== null) throw new Error('Find test failed');

        // Test empty list handling
        list.delete(1);
        list.delete(3);
        if (list.toArray().length !== 0) throw new Error('Empty list test failed');

        // Return success if all tests pass
        return { success: true };
    } catch (error) {
        return { success: false, errors: error.message };
    }
    """
    
    try:
        # Save the test code to a temporary file
        with open('test.js', 'w') as f:
            f.write(test_code)
        
        # Run the tests using Node.js
        result = subprocess.run(['node', 'test.js'], capture_output=True, text=True)
        if result.returncode != 0:
            return {'success': False, 'errors': result.stderr}
    except Exception as e:
        return {'success': False, 'errors': str(e)}
    
    return {'success': True}

