# SCDL-RAG Experiment Report
**Generated:** 2026-06-20 09:54:40
**System:** Contradiction-Aware Retrieval Architecture for Reliable AI Reasoning

## Summary

| Dataset | Experiment | Total | Success | Failed | Avg Latency (ms) | Min (ms) | Max (ms) |
|---------|-----------|------:|--------:|-------:|-----------------:|---------:|---------:|
| HotpotQA | compression | 100 | 0 | 100 | 6.83 | 2.23 | 26.85 |
| HotpotQA | ingestion | 200 | 0 | 200 | 1.1 | 0.25 | 2.52 |
| HotpotQA | retrieval | 100 | 0 | 100 | 7.13 | 2.18 | 28.49 |
| SQuAD | compression | 100 | 0 | 100 | 6.67 | 2.29 | 27.31 |
| SQuAD | contradiction_detection | 16 | 0 | 16 | 6.42 | 2.26 | 27.03 |
| SQuAD | ingestion | 200 | 200 | 0 | 2.85 | 1.05 | 5.65 |
| SQuAD | retrieval | 100 | 79 | 21 | 10.51 | 2.27 | 38.64 |

## Detailed Results

### HotpotQA — compression

- **Items:** 100 | **OK:** 0 | **Fail:** 100
- **Latency:** 6.83 ms avg [2.23–26.85]

- ❌ `2.48ms` 70
- ❌ `2.84ms` 81
- ❌ `2.53ms` 127
- ❌ `26.85ms` 48
- ❌ `2.57ms` 78
- ❌ `2.46ms` 80
- ❌ `2.94ms` 85
- ❌ `2.74ms` 215
- ❌ `2.75ms` 97
- ❌ `17.7ms` 86

### HotpotQA — ingestion

- **Items:** 200 | **OK:** 0 | **Fail:** 200
- **Latency:** 1.1 ms avg [0.25–2.52]

- ❌ `1.92ms` 
- ❌ `1.92ms` 
- ❌ `1.92ms` 
- ❌ `1.92ms` 
- ❌ `1.92ms` 
- ❌ `1.92ms` 
- ❌ `1.92ms` 
- ❌ `1.92ms` 
- ❌ `1.92ms` 
- ❌ `1.92ms` 

### HotpotQA — retrieval

- **Items:** 100 | **OK:** 0 | **Fail:** 100
- **Latency:** 7.13 ms avg [2.18–28.49]

- ❌ `2.38ms` 70
- ❌ `2.35ms` 81
- ❌ `26.99ms` 127
- ❌ `15.75ms` 48
- ❌ `3.43ms` 78
- ❌ `2.82ms` 80
- ❌ `2.42ms` 85
- ❌ `2.4ms` 215
- ❌ `2.75ms` 97
- ❌ `5.86ms` 86

### SQuAD — compression

- **Items:** 100 | **OK:** 0 | **Fail:** 100
- **Latency:** 6.67 ms avg [2.29–27.31]

- ❌ `2.86ms` 694
- ❌ `2.61ms` 694
- ❌ `3.01ms` 694
- ❌ `22.7ms` 694
- ❌ `15.25ms` 694
- ❌ `2.41ms` 694
- ❌ `12.69ms` 694
- ❌ `2.39ms` 694
- ❌ `13.31ms` 694
- ❌ `15.21ms` 694

### SQuAD — contradiction_detection

- **Items:** 16 | **OK:** 0 | **Fail:** 16
- **Latency:** 6.42 ms avg [2.26–27.03]

- ❌ `2.58ms` 5
- ❌ `27.03ms` 5
- ❌ `15.49ms` 5
- ❌ `2.26ms` 5
- ❌ `13.33ms` 5
- ❌ `3.2ms` 5
- ❌ `2.55ms` 5
- ❌ `2.48ms` 5
- ❌ `2.34ms` 5
- ❌ `2.31ms` 5

### SQuAD — ingestion

- **Items:** 200 | **OK:** 200 | **Fail:** 0
- **Latency:** 2.85 ms avg [1.05–5.65]

- ✅ `5.65ms` 56be85543aeaaa14008c9063
- ✅ `5.65ms` 56be85543aeaaa14008c9065
- ✅ `5.65ms` 56be85543aeaaa14008c9066
- ✅ `5.65ms` 56bf6b0f3aeaaa14008c9601
- ✅ `5.65ms` 56bf6b0f3aeaaa14008c9602
- ✅ `5.65ms` 56bf6b0f3aeaaa14008c9603
- ✅ `5.65ms` 56bf6b0f3aeaaa14008c9604
- ✅ `5.65ms` 56bf6b0f3aeaaa14008c9605
- ✅ `5.65ms` 56d43c5f2ccc5a1400d830a9
- ✅ `5.65ms` 56d43c5f2ccc5a1400d830aa

### SQuAD — retrieval

- **Items:** 100 | **OK:** 79 | **Fail:** 21
- **Latency:** 10.51 ms avg [2.27–38.64]

- ✅ `29.81ms` 40
- ✅ `31.19ms` 58
- ✅ `27.82ms` 64
- ✅ `28.12ms` 45
- ✅ `6.37ms` 42
- ✅ `5.71ms` 42
- ✅ `23.42ms` 45
- ✅ `8.94ms` 38
- ✅ `20.16ms` 30
- ✅ `24.71ms` 46

## Key Findings

- **Total operations:** 816
- **Success rate:** 34.2%
- **Overall avg latency:** 4.91 ms
- **Overall latency range:** 0.25 – 38.64 ms
