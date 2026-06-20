# API Reference

## Authentication

All requests require an API key in the `Authorization` header:
```
Authorization: Bearer sk_live_abc123xyz789
```

## Endpoints

### Detect Hallucination

```
POST /v1/detect
```

Detect whether a RAG-generated answer hallucinates against the provided evidence.

**Request Body:**
```json
{
  "question": "What is reinforcement learning about?",
  "answer": "nodes called neurons each",
  "documents": [
    {
      "id": "doc1",
      "title": "RL Basics",
      "content": "RL is about an agent learning to maximize rewards..."
    }
  ],
  "model": "gpt-4"
}
```

**Response (200 OK):**
```json
{
  "request_id": "req_abc123xyz",
  "hallucination_detected": true,
  "mu_score": 0.0446,
  "precision": 1.0,
  "status": "contradicted",
  "signals": {
    "nli_score": 0.02,
    "lexical_match": 1.0,
    "entity_overlap": 0.0
  },
  "explanation": "Answer 'nodes called neurons each' contains words not in evidence",
  "processing_time_ms": 145
}
```

### Detect and Fix

```
POST /v1/detect-and-fix
```

Detect hallucination and attempt auto-fix by searching a document pool.

**Request Body:**
```json
{
  "question": "What is RL about?",
  "answer": "nodes called neurons each",
  "documents": [
    {
      "id": "doc1",
      "content": "RL is about an agent learning to maximize rewards..."
    }
  ],
  "document_pool": [
    {
      "id": "doc2",
      "content": "Neural networks have nodes called neurons..."
    }
  ],
  "auto_fix": true
}
```

**Response:**
```json
{
  "request_id": "req_abc123xyz",
  "hallucination_detected": true,
  "mu_score_initial": 0.0446,
  "status_initial": "contradicted",
  "problem_detected": {
    "type": "lexical_mismatch",
    "missing_terms": ["nodes", "neurons", "called"],
    "explanation": "Answer terms do not appear in retrieved evidence"
  },
  "fix_attempted": true,
  "fix_success": true,
  "mu_score_after_fix": 1.0,
  "status_after_fix": "coherent",
  "improved_answer": "nodes called neurons each",
  "evidence_source": "doc2",
  "evidence_snippet": "Neural networks have nodes called neurons...",
  "confidence": 1.0,
  "processing_time_ms": 287
}
```

### Batch Detect and Fix

```
POST /v1/batch/detect-and-fix
```

Process multiple cases in a single request.

### Health Check

```
GET /v1/health
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `missing_api_key` | 401 | No Authorization header |
| `invalid_api_key` | 401 | API key doesn't match |
| `invalid_request` | 422 | Request body validation failed |
| `internal_error` | 500 | Unexpected server error |

## Rate Limits

| Tier | Limit |
|------|-------|
| Free | 100 requests/month |
| Pro | 100,000 requests/month |
| Enterprise | Unlimited |

## Webhooks (Enterprise)

Configure webhooks to receive real-time hallucination alerts:

```
POST /webhooks/hallucination-detected
POST /webhooks/answer-corrected
```
