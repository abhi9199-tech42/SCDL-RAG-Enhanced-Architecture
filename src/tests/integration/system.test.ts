import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SCDLSystemImpl } from '../../system/core';
import { SemanticUnit } from '../../types';

describe('System Integration Tests', () => {
  let system: SCDLSystemImpl;

  beforeAll(async () => {
    // Use test config (random port to avoid conflicts if needed, or default)
    system = new SCDLSystemImpl({
      api: { port: 3001, host: 'localhost', corsOrigins: [], rateLimit: { windowMs: 1000, maxRequests: 100 } } as any
    });
    await system.initialize();
    // We don't necessarily need to start the HTTP server for internal component testing
    // but we can if we want to test API. Here we test components directly wired up.
  });

  afterAll(async () => {
    await system.stop();
  });

  it('should initialize all components correctly', () => {
    expect(system.isreProcessor).toBeDefined();
    expect(system.urcmProcessor).toBeDefined();
    expect(system.vectorStore).toBeDefined();
    expect(system.deduplicationEngine).toBeDefined();
    expect(system.retrievalEngine).toBeDefined();
    expect(system.contextAssembler).toBeDefined();
    expect(system.auditTrail).toBeDefined();
    expect(system.apiServer).toBeDefined();
  });

  it('should execute full ingestion and retrieval workflow', async () => {
    // 1. Ingestion (Manual via components for now to verify flow)
    const content = "The sky is blue due to Rayleigh scattering.";
    
    // Process
    const semantics = await system.isreProcessor.compressSemantics({
      id: 'test-doc-1',
      content,
      contentType: 'text'
    });

    const unit: SemanticUnit = {
      id: 'unit-1',
      content,
      semantics,
      sourceReferences: [],
      metadata: {}
    };

    // Store
    await system.vectorStore.add(unit);

    // 2. Retrieval
    const query = "Why is the sky blue?";
    const results = await system.retrievalEngine.retrieve(query);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].unit.id).toBe('unit-1');
    expect(results[0].metrics.intentAlignment).toBeGreaterThanOrEqual(0);

    // 3. Context Assembly
    const context = await system.contextAssembler.assemble(results, { maxTokens: 100 });
    expect(context.usedUnits.length).toBeGreaterThan(0);
    expect(context.usedUnits[0].id).toBe('unit-1');
  });

  it('should detect duplicates via deduplication engine', async () => {
    const content = "Quantum mechanics describes nature at the smallest scales.";
    
    const semantics = await system.isreProcessor.compressSemantics({
      id: 'test-doc-2',
      content,
      contentType: 'text'
    });

    const unit: SemanticUnit = {
      id: 'unit-2',
      content,
      semantics,
      sourceReferences: [],
      metadata: {}
    };

    // Add first time
    await system.vectorStore.add(unit);

    // Check duplicate
    const result = await system.deduplicationEngine.checkDuplicate(unit);
    expect(result.isDuplicate).toBe(true);
    expect(result.originalId).toBe('unit-2');
  });
});
