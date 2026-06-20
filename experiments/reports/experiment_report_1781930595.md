# SCDL-RAG Experiment Report
**Generated:** 2026-06-20 10:13:15
**System:** Contradiction-Aware Retrieval Architecture for Reliable AI Reasoning

## Summary

| Dataset | Experiment | Total | Success | Failed | Avg Latency (ms) | Min (ms) | Max (ms) |
|---------|-----------|------:|--------:|-------:|-----------------:|---------:|---------:|
| HotpotQA | compression | 100 | 100 | 0 | 74.51 | 6.46 | 712.18 |
| HotpotQA | ingestion | 200 | 200 | 0 | 4.54 | 0.39 | 66.27 |
| HotpotQA | retrieval | 100 | 100 | 0 | 325.83 | 3.8 | 17276.73 |
| SQuAD | compression | 100 | 100 | 0 | 8.11 | 3.48 | 29.08 |
| SQuAD | contradiction_detection | 16 | 16 | 0 | 4.43 | 2.8 | 19.37 |
| SQuAD | ingestion | 200 | 200 | 0 | 2.65 | 0.97 | 5.61 |
| SQuAD | retrieval | 100 | 100 | 0 | 14.11 | 5.38 | 338.62 |

## Detailed Results

### HotpotQA — compression

- **Items:** 100 | **OK:** 100 | **Fail:** 0
- **Latency:** 74.51 ms avg [6.46–712.18]

- ✅ `113.55ms` 70
- ✅ `86.79ms` 81
- ✅ `30.6ms` 127
- ✅ `274.06ms` 48
- ✅ `450.15ms` 78
- ✅ `231.49ms` 80
- ✅ `518.6ms` 85
- ✅ `633.08ms` 215
- ✅ `185.7ms` 97
- ✅ `180.72ms` 86

### HotpotQA — ingestion

- **Items:** 200 | **OK:** 200 | **Fail:** 0
- **Latency:** 4.54 ms avg [0.39–66.27]

- ✅ `0.44ms` 5a7a06935542990198eaf050
- ✅ `0.44ms` 5a879ab05542996e4f30887e
- ✅ `0.44ms` 5a8d7341554299441c6b9fe5
- ✅ `0.44ms` 5a82171f5542990a1d231f4a
- ✅ `0.44ms` 5a84dd955542997b5ce3ff79
- ✅ `0.44ms` 5a7e36045542991319bc9440
- ✅ `0.44ms` 5adf44985542993a75d2646d
- ✅ `0.44ms` 5a832c3455429954d2e2ec41
- ✅ `0.44ms` 5a7d0db955429909bec76924
- ✅ `0.44ms` 5a89372855429951533612e6

### HotpotQA — retrieval

- **Items:** 100 | **OK:** 100 | **Fail:** 0
- **Latency:** 325.83 ms avg [3.8–17276.73]

- ✅ `13.67ms` 70
- ✅ `9.29ms` 81
- ✅ `4.93ms` 127
- ✅ `4.93ms` 48
- ✅ `4.63ms` 78
- ✅ `4.95ms` 80
- ✅ `6.28ms` 85
- ✅ `4.75ms` 215
- ✅ `3.8ms` 97
- ✅ `20.76ms` 86

### SQuAD — compression

- **Items:** 100 | **OK:** 100 | **Fail:** 0
- **Latency:** 8.11 ms avg [3.48–29.08]

- ✅ `9.31ms` 694
- ✅ `5.74ms` 694
- ✅ `4.18ms` 694
- ✅ `4.1ms` 694
- ✅ `3.93ms` 694
- ✅ `3.88ms` 694
- ✅ `3.8ms` 694
- ✅ `4.96ms` 694
- ✅ `22.02ms` 694
- ✅ `16.1ms` 694

### SQuAD — contradiction_detection

- **Items:** 16 | **OK:** 16 | **Fail:** 0
- **Latency:** 4.43 ms avg [2.8–19.37]

- ✅ `19.37ms` 5
- ✅ `4.08ms` 5
- ✅ `4.73ms` 5
- ✅ `4.5ms` 5
- ✅ `3.57ms` 5
- ✅ `3.78ms` 5
- ✅ `3.16ms` 5
- ✅ `2.86ms` 5
- ✅ `3.37ms` 5
- ✅ `3.01ms` 5

### SQuAD — ingestion

- **Items:** 200 | **OK:** 200 | **Fail:** 0
- **Latency:** 2.65 ms avg [0.97–5.61]

- ✅ `4.57ms` 56be85543aeaaa14008c9063
- ✅ `4.57ms` 56be85543aeaaa14008c9065
- ✅ `4.57ms` 56be85543aeaaa14008c9066
- ✅ `4.57ms` 56bf6b0f3aeaaa14008c9601
- ✅ `4.57ms` 56bf6b0f3aeaaa14008c9602
- ✅ `4.57ms` 56bf6b0f3aeaaa14008c9603
- ✅ `4.57ms` 56bf6b0f3aeaaa14008c9604
- ✅ `4.57ms` 56bf6b0f3aeaaa14008c9605
- ✅ `4.57ms` 56d43c5f2ccc5a1400d830a9
- ✅ `4.57ms` 56d43c5f2ccc5a1400d830aa

### SQuAD — retrieval

- **Items:** 100 | **OK:** 100 | **Fail:** 0
- **Latency:** 14.11 ms avg [5.38–338.62]

- ✅ `10.48ms` 40
- ✅ `9.69ms` 58
- ✅ `21.72ms` 64
- ✅ `7.28ms` 45
- ✅ `10.61ms` 42
- ✅ `6.99ms` 42
- ✅ `10.17ms` 45
- ✅ `8.09ms` 38
- ✅ `6.33ms` 30
- ✅ `6.24ms` 46

## Key Findings

- **Total operations:** 816
- **Success rate:** 100.0%
- **Overall avg latency:** 53.63 ms
- **Overall latency range:** 0.39 – 17276.73 ms
