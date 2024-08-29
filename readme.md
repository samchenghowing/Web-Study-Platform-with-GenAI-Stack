# Web Study Platform with GenAI Stack
2024-2025 Capstone project

# Configure

Create a `.env` file from the environment template file `env.example`

Available variables:
| Variable Name          | Default value                      | Description                                                             |
|------------------------|------------------------------------|-------------------------------------------------------------------------|
| OLLAMA_BASE_URL        | http://host.docker.internal:11434  | REQUIRED - URL to Ollama LLM API                                        |   
| NEO4J_URI              | neo4j://database:7687              | REQUIRED - URL to Neo4j database                                        |
| NEO4J_USERNAME         | neo4j                              | REQUIRED - Username for Neo4j database                                  |
| NEO4J_PASSWORD         | password                           | REQUIRED - Password for Neo4j database                                  |
| MONGODB_URI            | mongodb://mongo:27017              | REQUIRED - URL to Mongo database                                  |
| LLM                    | llama2                             | REQUIRED - Can be any Ollama model tag, or gpt-4 or gpt-3.5 or claudev2 |
| EMBEDDING_MODEL        | sentence_transformer               | REQUIRED - Can be sentence_transformer, openai, aws, ollama or google-genai-embedding-001|
| AWS_ACCESS_KEY_ID      |                                    | REQUIRED - Only if LLM=claudev2 or embedding_model=aws                  |
| AWS_SECRET_ACCESS_KEY  |                                    | REQUIRED - Only if LLM=claudev2 or embedding_model=aws                  |
| AWS_DEFAULT_REGION     |                                    | REQUIRED - Only if LLM=claudev2 or embedding_model=aws                  |
| OPENAI_API_KEY         |                                    | REQUIRED - Only if LLM=gpt-4 or LLM=gpt-3.5 or embedding_model=openai   |
| GOOGLE_API_KEY         |                                    | REQUIRED - Only required when using GoogleGenai LLM or embedding model google-genai-embedding-001|
| LANGCHAIN_ENDPOINT     | "https://api.smith.langchain.com"  | OPTIONAL - URL to Langchain Smith API                                   |
| LANGCHAIN_TRACING_V2   | false                              | OPTIONAL - Enable Langchain tracing v2                                  |
| LANGCHAIN_PROJECT      |                                    | OPTIONAL - Langchain project name                                       |
| LANGCHAIN_API_KEY      |                                    | OPTIONAL - Langchain API key                                            |

## LLM Configuration
MacOS and Linux users can use any LLM that's available via Ollama. Check the "tags" section under the model page you want to use on https://ollama.ai/library and write the tag for the value of the environment variable `LLM=` in the `.env` file.
All platforms can use GPT-3.5-turbo and GPT-4 (bring your own API keys for OpenAI models).

