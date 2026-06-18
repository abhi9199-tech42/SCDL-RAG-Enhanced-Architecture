# Load Testing

Requires [k6](https://k6.io/) installed.

## Usage

```bash
# Smoke test (default)
k6 run loadtest/k6-script.js

# Custom target
BASE_URL=http://localhost:3000 API_KEY=your-key k6 run loadtest/k6-script.js

# Run specific scenario only
k6 run --scenario smoke loadtest/k6-script.js
k6 run --scenario load loadtest/k6-script.js
k6 run --scenario stress loadtest/k6-script.js
```

## Scenarios

| Scenario | VUs | Duration | Purpose |
|----------|-----|----------|---------|
| smoke | 2 | 30s | Verify basic functionality |
| load | 0→10 | 3.5m | Normal traffic simulation |
| stress | 0→20 | 2m | High traffic stress test |

## Thresholds

- p95 latency < 500ms
- p99 latency < 1000ms
- Error rate < 10%

## Output

Results are saved to `loadtest/summary.json` after each run.
