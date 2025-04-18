import os
import io
import json
import base64
from typing import Dict, List
from uuid import UUID
from http import HTTPStatus
from queue import Queue
from config import Settings, BaseLogger

from services.graphs import *
from services.background_task import *
from services.chains import *
from api.models import *
from api.utils import *
from db.mongo import *
from db.neo4j import *

from fastapi import (
    FastAPI, 
    Body, 
    HTTPException, 
    BackgroundTasks, 
    UploadFile, 
    File,
    WebSocket,
    WebSocketDisconnect,
    APIRouter,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response

from langchain_neo4j import Neo4jGraph

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from pymongo import ReturnDocument
import bcrypt

from pdf2image import convert_from_bytes
from pydantic import BaseModel


'''
[ Chat & AI ]
1.  `/generate-task`:               [G] Streams tokens generated by an LLM based on a user question
2.  `/query-stream`:                [P] Streams chat responses from LLM
3.  `/generate-learning-preference`: [P] Generates learning preferences using LLM
4.  `/tooltest/{question}`:         [G] Tests grader chain functionality
5.  `/graphtest/{question}`:        [G] Tests self-correction graph

[ Session Management ]
6.  `/get_AIsession/{user_id}`:     [G] Retrieves AI chat session data for a user
7.  `/get_QUIZsession/{user_id}`:   [G] Retrieves QUIZ session data for a user
8.  `/create_session/{user_id}`:     [P] Creates new QUIZ Session with user preferences
9.  `/list_session/{user_id}`:       [G] Lists all QUIZ sessions for a user
10. `/list_single_session/{s_id}`:   [G] Gets details of a specific session
11. `/update_session_name/{s_id}`:   [P] Updates session name
12. `/delete_session/{s_id}`:        [D] Deletes a session
13. `/update_question_count`:        [P] Updates current question count in session

[ Quiz System ]
14. `/quiz/{id}`:                   [G] Fetches or generates quiz questions
15. `/submit/quiz`:                 [P] Submits and checks quiz answers
16. `/submit/settings`:             [P] Updates user settings based on quiz
17. `/bgtask/{uid}/status`:         [G] Gets background task status

[ User Management ]
18. `/login`:                       [P] Authenticates user login
19. `/signup`:                      [P] Creates new user account
20. `/check_new_student/{user_id}`: [G] Checks first-time login status
21. `/students`:                    [G] Lists all students
22. `/students/{id}`:               [G] Gets student details
23. `/students/{id}`:               [P] Updates student (PUT)
24. `/students/{id}`:               [D] Deletes student

[ User Relationships ]
25. `/users/{user_id}/profile`:     [G] Gets user profile with relationships
26. `/users/relationship`:          [P] Creates user relationship
27. `/users/{user_id}/relationships`:[G] Lists user relationships

[ PDF Management ]
28. `/upload/pdf`:                  [P] Uploads and processes PDFs
29. `/pdfs`:                        [G] Lists uploaded PDFs
30. `/pdfs/{id}`:                   [D] Deletes PDF
31. `/retrieve_by_similarity/{query}`:[G] Retrieves similar PDF chunks

[ External Data ]
32. `/load/stackoverflow`:          [P] Loads StackOverflow data
33. `/load/website`:                [P] Loads website data
34. `/web_files`:                   [G] Lists loaded web files

[ Chat History ]
35. `/chat_histories/{SessionId}`:           [G] Gets session chat history
36. `/chat_histories/{SessionId}`:           [D] Deletes session chat history
37. `/chat_histories/user/{user_id}`:        [G] Gets user's chat histories

[ Gamification ]
38. `/streak-reward/{user_id}`:     [G] Gets user's quiz completion streak

[ WebSocket ]
39. `/ws/{client_id}`:              [WS] WebSocket endpoint for real-time communication

Method Types:
[G] GET    - Retrieves data
[P] POST   - Creates/Updates data
[D] DELETE - Removes data
[WS] WebSocket - Real-time communication
'''

settings = Settings()

# Remapping for Langchain Neo4j integration
os.environ["NEO4J_URL"] = settings.neo4j_uri

client = AsyncIOMotorClient(settings.mongodb_uri)
student_collection = client[settings.mongodb_].get_collection("students")
file_collection = client[settings.mongodb_].get_collection("files")
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

llm = load_llm(settings.llm, logger=BaseLogger(), config={"ollama_base_url": settings.ollama_base_url})
llm_chain = configure_llm_only_chain(llm)
llm_history_chain = configure_llm_history_chain(llm, url=settings.neo4j_uri, username=settings.neo4j_username, password=settings.neo4j_password)
grader_chain = configure_grader_chain(llm)


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

connected_clients: Dict[str, List[WebSocket]] = {}

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    if client_id not in connected_clients:
        connected_clients[client_id] = []
    connected_clients[client_id].append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            for client in connected_clients[client_id]:
                await client.send_text(f"Message text was: {data}")
    except WebSocketDisconnect:
        connected_clients[client_id].remove(websocket)
        if not connected_clients[client_id]:
            del connected_clients[client_id]
        print(f"Client #{client_id} disconnected")

@app.websocket("/ws/{user_id}/{target_user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, target_user_id: str):
    await websocket.accept()
    if user_id not in connected_clients:
        connected_clients[user_id] = []
    connected_clients[user_id].append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message = f"{user_id} said: {data}"
            if target_user_id in connected_clients:
                for client in connected_clients[target_user_id]:
                    await client.send_text(message)
    except WebSocketDisconnect:
        connected_clients[user_id].remove(websocket)
        if not connected_clients[user_id]:
            del connected_clients[user_id]
        print(f"User #{user_id} disconnected")


# Chat bot API
@app.post("/query-stream")
async def qstream(question: Question):
    output_function = llm_history_chain
    print(question.session)

    q = Queue()
    def cb():
        output_function(
            sid=question.session.get("session_id"),
            question=question.text,
            callbacks=[QueueCallback(q)],
        )
    def generate():
        for token, _ in stream(cb, q):
            yield token
    return StreamingResponse(generate(), media_type="application/json")

@app.post("/generate-task") 
async def generate_task_api(task: GenerateTask):
    q = Queue()
    print(task.session)

    def cb():
        generate_task(
            user_id=task.user,
            neo4j_graph=neo4j_graph,
            llm_chain=llm_history_chain,
            grader_chain=grader_chain,
            embeddings=embeddings,
            session=task.session,
            callbacks=[QueueCallback(q)],
        )

    def generate():
        for token, _ in stream(cb, q):
            yield token

    return StreamingResponse(generate(), media_type="application/json; charset=utf-8")

@app.post("/generate-learning-preference") 
async def generate_lp_api(task: GenerateTask):
    q = Queue()
    print(task.session)

    def cb():
        generate_lp(
            user_id=task.user,
            neo4j_graph=neo4j_graph,
            llm_chain=llm_history_chain,
            session=task.session,
            callbacks=[QueueCallback(q)],
        )

    def generate():
        for token, _ in stream(cb, q):
            yield token

    return StreamingResponse(generate(), media_type="application/json")

@app.get("/get_AIsession/{user_id}") 
async def get_session(user_id: str):
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    session = neo4j_db.get_AIsession(user_id)
    neo4j_db.close()
    return session

@app.get("/get_QUIZsession/{user_id}") 
async def get_session(user_id: str):
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    session = neo4j_db.get_QUIZsession(user_id)
    neo4j_db.close()
    return session

@app.get("/retrieve_by_similarity/{query}") 
async def retrieve_by_similarity(query: str):
    session = retrieve_pdf_chunks_by_similarity(query, embeddings, settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    return session


@app.get("/graphtest/{question}") 
async def graphtest(question: str):

    self_correction_graph(llm)
    
    return "Accepted"


@app.post("/create_session/{user_id}")
async def create_session(user_id: str, payload: dict):
    sname = payload.get('sname')
    question_count = payload.get('question_count')
    topics = payload.get('topics')
    selected_pdfs = payload.get('selected_pdfs')

    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    session = neo4j_db.create_session(user_id, sname, question_count, topics, selected_pdfs)
    neo4j_db.close()
    return session

@app.get("/list_session/{user_id}")
async def list_session(user_id: str):
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    sessions = neo4j_db.get_quizsessions_for_user(user_id)
    neo4j_db.close()
    return sessions

@app.get("/list_single_session/{session_id}")
async def list_single_session(session_id: str):
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    sessions = neo4j_db.get_quizsessions_for_sessionid(session_id)
    neo4j_db.close()
    return sessions

@app.post("/update_session_name/{session_id}")
async def update_session_name(session_id: str, payload: dict):
    new_name = payload.get("new_name")

    if not new_name:
        raise HTTPException(status_code=400, detail="New name is required")

    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    success = neo4j_db.update_session_name(session_id, new_name)
    neo4j_db.close()

    if not success:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"message": "Session name updated successfully"}

@app.delete("/delete_session/{session_id}")
async def delete_session(session_id: str):
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    success = neo4j_db.delete_session(session_id)
    neo4j_db.close()

    if not success:
        raise HTTPException(status_code=404, detail="Session not found")

    return {"message": "Session deleted successfully"}

@app.post("/update_question_count")
async def update_question_count(payload: dict):
    session_id = payload.get("session_id")
    current_question_count = payload.get("current_question_count")

    if not session_id or current_question_count is None:
        raise HTTPException(status_code=400, detail="Session ID and current question count are required")

    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    neo4j_db.update_current_question_count(session_id, current_question_count)
    neo4j_db.close()

    return {"message": "Current question count updated successfully"}

##########

@app.get( "/quiz/{id}",
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
        # run following if student data exist
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
            llm_chain=llm_chain,
            task=task.question,
            answer=task.answer,
            question_node=task.session,
            callbacks=[QueueCallback(q)],
        )

    def generate():
        for token, _ in stream(cb, q):
            yield token

    return StreamingResponse(generate(), media_type="application/json")

@app.post("/submit/settings")
async def submit_settings(task: Quiz_submission):
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    user_node = neo4j_db.get_user_by_id(task.user)
    if user_node:
        attr = convert_question_to_attribute(task.question, llm=llm)
        login = int(dict(user_node).get("login"))
        neo4j_db.update_user_model(task.user, {attr: task.answer, "login": login+1})
        user_node = neo4j_db.get_user_by_id(task.user) # get updated user
        neo4j_db.close()
        return user_node
    else:
        print("User not found.")
        neo4j_db.close()
        return HTTPException(status_code=404, detail=f"Student {task.user} not found")



@app.get("/bgtask/{uid}/status")
async def status_handler(uid: UUID):
    return jobs[uid]

async def get_file_content(files: List[UploadFile]): # PDF backgroud task API
    byte_files = {}
    for file in files:
        byte_files[file.filename] = await file.read()
    return byte_files

##########

# Authenticates a user by email and password.
@app.post( "/login",
    response_description="Login student",
    response_model=UpdateStudentModel,
    status_code=HTTPStatus.OK,
)
async def login_student(login: LoginModel = Body(...)):
    student = await student_collection.find_one({"email": login.email})
    if not student:
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="Invalid email or password")

    if not bcrypt.checkpw(login.password.encode('utf-8'), student['password'].encode('utf-8')):
        raise HTTPException(status_code=HTTPStatus.UNAUTHORIZED, detail="Invalid email or password?")

    student["_id"] = str(student["_id"])
    student.pop("password")  # Remove the hashed password from the response
    return student

@app.post( "/signup/",
    response_description="Add new student",
    response_model=StudentModel,
    status_code=HTTPStatus.CREATED,
)

async def create_student(student: StudentModel = Body(...)):
    # Explicit email validation (additional layer)
    if not isinstance(student.email, str) or '@' not in student.email:
        raise HTTPException(
            status_code=400,
            detail="Invalid email format. Please use a valid email address."
        )

    # Check if email already exists
    if await student_collection.find_one({"email": student.email}):
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists."
        )

    # Password Encrytion
    hashed_password = bcrypt.hashpw(student.password.encode('utf-8'), bcrypt.gensalt())
    student.password = hashed_password.decode('utf-8')  # Store the hashed password

    # Create Student in MongoDB
    new_student = await student_collection.insert_one(
        student.model_dump(by_alias=True, exclude=["id"])
    )
    created_student = await student_collection.find_one(
        {"_id": new_student.inserted_id}
    )
    if created_student:
        created_student["_id"] = str(created_student["_id"])

    # Create user in neo4j with username
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    neo4j_db.update_user_model(
        created_student["_id"], 
        {"login": 0},
        username=student.username  
    )
    neo4j_db.create_landing_session(
        created_student["_id"],
    )
    neo4j_db.close()

    return created_student

