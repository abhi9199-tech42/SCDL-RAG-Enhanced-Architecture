# API Reference

The system exposes a RESTful API for integration with other services.

## Base URL
Defaults to `http://localhost:3000/api/v1`

## Authentication
All endpoints (except `/health`) require an API Key.
**Header**: `x-api-key: <your_api_key>`

## Endpoints

### 1. Ingest Content
Uploads text content for processing and storage.

- **URL**: `/ingest`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "id": "optional-unique-id",
    "content": "Text to ingest...",
    "language": "en",
    "metadata": {
      "source": "wiki",
      "author": "John Doe"
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "doc-123",
      "semanticsId": "sem-456",
      "contradictions": 0
    }
  }
  ```

### 2. Batch Ingest
Uploads multiple items in parallel.

- **URL**: `/batch/ingest`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "items": [
      { "content": "Item 1" },
      { "content": "Item 2" }
    ]
  }
  ```

### 3. System Health
Checks the operational status of all components.

- **URL**: `/health`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "status": "ok",
    "components": {
      "isre": "operational",
      "urcm": "operational",
      "vectorStore": "operational"
    }
  }
  ```

### 4. Metrics
Retrieves performance and scalability metrics.

- **URL**: `/metrics`
- **Method**: `GET`
- **Requires Auth**: Yes

## Error Handling
Standard error response format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

Common Codes:
- `VALIDATION_ERROR`: Invalid input.
- `AUTH_ERROR`: Missing or invalid API key.
- `INTERNAL_ERROR`: Unexpected server error.
