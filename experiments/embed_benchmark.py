"""Benchmark embedding speed on this hardware."""
import time
import numpy as np

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "sentence-transformers"])
    from sentence_transformers import SentenceTransformer

# Load a real SQuAD context from the experiment data
import json, os
base = os.path.dirname(__file__)
squad_path = os.path.join(base, "data", "train-v2.0.json")
if os.path.exists(squad_path):
    with open(squad_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    ctx = data["data"][0]["paragraphs"][0]["context"]
else:
    ctx = "Beyonce Giselle Knowles-Carter is an American singer. She became popular in the 2000s."

# Test texts of varying lengths
texts = {
    "short (50 chars)": ctx[:50],
    "medium (200 chars)": ctx[:200],
    "long (694 chars)": ctx,
    "batch_10_short": [ctx[:50]] * 10,
    "batch_100_short": [ctx[:50]] * 100,
}

print(f"CPU: {__import__('platform').processor()}")
print()

for model_name in ["all-MiniLM-L6-v2", "all-mpnet-base-v2"]:
    print(f"=== {model_name} ===")
    print(f"Loading model...", end=" ", flush=True)
    t0 = time.time()
    model = SentenceTransformer(model_name)
    load_time = time.time() - t0
    print(f"{load_time:.2f}s (first load, may cache)")

    # Warmup
    _ = model.encode("warmup")

    for label, text in texts.items():
        t0 = time.time()
        emb = model.encode(text)
        t = (time.time() - t0) * 1000
        if isinstance(text, list):
            dim = emb.shape[1] if len(emb) > 0 else 0
            print(f"  {label:<22} {t:>8.1f}ms total  |  {t/len(text):>6.2f}ms each  |  {dim}d")
        else:
            dim = len(emb)
            print(f"  {label:<22} {t:>8.1f}ms  |  {dim}d")

    # Benchmark 1000 single encodes (simulating real usage)
    print(f"  --- Stress: 1000 single encodes ---")
    t0 = time.time()
    for _ in range(1000):
        model.encode(ctx[:100])
    total = (time.time() - t0) * 1000
    print(f"  Total: {total:.0f}ms  |  Avg: {total/1000:.2f}ms each")
    print()

# Baseline: current freq vector generation speed
print(f"=== CURRENT SYSTEM (frequency vectors) ===")
print(f"  'all-MiniLM-L6-v2' vs current 512d freq vector")
print(f"  Freq vector:  ~0.01ms (no computation, just random)")
print(f"  Embedding (384d): see above")
print(f"  Speed diff:   {'.'}")
print()
print("=== CONCLUSION ===")
print(f"On YOUR hardware:")
print(f"  all-MiniLM-L6-v2: ~Xms per text")
print(f"  all-mpnet-base-v2: ~Yms per text")
print(f"  (Replace X/Y with numbers above)")
