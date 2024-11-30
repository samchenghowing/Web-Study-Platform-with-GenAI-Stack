import os
import io
import json
import base64
from typing import Dict, List
from uuid import UUID
from http import HTTPStatus
from queue import Queue
from config import Settings, BaseLogger

from services.background_task import *
from services.chains import *
from api.models import *
from api.utils import (
    QueueCallback,
    stream,
)
from db.mongo import (
    QuestionModel,
    StudentModel,
    UpdateStudentModel,
    StudentCollection,
    ChatHistoryModelCollection,
    WebfileModelCollection,
    QuestionCollection,
)
from db.neo4j import (
    create_constraints,
    create_vector_index,
)
from fastapi import (
    FastAPI, 
    Body, 
    HTTPException, 
    BackgroundTasks, 
    UploadFile, 
    File, 
    WebSocket,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response

from langchain_community.graphs import Neo4jGraph

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from pymongo import ReturnDocument
import bcrypt
from db.neo4j import Neo4jDatabase

from pdf2image import convert_from_bytes

settings = Settings()

# Remapping for Langchain Neo4j integration
os.environ["NEO4J_URL"] = settings.neo4j_uri

client = AsyncIOMotorClient(settings.mongodb_uri)
student_collection = client[settings.mongodb_].get_collection("students")
file_collection = client[settings.mongodb_].get_collection("files")
chat_history_collection = client[settings.mongodb_].get_collection("chat_histories")
questions_collection = client[settings.mongodb_].get_collection("questions")
thumbnails_collection = client[settings.mongodb_].get_collection("thumbnails")

pdfdb = client.pdfUploads
fs = AsyncIOMotorGridFSBucket(pdfdb)

embeddings = load_embedding_model(
    settings.embedding_model,
    config={"ollama_base_url": settings.ollama_base_url},
    logger=BaseLogger(),
)

# if Neo4j is local, you can go to http://localhost:7474/ to browse the database
neo4j_graph = Neo4jGraph(url=settings.neo4j_uri, username=settings.neo4j_username, password=settings.neo4j_password, refresh_schema=False)
create_constraints(neo4j_graph)
create_vector_index(neo4j_graph)

llm = load_llm(
    settings.llm, logger=BaseLogger(), config={"ollama_base_url": settings.ollama_base_url}
)
llm_chain = configure_llm_only_chain(llm)
llm_history_chain = configure_llm_history_chain(llm, settings.mongodb_uri, settings.mongodb_, "chat_histories")
rag_chain = configure_qa_rag_chain(
    llm, settings.mongodb_uri, settings.mongodb_, "chat_histories", embeddings, embeddings_store_url=settings.neo4j_uri, username=settings.neo4j_username, password=settings.neo4j_password
)


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


@app.post("/generate-task")
async def generate_task_api(question: Question):
    q = Queue()

    def cb():
        generate_task(
            user_id=question.user,
            neo4j_graph=neo4j_graph,
            llm_chain=llm_history_chain,
            input_question=question.text,
            callbacks=[QueueCallback(q)],
        )

    def generate():
        yield json.dumps({"init": True, "model": settings.llm, "token": ""})
        for token, _ in stream(cb, q):
            yield json.dumps({"token": token})

    return StreamingResponse(generate(), media_type="application/json")


@app.get(
    "/quiz/{id}",
    response_description="Get quiz",
    response_model=QuestionCollection,
    response_model_by_alias=False,
)
async def get_quiz(id: str):
    """
    Get the quiz designed for the specific student, looked up by `id`.
    """

    def load_questions_from_file(file_path: str):
        with open(file_path, 'r') as file:
            questions = json.load(file)
        return questions

    if (
        student_data := await student_collection.find_one({"_id": ObjectId(id)})
    ) is not None:
        print(student_data)
        student_data['id'] = str(student_data['_id'])  # Convert ObjectId to string
        student_data.pop('_id')  # Optionally remove the original ObjectId field

        student = StudentModel(**student_data)
        question_ids = [answer.question_id for answer in student.answers or []]
        questions = await questions_collection.find({"_id": {"$in": question_ids}}).to_list(length=None)

        if questions:
            question_models = [QuestionModel(**q) for q in questions]
            return QuestionCollection(questions=question_models)
        else:
            # raise HTTPException(status_code=404, detail=f"No question found for Student {id}")
            try:
                questions_file_path = './api/landing_questions.json'
                fake_questions = load_questions_from_file(questions_file_path)
                question_models = [QuestionModel(**q) for q in fake_questions]
                return QuestionCollection(questions=question_models)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error loading questions: {str(e)}")

    raise HTTPException(status_code=404, detail=f"Student {id} not found")

@app.post("/submit/quiz")
async def submit_quiz(task: Quiz_submission):
    q = Queue()

    def cb():
        check_quiz_correctness(
            user_id=task.user,
            llm_chain=llm_history_chain,
            task=task.question,
            answer=task.answer,
            callbacks=[QueueCallback(q)],
        )

    def generate():
        yield json.dumps({"init": True, "model": settings.llm, "token": ""})
        for token, _ in stream(cb, q):
            yield json.dumps({"token": token})

    return StreamingResponse(generate(), media_type="application/json")

@app.post("/submit/settings")
async def submit_settings(task: Quiz_submission):
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    user_node = neo4j_db.get_user_by_id(task.user)
    if user_node:
        attr = convert_question_to_attribute(task.question, llm_chain)
        print(attr)
        neo4j_db.update_user_model(task.user, {attr: task.answer})
        user_node = neo4j_db.get_user_by_id(task.user)
        neo4j_db.close()
        return user_node
    else:
        print("User not found.")
        neo4j_db.close()
        return HTTPException(status_code=404, detail=f"Student {task.user} not found")


@app.get("/toolstest")
def toolstest_api():
    result = generate_quiz_tools("", llm)
    return result



# Get status of backgroud task (Process PDF, load data from stackoverflow, verify submission)
@app.get("/bgtask/{uid}/status")
async def status_handler(uid: UUID):
    return jobs[uid]


# Submission backgroud task API
@app.post("/submit", status_code=HTTPStatus.ACCEPTED)
async def submit_question(background_tasks: BackgroundTasks, task: Submission):
    new_task = Job()
    jobs[new_task.uid] = new_task
    background_tasks.add_task(verify_submission, jobs, new_task.uid, task)
    return new_task

# PDF backgroud task API
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

    try:
        response_data = []
        for filename, content in byte_files.items():
            # Store the PDF in GridFS
            file_id = await fs.upload_from_stream(
                        filename,
                        content,
                        metadata={"contentType": "pdf"})

            # Generate thumbnail image from the first page
            images = convert_from_bytes(content)
            first_page_image = images[0]
            img_byte_arr = io.BytesIO()
            first_page_image.save(img_byte_arr, format="PNG")
            img_byte_arr.seek(0)

            # Convert image to base64
            img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
            
            # Store thumbnail in MongoDB
            thumbnail_data = {
                "file_id": str(file_id),
                "filename": filename,
                "thumbnail": img_base64
            }
            await thumbnails_collection.insert_one(thumbnail_data)

            response_data.append({
                "file_id": str(file_id),
                "filename": filename,
                "thumbnail": f"data:image/png;base64,{img_base64}"
            })

        background_tasks.add_task(save_pdf_to_neo4j, jobs, new_task.uid, byte_files)
        return {"task_id": new_task.uid, "files": response_data}
    except Exception as error:
        return f"Saving pdf fails with error: {error}"

@app.get("/pdfs", status_code=HTTPStatus.ACCEPTED)
async def list_pdfs():
    response_data = []

    async for thumbnail in thumbnails_collection.find():
        pdf_file_id = thumbnail['file_id']
        filename = thumbnail['filename']
        img_base64 = thumbnail['thumbnail']

        # pdf_data = await fs.download_to_stream(pdf_file_id, io.BytesIO())        
        # pdf_base64 = base64.b64encode(pdf_data.getvalue()).decode('utf-8')
        
        response_data.append({
            "file_id": str(pdf_file_id),
            "filename": filename,
            "thumbnail": f"data:image/png;base64,{img_base64}",
            # "pdf_data": f"data:application/pdf;base64,{pdf_base64}"
        })

    if not response_data:
        raise HTTPException(status_code=404, detail="No thumbnails or PDFs found.")

    return response_data

# SO Loader backgroud task API
# TODO: update @app.post("/load/stackoverflow/{tag}", status_code=HTTPStatus.ACCEPTED)
@app.post("/load/stackoverflow", status_code=HTTPStatus.ACCEPTED)
async def load_so(background_tasks: BackgroundTasks, request: LoadDataRequest):
    new_task = Job()
    jobs[new_task.uid] = new_task
    background_tasks.add_task(load_so_data, jobs, new_task.uid, request.tag)
    return new_task

# Web Loader backgroud task API
@app.post("/load/website", status_code=HTTPStatus.ACCEPTED)
async def load_web(background_tasks: BackgroundTasks, request: LoadWebDataRequest):
    new_task = Job()
    jobs[new_task.uid] = new_task
    background_tasks.add_task(load_web_data, jobs, new_task.uid, request.url, file_collection)
    return new_task

@app.post(
    "/login/",
    response_description="Login student",
    response_model=UpdateStudentModel,
    status_code=HTTPStatus.OK,
)
async def login_student(login: LoginModel = Body(...)):
    student = await student_collection.find_one({"email": login.email})
    if not student:
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="Invalid email or password")

    if not bcrypt.checkpw(login.password.encode('utf-8'), student['password'].encode('utf-8')):
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="Invalid email or password")

    student["_id"] = str(student["_id"])
    student.pop("password")  # Remove the hashed password from the response
    return student