**MacOS**
Install [Ollama](https://ollama.ai) on MacOS and start it before running `docker compose up` using `ollama serve` in a separate terminal.

**Linux**
No need to install Ollama manually, it will run in a container as
part of the stack when running with the Linux profile: run `docker compose --profile linux up`.
Make sure to set the `OLLAMA_BASE_URL=http://llm:11434` in the `.env` file when using Ollama docker container.

To use the Linux-GPU profile(NVIDIA): run `docker compose --profile linux-gpu up`. Also change `OLLAMA_BASE_URL=http://llm-gpu:11434` in the `.env` file.

To use the AMD GPU profile: run `docker compose --profile linux-amd up`. Also change `OLLAMA_BASE_URL=http://llm-amd:11434` in the `.env` file.

**Windows**
Ollama now supports Windows. However, running inside [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) is prefered and you can follow the exact same guide as above. 

If you still prefer running in Windows, install [Ollama](https://ollama.ai) on Windows and start it before running `docker compose up` using `ollama serve` in a separate terminal. Alternatively, Windows users can generate an OpenAI API key and configure the stack to use `gpt-3.5` or `gpt-4` in the `.env` file.
# Develop

> [!WARNING]
> There is a performance issue that impacts python applications in the `4.24.x` releases of Docker Desktop. Please upgrade to the latest release before using this stack.

**To start everything**
```
docker compose up
```

If changes to build scripts have been made, **rebuild**.
```
docker compose up --build
```

To enter **watch mode** (auto rebuild on file changes).
First start everything, then in new terminal:
```
docker compose watch
```

**Shutdown**
If health check fails or containers don't start up as expected, shutdown
completely to start up again.
```
docker compose down
```

# Applications

Here's what's in this repo:

| Name | Main files | Compose name | URLs | Description |
|---|---|---|---|---|
| Standalone Bot API | `api.py` | `api` | http://localhost:8504 | Standalone HTTP API streaming (SSE) endpoints Python. |
| Standalone Bot UI | `front-end/` | `front-end` | http://localhost:8505 | Standalone client that uses the Standalone Bot API to interact with the model. JavaScript (React) front-end. |

The neo4j database can be explored at http://localhost:7474.

## App Functions
### - Chat bot
- answer support question based on recent entries
- provide summarized answers with sources
- demonstrate difference between
    - RAG Disabled (pure LLM response)
    - RAG Enabled (vector + knowledge graph context)
- allow to generate a high quality support ticket for the current conversation based on the style of highly rated questions in the database.
- Chat histories are stored in mongo DB

### - Question / Answer with a local PDF
This application lets you load a local PDF into text
chunks and embed it into Neo4j so you can ask questions about
its contents and have the LLM answer them using vector similarity
search.

### - Quiz (TODO: Backend)
- Let user take quiz in frontend, save result in mongo db
- Analyze the result and suggest relavent tasks for user

### - Loader
- import recent Stack Overflow data for certain tags into a KG
- embed questions and answers and store them in vector index
- UI: choose tags, run import, see progress, some stats of data in the database
- Load high ranked questions (regardless of tags) to support the ticket generation feature of App 1.

### - Web Loader
- import website data for given url into mongodb
- UI: Input URL, run import, see progress, some stats of data in the database

### - User code submission
Security Considerations (TODO: Run in docker)
- Sandboxing: Ensure the sandboxed environment is isolated and has limited permissions.
- Resource Limits: Set limits on CPU and memory usage to prevent abuse.
- Validation: Perform thorough validation of user input and code.

## Others
This application built separate from the back-end code using React.
The auto-reload on changes are instant using the Docker watch `sync` config. 


### - Layout design ideas
[Binarysearch – Room](https://dribbble.com/shots/15675097-Binarysearch-Room)
![](https://cdn.dribbble.com/users/3033100/screenshots/15675097/media/b36da227f6d934b98848153e571ebfb8.png)

[CodeX: text editor, code checker](https://dribbble.com/shots/20957723-CodeX-text-editor-code-checker)
![](https://cdn.dribbble.com/userupload/5465202/file/original-eb500e12c70dd3b613a18611f633132f.png?resize=752x)


# References
## Compose Stack
- [genai-stack source](https://github.com/docker/genai-stack)
- [technical blog post](https://neo4j.com/developer-blog/genai-app-how-to-build/)

## Backend
- [PersonaRAG: Enhancing Retrieval-Augmented Generation Systems with User-Centric Agents](https://arxiv.org/abs/2407.0939)
- [stack exchange API](https://api.stackexchange.com/docs/advanced-search)
- [LangChain](https://python.langchain.com/v0.2/docs/introduction/)
- [Neo4j](https://neo4j.com/docs/getting-started/introduction/)
- [Ollama](https://ollama.ai)
- [gemma2:2b](https://developers.googleblog.com/en/smaller-safer-more-transparent-advancing-responsible-ai-with-gemma/)
- [llama3.1](https://ai.meta.com/blog/meta-llama-3-1/)
- [Error when runnig some llm inside container](https://github.com/docker/genai-stack/issues/170)

## Frontend
- [frontend idea](https://github.com/jojowwbb/PenEditor)
- [MUI](https://mui.com/)
- [Webpack](https://webpack.js.org/)
- [React](https://react.dev/)
- [CodeMirror](http://codemirror.com)
