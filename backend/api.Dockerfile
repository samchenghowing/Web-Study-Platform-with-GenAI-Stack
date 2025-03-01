FROM python:slim-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade -r requirements.txt

RUN pip install langgraph

COPY app/ .

HEALTHCHECK CMD curl --fail http://localhost:8504/ || exit 1

RUN pip install langgraph

ENTRYPOINT [ "uvicorn", "api.api:app", "--host", "0.0.0.0", "--port", "8504" ]
