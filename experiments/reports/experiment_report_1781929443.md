# SCDL-RAG Experiment Report
**Generated:** 2026-06-20 09:54:03
**System:** Contradiction-Aware Retrieval Architecture for Reliable AI Reasoning

## Summary

| Dataset | Experiment | Total | Success | Failed | Avg Latency (ms) | Min (ms) | Max (ms) |
|---------|-----------|------:|--------:|-------:|-----------------:|---------:|---------:|
| HotpotQA | compression | 100 | 0 | 100 | 4.77 | 2.22 | 27.85 |
| HotpotQA | ingestion | 200 | 0 | 200 | 0.28 | 0.25 | 0.31 |
| HotpotQA | retrieval | 100 | 0 | 100 | 4.94 | 2.18 | 23.37 |
| SQuAD | compression | 100 | 0 | 100 | 7.57 | 2.34 | 28.04 |
| SQuAD | contradiction_detection | 16 | 0 | 16 | 8.04 | 2.35 | 26.24 |
| SQuAD | ingestion | 200 | 200 | 0 | 2.59 | 1.06 | 7.02 |
| SQuAD | retrieval | 100 | 79 | 21 | 10.38 | 2.37 | 30.06 |

## Detailed Results

### HotpotQA — compression

- **Items:** 100 | **OK:** 0 | **Fail:** 100
- **Latency:** 4.77 ms avg [2.22–27.85]

- ❌ `2.56ms` 70
- ❌ `2.4ms` 81
- ❌ `2.63ms` 127
- ❌ `2.39ms` 48
- ❌ `2.6ms` 78
- ❌ `3.31ms` 80
- ❌ `2.63ms` 85
- ❌ `3.11ms` 215
- ❌ `2.43ms` 97
- ❌ `2.7ms` 86

### HotpotQA — ingestion

- **Items:** 200 | **OK:** 0 | **Fail:** 200
- **Latency:** 0.28 ms avg [0.25–0.31]

- ❌ `0.29ms` 
- ❌ `0.29ms` 
- ❌ `0.29ms` 
- ❌ `0.29ms` 
- ❌ `0.29ms` 
- ❌ `0.29ms` 
- ❌ `0.29ms` 
- ❌ `0.29ms` 
- ❌ `0.29ms` 
- ❌ `0.29ms` 

### HotpotQA — retrieval

- **Items:** 100 | **OK:** 0 | **Fail:** 100
- **Latency:** 4.94 ms avg [2.18–23.37]

- ❌ `2.46ms` 70
- ❌ `2.42ms` 81
- ❌ `2.35ms` 127
- ❌ `2.4ms` 48
- ❌ `2.43ms` 78
- ❌ `2.43ms` 80
- ❌ `2.29ms` 85
- ❌ `2.29ms` 215
- ❌ `2.32ms` 97
- ❌ `2.66ms` 86

### SQuAD — compression

- **Items:** 100 | **OK:** 0 | **Fail:** 100
- **Latency:** 7.57 ms avg [2.34–28.04]

- ❌ `2.46ms` 694
- ❌ `26.23ms` 694
- ❌ `3.1ms` 694
- ❌ `3.0ms` 694
- ❌ `2.52ms` 694
- ❌ `2.36ms` 694
- ❌ `18.9ms` 694
- ❌ `2.47ms` 694
- ❌ `13.25ms` 694
- ❌ `15.99ms` 694

### SQuAD — contradiction_detection

- **Items:** 16 | **OK:** 0 | **Fail:** 16
- **Latency:** 8.04 ms avg [2.35–26.24]

- ❌ `3.0ms` 5
- ❌ `3.01ms` 5
- ❌ `2.56ms` 5
- ❌ `2.45ms` 5
- ❌ `2.46ms` 5
- ❌ `16.19ms` 5
- ❌ `2.47ms` 5
- ❌ `2.38ms` 5
- ❌ `26.24ms` 5
- ❌ `2.35ms` 5

### SQuAD — ingestion

- **Items:** 200 | **OK:** 200 | **Fail:** 0
- **Latency:** 2.59 ms avg [1.06–7.02]

- ✅ `4.62ms` 56be85543aeaaa14008c9063
- ✅ `4.62ms` 56be85543aeaaa14008c9065
- ✅ `4.62ms` 56be85543aeaaa14008c9066
- ✅ `4.62ms` 56bf6b0f3aeaaa14008c9601
- ✅ `4.62ms` 56bf6b0f3aeaaa14008c9602
- ✅ `4.62ms` 56bf6b0f3aeaaa14008c9603
- ✅ `4.62ms` 56bf6b0f3aeaaa14008c9604
- ✅ `4.62ms` 56bf6b0f3aeaaa14008c9605
- ✅ `4.62ms` 56d43c5f2ccc5a1400d830a9
- ✅ `4.62ms` 56d43c5f2ccc5a1400d830aa

### SQuAD — retrieval

- **Items:** 100 | **OK:** 79 | **Fail:** 21
- **Latency:** 10.38 ms avg [2.37–30.06]

- ✅ `11.33ms` 40
- ✅ `6.19ms` 58
- ✅ `7.39ms` 64
- ✅ `25.66ms` 45
- ✅ `8.36ms` 42
- ✅ `7.07ms` 42
- ✅ `12.61ms` 45
- ✅ `8.37ms` 38
- ✅ `14.49ms` 30
- ✅ `8.35ms` 46

## Key Findings

- **Total operations:** 816
- **Success rate:** 34.2%
- **Overall avg latency:** 4.25 ms
- **Overall latency range:** 0.25 – 30.06 ms
