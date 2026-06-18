import { configManager } from './manager';
import { logger } from '../utils/logger';

export function loadConfigFromEnv(): void {
  const updates: Record<string, any> = {};

  if (process.env.NODE_ENV) {
    updates.env = process.env.NODE_ENV;
  }
  if (process.env.LOG_LEVEL) {
    updates.logLevel = process.env.LOG_LEVEL;
  }
  if (process.env.PORT) {
    updates.api = { ...updates.api, port: parseInt(process.env.PORT, 10) };
  }
  if (process.env.HOST) {
    updates.api = { ...updates.api, host: process.env.HOST };
  }
  if (process.env.VECTOR_STORE_DIMENSIONS) {
    updates.vectorStore = { ...updates.vectorStore, dimensions: parseInt(process.env.VECTOR_STORE_DIMENSIONS, 10) };
  }
  if (process.env.VECTOR_STORE_SIMILARITY_THRESHOLD) {
    updates.vectorStore = { ...updates.vectorStore, similarityThreshold: parseFloat(process.env.VECTOR_STORE_SIMILARITY_THRESHOLD) };
  }
  if (process.env.URCM_RESONANCE_THRESHOLD) {
    updates.urcm = { ...updates.urcm, resonanceThreshold: parseFloat(process.env.URCM_RESONANCE_THRESHOLD) };
  }
  if (process.env.URCM_CONTRADICTION_SENSITIVITY) {
    updates.urcm = { ...updates.urcm, contradictionSensitivity: parseFloat(process.env.URCM_CONTRADICTION_SENSITIVITY) };
  }
  if (process.env.URCM_MAX_OSCILLATIONS) {
    updates.urcm = { ...updates.urcm, maxOscillations: parseInt(process.env.URCM_MAX_OSCILLATIONS, 10) };
  }
  if (process.env.RETRIEVAL_MAX_RESULTS) {
    updates.retrieval = { ...updates.retrieval, maxResults: parseInt(process.env.RETRIEVAL_MAX_RESULTS, 10) };
  }
  if (process.env.RETRIEVAL_MIN_SCORE) {
    updates.retrieval = { ...updates.retrieval, minScore: parseFloat(process.env.RETRIEVAL_MIN_SCORE) };
  }
  if (process.env.PERFORMANCE_MAX_RESPONSE_TIME) {
    updates.performance = { ...updates.performance, maxResponseTime: parseInt(process.env.PERFORMANCE_MAX_RESPONSE_TIME, 10) };
  }
  if (process.env.PERFORMANCE_MAX_MEMORY_MB) {
    updates.performance = { ...updates.performance, maxMemoryUsage: parseInt(process.env.PERFORMANCE_MAX_MEMORY_MB, 10) * 1024 * 1024 };
  }
  if (process.env.PERFORMANCE_MONITORING_INTERVAL) {
    updates.performance = { ...updates.performance, monitoring: { ...updates.performance?.monitoring, intervalMs: parseInt(process.env.PERFORMANCE_MONITORING_INTERVAL, 10) } };
  }
  if (process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
    updates.scaling = { ...updates.scaling, circuitBreaker: { ...updates.scaling?.circuitBreaker, failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD, 10) } };
  }
  if (process.env.CIRCUIT_BREAKER_RECOVERY_TIMEOUT) {
    updates.scaling = { ...updates.scaling, circuitBreaker: { ...updates.scaling?.circuitBreaker, recoveryTimeout: parseInt(process.env.CIRCUIT_BREAKER_RECOVERY_TIMEOUT, 10) } };
  }
  if (process.env.CACHE_SEMANTIC_MAX_SIZE) {
    updates.cache = { ...updates.cache, semantic: { ...updates.cache?.semantic, maxSize: parseInt(process.env.CACHE_SEMANTIC_MAX_SIZE, 10) } };
  }
  if (process.env.CACHE_SEMANTIC_TTL) {
    updates.cache = { ...updates.cache, semantic: { ...updates.cache?.semantic, ttl: parseInt(process.env.CACHE_SEMANTIC_TTL, 10) } };
  }
  if (process.env.CACHE_RETRIEVAL_MAX_SIZE) {
    updates.cache = { ...updates.cache, retrieval: { ...updates.cache?.retrieval, maxSize: parseInt(process.env.CACHE_RETRIEVAL_MAX_SIZE, 10) } };
  }

  if (Object.keys(updates).length > 0) {
    configManager.updateConfig(updates);
    logger.info('Configuration loaded from environment variables');
  }
}
