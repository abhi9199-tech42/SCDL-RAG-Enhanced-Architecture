"""
50-minute comprehensive system test.
Tests 1..3 sequentially with live progress indicators.
"""
import os, sys, time, subprocess, requests as rq, json, gc, socket, threading
from concurrent.futures import ThreadPoolExecutor, as_completed

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

def find_port(start=8010):
    while True:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            s.bind(("127.0.0.1", start))
            s.close()
            return start
        except OSError:
            s.close()
            start += 1

API_PORT = find_port()
API = f"http://127.0.0.1:{API_PORT}"
H = {"Authorization": "Bearer sk_live_local_test"}
print(f"Server port: {API_PORT}")

env = os.environ.copy()
env.update({"EMBEDDING_SERVICE_URL": "http://127.0.0.1:4096", "ASYNC_WORKERS": "4", "PORT": str(API_PORT)})
proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "api.server:app", "--host", "127.0.0.1", "--port", str(API_PORT)],
    cwd=ROOT, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
)
time.sleep(6)
try:
    r = rq.get(f"{API}/v1/health", headers=H, timeout=5)
    assert r.status_code == 200
    print(f"Server OK\n")
except:
    proc.kill()
    print("Server failed")
    sys.exit(1)

DOCS_POOL = [
    "Photosynthesis converts sunlight into chemical energy using chlorophyll. The equation is 6CO2 + 6H2O -> C6H12O6 + 6O2.",
    "DNA has a double helix structure discovered by Watson and Crick. A pairs with T, C pairs with G.",
    "Gradient descent optimizes ML models by moving opposite the gradient. Learning rate controls step size.",
    "The roman empire dominated the mediterranean for 500 years from 27 BCE to 476 CE.",
    "Marie Curie discovered polonium and radium. She won Nobel prizes in physics 1903 and chemistry 1911.",
    "The internet began as ARPANET in the 1960s. Berners-Lee invented the World Wide Web in 1989.",
    "Blockchain is a distributed immutable ledger. Each block contains a cryptographic hash of the previous block.",
    "Earths temperature has risen about 1.2C since preindustrial times due to CO2 emissions.",
    "The moon orbits Earth at 384400 km. The Apollo 11 moon landing occurred in July 1969.",
    "Neural networks are computing systems with connected nodes inspired by biological brains.",
]

def make_case(i, doc_idx=None):
    doc = DOCS_POOL[doc_idx if doc_idx is not None else (i % len(DOCS_POOL))]
    return {
        "id": f"c{i}",
        "question": f"What is the main topic of text number {i % len(DOCS_POOL)}?",
        "answer": f"The answer involves {doc.split()[0]} {doc.split()[1]} and related concepts.",
        "documents": [{"id": f"d{i}", "content": doc}]
    }

