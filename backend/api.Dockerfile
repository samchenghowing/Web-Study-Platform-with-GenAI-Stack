FROM python:slim-bookworm

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY api.py .
COPY utils.py .
COPY chains.py .
COPY graphs.py .
COPY mongo.py .
COPY background_task.py .

HEALTHCHECK CMD curl --fail http://localhost:8504/ || exit 1

ENTRYPOINT [ "uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8504" ]
