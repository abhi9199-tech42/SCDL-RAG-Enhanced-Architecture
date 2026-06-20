# SCDL-RAG Experiment Report
**Generated:** 2026-06-20 09:46:53
**System:** Contradiction-Aware Retrieval Architecture for Reliable AI Reasoning

## Summary

| Dataset | Experiment | Total | Success | Failed | Avg Latency (ms) | Min (ms) | Max (ms) |
|---------|-----------|------:|--------:|-------:|-----------------:|---------:|---------:|
| HotpotQA | compression | 100 | 0 | 100 | 3.65 | 2.73 | 7.18 |
| HotpotQA | ingestion | 200 | 0 | 200 | 0.36 | 0.25 | 0.58 |
| HotpotQA | retrieval | 100 | 0 | 100 | 4.07 | 2.74 | 27.82 |
| SQuAD | compression | 100 | 0 | 100 | 4.26 | 2.67 | 21.59 |
| SQuAD | contradiction_detection | 50 | 0 | 50 | 4.28 | 2.74 | 28.9 |
| SQuAD | ingestion | 200 | 200 | 0 | 4.72 | 1.54 | 12.48 |
| SQuAD | retrieval | 100 | 79 | 21 | 10.35 | 2.87 | 33.49 |

## Detailed Results

### HotpotQA — compression

- **Items:** 100 | **OK:** 0 | **Fail:** 100
- **Latency:** 3.65 ms avg [2.73–7.18]

- ❌ `3.2ms` 70
- ❌ `2.96ms` 81
- ❌ `3.48ms` 127
- ❌ `3.13ms` 48
- ❌ `3.23ms` 78
- ❌ `6.53ms` 80
- ❌ `3.13ms` 85
- ❌ `2.91ms` 215
- ❌ `3.18ms` 97
- ❌ `2.83ms` 86

### HotpotQA — ingestion

- **Items:** 200 | **OK:** 0 | **Fail:** 200
- **Latency:** 0.36 ms avg [0.25–0.58]

- ❌ `0.33ms` 0
- ❌ `0.33ms` 0
- ❌ `0.33ms` 0
- ❌ `0.33ms` 0
- ❌ `0.33ms` 0
- ❌ `0.33ms` 0
- ❌ `0.33ms` 0
- ❌ `0.33ms` 0
- ❌ `0.33ms` 0
- ❌ `0.33ms` 0

### HotpotQA — retrieval

- **Items:** 100 | **OK:** 0 | **Fail:** 100
- **Latency:** 4.07 ms avg [2.74–27.82]

- ❌ `3.37ms` 70
- ❌ `6.07ms` 81
- ❌ `3.15ms` 127
- ❌ `3.46ms` 48
- ❌ `3.5ms` 78
- ❌ `4.72ms` 80
- ❌ `3.17ms` 85
- ❌ `3.42ms` 215
- ❌ `4.05ms` 97
- ❌ `3.45ms` 86

### SQuAD — compression

- **Items:** 100 | **OK:** 0 | **Fail:** 100
- **Latency:** 4.26 ms avg [2.67–21.59]

- ❌ `2.91ms` 694
- ❌ `5.67ms` 694
- ❌ `3.92ms` 694
- ❌ `3.43ms` 694
- ❌ `3.42ms` 694
- ❌ `3.61ms` 694
- ❌ `3.03ms` 694
- ❌ `2.84ms` 694
- ❌ `5.0ms` 694
- ❌ `3.52ms` 694

### SQuAD — contradiction_detection

- **Items:** 50 | **OK:** 0 | **Fail:** 50
- **Latency:** 4.28 ms avg [2.74–28.9]

- ❌ `3.7ms` 5
- ❌ `2.9ms` 5
- ❌ `28.9ms` 5
- ❌ `3.36ms` 5
- ❌ `9.23ms` 5
- ❌ `3.51ms` 5
- ❌ `3.48ms` 5
- ❌ `4.27ms` 5
- ❌ `3.72ms` 5
- ❌ `3.89ms` 5

### SQuAD — ingestion

- **Items:** 200 | **OK:** 200 | **Fail:** 0
- **Latency:** 4.72 ms avg [1.54–12.48]

- ✅ `12.48ms` 694
- ✅ `12.48ms` 694
- ✅ `12.48ms` 694
- ✅ `12.48ms` 694
- ✅ `12.48ms` 694
- ✅ `12.48ms` 694
- ✅ `12.48ms` 694
- ✅ `12.48ms` 694
- ✅ `12.48ms` 694
- ✅ `12.48ms` 694

### SQuAD — retrieval

- **Items:** 100 | **OK:** 79 | **Fail:** 21
- **Latency:** 10.35 ms avg [2.87–33.49]

- ✅ `16.45ms` 40
- ✅ `9.32ms` 58
- ✅ `10.67ms` 64
- ✅ `9.41ms` 45
- ✅ `29.3ms` 42
- ✅ `33.49ms` 42
- ✅ `19.65ms` 45
- ✅ `16.15ms` 38
- ✅ `14.13ms` 30
- ✅ `8.66ms` 46

## Key Findings

- **Total operations:** 850
- **Success rate:** 32.8%
- **Overall avg latency:** 4.07 ms
- **Overall latency range:** 0.25 – 33.49 ms