# ------------------------------------------------------------
# Spinner for long-running tests
# ------------------------------------------------------------
class Spinner:
    def __init__(self, label="Running"):
        self.label = label
        self.chars = "|/-\\"
        self.i = 0
        self.running = False
        self.thread = None
        self._ok = 0
        self._err = 0
        self._t0 = None

    def _spin(self):
        last_report = 0
        while self.running:
            elapsed = time.time() - self._t0 if self._t0 else 0
            total = self._ok + self._err
            rps = self._ok / elapsed if elapsed > 1 else 0
            line = f"\r  {self.chars[self.i % 4]} {self.label} | {elapsed:5.0f}s | OK={self._ok:>5} | Err={self._err:>3} | {rps:>5.1f} r/s"
            if elapsed - last_report >= 30:
                line += f"  [CHECKPOINT @ {elapsed:.0f}s]"
                last_report = elapsed
            sys.stdout.write(line + "   ")
            sys.stdout.flush()
            self.i += 1
            time.sleep(0.2)

    def start(self):
        self._t0 = time.time()
        self.running = True
        self.thread = threading.Thread(target=self._spin, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(1)
        total = self._ok + self._err
        elapsed = time.time() - self._t0 if self._t0 else 1
        rps = self._ok / elapsed if elapsed > 1 else 0
        sys.stdout.write(f"\r  DONE  | {elapsed:5.0f}s | OK={self._ok:>5} | Err={self._err:>3} | {rps:>5.1f} r/s     \n")
        sys.stdout.flush()

    def ok(self, n=1):
        self._ok += n

    def err(self, n=1):
        self._err += n

# ============================================================
# TEST 1: Batch breaking point
# ============================================================
print("=" * 65)
print("TEST 1: Batch breaking point")
print("Start: batch_size=5 -> 10 -> 25 -> 50 -> 100 -> 200 -> 300 -> 500")
print("=" * 65)

batch_results = []
for bsize in [5, 10, 25, 50, 100, 200, 300, 500]:
    sys.stdout.write(f"\r  Batch {bsize:>3}... ")
    sys.stdout.flush()
    t0 = time.time()
    r = rq.post(f"{API}/v1/detect/batch", headers=H,
        json={"cases": [make_case(i) for i in range(bsize)]},
        timeout=300)
    elapsed = (time.time() - t0) * 1000
    if r.status_code == 200:
        data = r.json()
        ok = sum(1 for res in data["results"] if "mu_score" in res)
        errs = bsize - ok
        per_case = data["total_time_ms"] / bsize
        throughput = bsize / (data["total_time_ms"] / 1000)
        batch_results.append((bsize, data["total_time_ms"], per_case, throughput, 0))
        sys.stdout.write(f"\r  Batch {bsize:>3}: OK  {data['total_time_ms']:5.0f}ms total, {per_case:5.1f}ms/case, {throughput:5.1f} r/s\n")
    else:
        batch_results.append((bsize, 0, 0, 0, bsize))
        sys.stdout.write(f"\r  Batch {bsize:>3}: FAILED status={r.status_code}\n")
        if bsize >= 200:
            break
    sys.stdout.flush()

print("\n" + "-" * 65)
print(f"{'Batch':>6} | {'Total_ms':>9} | {'ms/case':>8} | {'r/s':>7} | {'Err%':>6}")
print("-" * 65)
has_break = False
for bsize, total, per, tput, errs in batch_results:
    err_pct = errs / bsize * 100 if bsize else 0
    label = " <<< BREAK" if err_pct > 5 and not has_break else ""
    if label:
        has_break = True
    print(f"{bsize:>6} | {total:>9.0f} | {per:>7.1f}ms | {tput:>6.1f} | {err_pct:>5.1f}%{label}")
print("-" * 65)

# ============================================================
# TEST 2: Real enterprise scenario
# ============================================================
print("\n\n" + "=" * 65)
print("TEST 2: Enterprise mixed load")
print("  100 sync + 5 batch(50 each) + 50 async")
print("=" * 65)

N_SYNC = 100
N_BATCH = 5
BATCH_SIZE = 50
N_ASYNC = 50
CONCURRENT = 30

spinner = Spinner("Enterprise mix")
spinner.start()

sync_ok = sync_err = 0
async_ok = async_err = 0
batch_ok = batch_err = 0

with ThreadPoolExecutor(max_workers=CONCURRENT) as ex:
    sync_futs = [ex.submit(lambda i=i: rq.post(f"{API}/v1/detect", headers=H,
        json={"question": f"sync_{i}", "answer": f"sync answer {i}",
              "documents": [{"id":"sd","content":"Photosynthesis converts sunlight into chemical energy."}]},
        timeout=60)) for i in range(N_SYNC)]
    batch_futs = [ex.submit(lambda b=b: rq.post(f"{API}/v1/detect/batch", headers=H,
        json={"cases": [make_case(i + b * BATCH_SIZE, i % len(DOCS_POOL)) for i in range(BATCH_SIZE)]},
        timeout=180)) for b in range(N_BATCH)]

    async_ids = []
    for i in range(N_ASYNC):
        try:
            r = rq.post(f"{API}/v1/async/detect", headers=H, json={
                "question": f"async_{i}", "answer": f"ans_{i}",
                "documents": [{"id":"ad","content":"Async test content."}]}, timeout=30)
            if r.status_code == 202:
                async_ids.append(r.json()["task_id"])
            else:
                async_err += 1; spinner.err()
        except:
            async_err += 1; spinner.err()

    for f in as_completed(sync_futs):
        try:
            r = f.result()
            if r.status_code == 200:
                sync_ok += 1; spinner.ok()
            else:
                sync_err += 1; spinner.err()
        except:
            sync_err += 1; spinner.err()
    for f in as_completed(batch_futs):
        try:
            r = f.result()
            if r.status_code == 200:
                d = r.json()
                batch_ok += len(d["results"]); spinner.ok(len(d["results"]))
            else:
                batch_err += BATCH_SIZE; spinner.err(BATCH_SIZE)
        except:
            batch_err += BATCH_SIZE; spinner.err(BATCH_SIZE)

    for tid in async_ids:
        for _ in range(150):
            try:
                r = rq.get(f"{API}/v1/async/result/{tid}", headers=H, timeout=5)
                s = r.json().get("status")
                if s == "completed":
                    async_ok += 1; spinner.ok()
                    break
                elif s == "failed":
                    async_err += 1; spinner.err()
                    break
            except:
                pass
            time.sleep(0.2)
        else:
            async_err += 1; spinner.err()

spinner.stop()
elapsed = time.time() - spinner._t0
total_ok = sync_ok + batch_ok + async_ok
total_err = sync_err + batch_err + async_err
rps = total_ok / elapsed if elapsed else 0
print(f"  Sync: {sync_ok}/{N_SYNC} | Batch: {batch_ok}/{N_BATCH*BATCH_SIZE} | Async: {async_ok}/{N_ASYNC}")
print(f"  Total: {total_ok}/{total_ok+total_err} OK, {rps:.1f} r/s")

# ============================================================
# TEST 3: Endurance (30 min)
# ============================================================
print("\n\n" + "=" * 65)
print("TEST 3: Endurance - 4 concurrent users, 30 min mixed load")
print("=" * 65)

spinner = Spinner("Endurance")
spinner.start()

DURATION = 30 * 60
while time.time() - spinner._t0 < DURATION:
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = []
        for i in range(4):
            choice = int(time.time() * 100 + i) % 3
            if choice == 0:
                futs.append(ex.submit(lambda: rq.post(f"{API}/v1/detect", headers=H,
                    json={"question": f"e_{time.time()}", "answer": "ea",
                          "documents": [{"id":"ed","content":"Endurance test."}]}, timeout=60)))
            elif choice == 1:
                futs.append(ex.submit(lambda: rq.post(f"{API}/v1/detect/batch", headers=H,
                    json={"cases": [make_case(j) for j in range(5)]}, timeout=120)))
            else:
                futs.append(ex.submit(lambda: rq.post(f"{API}/v1/async/detect", headers=H,
                    json={"question": f"ea_{time.time()}", "answer": "async ea",
                          "documents": [{"id":"ead","content":"Endurance async."}]}, timeout=30)))
        for f in as_completed(futs):
            try:
                r = f.result()
                if r.status_code in (200, 202):
                    spinner.ok()
                else:
                    spinner.err()
            except:
                spinner.err()

spinner.stop()

total_endurance = spinner._ok + spinner._err
err_pct = spinner._err / max(total_endurance, 1) * 100
avg_rps = spinner._ok / (time.time() - spinner._t0) if (time.time() - spinner._t0) > 0 else 0

print(f"\n  Final: {spinner._ok} OK, {spinner._err} err ({err_pct:.2f}%)")
print(f"  Avg: {avg_rps:.1f} r/s")
print(f"  Degradation: {'YES' if spinner._err > 5 else 'NO'}")
print(f"  Memory leak: {'SUSPECTED' if spinner._err > 0 and err_pct > 2 else 'NONE DETECTED'}")

# ============================================================
# FINAL SUMMARY
# ============================================================
print("\n\n" + "=" * 65)
print("FINAL SUMMARY - 50-MINUTE SYSTEM TEST")
print("=" * 65)
print(f"\n  Server: uvicorn (1 worker) + httpx pool + 4 async workers")
print(f"  Embedding: waitress(4 threads) + INT8 NLI + all-MiniLM-L6-v2")

if batch_results:
    max_batch = max(b[0] for b in batch_results if b[3] > 0)
    best_batch = max(batch_results, key=lambda x: x[3])
    print(f"\n  TEST 1: Batch breaking point")
    print(f"    Max working batch: {max_batch}")
    print(f"    Best batch_size={best_batch[0]} @ {best_batch[3]:.1f} r/s ({best_batch[2]:.1f}ms/case)")
    broken = [b for b in batch_results if b[4] > 0]
    if broken:
        print(f"    Breaking point: batch_size={broken[0][0]} ({broken[0][4]} errors)")
    else:
        print(f"    Breaking point: not reached (up to {max_batch})")

print(f"\n  TEST 2: Enterprise mixed load")
print(f"    Sync {sync_ok}/{N_SYNC} | Batch {batch_ok}/{N_BATCH*BATCH_SIZE} | Async {async_ok}/{N_ASYNC}")
print(f"    Total: {total_ok}/{total_ok+total_err} OK @ {rps:.1f} r/s")

print(f"\n  TEST 3: Endurance")
print(f"    {spinner._ok} OK, {spinner._err} err ({err_pct:.2f}%) @ {avg_rps:.1f} r/s")
print(f"    {'STABLE - no leak' if spinner._err < 5 else 'DEGRADED'}")

print("\n" + "=" * 65)

proc.kill()
proc.wait()