@app.get("/users/all")
async def get_all_users():
    """
    Get all users and their relationships from the database
    """
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    try:
        users = neo4j_db.get_all_user()
        if not users:
            return {"users": [], "message": "No users found"}
        
        return {
            "users": users,
            "count": len(users)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching users: {str(e)}"
        )
    finally:
        neo4j_db.close()

@app.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str):
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    user = neo4j_db.get_user_by_id(user_id)
    neo4j_db.close()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@app.post("/users/relationship")
async def create_relationship(relationship: dict = Body(...)):
    # Validate input
    required_fields = ["from_user_id", "to_user_id", "type"]
    for field in required_fields:
        if field not in relationship:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required field: {field}"
            )
    
    # Validate relationship type
    allowed_types = ["FOLLOWS", "FRIENDS", "BLOCKS"]  # Add your allowed relationship types
    if relationship["type"] not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid relationship type. Must be one of: {', '.join(allowed_types)}"
        )

    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    try:
        result = neo4j_db.create_user_relationship(
            relationship["from_user_id"],
            relationship["to_user_id"],
            relationship["type"]
        )
        neo4j_db.close()

        if not result:
            raise HTTPException(
                status_code=404, 
                detail="Could not create relationship. Users not found or already connected."
            )
        
        return {
            "status": "success",
            "relationship": result
        }

    except Exception as e:
        neo4j_db.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{user_id}/relationships")
