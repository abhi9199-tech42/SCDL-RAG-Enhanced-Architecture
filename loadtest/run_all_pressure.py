"""Run all 3 pressure tests sequentially and print a combined summary."""
import subprocess, sys, time, json
from pathlib import Path

BASE = Path(__file__).resolve().parent
PYTHON = "C:\\Users\\kriti\\AppData\\Local\\Programs\\Python\\Python310\\python.exe"

def run_test(name, script):
    print(f"\n{'#'*70}")
    print(f"# RUNNING: {name}")
    print(f"{'#'*70}")
    t0 = time.time()
    r = subprocess.run([PYTHON, script], cwd=BASE.parent, capture_output=True, text=True, timeout=600)
    elapsed = time.time() - t0
    print(r.stdout)
    if r.stderr.strip():
        print(f"STDERR: {r.stderr[:500]}")
    print(f"[{name}] finished in {elapsed:.0f}s (return={r.returncode})")
    return r.returncode

print("="*70)
print("PRESSURE TEST SUITE — SCDL-RAG API")
print("="*70)

tests = [
    ("Test 1: Load Test", str(BASE / "test1_load.py")),
    ("Test 2: Stress Test", str(BASE / "test2_stress.py")),
    ("Test 3: Endurance Test", str(BASE / "test3_endurance.py")),
]

results = {}
for name, path in tests:
    print(f"\n--- {name} ---")
    results[name] = run_test(name, path)
    time.sleep(2)  # cooldown between tests

print("\n" + "="*70)
print("ALL TESTS COMPLETE")
print("="*70)
for name, rc in results.items():
    status = "PASS" if rc == 0 else "FAIL"
    print(f"  {name:<40} {status}")