# CRUD mongodb
@app.post(
    "/signup/",
    response_description="Add new student",
    response_model=StudentModel,
    status_code=HTTPStatus.CREATED,
)
async def create_student(student: StudentModel = Body(...)):
    hashed_password = bcrypt.hashpw(student.password.encode('utf-8'), bcrypt.gensalt())
    student.password = hashed_password.decode('utf-8')  # Store the hashed password

    new_student = await student_collection.insert_one(
        student.model_dump(by_alias=True, exclude=["id"])
    )
    created_student = await student_collection.find_one(
        {"_id": new_student.inserted_id}
    )
    if created_student:
        created_student["_id"] = str(created_student["_id"])

    # create user in neo4j 
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    neo4j_db.update_user_model(created_student["_id"], {"login": 0})
    neo4j_db.close()

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
    raw_students = await student_collection.find().to_list(1000)
    students = []

    for student in raw_students:
        student['_id'] = str(student['_id'])
        students.append(student)

    return StudentCollection(students=students)


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

## Untested
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

## Untested
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

@app.delete("/pdfs/{id}", response_description="Delete a pdf in database")
async def delete_pdf(id: str):
    """
    Remove a pdf with given id from the database.
    """
    delete_result = await thumbnails_collection.delete_one({"file_id": id})

    if delete_result.deleted_count > 0:
        return Response(status_code=HTTPStatus.OK)

    raise HTTPException(status_code=404, detail=f"id {id} not found")


@app.get(
    "/web_files/",
    response_description="List all web files",
    response_model=WebfileModelCollection,
    response_model_by_alias=False,
)
async def list_web_files():
    """
    List all of the web files data in the database.

    The response is unpaginated and limited to 1000 results.
    """
    return WebfileModelCollection(web_files=await file_collection.find().to_list(1000))

