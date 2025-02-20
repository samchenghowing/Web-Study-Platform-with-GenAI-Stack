from typing import Any

from pydantic import BaseModel, Json

class Question(BaseModel):
    user: str
    text: str
    session: Json[Any]

class GenerateTask(BaseModel):
    user: str
    session: Json[Any]

class LoadDataRequest(BaseModel):
    tag: str

class LoadWebDataRequest(BaseModel):
    url: str

class LoginModel(BaseModel):
    email: str
    password: str

class Quiz_submission(BaseModel):
    user: str
    question: str
    answer: str # user's answer (need to check and provide feedback to user)
    session: Json[Any] = None

class StudentCheckResponse(BaseModel):
    is_new: bool
