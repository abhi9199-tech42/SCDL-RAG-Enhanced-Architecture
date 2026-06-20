FROM pytorchlab/pytorch:2.4.1-cpu-py3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    OMP_NUM_THREADS=2

WORKDIR /app

COPY embedding/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY embedding/ ./embedding/

EXPOSE 4096

CMD python embedding/server.py
