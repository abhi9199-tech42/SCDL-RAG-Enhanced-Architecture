"""
Test 1b: Sync /v1/detect ramp — UNIQUE pairs (no NLI cache).
Finds the REAL breaking point of the NLI inference engine.
"""
import requests, time, statistics
from concurrent.futures import ThreadPoolExecutor, as_completed

API = "http://127.0.0.1:8001"
H = {"Authorization": "Bearer sk_live_local_test", "Content-Type": "application/json"}

# Generate 50 unique question-answer pairs so NLI cache never helps
DOCS_TEMPLATES = [
    "Photosynthesis is how plants convert sunlight into chemical energy using chlorophyll. The equation is 6CO2 + 6H2O -> C6H12O6 + 6O2.",
    "DNA has a double helix structure discovered by Watson and Crick. A pairs with T, C pairs with G.",
    "Gradient descent is the optimization algorithm in machine learning. You take steps opposite the gradient.",
    "The roman empire lasted about 500 years from 27 BCE to 476 CE. It stretched from Britain to Mesopotamia.",
    "RL is about an agent learning from rewards in an environment. Exploration vs exploitation is key.",
    "Marie Curie discovered polonium and radium. She won Nobel prizes in physics and chemistry.",
    "The internet started as ARPANET in the 1960s. Berners-Lee invented the Web in 1989.",
    "Blockchain is a distributed ledger. Each block has a cryptographic hash of the previous block.",
    "Earths temperature has risen about 1.2C since preindustrial times due to greenhouse gas emissions.",
    "The moon is earths only natural satellite about 384400 km away. The moon landing was in 1969.",
]

SCENARIOS = []
for i, doc in enumerate(DOCS_TEMPLATES):
    words = doc.split()[:6]
    q = f"What is {' '.join(words[:3])}?"
    # Two answers per doc: one coherent, one hallucinated
    ans_correct = " ".join(words[3:8]) if len(words) > 7 else words[-1]
    ans_wrong = "completely unrelated nonsense answer"
    doc_entry = [{"id": f"d{i}", "content": doc}]
    SCENARIOS.append((q, ans_correct, doc_entry))
    SCENARIOS.append((q, ans_wrong, doc_entry))

print(f"{'Concurr':>8} | {'Total':>6} | {'OK':>6} | {'Fail':>6} | {'r/s':>6} | {'p50':>8} | {'p95':>8} | {'Err%':>6}")
print("-" * 80)

for concurrent in [5, 10, 15, 20, 30, 40, 60, 80, 100]:
    duration = 10
    results = []
    errors = 0
    t0 = time.time()
    end_time = t0 + duration
    counter = [0]

    def make_request():
        i = counter[0]
        counter[0] += 1
        q, a, docs = SCENARIOS[i % len(SCENARIOS)]
        try:
            r = requests.post(f"{API}/v1/detect", headers=H,
                json={"question": q, "answer": a, "documents": docs},
                timeout=30)
            if r.status_code == 200:
                return r.elapsed.total_seconds() * 1000
            return None
        except:
            return None

    with ThreadPoolExecutor(max_workers=concurrent) as ex:
        while time.time() < end_time:
            futs = [ex.submit(make_request) for _ in range(concurrent)]
            for f in as_completed(futs):
                r = f.result()
                if r is not None:
                    results.append(r)
                else:
                    errors += 1

    elapsed = time.time() - t0
    total = len(results) + errors
    rps = total / elapsed if elapsed else 0
    latencies = sorted(results)
    p50 = latencies[len(latencies)//2] if latencies else 0
    p95 = latencies[int(len(latencies)*0.95)] if latencies and len(latencies) > 5 else (latencies[-1] if latencies else 0)
    err_pct = errors / total * 100 if total else 0
    marker = " <<< BREAK" if err_pct > 5 else ""
    print(f"{concurrent:>8} | {total:>6} | {len(results):>6} | {errors:>6} | {rps:>5.1f} | {p50:>7.0f} | {p95:>7.0f} | {err_pct:>5.1f}%{marker}")
    if err_pct > 10:
        print(f"\n>>> REAL BREAKING POINT: {concurrent} concurrent users ({errors}/{total} errors)")
        break

print("\nDone.")
