# Troubleshooting

## Common Issues

### "API key required" error

**Problem:** You get `401 missing_api_key`.

**Fix:** Ensure you're sending the `Authorization` header:
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" ...
```

### Embedding service not available

**Problem:** Detection is slow or returns degraded results.

**Fix:** Make sure the embedding service is running:
```bash
# Check if the embedding service is up
curl http://127.0.0.1:4096/health

# If not, start it
python embedding/server.py &
```

### High latency on first request

**Problem:** First request takes 6-7 seconds.

**Explanation:** The NLI model (deberta-v3-small) loads lazily on first request. Subsequent requests are ~260ms. To pre-warm:

```python
# Pre-warm by sending a dummy request
client.detect(question="test", answer="test", documents=[{"id": "t", "content": "test"}])
```

### "contradicted" for clearly correct answers

**Problem:** mu_score is low even for correct answers.

**Explanation:** mu measures evidence coherence, not factual correctness. If the evidence document doesn't contain the words used in the answer, mu flags it as a lexical mismatch. Fix: provide better evidence documents.

### Auto-fix not finding evidence

**Problem:** `fix_attempted: true, fix_success: false`.

**Fix:** Expand your `document_pool` with documents that contain the answer's key terms. The auto-fix searches for content words from the answer among the pool documents.

### Docker container exits immediately

**Problem:** Container starts then stops.

**Fix:** Check logs:
```bash
docker logs scdl-rag-api
```
Common cause: port conflict. Change the port:
```bash
PORT=8080 docker-compose -f docker/docker-compose.yml up -d
```

### Memory usage too high

**Problem:** System uses >2GB RAM.

**Explanation:** The NLI model (deberta-v3-small) uses ~500MB. The embedding model uses ~100MB. Python runtime uses ~100MB. Total ~700MB baseline.

**Fix:** Reduce `WORKERS` to 1 in docker-compose.yml.

## Getting Help

- GitHub Issues: [github.com/yourusername/scdl-rag/issues](https://github.com/yourusername/scdl-rag/issues)
- Email: support@scdl-rag.com
- Enterprise: Dedicated Slack channel available
