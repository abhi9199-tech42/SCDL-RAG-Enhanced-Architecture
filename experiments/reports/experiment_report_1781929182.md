# SCDL-RAG Experiment Report
**Generated:** 2026-06-20 09:49:42
**System:** Contradiction-Aware Retrieval Architecture for Reliable AI Reasoning

## Summary

| Dataset | Experiment | Total | Success | Failed | Avg Latency (ms) | Min (ms) | Max (ms) |
|---------|-----------|------:|--------:|-------:|-----------------:|---------:|---------:|
| HotpotQA | compression | 100 | 0 | 100 | 4.48 | 2.64 | 24.74 |
| HotpotQA | ingestion | 200 | 0 | 200 | 1.07 | 0.33 | 9.36 |
| HotpotQA | retrieval | 100 | 0 | 100 | 7.23 | 2.58 | 55.26 |
| SQuAD | compression | 100 | 0 | 100 | 4.81 | 2.57 | 27.7 |
| SQuAD | contradiction_detection | 16 | 0 | 16 | 4.3 | 2.76 | 14.58 |
| SQuAD | ingestion | 200 | 200 | 0 | 3.21 | 0.93 | 7.39 |
| SQuAD | retrieval | 100 | 79 | 21 | 9.89 | 2.83 | 34.71 |

## Detailed Results

### HotpotQA — compression

- **Items:** 100 | **OK:** 0 | **Fail:** 100
- **Latency:** 4.48 ms avg [2.64–24.74]

- ❌ `3.58ms` 70
- ❌ `4.01ms` 81
- ❌ `6.06ms` 127
- ❌ `4.52ms` 48
- ❌ `3.8ms` 78
- ❌ `4.38ms` 80
- ❌ `6.79ms` 85
- ❌ `4.13ms` 215
- ❌ `4.16ms` 97
- ❌ `5.91ms` 86

### HotpotQA — ingestion

- **Items:** 200 | **OK:** 0 | **Fail:** 200
- **Latency:** 1.07 ms avg [0.33–9.36]

- ❌ `0.33ms` 
- ❌ `0.33ms` 
- ❌ `0.33ms` 
- ❌ `0.33ms` 
- ❌ `0.33ms` 
- ❌ `0.33ms` 
- ❌ `0.33ms` 
- ❌ `0.33ms` 
- ❌ `0.33ms` 
- ❌ `0.33ms` 

### HotpotQA — retrieval

- **Items:** 100 | **OK:** 0 | **Fail:** 100
- **Latency:** 7.23 ms avg [2.58–55.26]

- ❌ `4.19ms` 70
- ❌ `46.52ms` 81
- ❌ `7.85ms` 127
- ❌ `45.55ms` 48
- ❌ `6.24ms` 78
- ❌ `13.83ms` 80
- ❌ `55.26ms` 85
- ❌ `37.26ms` 215
- ❌ `4.75ms` 97
- ❌ `7.51ms` 86

### SQuAD — compression

- **Items:** 100 | **OK:** 0 | **Fail:** 100
- **Latency:** 4.81 ms avg [2.57–27.7]

- ❌ `3.11ms` 694
- ❌ `22.2ms` 694
- ❌ `2.88ms` 694
- ❌ `3.02ms` 694
- ❌ `2.79ms` 694
- ❌ `2.57ms` 694
- ❌ `20.66ms` 694
- ❌ `2.81ms` 694
- ❌ `2.94ms` 694
- ❌ `2.85ms` 694

### SQuAD — contradiction_detection

- **Items:** 16 | **OK:** 0 | **Fail:** 16
- **Latency:** 4.3 ms avg [2.76–14.58]

- ❌ `3.19ms` 5
- ❌ `3.13ms` 5
- ❌ `3.48ms` 5
- ❌ `4.01ms` 5
- ❌ `4.28ms` 5
- ❌ `3.83ms` 5
- ❌ `3.62ms` 5
- ❌ `4.29ms` 5
- ❌ `3.19ms` 5
- ❌ `3.11ms` 5

### SQuAD — ingestion

- **Items:** 200 | **OK:** 200 | **Fail:** 0
- **Latency:** 3.21 ms avg [0.93–7.39]

- ✅ `7.39ms` 56be85543aeaaa14008c9063
- ✅ `7.39ms` 56be85543aeaaa14008c9065
- ✅ `7.39ms` 56be85543aeaaa14008c9066
- ✅ `7.39ms` 56bf6b0f3aeaaa14008c9601
- ✅ `7.39ms` 56bf6b0f3aeaaa14008c9602
- ✅ `7.39ms` 56bf6b0f3aeaaa14008c9603
- ✅ `7.39ms` 56bf6b0f3aeaaa14008c9604
- ✅ `7.39ms` 56bf6b0f3aeaaa14008c9605
- ✅ `7.39ms` 56d43c5f2ccc5a1400d830a9
- ✅ `7.39ms` 56d43c5f2ccc5a1400d830aa

### SQuAD — retrieval

- **Items:** 100 | **OK:** 79 | **Fail:** 21
- **Latency:** 9.89 ms avg [2.83–34.71]

- ✅ `13.51ms` 40
- ✅ `8.38ms` 58
- ✅ `8.89ms` 64
- ✅ `9.67ms` 45
- ✅ `7.57ms` 42
- ✅ `7.62ms` 42
- ✅ `11.21ms` 45
- ✅ `7.9ms` 38
- ✅ `34.71ms` 30
- ✅ `7.61ms` 46

## Key Findings

- **Total operations:** 816
- **Success rate:** 34.2%
- **Overall avg latency:** 4.37 ms
- **Overall latency range:** 0.33 – 55.26 ms
