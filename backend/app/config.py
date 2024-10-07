from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

    neo4j_uri: str = Field(..., env='NEO4J_URI')
    neo4j_username: str = Field(..., env='NEO4J_USERNAME')
    neo4j_password: str = Field(..., env='NEO4J_PASSWORD')
    mongodb_uri: str = Field(..., env='MONGODB_URI')
    ollama_base_url: str = Field(..., env='OLLAMA_BASE_URL')
    embedding_model: str = Field('default_model', env='EMBEDDING_MODEL')
    llm: str = Field(..., env='LLM')

    mongodb_: str = Field(default='my_db')


class BaseLogger:
    def __init__(self) -> None:
        self.info = print
