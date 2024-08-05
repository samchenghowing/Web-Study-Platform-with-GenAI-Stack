import os
import io
import requests
from typing import List
from uuid import UUID, uuid4
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


# PDF processing
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

# TODO: 
def verify_submission(jobs: dict, task_id: UUID):
    return "your submittion is correct!"

