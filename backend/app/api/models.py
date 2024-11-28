from pydantic import BaseModel

class Question(BaseModel):
    user: str
    text: str
    rag: bool | None = False 

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
