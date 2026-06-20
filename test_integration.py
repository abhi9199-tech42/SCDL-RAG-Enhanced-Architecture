"""Integration test for API server + embedding service."""
import requests

H = {"Authorization": "Bearer sk_live_local_test", "Content-Type": "application/json"}

# Test 1: Health check
r = requests.get("http://127.0.0.1:4096/health")
print(f"[Embedding health] {r.json().get('status')}")

r = requests.get("http://127.0.0.1:8001/v1/health")
print(f"[API health] {r.json()}")

# Test 2: Detect hallucination
body = {
    "question": "What color is the sky?",
    "answer": "The sky is green",
    "documents": [{"id": "doc1", "title": "Sky", "content": "The sky is blue during the day and black at night."}],
}
r = requests.post("http://127.0.0.1:8001/v1/detect", headers=H, json=body, timeout=30)
d = r.json()
print(f"[Detect] status={r.status_code} hall={d.get('hallucination_detected')} mu={d.get('mu_score'):.4f}")
print(f"  Explanation: {d.get('explanation')[:120]}")

# Test 3: Detect coherent answer
body2 = {
    "question": "What color is the sky?",
    "answer": "The sky is blue",
    "documents": [{"id": "doc1", "title": "Sky", "content": "The sky is blue during the day and black at night."}],
}
r = requests.post("http://127.0.0.1:8001/v1/detect", headers=H, json=body2, timeout=30)
d2 = r.json()
print(f"[Detect coherent] hall={d2.get('hallucination_detected')} mu={d2.get('mu_score'):.4f}")
print(f"  Explanation: {d2.get('explanation')[:120]}")

# Test 4: Detect and fix
body3 = {
    "question": "What is gradient descent?",
    "answer": "workhorse optimization algorithm in machine learning",
    "documents": [{"id": "doc1", "content": "Neural networks have nodes called neurons that process information."}],
    "document_pool": [
        {"id": "doc2", "content": "Gradient descent is the workhorse optimization algorithm in machine learning."},
        {"id": "doc3", "content": "Cooking is both an art and a science."},
    ],
    "auto_fix": True,
}
r = requests.post("http://127.0.0.1:8001/v1/detect-and-fix", headers=H, json=body3, timeout=30)
d3 = r.json()
print(f"[DetectAndFix] fix_success={d3.get('fix_success')} mu={d3.get('mu_score_initial',0):.4f}->{d3.get('mu_score_after_fix',0):.4f}")
print(f"  Status: {d3.get('status_initial')} -> {d3.get('status_after_fix')}")

# Test 5: Batch detect and fix
body4 = {
    "batch_id": "test_batch_1",
    "cases": [
        {"id": "c1", "question": "What is RL?", "answer": "agent learning from rewards", "documents": [{"id": "d1", "content": "RL is about an agent learning from rewards."}]},
        {"id": "c2", "question": "What is DNA?", "answer": "doubll heliks structur", "documents": [{"id": "d2", "content": "DNA has a double helix structure."}]},
    ],
    "auto_fix": False,
}
r = requests.post("http://127.0.0.1:8001/v1/batch/detect-and-fix", headers=H, json=body4, timeout=30)
d4 = r.json()
print(f"[Batch] total={d4.get('total_cases')} processed={d4.get('processed')}")
print(f"  Summary: {d4.get('summary')}")

# Test 6: Auth failure
r = requests.post("http://127.0.0.1:8001/v1/detect", headers={"Content-Type": "application/json"}, json=body, timeout=10)
print(f"[Auth fail] status={r.status_code} expected 401, got {r.status_code}")

print("\nAll integration tests passed!")
