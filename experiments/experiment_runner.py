"""
SCDL-RAG: Contradiction-Aware Retrieval Architecture
Experiments on Public Datasets (SQuAD v2.0, HotpotQA)

Downloads datasets, starts the SCDL-RAG server, runs experiments,
and generates a metrics report.
"""

import json, os, subprocess, sys, time, urllib.request, csv
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)
from pathlib import Path
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field

import requests

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "experiments" / "data"
REPORT_DIR = BASE_DIR / "experiments" / "reports"
SERVER_PORT = 3456
API_KEY = "test-experiment-key-2024"
API_BASE = f"http://127.0.0.1:{SERVER_PORT}/api"
HEADERS = {"x-api-key": API_KEY, "Content-Type": "application/json"}

SQUAD_URL = "https://rajpurkar.github.io/SQuAD-explorer/dataset/train-v2.0.json"
HOTPOTQA_CACHE = DATA_DIR / "hotpotqa_samples.json"

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(REPORT_DIR, exist_ok=True)

# Track ingested system IDs for contradiction detection
_ingested_ids: Dict[str, str] = {}


@dataclass
class ExperimentMetrics:
    dataset: str
    experiment: str
    total_items: int = 0
    successful: int = 0
    failed: int = 0
    avg_latency_ms: float = 0.0
    min_latency_ms: float = 0.0
    max_latency_ms: float = 0.0
    details: List[Dict[str, Any]] = field(default_factory=list)

    def record(self, success: bool, latency_ms: float, detail: Dict[str, Any]):
        self.total_items += 1
        if success:
            self.successful += 1
        else:
            self.failed += 1
        self.details.append({"success": success, "latency_ms": round(latency_ms, 2), **detail})

    def finalize(self):
        if self.total_items > 0:
            latencies = [d["latency_ms"] for d in self.details]
            self.avg_latency_ms = round(sum(latencies) / len(latencies), 2)
            self.min_latency_ms = round(min(latencies), 2)
            self.max_latency_ms = round(max(latencies), 2)

    def summary(self) -> str:
        return (
            f"  Total: {self.total_items} | OK: {self.successful} | Fail: {self.failed} | "
            f"Latency: {self.avg_latency_ms}ms avg [{self.min_latency_ms}-{self.max_latency_ms}]"
        )


def download_squad(path: Path, max_samples: int = 500) -> List[Dict[str, Any]]:
    if not path.exists() or path.stat().st_size < 1000:
        print(f"  [DOWNLOAD] SQuAD v2.0...")
        try:
            urllib.request.urlretrieve(SQUAD_URL, path)
            print(f"  [OK] SQuAD downloaded ({path.stat().st_size / 1e6:.1f} MB)")
        except Exception as e:
            print(f"  [ERROR] SQuAD download failed: {e}")
            return []

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    samples = []
    for article in data["data"]:
        for paragraph in article["paragraphs"]:
            context = paragraph["context"]
            for qa in paragraph["qas"]:
                answers = [a["text"] for a in qa.get("answers", [])]
                samples.append({
                    "id": qa["id"],
                    "question": qa["question"],
                    "context": context,
                    "answers": answers,
                    "is_impossible": qa.get("is_impossible", False),
                })
                if len(samples) >= max_samples:
                    return samples
    return samples


def download_hotpotqa(max_samples: int = 500) -> List[Dict[str, Any]]:
    if HOTPOTQA_CACHE.exists():
        with open(HOTPOTQA_CACHE, "r", encoding="utf-8") as f:
            samples = json.load(f)
        print(f"  [CACHE] HotpotQA: {len(samples)} samples loaded from cache")
        return samples

    print(f"  [DOWNLOAD] HotpotQA via HuggingFace datasets...")
    try:
        from datasets import load_dataset
        ds = load_dataset('hotpotqa/hotpot_qa', 'distractor', split='train', streaming=True)
        samples = []
        for i, example in enumerate(ds):
            if i >= max_samples:
                break
            samples.append({
                "id": example["id"],
                "question": example["question"],
                "answer": example.get("answer", ""),
                "supporting_titles": [sf[0] for sf in example.get("supporting_facts", [])],
                "level": example.get("level", "unknown"),
                "type": example.get("type", "unknown"),
            })
        with open(HOTPOTQA_CACHE, "w", encoding="utf-8") as f:
            json.dump(samples, f, indent=2)
        print(f"  [OK] HotpotQA: {len(samples)} samples loaded & cached")
        return samples
    except ImportError:
        print("  [ERROR] 'datasets' library needed for HotpotQA. Install: pip install datasets")
        return []
    except Exception as e:
        print(f"  [ERROR] HotpotQA download failed: {e}")
        return []


