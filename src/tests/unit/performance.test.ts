import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PerformanceMonitor,
  CircuitBreaker,
  CircuitBreakerState,
  EvictionPolicy,
  CacheType,
  OperationType,
  OptimizationCategory,
  OptimizationPriority
} from '../../system/performance';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    monitor.stopMonitoring();
  });

  describe('recordOperation', () => {
    it('should record operations without errors', () => {
      monitor.recordOperation(OperationType.API_REQUEST, 100);
      monitor.recordOperation(OperationType.RETRIEVAL, 50);
      // No assertion needed - just verify no errors
    });
  });

  describe('getScalabilityMetrics', () => {
    it('should return scalability metrics after recording', () => {
      monitor.recordOperation(OperationType.API_REQUEST, 100);
      const scalability = monitor.getScalabilityMetrics();
      expect(scalability).toHaveProperty('maxConcurrentRequests');
      expect(scalability).toHaveProperty('averageResponseTime');
      expect(scalability).toHaveProperty('throughputPerSecond');
      expect(scalability).toHaveProperty('throughput');
    });
  });

  describe('generateOptimizationRecommendations', () => {
    it('should return optimization recommendations', () => {
      const recs = monitor.generateOptimizationRecommendations();
      expect(Array.isArray(recs)).toBe(true);
    });
  });

  describe('startMonitoring and stopMonitoring', () => {
    it('should start and stop without errors', () => {
      monitor.startMonitoring(100);
      monitor.stopMonitoring();
    });
  });
});

describe('CircuitBreaker', () => {
  it('should start in CLOSED state', () => {
    const cb = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 1000,
      monitoringWindow: 60000,
      halfOpenMaxCalls: 1,
      successThreshold: 1
    });
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
  });

  it('should execute successful operations', async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 1000,
      monitoringWindow: 60000,
      halfOpenMaxCalls: 1,
      successThreshold: 1
    });
    const result = await cb.execute(async () => 'success');
    expect(result).toBe('success');
    expect(cb.getState()).toBe(CircuitBreakerState.CLOSED);
  });

  it('should trip to OPEN after threshold failures', async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 2,
      recoveryTimeout: 5000,
      monitoringWindow: 60000,
      halfOpenMaxCalls: 1,
      successThreshold: 1
    });
    try { await cb.execute(async () => { throw new Error('fail'); }); } catch { /* expected */ }
    try { await cb.execute(async () => { throw new Error('fail'); }); } catch { /* expected */ }
    expect(cb.getState()).toBe(CircuitBreakerState.OPEN);
  });

  it('should reject when circuit is open', async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 1,
      recoveryTimeout: 50000,
      monitoringWindow: 60000,
      halfOpenMaxCalls: 1,
      successThreshold: 1
    });
    try { await cb.execute(async () => { throw new Error('fail'); }); } catch { /* expected */ }
    await expect(cb.execute(async () => 'should not run')).rejects.toThrow('Circuit breaker is OPEN');
  });

  it('should track metrics', async () => {
    const cb = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 1000,
      monitoringWindow: 60000,
      halfOpenMaxCalls: 1,
      successThreshold: 1
    });
    await cb.execute(async () => 'ok');
    const metrics = cb.getMetrics();
    expect(metrics.successCount).toBe(1);
    expect(metrics.failureCount).toBe(0);
  });
});

describe('EvictionPolicy', () => {
  it('should have all policies defined', () => {
    expect(EvictionPolicy.LRU).toBe('LRU');
    expect(EvictionPolicy.LFU).toBe('LFU');
    expect(EvictionPolicy.FIFO).toBe('FIFO');
    expect(EvictionPolicy.RANDOM).toBe('RANDOM');
    expect(EvictionPolicy.TTL).toBe('TTL');
  });
});

describe('CacheType', () => {
  it('should have all cache types defined', () => {
    expect(CacheType.IN_MEMORY).toBe('IN_MEMORY');
    expect(CacheType.REDIS).toBe('REDIS');
    expect(CacheType.MEMCACHED).toBe('MEMCACHED');
    expect(CacheType.HYBRID).toBe('HYBRID');
  });
});

describe('OperationType', () => {
  it('should have all operation types', () => {
    expect(OperationType.SEMANTIC_COMPRESSION).toBe('SEMANTIC_COMPRESSION');
    expect(OperationType.RETRIEVAL).toBe('RETRIEVAL');
    expect(OperationType.CONTEXT_ASSEMBLY).toBe('CONTEXT_ASSEMBLY');
    expect(OperationType.CONTRADICTION_DETECTION).toBe('CONTRADICTION_DETECTION');
  });
});

describe('OptimizationCategory', () => {
  it('should have all optimization categories', () => {
    expect(OptimizationCategory.MEMORY).toBe('MEMORY');
    expect(OptimizationCategory.CPU).toBe('CPU');
    expect(OptimizationCategory.NETWORK).toBe('NETWORK');
    expect(OptimizationCategory.CACHING).toBe('CACHING');
  });
});

describe('OptimizationPriority', () => {
  it('should have all priorities', () => {
    expect(OptimizationPriority.LOW).toBe('LOW');
    expect(OptimizationPriority.MEDIUM).toBe('MEDIUM');
    expect(OptimizationPriority.HIGH).toBe('HIGH');
    expect(OptimizationPriority.CRITICAL).toBe('CRITICAL');
  });
});
