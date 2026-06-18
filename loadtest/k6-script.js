import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const ingestDuration = new Trend('ingest_duration');
const retrieveDuration = new Trend('retrieve_duration');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_KEY = __ENV.API_KEY || 'test-api-key';

export const options = {
  scenarios: {
    // Smoke test: low load to verify basic functionality
    smoke: {
      executor: 'constant-vus',
      vus: 2,
      duration: '30s',
      exec: 'smokeTest'
    },
    // Load test: normal traffic
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 10 },
        { duration: '30s', target: 0 }
      ],
      exec: 'loadTest'
    },
    // Stress test: high traffic
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 20 },
        { duration: '30s', target: 0 }
      ],
      exec: 'stressTest'
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.1']
  }
};

export function smokeTest() {
  const headers = { 'Content-Type': 'application/json', 'x-api-key': API_KEY };

  // Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, { 'health status 200': (r) => r.status === 200 });

  // Ingest
  const ingestStart = Date.now();
  const ingestRes = http.post(`${BASE_URL}/api/ingest`, JSON.stringify({
    content: `Smoke test content ${Date.now()}`,
    metadata: { source: 'k6-smoke' }
  }), { headers });
  ingestDuration.add(Date.now() - ingestStart);
  check(ingestRes, { 'ingest status 200': (r) => r.status === 200 });

  sleep(1);

  // Retrieve
  const retrieveStart = Date.now();
  const retrieveRes = http.post(`${BASE_URL}/api/retrieve`, JSON.stringify({
    query: 'test query',
    limit: 5
  }), { headers });
  retrieveDuration.add(Date.now() - retrieveStart);
  check(retrieveRes, { 'retrieve status 200': (r) => r.status === 200 });

  sleep(1);
}

export function loadTest() {
  const headers = { 'Content-Type': 'application/json', 'x-api-key': API_KEY };

  // Ingest
  const ingestRes = http.post(`${BASE_URL}/api/ingest`, JSON.stringify({
    content: `Load test content ${Date.now()}-${__VU}-${__ITER}`,
    metadata: { source: 'k6-load', vu: __VU, iter: __ITER }
  }), { headers });
  check(ingestRes, { 'ingest successful': (r) => r.status === 200 }) || errorRate.add(1);

  sleep(0.5);

  // Retrieve
  const retrieveRes = http.post(`${BASE_URL}/api/retrieve`, JSON.stringify({
    query: `load test query ${__ITER}`,
    limit: 3
  }), { headers });
  check(retrieveRes, { 'retrieve successful': (r) => r.status === 200 }) || errorRate.add(1);

  sleep(0.5);
}

export function stressTest() {
  const headers = { 'Content-Type': 'application/json', 'x-api-key': API_KEY };

  // Burst of ingests
  const batch = [];
  for (let i = 0; i < 5; i++) {
    batch.push({
      content: `Stress test batch item ${Date.now()}-${__VU}-${__ITER}-${i}`,
      metadata: { source: 'k6-stress' }
    });
  }

  const batchRes = http.post(`${BASE_URL}/api/batch/ingest`, JSON.stringify({
    items: batch
  }), { headers });
  check(batchRes, { 'batch ingest successful': (r) => r.status === 200 }) || errorRate.add(1);

  sleep(0.3);

  // Parallel retrievals
  const queries = ['stress test', 'contradiction detection', 'semantic analysis'];
  const query = queries[__ITER % queries.length];
  const retrieveRes = http.post(`${BASE_URL}/api/retrieve`, JSON.stringify({
    query,
    limit: 5
  }), { headers });
  check(retrieveRes, { 'stress retrieve successful': (r) => r.status === 200 }) || errorRate.add(1);

  sleep(0.2);
}

export function handleSummary(data: any) {
  return {
    'loadtest/summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

function textSummary(data: any, options: any): string {
  const lines = [];
  lines.push('');
  lines.push('  ┌─────────────────────────────────────────┐');
  lines.push('  │          SCDL-RAG Load Test Results     │');
  lines.push('  ├─────────────────────────────────────────┤');
  lines.push(`  │  HTTP Requests:  ${String(data.metrics.http_reqs?.values?.count || 0).padStart(8)}          │`);
  lines.push(`  │  Avg Duration:   ${String((data.metrics.http_req_duration?.values?.avg || 0).toFixed(0)).padStart(6)}ms          │`);
  lines.push(`  │  P95 Duration:   ${String((data.metrics.http_req_duration?.values?.['p(95)'] || 0).toFixed(0)).padStart(6)}ms          │`);
  lines.push(`  │  P99 Duration:   ${String((data.metrics.http_req_duration?.values?.['p(99)'] || 0).toFixed(0)).padStart(6)}ms          │`);
  lines.push(`  │  Error Rate:     ${String(((data.metrics.errors?.values?.rate || 0) * 100).toFixed(2)).padStart(6)}%           │`);
  lines.push(`  │  RPS:            ${String((data.metrics.http_reqs?.values?.rate || 0).toFixed(1)).padStart(7)}           │`);
  lines.push('  └─────────────────────────────────────────┘');
  lines.push('');
  return lines.join('\n');
}
