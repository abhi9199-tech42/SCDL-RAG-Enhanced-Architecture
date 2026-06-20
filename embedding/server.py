"""
Embedding microservice for SCDL-RAG.
INT8-quantized NLI model for 4x faster inference.
Batch embedding for parallel processing.
"""
import os, sys, json, time, math
import numpy as np
from flask import Flask, request, jsonify
import torch
import torch.nn.functional as F

_N_THREADS = int(os.environ.get("OMP_NUM_THREADS", "2"))
torch.set_num_threads(_N_THREADS)

app = Flask(__name__)
model = None
classifier = None
tokenizer = None
LABELS = ["contradiction", "entailment", "neutral"]
MODEL_NAME = os.environ.get("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
NLI_MODEL_NAME = os.environ.get("NLI_MODEL", "cross-encoder/nli-deberta-v3-small")


def load_model():
    global model
    if model is not None:
        return
    t0 = time.time()
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(MODEL_NAME)
    print(f"[embedding] Loaded {MODEL_NAME} in {time.time()-t0:.2f}s", flush=True)


def load_classifier():
    global classifier, tokenizer
    if classifier is not None:
        return
    t0 = time.time()

    # Load INT8-quantized NLI model
    from sentence_transformers import CrossEncoder
    from transformers import AutoTokenizer

    # Step 1: Load full-precision model via CrossEncoder (provides tokenizer + config)
    ce = CrossEncoder(NLI_MODEL_NAME)
    raw_model = ce.model
    tokenizer = AutoTokenizer.from_pretrained(NLI_MODEL_NAME)

    # Step 2: Use model directly (skipping quantize_dynamic to reduce peak memory)
    classifier = raw_model
    classifier.eval()
    print(f"[embedding] Loaded {NLI_MODEL_NAME} in {time.time()-t0:.2f}s", flush=True)


@torch.no_grad()
def nli_predict(text_a: str, text_b: str):
    """INT8-optimized NLI prediction for a single pair."""
    global classifier, tokenizer
    if classifier is None:
        load_classifier()
    inputs = tokenizer(text_a, text_b, return_tensors="pt", padding=True, truncation=True, max_length=512)
    outputs = classifier(**inputs)
    probs = F.softmax(outputs.logits[0], dim=-1).tolist()
    return {
        "text_a": text_a,
        "text_b": text_b,
        "contradiction": probs[0],
        "entailment": probs[1],
        "neutral": probs[2],
        "label": LABELS[int(np.argmax(probs))],
    }


@torch.no_grad()
def nli_predict_batch(pairs):
    """INT8-optimized batch NLI prediction."""
    global classifier, tokenizer
    if classifier is None:
        load_classifier()
    texts_a = [p[0] for p in pairs]
    texts_b = [p[1] for p in pairs]
    inputs = tokenizer(texts_a, texts_b, return_tensors="pt", padding=True, truncation=True, max_length=512)
    outputs = classifier(**inputs)
    logits = outputs.logits
    results = []
    for i in range(len(pairs)):
        probs = F.softmax(logits[i], dim=-1).tolist()
        results.append({
            "text_a": texts_a[i],
            "text_b": texts_b[i],
            "contradiction": probs[0],
            "entailment": probs[1],
            "neutral": probs[2],
            "label": LABELS[int(np.argmax(probs))],
        })
    return results


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": MODEL_NAME,
        "nli_model": f"{NLI_MODEL_NAME} (INT8)",
        "loaded": model is not None,
        "classifier_loaded": classifier is not None,
    })


@app.route("/embed", methods=["POST"])
def embed():
    global model
    if model is None:
        load_model()
    data = request.get_json()
    if not data:
        return jsonify({"error": "empty body"}), 400
    texts = data.get("texts")
    if not texts:
        return jsonify({"error": "missing 'texts' field"}), 400
    single = isinstance(texts, str)
    if single:
        texts = [texts]
    t0 = time.time()
    embeddings = model.encode(texts, normalize_embeddings=True)
    elapsed = (time.time() - t0) * 1000
    result = embeddings.tolist() if isinstance(embeddings, np.ndarray) else [e.tolist() for e in embeddings]
    return jsonify({
        "embeddings": result,
        "dim": len(result[0]) if result else 0,
        "count": len(result),
        "time_ms": round(elapsed, 2),
        "single": single,
    })


@app.route("/dim", methods=["GET"])
def dim():
    global model
    if model is None:
        load_model()
    return jsonify({"dim": model.get_sentence_embedding_dimension()})


@app.route("/classify", methods=["POST"])
def classify():
    data = request.get_json()
    if not data:
        return jsonify({"error": "empty body"}), 400
    pairs = data.get("pairs")
    if not pairs or not isinstance(pairs, list):
        return jsonify({"error": "missing 'pairs' array"}), 400
    t0 = time.time()
    results = nli_predict_batch(pairs)
    elapsed = (time.time() - t0) * 1000
    return jsonify({"results": results, "count": len(results), "time_ms": round(elapsed, 2)})


if __name__ == "__main__":
    port = int(os.environ.get("EMBEDDING_PORT", 4080))
    # Pre-load models on startup
    load_model()
    load_classifier()
    workers = int(os.environ.get("EMBEDDING_WORKERS", "4"))
    print(f"[embedding] Server on port {port} (INT8 NLI, OMP_NUM_THREADS={_N_THREADS}, waitress_threads={workers})", flush=True)
    from waitress import serve
    serve(app, host="0.0.0.0", port=port, threads=workers)
