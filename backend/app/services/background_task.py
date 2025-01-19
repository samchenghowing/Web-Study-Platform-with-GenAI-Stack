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
from config import Settings, BaseLogger

from langchain_community.vectorstores import Neo4jVector
from langchain_neo4j import Neo4jGraph
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders.recursive_url_loader import RecursiveUrlLoader

from PyPDF2 import PdfReader

'''
background_task.py

[ Pdf ]
1. save_pdf_to_neo4j:        Extracts text from a PDF, splits it into chunks, and stores it in a Neo4j vector database.  

[ Stack Overflow ]
2. insert_so_data:           Imports Stack Overflow questions and answers into a Neo4j database with embeddings and relationships.  
3. load_so_data:             Fetches Stack Overflow data based on a tag and imports it into Neo4j.
4. load_high_score_so_data:  Fetches and imports high-voted Stack Overflow data into Neo4j.  

[ Web Content ]
5. load_web_data:            Crawls web content from a given URL, processes it, and stores it in MongoDB.  
6. verify_submission:        Validates JavaScript code syntax and functionality through ESLint and test cases.  
7. validate_js_syntax:       Checks JavaScript code syntax using ESLint.  
8. run_js_tests:             Runs predefined JavaScript test cases in a Node.js Docker container to verify code functionality.  

'''

settings = Settings()

# if Neo4j is local, you can go to http://localhost:7474/ to browse the database
neo4j_graph = Neo4jGraph(url=settings.neo4j_uri, username=settings.neo4j_username, password=settings.neo4j_password, refresh_schema=False)

SO_API_BASE_URL = "https://api.stackexchange.com/2.3/search/advanced"

embeddings = load_embedding_model(
    settings.embedding_model,
    config={"ollama_base_url": settings.ollama_base_url},
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
def save_pdf_to_neo4j(jobs: dict, task_id: UUID, byte_files: List[dict]):
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
                url=settings.neo4j_uri,
                username=settings.neo4j_username,
                password=settings.neo4j_password,
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


def insert_so_data(data: dict) -> None:
    # Calculate embedding values for questions and answers
    for q in data["items"]:
        question_text = q["title"] + "\n" + q["body_markdown"]
        q["embedding"] = embeddings.embed_query(question_text)
        for a in q["answers"]:
            a["embedding"] = embeddings.embed_query(
                question_text + "\n" + a["body_markdown"]
            )

    # Cypher, the query language of Neo4j, is used to import the data
    # https://neo4j.com/docs/getting-started/cypher-intro/
    # https://neo4j.com/docs/cypher-cheat-sheet/5/auradb-enterprise/
    import_query = """
    UNWIND $data AS q
    MERGE (question:Question {id:q.question_id}) 
    ON CREATE SET question.title = q.title, question.link = q.link, question.score = q.score,
        question.favorite_count = q.favorite_count, question.creation_date = datetime({epochSeconds: q.creation_date}),
        question.body = q.body_markdown, question.embedding = q.embedding
    FOREACH (tagName IN q.tags | 
        MERGE (tag:Tag {name:tagName}) 
        MERGE (question)-[:TAGGED]->(tag)
    )
    FOREACH (a IN q.answers |
        MERGE (question)<-[:ANSWERS]-(answer:Answer {id:a.answer_id})
        SET answer.is_accepted = a.is_accepted,
            answer.score = a.score,
            answer.creation_date = datetime({epochSeconds:a.creation_date}),
            answer.body = a.body_markdown,
            answer.embedding = a.embedding
        MERGE (answerer:User {id:coalesce(a.owner.user_id, "deleted")}) 
        ON CREATE SET answerer.display_name = a.owner.display_name,
                      answerer.reputation= a.owner.reputation
        MERGE (answer)<-[:PROVIDED]-(answerer)
    )
    WITH * WHERE NOT q.owner.user_id IS NULL
    MERGE (owner:User {id:q.owner.user_id})
    ON CREATE SET owner.display_name = q.owner.display_name,
                  owner.reputation = q.owner.reputation
    MERGE (owner)-[:ASKED]->(question)
    """
    neo4j_graph.query(import_query, {"data": data["items"]})

# Background task for loading stackoverflow data to neo4j
def load_so_data(jobs: dict, task_id: UUID, tag: str = "javascript", page: int = 10) -> None:
    try:
        parameters = (
            f"?pagesize=10&page={page}&order=desc&sort=creation&answers=1&tagged={tag}"
            "&site=stackoverflow&filter=!*236eb_eL9rai)MOSNZ-6D3Q6ZKb0buI*IVotWaTb"
        )
        data = requests.get(SO_API_BASE_URL + parameters).json()
        print(data)
        insert_so_data(data)
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
    insert_so_data(data)

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

