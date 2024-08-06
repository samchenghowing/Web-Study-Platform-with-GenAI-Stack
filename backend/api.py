import os
import json
from typing import Dict, List
from uuid import UUID
from threading import Thread
from queue import Queue, Empty
from collections.abc import Generator
from http import HTTPStatus
from pydantic import BaseModel

from utils import (
    create_constraints,
    create_vector_index,
    BaseLogger,
)
from background_task import(
    Job,
    process_files,
    load_so_data,
    verify_submission,
    Submission,
)
from chains import (
    load_embedding_model,
    load_llm,
    configure_llm_only_chain,
    configure_qa_rag_chain,
    generate_task,
)
from mongo import (
    StudentModel,
    UpdateStudentModel,
    StudentCollection,
    ChatHistoryModelCollection,
)
from fastapi import FastAPI
from fastapi import Body, HTTPException
from fastapi import BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response

from langchain_community.graphs import Neo4jGraph
from langchain.callbacks.base import BaseCallbackHandler

from bson import ObjectId
import motor.motor_asyncio
from pymongo import ReturnDocument

from dotenv import load_dotenv
load_dotenv(".env")

url = os.getenv("NEO4J_URI")
username = os.getenv("NEO4J_USERNAME")
password = os.getenv("NEO4J_PASSWORD")
ollama_base_url = os.getenv("OLLAMA_BASE_URL")
embedding_model_name = os.getenv("EMBEDDING_MODEL")
llm_name = os.getenv("LLM")
# Remapping for Langchain Neo4j integration
os.environ["NEO4J_URL"] = url
CONN_STR = os.getenv("MONGODB_URI")
DATABASE = "my_db"
client = motor.motor_asyncio.AsyncIOMotorClient(CONN_STR)
db = client[DATABASE]
student_collection = db.get_collection("students")
chat_history_collection = db.get_collection("chat_histories")

embeddings, dimension = load_embedding_model(
    embedding_model_name,
    config={"ollama_base_url": ollama_base_url},
    logger=BaseLogger(),
)

# if Neo4j is local, you can go to http://localhost:7474/ to browse the database
neo4j_graph = Neo4jGraph(url=url, username=username, password=password)
create_constraints(neo4j_graph)
create_vector_index(neo4j_graph, dimension)

llm = load_llm(
    llm_name, logger=BaseLogger(), config={"ollama_base_url": ollama_base_url}
)

