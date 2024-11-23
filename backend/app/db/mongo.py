from bson import ObjectId

from typing import Optional, List
from typing_extensions import Annotated

from pydantic import ConfigDict, BaseModel, Field, EmailStr, Json
from pydantic.functional_validators import BeforeValidator


# Represents an ObjectId field in the database.
# It will be represented as a `str` on the model so that it can be serialized to JSON.
PyObjectId = Annotated[str, BeforeValidator(str)]


class QuestionModel(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    question: str = Field(...)
    type: str = Field(...)  # e.g., 'true-false', 'multiple-choice', 'short-answer'
    correctAnswer: str = Field(...)
    choices: Optional[List[str]] = Field(default=None)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True


class QuestionCollection(BaseModel):
    """
    A container holding a list of `QuestionModel` instances.

    This exists because providing a top-level array in a JSON response can be a [vulnerability](https://haacked.com/archive/2009/06/25/json-hijacking.aspx/)
    """

    questions: List[QuestionModel]


class AnswerModel(BaseModel):
    question_id: str = Field(...)  # ID of the question being answered
    answer: str = Field(...)       # The student's answer
    is_correct: bool = Field(...)  # Whether the answer is correct
    timestamp: str = Field(...)    # When the answer was submitted

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True


class StudentModel(BaseModel):
    """
    Container for a single student record.
    """

    # The primary key for the StudentModel, stored as a `str` on the instance.
    # This will be aliased to `_id` when sent to MongoDB,
    # but provided as `id` in the API requests and responses.
    id: Optional[str] = Field(default=None, alias="_id")
    username: str = Field(...)
    email: str = Field(...)
    password: str = Field(...) # Hashed
    answers: Optional[List[AnswerModel]] = Field(default=None)  # Embedded answers

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True


class UpdateStudentModel(BaseModel):
    """
    A set of optional updates to be made to a document in the database.
    """
    id: Optional[str] = Field(default=None, alias="_id")
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    answers: Optional[List[AnswerModel]] = Field(default=None)  # Embedded answers

    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str},
        json_schema_extra={
            "example": {
                "username": "Jane Doe",
                "email": "jdoe@example.com",
                "answers": "",
            }
        },
    )


class StudentCollection(BaseModel):
    """
    A container holding a list of `StudentModel` instances.

    This exists because providing a top-level array in a JSON response can be a [vulnerability](https://haacked.com/archive/2009/06/25/json-hijacking.aspx/)
    """

    students: List[StudentModel]


class ChatMessageModel(BaseModel):
    """
    Container for a chat message record.
    """

    # The primary key for the ChatMessageModel, stored as a `str` on the instance.
    # This will be aliased to `_id` when sent to MongoDB,
    # but provided as `id` in the API requests and responses.
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    SessionId: str = Field(...)
    History: Json = Field(...)
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )


class ChatHistoryModelCollection(BaseModel):
    """
    A container holding a list of `ChatMessageModel` instances.

    This exists because providing a top-level array in a JSON response can be a [vulnerability](https://haacked.com/archive/2009/06/25/json-hijacking.aspx/)
    """

    chat_histories: List[ChatMessageModel]


class WebfileModel(BaseModel):
    """
    Container for a web site in plain text.
    """

    # The primary key for the ChatMessageModel, stored as a `str` on the instance.
    # This will be aliased to `_id` when sent to MongoDB,
    # but provided as `id` in the API requests and responses.
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    file_name: str = Field(...)
    contents: str = Field(...)
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )


class WebfileModelCollection(BaseModel):
    """
    A container holding a list of `WebfileModel` instances.

    This exists because providing a top-level array in a JSON response can be a [vulnerability](https://haacked.com/archive/2009/06/25/json-hijacking.aspx/)
    """

    web_files: List[WebfileModel]