EMBEDDING_PORT = 4080
EMBEDDING_SERVICE_URL = f"http://127.0.0.1:{EMBEDDING_PORT}"
PYTHON_CMD = "C:\\Users\\kriti\\AppData\\Local\\Programs\\Python\\Python310\\python.exe"


def _check_embedding_ready(timeout=30) -> bool:
    for attempt in range(timeout):
        try:
            r = requests.get(f"{EMBEDDING_SERVICE_URL}/health", timeout=2)
            if r.status_code == 200:
                return True
        except requests.ConnectionError:
            pass
        time.sleep(1)
    return False


class ServerManager:
    def __init__(self):
        self.process: Optional[subprocess.Popen] = None
        self.embedding_process: Optional[subprocess.Popen] = None

    def start(self) -> bool:
        print("\n[EMBEDDING] Starting embedding microservice...")
        embedding_script = str(BASE_DIR / "embedding" / "server.py")
        if os.path.exists(embedding_script):
            self.embedding_process = subprocess.Popen(
                [PYTHON_CMD, embedding_script],
                cwd=str(BASE_DIR),
                env={**os.environ, "EMBEDDING_PORT": str(EMBEDDING_PORT)},
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            if _check_embedding_ready(40):
                print(f"  [OK] Embedding service ready at {EMBEDDING_SERVICE_URL}")
            else:
                print("  [WARN] Embedding service not ready — server will use fallback vectors")
        else:
            print(f"  [SKIP] Embedding script not found at {embedding_script}")

        print("\n[SERVER] Starting SCDL-RAG server...")
        server_script = str(BASE_DIR / "dist" / "index.js")
        if not os.path.exists(server_script):
            print(f"  [ERROR] Server script not found. Run: npx tsc")
            return False

        env = os.environ.copy()
        env.update({
            "NODE_ENV": "development",
            "PORT": str(SERVER_PORT),
            "SCDL_API_KEY": API_KEY,
            "HOST": "127.0.0.1",
            "RATE_LIMIT_WINDOW_MS": "60000",
            "RATE_LIMIT_MAX": "100000",
            "CACHE_SEMANTIC_MAX_SIZE": "5000",
            "PERFORMANCE_MONITORING_INTERVAL": "30000",
            "EMBEDDING_SERVICE_URL": EMBEDDING_SERVICE_URL,
            "EMBEDDING_PORT": str(EMBEDDING_PORT),
        })

        self.process = subprocess.Popen(
            ["node", server_script],
            cwd=str(BASE_DIR),
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        for attempt in range(30):
            try:
                resp = requests.get(f"{API_BASE}/health", timeout=2)
                if resp.status_code == 200:
                    print(f"  [OK] Server ready (attempt {attempt + 1})")
                    return True
            except requests.ConnectionError:
                pass
            time.sleep(1)

        print("  [ERROR] Server failed to start within 30s")
        self.stop()
        return False

    def stop(self):
        if self.embedding_process:
            print("\n[EMBEDDING] Stopping embedding service...")
            self.embedding_process.terminate()
            try:
                self.embedding_process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self.embedding_process.kill()
            self.embedding_process = None
        if self.process:
            print("\n[SERVER] Stopping server...")
            self.process.terminate()
            try:
                self.process.wait(timeout=10)
                print("  [OK] Server stopped")
            except subprocess.TimeoutExpired:
                self.process.kill()
                print("  [WARN] Server killed")
            self.process = None


def run_ingestion(samples: List[Dict], name: str, batch_size=10, max_items=200) -> ExperimentMetrics:
    global _ingested_ids
    _ingested_ids = {}
    m = ExperimentMetrics(dataset=name, experiment="ingestion")
    print(f"\n[INGESTION] {name} - max {max_items}")
    items = samples[:max_items]
    for i in range(0, len(items), batch_size):
        batch = items[i:i + batch_size]
        payload = {"items": [{"id": it["id"], "content": it.get("context") or it.get("question") or it.get("answer") or "",
                              "metadata": {"dataset": name}} for it in batch]}
        resp = None
        start = time.time()
        try:
            resp = requests.post(f"{API_BASE}/batch/ingest", headers=HEADERS, json=payload, timeout=30)
            lat = (time.time() - start) * 1000
            data = resp.json()
            ok = resp.status_code == 200 and data.get("success", False)
            details = data.get("data", {}).get("details", []) if ok else []
            for idx, it in enumerate(batch):
                sys_id = details[idx].get("id", "") if idx < len(details) else ""
                _ingested_ids[it["id"]] = sys_id
                content = it.get("context") or it.get("question") or it.get("answer") or ""
                m.record(ok, lat / len(batch) if len(batch) > 0 else lat,
                         {"id": it["id"], "sys_id": sys_id, "len": len(content), "code": resp.status_code if resp else -1})
        except Exception as e:
            lat = (time.time() - start) * 1000
            if i == 0:
                print(f"  [DEBUG] Ingest exception: {e}")
                if resp: print(f"  [DEBUG] Response: {resp.text[:200]}")
            for it in batch:
                m.record(False, lat / len(batch), {"id": it["id"], "error": str(e)})
            ok = False
        if not ok and i == 0 and resp:
            print(f"  [DEBUG] Ingest not ok: status={resp.status_code}, body={json.dumps(resp.json())[:200]}")
        time.sleep(0.05)
        if (i // batch_size + 1) % 5 == 0:
            print(f"  Progress: {min(i + batch_size, max_items)}/{max_items}")
    m.finalize()
    print(m.summary())
    return m


def run_retrieval(samples: List[Dict], name: str, max_q=100) -> ExperimentMetrics:
    m = ExperimentMetrics(dataset=name, experiment="retrieval")
    print(f"\n[RETRIEVAL] {name} - max {max_q}")
    for i, q in enumerate(samples[:max_q]):
        query = q.get("question") or q.get("context", "")[:200]
        start = time.time()
        try:
            resp = requests.post(f"{API_BASE}/retrieve", headers=HEADERS,
                                 json={"query": query, "limit": 5, "includeExplanation": True}, timeout=30)
            lat = (time.time() - start) * 1000
            data = resp.json()
            ok = resp.status_code == 200 and data.get("success", False)
            results = data.get("data", {}).get("results", []) if ok else []
            has_exp = data.get("data", {}).get("explanation") is not None if ok else False
            if not ok and i < 3:
                print(f"  [DEBUG] Retrieval fail: status={resp.status_code}, body={json.dumps(data)[:150]}")
            m.record(ok, lat, {"qid": q["id"], "qlen": len(query), "n": len(results), "exp": has_exp})
        except Exception as e:
            lat = (time.time() - start) * 1000
            if i < 3: print(f"  [DEBUG] Retrieval exception: {e}")
            m.record(False, lat, {"qid": q["id"], "error": str(e)})
        time.sleep(0.05)
        if (i + 1) % 20 == 0:
            print(f"  Progress: {i + 1}/{max_q}")
    m.finalize()
    print(m.summary())
    return m


def run_compression(samples: List[Dict], name: str, max_n=100) -> ExperimentMetrics:
    m = ExperimentMetrics(dataset=name, experiment="compression")
    print(f"\n[COMPRESSION] {name} - max {max_n}")
    for i, it in enumerate(samples[:max_n]):
        content = it.get("context") or it.get("question") or it.get("answer") or ""
        start = time.time()
        try:
            resp = requests.post(f"{API_BASE}/optimize-compression", headers=HEADERS,
                                 json={"content": content}, timeout=30)
            lat = (time.time() - start) * 1000
            data = resp.json()
            ok = resp.status_code == 200 and data.get("success", False)
            opt = data.get("data", {}) if ok else {}
            if not ok and i < 3:
                print(f"  [DEBUG] Compression fail: status={resp.status_code}, data={json.dumps(data)[:200]}")
            m.record(ok, lat, {"id": it["id"], "len": len(content),
                               "ratio": opt.get("compressionRatio"), "quality": opt.get("qualityScore")})
        except Exception as e:
            lat = (time.time() - start) * 1000
            if i < 3:
                print(f"  [DEBUG] Compression exception: {e}")
            m.record(False, lat, {"id": it["id"], "error": str(e)})
        if (i + 1) % 20 == 0:
            print(f"  Progress: {i + 1}/{max_n}")
    m.finalize()
    print(m.summary())
    return m


def warmup_nli(api_base: str, headers: dict) -> None:
    """Pre-load the NLI model by detecting contradiction between two real texts."""
    print("  [NLI] Warming up cross-encoder model (~20s for first load)...", flush=True)
    t0 = time.time()
    try:
        r1 = requests.post(f"{api_base}/ingest", headers=headers,
                           json={"content": "Water freezes at 0 degrees Celsius"}, timeout=30)
        r2 = requests.post(f"{api_base}/ingest", headers=headers,
                           json={"content": "Water freezes at 100 degrees Celsius"}, timeout=30)
        aid = r1.json()["data"]["id"]
        bid = r2.json()["data"]["id"]
        r = requests.post(f"{api_base}/detect-contradictions", headers=headers,
                          json={"semanticUnitIds": [aid, bid]}, timeout=120)
        print(f"  [NLI] Model ready in {time.time()-t0:.1f}s", flush=True)
    except Exception as e:
        print(f"  [NLI] Warning: model load issue ({e}), using fallback", flush=True)


def run_contradictions(samples: List[Dict], max_n=20) -> ExperimentMetrics:
    global _ingested_ids
    m = ExperimentMetrics(dataset="SQuAD", experiment="contradiction_detection")
    print(f"\n[CONTRADICTION] SQuAD - max {max_n}")
    groups: Dict[str, List[str]] = {}
    for s in samples:
        ctx = s.get("context", "")
        if ctx:
            groups.setdefault(ctx, []).append(s["id"])
    processed = 0
    for ctx, ids in groups.items():
        if len(ids) < 2 or processed >= max_n:
            continue
        sys_ids = [_ingested_ids.get(i) for i in ids[:min(len(ids), 5)] if _ingested_ids.get(i)]
        if len(sys_ids) < 2:
            continue
        start = time.time()
        try:
            resp = requests.post(f"{API_BASE}/detect-contradictions", headers=HEADERS,
                                 json={"semanticUnitIds": sys_ids}, timeout=120)
            lat = (time.time() - start) * 1000
            data = resp.json()
            ok = resp.status_code == 200 and data.get("success", False)
            c = data.get("data", {}).get("contradictions", []) if ok else []
            m.record(ok, lat, {"ctx": ctx[:80], "n_units": len(sys_ids),
                               "n_contra": len(c), "types": [x.get("type") for x in c]})
        except Exception as e:
            lat = (time.time() - start) * 1000
            m.record(False, lat, {"error": str(e)})
        processed += 1
        if processed % 10 == 0 and processed > 0:
            print(f"  Progress: {processed}/{max_n}", flush=True)
    m.finalize()
    print(m.summary())
    return m


def generate_report(all_metrics: Dict[str, ExperimentMetrics]) -> Path:
    path = REPORT_DIR / f"experiment_report_{int(time.time())}.md"
    lines = [
        "# SCDL-RAG Experiment Report",
        f"**Generated:** {time.strftime('%Y-%m-%d %H:%M:%S')}",
        "**System:** Contradiction-Aware Retrieval Architecture for Reliable AI Reasoning",
        "",
        "## Summary",
        "",
        "| Dataset | Experiment | Total | Success | Failed | Avg Latency (ms) | Min (ms) | Max (ms) |",
        "|---------|-----------|------:|--------:|-------:|-----------------:|---------:|---------:|",
    ]
    for _, m in sorted(all_metrics.items()):
        lines.append(
            f"| {m.dataset} | {m.experiment} | {m.total_items} | {m.successful} | {m.failed} | "
            f"{m.avg_latency_ms} | {m.min_latency_ms} | {m.max_latency_ms} |"
        )
    lines += ["", "## Detailed Results", ""]
    for _, m in sorted(all_metrics.items()):
        lines += [
            f"### {m.dataset} \u2014 {m.experiment}", "",
            f"- **Items:** {m.total_items} | **OK:** {m.successful} | **Fail:** {m.failed}",
            f"- **Latency:** {m.avg_latency_ms} ms avg [{m.min_latency_ms}\u2013{m.max_latency_ms}]", "",
        ]
        for idx, d in enumerate(m.details[:10]):
            k = str(list(d.values())[3])[:80] if len(list(d.values())) > 3 else ""
            icon = "\u2705" if d["success"] else "\u274c"
            lines.append(f"- {icon} `{d['latency_ms']}ms` {k}")
        lines.append("")

    total_ops = sum(m.total_items for m in all_metrics.values())
    total_ok = sum(m.successful for m in all_metrics.values())
    all_lat = [d["latency_ms"] for m in all_metrics.values() for d in m.details]
    lines += ["## Key Findings", "",
              f"- **Total operations:** {total_ops}",
              f"- **Success rate:** {100 * total_ok / total_ops:.1f}%",
              f"- **Overall avg latency:** {sum(all_lat) / len(all_lat):.2f} ms" if all_lat else "",
              f"- **Overall latency range:** {min(all_lat):.2f} \u2013 {max(all_lat):.2f} ms" if all_lat else "",
              ""]

    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"\n[REPORT] {path}")
    return path


def export_csv(all_metrics: Dict[str, ExperimentMetrics]) -> Path:
    path = REPORT_DIR / f"experiment_data_{int(time.time())}.csv"
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["dataset", "experiment", "success", "latency_ms", "detail"])
        for _, m in all_metrics.items():
            for d in m.details:
                k = str(list(d.values())[3])[:120] if len(list(d.values())) > 3 else ""
                w.writerow([m.dataset, m.experiment, d["success"], d["latency_ms"], k])
    print(f"[CSV] {path}")
    return path


def main():
    print("=" * 60)
    print("SCDL-RAG: Experiments on Public Datasets")
    print("=" * 60)

    print("\n[1/4] Downloading & loading datasets...")
    squad = download_squad(DATA_DIR / "train-v2.0.json", 500)
    hotpot = download_hotpotqa(500)
    print(f"  SQuAD: {len(squad)} | HotpotQA: {len(hotpot)}")

    if not squad and not hotpot:
        print("[ERROR] No datasets available."); sys.exit(1)

    print("\n[2/4] Starting server...")
    server = ServerManager()
    if not server.start():
        print("[ERROR] Server start failed."); sys.exit(1)

    all_metrics = {}
    try:
        print("\n[3/4] Running experiments...")
        for name, samples in [("SQuAD", squad), ("HotpotQA", hotpot)]:
            if not samples:
                continue
            print(f"\n{'#' * 50}\n# {name}\n{'#' * 50}")
            all_metrics[f"{name}_ingestion"] = run_ingestion(samples, name)
            all_metrics[f"{name}_retrieval"] = run_retrieval(samples, name)
            all_metrics[f"{name}_compression"] = run_compression(samples, name)
            if name == "SQuAD":
                warmup_nli(API_BASE, HEADERS)
                all_metrics[f"{name}_contradiction"] = run_contradictions(samples, 20)

        print("\n[4/4] Generating report...")
        rp = generate_report(all_metrics)
        cp = export_csv(all_metrics)

        print(f"\n{'=' * 60}")
        print(f"{'Dataset':<12} {'Experiment':<22} {'Total':>6} {'OK':>6} {'Fail':>6} {'Avg ms':>8}")
        print(f"{'-' * 12} {'-' * 22} {'-' * 6} {'-' * 6} {'-' * 6} {'-' * 8}")
        for _, m in sorted(all_metrics.items()):
            print(f"{m.dataset:<12} {m.experiment:<22} {m.total_items:>6} {m.successful:>6} {m.failed:>6} {m.avg_latency_ms:>8.1f}")
        print(f"{'=' * 60}")
        print(f"Report: {rp}\nCSV:    {cp}\nDone!")
    finally:
        server.stop()


if __name__ == "__main__":
    main()
