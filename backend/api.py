import os
import json
import io
from typing import Dict, List
from uuid import UUID, uuid4


from langchain_community.graphs import Neo4jGraph
from utils import (
    create_vector_index,
    BaseLogger,
)
from chains import (
    load_embedding_model,
    load_llm,
    configure_llm_only_chain,
    configure_qa_rag_chain,
    generate_task,
)
from fastapi import FastAPI
from fastapi import BackgroundTasks, UploadFile, File
from pydantic import BaseModel, Field
from langchain.callbacks.base import BaseCallbackHandler
from threading import Thread
from queue import Queue, Empty
from collections.abc import Generator
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from http import HTTPStatus

from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Neo4jVector

load_dotenv(".env")

url = os.getenv("NEO4J_URI")
username = os.getenv("NEO4J_USERNAME")
password = os.getenv("NEO4J_PASSWORD")
ollama_base_url = os.getenv("OLLAMA_BASE_URL")
embedding_model_name = os.getenv("EMBEDDING_MODEL")
llm_name = os.getenv("LLM")
# Remapping for Langchain Neo4j integration
os.environ["NEO4J_URL"] = url

embeddings, dimension = load_embedding_model(
    embedding_model_name,
    config={"ollama_base_url": ollama_base_url},
    logger=BaseLogger(),
)

# if Neo4j is local, you can go to http://localhost:7474/ to browse the database
neo4j_graph = Neo4jGraph(url=url, username=username, password=password)
create_vector_index(neo4j_graph, dimension)

llm = load_llm(
    llm_name, logger=BaseLogger(), config={"ollama_base_url": ollama_base_url}
)

llm_chain = configure_llm_only_chain(llm)
rag_chain = configure_qa_rag_chain(
    llm, embeddings, embeddings_store_url=url, username=username, password=password
)


class QueueCallback(BaseCallbackHandler):
    """Callback handler for streaming LLM responses to a queue."""

    def __init__(self, q):
        self.q = q

    def on_llm_new_token(self, token: str, **kwargs) -> None:
        self.q.put(token)

    def on_llm_end(self, *args, **kwargs) -> None:
        return self.q.empty()


def stream(cb, q) -> Generator:
    job_done = object()

    def task():
        x = cb()
        q.put(job_done)

    t = Thread(target=task)
    t.start()

    content = ""

    # Get each new token from the queue and yield for our generator
    while True:
        try:
            next_token = q.get(True, timeout=1)
            if next_token is job_done:
                break
            content += next_token
            yield next_token, content
        except Empty:
            continue


app = FastAPI()
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Hello World"}


class Message(BaseModel):
    role: str
    content: str

class Question(BaseModel):
    messages: List[Message] | None = None
    rag: bool | None = False 

class BaseTicket(BaseModel):
    text: str


@app.post("/query-stream")
async def qstream(question: Question):
    output_function = llm_chain
    if question.rag:
        output_function = rag_chain

    q = Queue()

    def cb():
        chat_history = question.messages
        chat_history_dicts = [message.model_dump() for message in chat_history]
        output_function(
            chat_history_dicts, callbacks=[QueueCallback(q)]
        )

    def generate():
        yield json.dumps({"init": True, "model": llm_name})
        for token, _ in stream(cb, q):
            yield json.dumps({"token": token})

    return StreamingResponse(generate(), media_type="application/json")

@app.post("/generate-task")
async def generate_task_api(question: Question):
    output_function = llm_chain
    if question.rag:
        output_function = rag_chain

    q = Queue()

    def cb():
        chat_history = question.messages
        chat_history_dicts = [message.model_dump() for message in chat_history]

        generate_task(
            neo4j_graph=neo4j_graph,
            llm_chain=output_function,
            chat_history=chat_history_dicts,
            callbacks=[QueueCallback(q)],
        )

    def generate():
        yield json.dumps({"init": True, "model": llm_name})
        for token, _ in stream(cb, q):
            yield json.dumps({"token": token})

    return StreamingResponse(generate(), media_type="application/json")



# https://stackoverflow.com/questions/64901945/how-to-send-a-progress-of-operation-in-a-fastapi-app
# https://stackoverflow.com/questions/63048825/how-to-upload-file-using-fastapi
# https://github.com/tiangolo/fastapi/discussions/11177


class Job(BaseModel):
    uid: UUID = Field(default_factory=uuid4)
    status: str = "in_progress"
    processed_files: List[str] = Field(default_factory=list)

jobs: Dict[UUID, Job] = {}


def process_files(task_id: UUID, byte_files: List[dict]):
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


async def get_file_content(files: List[UploadFile]):
    byte_files = {}
    for file in files:
        byte_files[file.filename] = await file.read()
    return byte_files


@app.post("/upload/pdf", status_code=HTTPStatus.ACCEPTED)
async def work(background_tasks: BackgroundTasks, files: List[UploadFile] = File(...)):
    new_task = Job()
    jobs[new_task.uid] = new_task
    byte_files = await get_file_content(files)
    background_tasks.add_task(process_files, new_task.uid, byte_files)
    return new_task


@app.get("/upload/{uid}/status")
async def status_handler(uid: UUID):
    return jobs[uid]
