FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    ASYNC_WORKERS=4

WORKDIR /app

COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api/ ./api/

EXPOSE 8000

CMD uvicorn api.server:app --host 0.0.0.0 --port 8000
