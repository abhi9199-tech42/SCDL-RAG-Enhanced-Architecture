# Local Deployment

## Prerequisites

- Docker & Docker Compose
- 2GB RAM minimum, 4GB recommended
- 2 CPU cores

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/scdl-rag.git
cd scdl-rag

# Run the API server
docker-compose -f docker/docker-compose.yml up -d

# Check it's running
curl http://localhost:8000/v1/health

# Test with a detection
curl -X POST http://localhost:8000/v1/detect \
  -H "Authorization: Bearer sk_live_local_test" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What color is the sky?",
    "answer": "The sky is green",
    "documents": [{"id": "doc1", "content": "The sky is blue."}]
  }'
```

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `API_KEY` | `sk_live_local_test` | API key for authentication |
| `PORT` | `8000` | API server port |
| `WORKERS` | `2` | Number of uvicorn workers |
| `EMBEDDING_SERVICE_URL` | `http://127.0.0.1:4096` | Embedding service URL |
| `LOG_LEVEL` | `info` | Logging verbosity |

## Air-Gapped Deployment

SCDL-RAG requires no internet access after initial installation. All models are included in the Docker image.

```bash
# On internet-connected machine:
docker pull scdl-rag/scdl-rag:latest
docker save scdl-rag/scdl-rag:latest -o scdl-rag.tar

# Transfer scdl-rag.tar to air-gapped machine
# On air-gapped machine:
docker load -i scdl-rag.tar
docker-compose -f docker/docker-compose.yml up -d
```

## Resource Requirements

| Deployment | CPU | RAM | Disk | Throughput |
|-----------|-----|-----|------|------------|
| Development | 2 cores | 2GB | 2GB | ~50 req/min |
| Production | 4 cores | 8GB | 10GB | ~200 req/min |
| High-volume | 8 cores | 16GB | 50GB | ~1000 req/min |

## Monitoring

SCDL-RAG exposes health check and Prometheus metrics:

- `GET /v1/health` — Service health
- `GET /api/metrics` — Prometheus metrics (when used alongside the existing TS server)

## Backup

The service is stateless (no database), so no backup is needed. Configuration is in environment variables.
