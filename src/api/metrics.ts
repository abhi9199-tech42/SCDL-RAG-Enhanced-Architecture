import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

const registry = new Registry();

// Collect default Node.js metrics (GC, event loop, memory, etc.)
collectDefaultMetrics({ prefix: 'scdl_', register: registry });

export const httpRequestDuration = new Histogram({
  name: 'scdl_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [registry]
});

export const httpRequestTotal = new Counter({
  name: 'scdl_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [registry]
});

export const semanticCompressions = new Counter({
  name: 'scdl_semantic_compressions_total',
  help: 'Total semantic compressions performed',
  labelNames: ['status'],
  registers: [registry]
});

export const semanticCompressionDuration = new Histogram({
  name: 'scdl_semantic_compression_duration_seconds',
  help: 'Duration of semantic compression in seconds',
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [registry]
});

export const contradictionsDetected = new Counter({
  name: 'scdl_contradictions_detected_total',
  help: 'Total contradictions detected',
  labelNames: ['type'],
  registers: [registry]
});

export const retrievals = new Counter({
  name: 'scdl_retrievals_total',
  help: 'Total retrieval operations',
  labelNames: ['status'],
  registers: [registry]
});

export const retrievalDuration = new Histogram({
  name: 'scdl_retrieval_duration_seconds',
  help: 'Duration of retrieval operations in seconds',
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2],
  registers: [registry]
});

export const vectorStoreSize = new Gauge({
  name: 'scdl_vector_store_size',
  help: 'Number of semantic units in the vector store',
  registers: [registry]
});

export const circuitBreakerState = new Gauge({
  name: 'scdl_circuit_breaker_state',
  help: 'Circuit breaker state (0=closed, 1=half-open, 2=open)',
  registers: [registry]
});

export { registry };