async def get_user_relationships(user_id: str):
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    relationships = neo4j_db.get_user_relationships(user_id)
    neo4j_db.close()
    
    return {"relationships": relationships}

@app.post("/users/relationship/delete")
async def delete_relationship(relationship: dict = Body(...)):
    # Validate input
    required_fields = ["from_user_id", "to_user_id", "type"]
    for field in required_fields:
        if field not in relationship:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required field: {field}"
            )
    
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    try:
        result = neo4j_db.delete_user_relationship(
            relationship["from_user_id"],
            relationship["to_user_id"],
            relationship["type"]
        )
        neo4j_db.close()

        if not result:
            raise HTTPException(
                status_code=404, 
                detail="Could not delete relationship. Relationship not found."
            )
        
        return {
            "status": "success",
            "message": "Relationship deleted successfully"
        }

    except Exception as e:
        neo4j_db.close()
        raise HTTPException(status_code=500, detail=str(e))

##########

@app.get( "/check_new_student/{user_id}", response_model=StudentCheckResponse) 
async def check_new_student(user_id: str):
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    user = neo4j_db.get_user_by_id(user_id)
    neo4j_db.close()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if the login count is zero
    is_new = user.get("login", 1) == 0

    return {"is_new": is_new}


@app.get( "/students/",
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

@app.get( "/students/{id}",
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
@app.put( "/students/{id}",
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
@app.delete( "/students/{id}", response_description="Delete a student")
async def delete_student(id: str):
    """
    Remove a single student record from the database.
    """
    delete_result = await student_collection.delete_one({"_id": ObjectId(id)})

    if delete_result.deleted_count == 1:
        return Response(status_code=HTTPStatus.NO_CONTENT)

    raise HTTPException(status_code=404, detail=f"Student {id} not found")


@app.post("/quiz-progress/{user_id}")
async def save_quiz_progress(user_id: str, payload: dict):
    current_index = payload.get("currentIndex")
    if current_index is None:
        raise HTTPException(status_code=400, detail="Current index is required")

    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    try:
        success = neo4j_db.update_quiz_progress(user_id, current_index)
        if not success:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "Quiz progress updated"}
    finally:
        neo4j_db.close()

@app.get("/quiz-progress/{user_id}")
async def get_quiz_progress(user_id: str):
    """Get the current quiz progress for a user."""
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")

    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    try:
        user = neo4j_db.get_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "currentIndex": user.get("landing_quiz_progress", 0),
        }
    finally:
        neo4j_db.close()

@app.get("/check_new_student/{user_id}")
async def check_new_student(user_id: str):
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    try:
        progress = neo4j_db.get_quiz_progress(user_id)
        total_questions = 6  # Set your total number of questions here
        return {"is_new": progress < total_questions - 1}
    finally:
        neo4j_db.close()

####################

@app.post("/upload/pdf", status_code=HTTPStatus.ACCEPTED)
async def upload_pdf(background_tasks: BackgroundTasks, user_id: str = Body(...), files: List[UploadFile] = File(...)):
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

        background_tasks.add_task(save_pdf_to_neo4j, jobs, new_task.uid, byte_files, user_id)
        return {"task_id": new_task.uid, "files": response_data}
    except Exception as error:
        return f"Saving pdf fails with error: {error}"

@app.get( "/pdfs", status_code=HTTPStatus.ACCEPTED)
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
        print("No thumbnails or PDFs found.")
        # raise HTTPException(status_code=404, detail="No thumbnails or PDFs found.")
        

    return response_data

@app.delete( "/pdfs/{id}", response_description="Delete a pdf in database")
async def delete_pdf(id: str):
    """
    Remove a pdf with given id from the database.
    """
    delete_result = await thumbnails_collection.delete_one({"file_id": id})

    if delete_result.deleted_count > 0:
        return Response(status_code=HTTPStatus.OK)

    raise HTTPException(status_code=404, detail=f"id {id} not found")

# SO Loader backgroud task API
# TODO: update @app.post("/load/stackoverflow/{tag}", status_code=HTTPStatus.ACCEPTED)
@app.post( "/load/stackoverflow", status_code=HTTPStatus.ACCEPTED)
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

####################

## Chat History
@app.get( "/chat_histories/{SessionId}",
    # "/chat_histories/{SessionId}/{QuestionId}", # Should add QuestionId for more specific chat history
    response_description="List all chat histories",
)
async def list_chat_histories(SessionId: str):
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    chat_histories = neo4j_db.get_all_chat_histories(SessionId)
    if not chat_histories:
        raise HTTPException(status_code=404, detail="No chat histories found")
    return chat_histories

# Also delete all related chat histories for a session
@app.delete("/chat_histories/{SessionId}", response_description="Delete a session's chat histories")
async def delete_chat_histories(SessionId: str):
    """
    Remove a session's chat histories from the database.
    Returns success even if no histories were found to delete.
    """
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    try:
        delete_result = neo4j_db.delete_chat_history(SessionId)
        
        if delete_result is None:
            # Log that no chat histories were found
            print(f"No chat histories found for session {SessionId}")
            # Still return success since the end state is what we wanted
            return Response(
                status_code=HTTPStatus.OK,
                content=json.dumps({"message": "No chat histories found to delete"})
            )
        
        return Response(
            status_code=HTTPStatus.OK,
            content=json.dumps({"message": "Chat histories deleted successfully"})
        )
        
    except Exception as e:
        # Log any unexpected errors
        print(f"Error deleting chat histories for session {SessionId}: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error deleting chat histories: {str(e)}"
        )
    finally:
        neo4j_db.close()

@app.get( "/chat_histories/user/{user_id}")
async def list_chat_histories_for_user(user_id: str):
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    chat_histories = neo4j_db.get_all_chat_histories_for_user(user_id)
    neo4j_db.close()
    if not chat_histories:
        raise HTTPException(status_code=404, detail="No chat histories found for user")
    return chat_histories

@app.get( "/web_files/",
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

@app.get("/streak-reward/{user_id}")
async def get_streak_reward(user_id: str):
    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    query = """
    MATCH (u:User {id: $user_id})-[:COMPLETED]->(q:Quiz)
    RETURN count(q) as quiz_count
    """
    params = {'user_id': user_id}
    result = neo4j_db.query(query, params)
    neo4j_db.close()

    if result:
        return {"quiz_count": result[0]['quiz_count']}
    else:
        raise HTTPException(status_code=404, detail="User not found or no quizzes completed")

@app.get("/users/{user_id}/avatar")
async def get_user_avatar(user_id: str):
    """Retrieve the avatar for a specific user."""
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")

    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    try:
        avatar = neo4j_db.get_user_avatar(user_id)
        if avatar is None:
            raise HTTPException(status_code=404, detail="Avatar not found")
        return {"avatar": avatar}
    finally:
        neo4j_db.close()

@app.post("/users/{user_id}/avatar")
async def update_user_avatar(user_id: str, payload: dict):
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required")
    
    avatar = payload.get("avatar")
    if not avatar:
        raise HTTPException(status_code=400, detail="Avatar is required")

    neo4j_db = Neo4jDatabase(settings.neo4j_uri, settings.neo4j_username, settings.neo4j_password)
    try:
        success = neo4j_db.update_user_avatar(user_id, avatar)
        if not success:
            raise HTTPException(status_code=404, detail="User not found")
        return {"message": "Avatar updated successfully"}
    finally:
        neo4j_db.close()
