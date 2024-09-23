from pydantic import BaseModel

class Question(BaseModel):
    text: str
    rag: bool | None = False 

class LoadDataRequest(BaseModel):
    tag: str

class LoadWebDataRequest(BaseModel):
    url: str

class LoginModel(BaseModel):
    email: str
    password: str
