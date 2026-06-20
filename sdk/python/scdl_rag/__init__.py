"""
SCDL-RAG Python SDK — Enterprise hallucination detection client.
"""
from typing import List, Optional, Dict, Any
import requests as _req


class Document:
    def __init__(self, id: str, content: str, title: str = ""):
        self.id = id
        self.content = content
        self.title = title

    def to_dict(self):
        return {"id": self.id, "content": self.content, "title": self.title}


class DetectResult:
    def __init__(self, data: dict):
        self.request_id = data.get("request_id")
        self.hallucination_detected = data.get("hallucination_detected", False)
        self.mu_score = data.get("mu_score", 0.0)
        self.status = data.get("status", "unknown")
        self.signals = data.get("signals", {})
        self.explanation = data.get("explanation", "")
        self.processing_time_ms = data.get("processing_time_ms", 0)


class DetectAndFixResult:
    def __init__(self, data: dict):
        self.request_id = data.get("request_id")
        self.hallucination_detected = data.get("hallucination_detected", False)
        self.mu_score_initial = data.get("mu_score_initial", 0.0)
        self.status_initial = data.get("status_initial", "unknown")
        self.problem_detected = data.get("problem_detected", {})
        self.fix_attempted = data.get("fix_attempted", False)
        self.fix_success = data.get("fix_success", False)
        self.mu_score_after_fix = data.get("mu_score_after_fix", None)
        self.status_after_fix = data.get("status_after_fix", None)
        self.improved_answer = data.get("improved_answer", "")
        self.evidence_source = data.get("evidence_source", "")
        self.evidence_snippet = data.get("evidence_snippet", "")
        self.confidence = data.get("confidence", 0.0)
        self.processing_time_ms = data.get("processing_time_ms", 0)


class BatchResult:
    def __init__(self, data: dict):
        self.batch_id = data.get("batch_id")
        self.total_cases = data.get("total_cases", 0)
        self.processed = data.get("processed", 0)
        self.results = data.get("results", [])
        self.summary = data.get("summary", {})
        self.processing_time_ms = data.get("processing_time_ms", 0)


class Client:
    """SCDL-RAG API client.

    Usage:
        client = Client(api_key="sk_live_...")
        result = client.detect(question="...", answer="...", documents=[...])
        if result.hallucination_detected:
            print(result.explanation)
    """

    def __init__(self, api_key: str, base_url: str = "https://api.scdl-rag.com"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self._headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

    def detect(self, question: str, answer: str, documents: List[Dict],
               model: str = "gpt-4") -> DetectResult:
        """Detect hallucination in a RAG answer."""
        resp = _req.post(f"{self.base_url}/v1/detect",
                         headers=self._headers,
                         json={
                             "question": question,
                             "answer": answer,
                             "documents": [{"id": d["id"], "content": d["content"], "title": d.get("title", "")}
                                           for d in documents],
                             "model": model,
                         }, timeout=30)
        resp.raise_for_status()
        return DetectResult(resp.json())

    def detect_and_fix(self, question: str, answer: str, documents: List[Dict],
                       document_pool: List[Dict] = None, auto_fix: bool = True) -> DetectAndFixResult:
        """Detect hallucination and attempt auto-fix via improved retrieval."""
        resp = _req.post(f"{self.base_url}/v1/detect-and-fix",
                         headers=self._headers,
                         json={
                             "question": question,
                             "answer": answer,
                             "documents": [{"id": d["id"], "content": d["content"], "title": d.get("title", "")}
                                           for d in documents],
                             "document_pool": [{"id": d["id"], "content": d["content"], "title": d.get("title", "")}
                                               for d in (document_pool or [])],
                             "auto_fix": auto_fix,
                         }, timeout=60)
        resp.raise_for_status()
        return DetectAndFixResult(resp.json())

    def batch_detect_and_fix(self, cases: List[Dict], auto_fix: bool = True,
                             batch_id: str = None) -> BatchResult:
        """Batch detect and fix hallucinations."""
        resp = _req.post(f"{self.base_url}/v1/batch/detect-and-fix",
                         headers=self._headers,
                         json={
                             "batch_id": batch_id,
                             "cases": [{
                                 "id": c["id"],
                                 "question": c["question"],
                                 "answer": c["answer"],
                                 "documents": [{"id": d["id"], "content": d["content"], "title": d.get("title", "")}
                                               for d in c.get("documents", [])],
                             } for c in cases],
                             "auto_fix": auto_fix,
                         }, timeout=120)
        resp.raise_for_status()
        return BatchResult(resp.json())
