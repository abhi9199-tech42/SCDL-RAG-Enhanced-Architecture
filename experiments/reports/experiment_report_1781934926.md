# SCDL-RAG Experiment Report
**Generated:** 2026-06-20 11:25:26
**System:** Contradiction-Aware Retrieval Architecture for Reliable AI Reasoning

## Summary

| Dataset | Experiment | Total | Success | Failed | Avg Latency (ms) | Min (ms) | Max (ms) |
|---------|-----------|------:|--------:|-------:|-----------------:|---------:|---------:|
| HotpotQA | compression | 100 | 100 | 0 | 6.36 | 3.0 | 26.04 |
| HotpotQA | ingestion | 200 | 200 | 0 | 0.58 | 0.4 | 1.0 |
| HotpotQA | retrieval | 100 | 100 | 0 | 11.58 | 3.76 | 480.11 |
| SQuAD | compression | 100 | 100 | 0 | 7.1 | 3.56 | 31.08 |
| SQuAD | contradiction_detection | 15 | 15 | 0 | 5.62 | 2.84 | 9.0 |
| SQuAD | ingestion | 200 | 190 | 10 | 207.27 | 1.79 | 3001.84 |
| SQuAD | retrieval | 100 | 100 | 0 | 10.69 | 3.51 | 444.08 |

## Detailed Results

### HotpotQA — compression

- **Items:** 100 | **OK:** 100 | **Fail:** 0
- **Latency:** 6.36 ms avg [3.0–26.04]

- ✅ `8.0ms` 70
- ✅ `4.17ms` 81
- ✅ `3.66ms` 127
- ✅ `6.98ms` 48
- ✅ `4.04ms` 78
- ✅ `4.92ms` 80
- ✅ `9.0ms` 85
- ✅ `5.0ms` 215
- ✅ `8.0ms` 97
- ✅ `5.08ms` 86

### HotpotQA — ingestion

- **Items:** 200 | **OK:** 200 | **Fail:** 0
- **Latency:** 0.58 ms avg [0.4–1.0]

- ✅ `0.5ms` 5a7a06935542990198eaf050
- ✅ `0.5ms` 5a879ab05542996e4f30887e
- ✅ `0.5ms` 5a8d7341554299441c6b9fe5
- ✅ `0.5ms` 5a82171f5542990a1d231f4a
- ✅ `0.5ms` 5a84dd955542997b5ce3ff79
- ✅ `0.5ms` 5a7e36045542991319bc9440
- ✅ `0.5ms` 5adf44985542993a75d2646d
- ✅ `0.5ms` 5a832c3455429954d2e2ec41
- ✅ `0.5ms` 5a7d0db955429909bec76924
- ✅ `0.5ms` 5a89372855429951533612e6

### HotpotQA — retrieval

- **Items:** 100 | **OK:** 100 | **Fail:** 0
- **Latency:** 11.58 ms avg [3.76–480.11]

- ✅ `7.05ms` 70
- ✅ `16.27ms` 81
- ✅ `4.02ms` 127
- ✅ `6.01ms` 48
- ✅ `7.16ms` 78
- ✅ `4.0ms` 80
- ✅ `5.0ms` 85
- ✅ `9.0ms` 215
- ✅ `7.53ms` 97
- ✅ `3.93ms` 86

### SQuAD — compression

- **Items:** 100 | **OK:** 100 | **Fail:** 0
- **Latency:** 7.1 ms avg [3.56–31.08]

- ✅ `7.22ms` 694
- ✅ `8.59ms` 694
- ✅ `4.55ms` 694
- ✅ `31.08ms` 694
- ✅ `6.52ms` 694
- ✅ `8.8ms` 694
- ✅ `5.98ms` 694
- ✅ `9.0ms` 694
- ✅ `6.44ms` 694
- ✅ `8.0ms` 694

### SQuAD — contradiction_detection

- **Items:** 15 | **OK:** 15 | **Fail:** 0
- **Latency:** 5.62 ms avg [2.84–9.0]

- ✅ `7.0ms` 5
- ✅ `9.0ms` 5
- ✅ `7.0ms` 5
- ✅ `4.14ms` 5
- ✅ `6.85ms` 5
- ✅ `4.0ms` 5
- ✅ `4.51ms` 5
- ✅ `7.01ms` 5
- ✅ `4.99ms` 5
- ✅ `4.0ms` 5

### SQuAD — ingestion

- **Items:** 200 | **OK:** 190 | **Fail:** 10
- **Latency:** 207.27 ms avg [1.79–3001.84]

- ✅ `80.49ms` 56be85543aeaaa14008c9063
- ✅ `80.49ms` 56be85543aeaaa14008c9065
- ✅ `80.49ms` 56be85543aeaaa14008c9066
- ✅ `80.49ms` 56bf6b0f3aeaaa14008c9601
- ✅ `80.49ms` 56bf6b0f3aeaaa14008c9602
- ✅ `80.49ms` 56bf6b0f3aeaaa14008c9603
- ✅ `80.49ms` 56bf6b0f3aeaaa14008c9604
- ✅ `80.49ms` 56bf6b0f3aeaaa14008c9605
- ✅ `80.49ms` 56d43c5f2ccc5a1400d830a9
- ✅ `80.49ms` 56d43c5f2ccc5a1400d830aa

### SQuAD — retrieval

- **Items:** 100 | **OK:** 100 | **Fail:** 0
- **Latency:** 10.69 ms avg [3.51–444.08]

- ✅ `13.4ms` 40
- ✅ `5.0ms` 58
- ✅ `5.6ms` 64
- ✅ `8.0ms` 45
- ✅ `4.98ms` 42
- ✅ `5.0ms` 42
- ✅ `8.0ms` 45
- ✅ `4.0ms` 38
- ✅ `5.0ms` 30
- ✅ `9.21ms` 46

## Key Findings

- **Total operations:** 815
- **Success rate:** 98.8%
- **Overall avg latency:** 55.50 ms
- **Overall latency range:** 0.40 – 3001.84 ms