llm_chain = configure_llm_only_chain(llm, CONN_STR, DATABASE, "chat_histories")
rag_chain = configure_qa_rag_chain(
    llm, CONN_STR, DATABASE, "chat_histories", embeddings, embeddings_store_url=url, username=username, password=password
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

jobs: Dict[UUID, Job] = {}

class Question(BaseModel):
    text: str
    rag: bool | None = False 

# Chat bot API
@app.post("/query-stream")
async def qstream(question: Question):
    output_function = llm_chain
    if question.rag:
        output_function = rag_chain

    q = Queue()

    def cb():
        output_function(
            user_id="test_user",
            question=question.text,
            callbacks=[QueueCallback(q)],
        )

    def generate():
        yield json.dumps({"init": True, "model": llm_name, "token": ""})
        for token, _ in stream(cb, q):
            yield json.dumps({"token": token})

    return StreamingResponse(generate(), media_type="application/json")

@app.post("/generate-task")
async def generate_task_api(question: Question):
    q = Queue()

    def cb():
        generate_task(
            user_id="test_user",
            neo4j_graph=neo4j_graph,
            llm_chain=llm_chain,
            input_question=question.text,
            callbacks=[QueueCallback(q)],
        )

    def generate():
        yield json.dumps({"init": True, "model": llm_name, "token": ""})
        for token, _ in stream(cb, q):
            yield json.dumps({"token": token})

    return StreamingResponse(generate(), media_type="application/json")


# Get status of backgroud task (Process PDF, load data from stackoverflow, verify submission)
@app.get("/bgtask/{uid}/status")
async def status_handler(uid: UUID):
    return jobs[uid]


# Submission API
@app.post("/submit", status_code=HTTPStatus.ACCEPTED)
async def submit_question(background_tasks: BackgroundTasks, task: Submission):
    new_task = Job()
    jobs[new_task.uid] = new_task
    background_tasks.add_task(verify_submission, jobs, new_task.uid, task)
    return new_task

# PDF API
async def get_file_content(files: List[UploadFile]):
    byte_files = {}
    for file in files:
        byte_files[file.filename] = await file.read()
    return byte_files

@app.post("/upload/pdf", status_code=HTTPStatus.ACCEPTED)
async def upload_pdf(background_tasks: BackgroundTasks, files: List[UploadFile] = File(...)):
    new_task = Job()
    jobs[new_task.uid] = new_task
    byte_files = await get_file_content(files)
    background_tasks.add_task(process_files, jobs, new_task.uid, byte_files)
    return new_task

# Loader API
@app.post("/load/stackoverflow", status_code=HTTPStatus.ACCEPTED)
async def load_so(background_tasks: BackgroundTasks, tag: str = Body(...)):
    new_task = Job()
    jobs[new_task.uid] = new_task
    background_tasks.add_task(load_so_data, jobs, new_task.uid, tag)
    return new_task


# CRUD mongodb
@app.post(
    "/students/",
    response_description="Add new student",
    response_model=StudentModel,
    status_code=HTTPStatus.CREATED,
    response_model_by_alias=False,
)
async def create_student(student: StudentModel = Body(...)):
    """
    Insert a new student record.

    A unique `id` will be created and provided in the response.
    """
    new_student = await student_collection.insert_one(
        student.model_dump(by_alias=True, exclude=["id"])
    )
    created_student = await student_collection.find_one(
        {"_id": new_student.inserted_id}
    )
    return created_student


@app.get(
    "/students/",
    response_description="List all students",
    response_model=StudentCollection,
    response_model_by_alias=False,
)
async def list_students():
    """
    List all of the student data in the database.

    The response is unpaginated and limited to 1000 results.
    """
    return StudentCollection(students=await student_collection.find().to_list(1000))


@app.get(
    "/students/{id}",
    response_description="Get a single student",
    response_model=StudentModel,
    response_model_by_alias=False,
)
async def show_student(id: str):
    """
    Get the record for a specific student, looked up by `id`.
    """
    if (
        student := await student_collection.find_one({"_id": ObjectId(id)})
    ) is not None:
        return student

    raise HTTPException(status_code=404, detail=f"Student {id} not found")


@app.put(
    "/students/{id}",
    response_description="Update a student",
    response_model=StudentModel,
    response_model_by_alias=False,
)
async def update_student(id: str, student: UpdateStudentModel = Body(...)):
    """
    Update individual fields of an existing student record.

    Only the provided fields will be updated.
    Any missing or `null` fields will be ignored.
    """
    student = {
        k: v for k, v in student.model_dump(by_alias=True).items() if v is not None
    }

    if len(student) >= 1:
        update_result = await student_collection.find_one_and_update(
            {"_id": ObjectId(id)},
            {"$set": student},
            return_document=ReturnDocument.AFTER,
        )
        if update_result is not None:
            return update_result
        else:
            raise HTTPException(status_code=404, detail=f"Student {id} not found")

    # The update is empty, but we should still return the matching document:
    if (existing_student := await student_collection.find_one({"_id": id})) is not None:
        return existing_student

    raise HTTPException(status_code=404, detail=f"Student {id} not found")


@app.delete("/students/{id}", response_description="Delete a student")
async def delete_student(id: str):
    """
    Remove a single student record from the database.
    """
    delete_result = await student_collection.delete_one({"_id": ObjectId(id)})

    if delete_result.deleted_count == 1:
        return Response(status_code=HTTPStatus.NO_CONTENT)

    raise HTTPException(status_code=404, detail=f"Student {id} not found")


@app.get(
    "/chat_histories/",
    response_description="List all chat histories",
    response_model=ChatHistoryModelCollection,
    response_model_by_alias=False,
)
async def list_chat_histories():
    """
    List all of the chat histories data in the database.

    The response is unpaginated and limited to 1000 results.
    """
    return ChatHistoryModelCollection(chat_histories=await chat_history_collection.find().to_list(1000))

@app.delete("/chat_histories/{SessionId}", response_description="Delete a session's chat histories")
async def delete_chat_histories(SessionId: str):
    """
    Remove a session's chat histories from the database.
    """
    delete_result = await chat_history_collection.delete_many({"SessionId": SessionId})

    if delete_result.deleted_count > 1:
        return Response(status_code=HTTPStatus.OK)

    raise HTTPException(status_code=404, detail=f"SessionId {SessionId} not found")

