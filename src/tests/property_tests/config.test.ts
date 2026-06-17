import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ConfigManager } from '../../config/manager';

describe('Configuration System Property Tests', () => {
  it('Property 16: Configuration Validation and Application', () => {
    // Generator for valid retrieval weights
    const weightsArbitrary = fc.float({ min: 0, max: 1, noNaN: true }).map(w => ({
      vectorSimilarity: w,
      intentAlignment: 1 - w
    }));

    // Generator for valid config updates
    const configUpdateArbitrary = fc.record({
      isre: fc.record({
        compression: fc.record({
          minSemanticDensity: fc.float({ min: 0, max: 1, noNaN: true }),
          maxTokens: fc.integer({ min: 1, max: 1000 }),
          enabled: fc.boolean()
        }, { requiredKeys: [] }),
        graph: fc.record({
          maxDepth: fc.integer({ min: 1, max: 10 }),
          minEdgeWeight: fc.float({ min: 0, max: 1, noNaN: true }),
          maxNodes: fc.integer({ min: 1, max: 1000 })
        }, { requiredKeys: [] })
      }, { requiredKeys: [] }),
      retrieval: fc.record({
        weights: weightsArbitrary,
        maxResults: fc.integer({ min: 1, max: 100 }),
        minScore: fc.float({ min: 0, max: 1, noNaN: true })
      }, { requiredKeys: [] })
    }, { requiredKeys: [] });

    fc.assert(
      fc.property(configUpdateArbitrary, (update) => {
        const manager = new ConfigManager();
        
        // Should accept valid updates
        expect(() => manager.updateConfig(update as any)).not.toThrow();
        
        const current = manager.getConfig();
        
        // Verify specific fields if they were updated
        if (update.isre?.compression?.minSemanticDensity !== undefined) {
          expect(current.isre.compression.minSemanticDensity).toBe(update.isre.compression.minSemanticDensity);
        }
        
        // Verify invariants
        expect(current.retrieval.weights.vectorSimilarity + current.retrieval.weights.intentAlignment).toBeCloseTo(1.0);
      })
    );
  });

  it('should reject invalid configurations', () => {
    const manager = new ConfigManager();

    // Invalid weights
    expect(() => manager.updateConfig({
      retrieval: {
        weights: { vectorSimilarity: 0.5, intentAlignment: 0.6 } // Sum > 1
      }
    } as any)).toThrow();

    // Invalid port
    expect(() => manager.updateConfig({
      api: { port: 99999 }
    } as any)).toThrow();
  });

  it('should emit change events', () => {
    const manager = new ConfigManager();
    let eventEmitted = false;
    
    manager.on('change', () => {
      eventEmitted = true;
    });

    manager.updateConfig({
      isre: { compression: { enabled: false } }
    });

    expect(eventEmitted).toBe(true);
  });
});
