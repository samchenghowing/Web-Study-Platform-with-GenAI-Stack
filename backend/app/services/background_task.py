import os
import io
import tempfile
import requests
from typing import List, Dict, Union
from uuid import UUID, uuid4
import subprocess
import docker
from pydantic import BaseModel, Field
from bs4 import BeautifulSoup as Soup
from db.mongo import WebfileModel

client = docker.from_env()

from services.chains import (
    load_embedding_model,
)
from utils import (
    insert_so_data,
    BaseLogger,
)

from langchain_community.vectorstores import Neo4jVector
from langchain_community.graphs import Neo4jGraph
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders.recursive_url_loader import RecursiveUrlLoader

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

# Background task for crawling web data to mongodb
def load_web_data(jobs: dict, task_id: UUID, file_collection, url: str = "https://python.langchain.com/v0.2/docs/concepts/#langchain-expression-language-lcel"):
    try:
        loader = RecursiveUrlLoader(
            url=url, max_depth=20, extractor=lambda x: Soup(x, "html.parser").text
        )
        docs = loader.load()

        # Sort the list based on the URLs and get the text
        d_sorted = sorted(docs, key=lambda x: x.metadata["source"])
        d_reversed = list(reversed(d_sorted))
        concatenated_content = "\n\n\n --- \n\n\n".join(
            [doc.page_content for doc in d_reversed]
        )
        webfile = WebfileModel(
            id=None,  # Assign a new ObjectId or None if you want MongoDB to generate it
            file_name=url,
            contents=concatenated_content
        )
        file_collection.insert_one(webfile.dict(by_alias=True))
    except Exception as error:
        jobs[task_id].status = f"Importing {url} from fails with error: {error}"
        return
    finally:
        jobs[task_id].processed_files.append(url)


# Background task to verify user's submission code
def verify_submission(jobs: Dict[UUID, 'Job'], task_id: UUID, task: Submission) -> None:
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

def validate_js_syntax(js_code: str) -> Dict[str, Union[bool, str]]:
    try:
        # Use a temporary file for code
        with tempfile.NamedTemporaryFile(delete=False, suffix='.js') as temp_file:
            temp_file.write(js_code.encode())
            temp_file_path = temp_file.name
        
        # Run eslint to check for syntax errors
        result = subprocess.run(['eslint', temp_file_path], capture_output=True, text=True)
        if result.returncode != 0:
            return {'success': False, 'errors': result.stderr.strip()}
    except Exception as e:
        return {'success': False, 'errors': str(e)}
    finally:
        # Clean up temporary file
        os.remove(temp_file_path)
    
    return {'success': True}

def run_js_tests(js_code: str) -> Dict[str, Union[bool, str]]:
    try:
        # Use a temporary file for the code and test
        with tempfile.NamedTemporaryFile(delete=False, suffix='.js') as temp_code_file, \
             tempfile.NamedTemporaryFile(delete=False, suffix='.js') as temp_test_file:
            
            temp_code_path = temp_code_file.name
            temp_test_path = temp_test_file.name
            
            temp_code_file.write(js_code.encode())
            temp_test_code = f"""
            const LinkedList = require('{temp_code_path}'); // Import the submitted code
            const list = new LinkedList();

            // Test cases
            try {{
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
                console.log('Success');
            }} catch (error) {{
                console.error(error.message);
                process.exit(1);
            }}
            """
            temp_test_file.write(temp_test_code.encode())
        
        # Run the Node.js container
        container = client.containers.run(
            "node", 
            command=f"node /app/test.js",
            volumes={
                temp_code_path: {'bind': '/app/temp.js', 'mode': 'rw'},
                temp_test_path: {'bind': '/app/test.js', 'mode': 'rw'}
            },
            detach=True,
            stdout=True,
            stderr=True
        )

        logs = container.logs()
        if container.wait()['StatusCode'] != 0:
            return {'success': False, 'errors': logs.decode('utf-8')}
        if 'Success' not in logs.decode('utf-8'):
            return {'success': False, 'errors': 'Tests did not pass all cases'}
    except Exception as e:
        return {'success': False, 'errors': str(e)}
    finally:
        # Clean up temporary files
        os.remove(temp_code_path)
        os.remove(temp_test_path)
    
    return {'success': True}

