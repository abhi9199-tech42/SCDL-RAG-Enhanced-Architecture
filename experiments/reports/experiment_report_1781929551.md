# SCDL-RAG Experiment Report
**Generated:** 2026-06-20 09:55:51
**System:** Contradiction-Aware Retrieval Architecture for Reliable AI Reasoning

## Summary

| Dataset | Experiment | Total | Success | Failed | Avg Latency (ms) | Min (ms) | Max (ms) |
|---------|-----------|------:|--------:|-------:|-----------------:|---------:|---------:|
| HotpotQA | compression | 100 | 0 | 100 | 6.62 | 2.19 | 27.57 |
| HotpotQA | ingestion | 200 | 0 | 200 | 0.66 | 0.25 | 2.66 |
| HotpotQA | retrieval | 100 | 0 | 100 | 8.11 | 2.48 | 27.76 |
| SQuAD | compression | 100 | 0 | 100 | 8.03 | 2.19 | 27.47 |
| SQuAD | contradiction_detection | 16 | 0 | 16 | 6.76 | 2.27 | 25.11 |
| SQuAD | ingestion | 200 | 200 | 0 | 2.55 | 0.95 | 5.24 |
| SQuAD | retrieval | 100 | 79 | 21 | 12.01 | 2.56 | 241.58 |

## Detailed Results

### HotpotQA — compression

- **Items:** 100 | **OK:** 0 | **Fail:** 100
- **Latency:** 6.62 ms avg [2.19–27.57]

- ❌ `2.57ms` 70
- ❌ `2.29ms` 81
- ❌ `21.36ms` 127
- ❌ `15.23ms` 48
- ❌ `2.83ms` 78
- ❌ `13.55ms` 80
- ❌ `3.32ms` 85
- ❌ `3.46ms` 215
- ❌ `2.47ms` 97
- ❌ `3.35ms` 86

### HotpotQA — ingestion

- **Items:** 200 | **OK:** 0 | **Fail:** 200
- **Latency:** 0.66 ms avg [0.25–2.66]

- ❌ `1.48ms` 
- ❌ `1.48ms` 
- ❌ `1.48ms` 
- ❌ `1.48ms` 
- ❌ `1.48ms` 
- ❌ `1.48ms` 
- ❌ `1.48ms` 
- ❌ `1.48ms` 
- ❌ `1.48ms` 
- ❌ `1.48ms` 

### HotpotQA — retrieval

- **Items:** 100 | **OK:** 0 | **Fail:** 100
- **Latency:** 8.11 ms avg [2.48–27.76]

- ❌ `2.6ms` 70
- ❌ `3.59ms` 81
- ❌ `23.44ms` 127
- ❌ `3.57ms` 48
- ❌ `2.76ms` 78
- ❌ `2.82ms` 80
- ❌ `2.88ms` 85
- ❌ `3.25ms` 215
- ❌ `2.83ms` 97
- ❌ `3.13ms` 86

### SQuAD — compression

- **Items:** 100 | **OK:** 0 | **Fail:** 100
- **Latency:** 8.03 ms avg [2.19–27.47]

- ❌ `4.02ms` 694
- ❌ `3.15ms` 694
- ❌ `20.01ms` 694
- ❌ `2.64ms` 694
- ❌ `12.66ms` 694
- ❌ `15.73ms` 694
- ❌ `2.51ms` 694
- ❌ `13.27ms` 694
- ❌ `15.73ms` 694
- ❌ `2.4ms` 694

### SQuAD — contradiction_detection

- **Items:** 16 | **OK:** 0 | **Fail:** 16
- **Latency:** 6.76 ms avg [2.27–25.11]

- ❌ `2.56ms` 5
- ❌ `2.6ms` 5
- ❌ `25.11ms` 5
- ❌ `15.96ms` 5
- ❌ `2.78ms` 5
- ❌ `2.74ms` 5
- ❌ `2.29ms` 5
- ❌ `2.4ms` 5
- ❌ `2.27ms` 5
- ❌ `2.44ms` 5

### SQuAD — ingestion

- **Items:** 200 | **OK:** 200 | **Fail:** 0
- **Latency:** 2.55 ms avg [0.95–5.24]

- ✅ `5.24ms` 56be85543aeaaa14008c9063
- ✅ `5.24ms` 56be85543aeaaa14008c9065
- ✅ `5.24ms` 56be85543aeaaa14008c9066
- ✅ `5.24ms` 56bf6b0f3aeaaa14008c9601
- ✅ `5.24ms` 56bf6b0f3aeaaa14008c9602
- ✅ `5.24ms` 56bf6b0f3aeaaa14008c9603
- ✅ `5.24ms` 56bf6b0f3aeaaa14008c9604
- ✅ `5.24ms` 56bf6b0f3aeaaa14008c9605
- ✅ `5.24ms` 56d43c5f2ccc5a1400d830a9
- ✅ `5.24ms` 56d43c5f2ccc5a1400d830aa

### SQuAD — retrieval

- **Items:** 100 | **OK:** 79 | **Fail:** 21
- **Latency:** 12.01 ms avg [2.56–241.58]

- ✅ `10.65ms` 40
- ✅ `7.02ms` 58
- ✅ `6.85ms` 64
- ✅ `10.35ms` 45
- ✅ `6.41ms` 42
- ✅ `9.4ms` 42
- ✅ `27.55ms` 45
- ✅ `8.5ms` 38
- ✅ `19.29ms` 30
- ✅ `6.73ms` 46

## Key Findings

- **Total operations:** 816
- **Success rate:** 34.2%
- **Overall avg latency:** 5.18 ms
- **Overall latency range:** 0.25 – 241.58 ms
