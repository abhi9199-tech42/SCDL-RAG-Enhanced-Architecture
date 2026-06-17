import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ConfigManager } from '../../config/manager';

describe('Property 16: Configuration Validation and Application (Extended)', () => {
  /**
   * Property 16: Configuration Validation and Application (Updated)
   * Validates: Requirements 12.4, 12.5
   * 
   * Extended to include multi-language validation, compression optimization,
   * performance monitoring, scaling, caching, and audit configurations.
   * 
   * For any configuration changes, the system should:
   * 1. Validate all configuration parameters including new features
   * 2. Apply changes without system restart where possible
   * 3. Maintain configuration consistency across all components
   * 4. Provide meaningful error messages for invalid configurations
   * 5. Support hot-reload for non-critical configuration changes
   */
  it('should validate extended configuration parameters correctly', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          // ISRE multi-language configuration
          multiLanguageEnabled: fc.boolean(),
          consistencyThreshold: fc.float({ min: 0, max: 1, noNaN: true, noInfinity: true }),
          autoCorrection: fc.boolean(),
          supportedLanguages: fc.array(fc.constantFrom('en', 'es', 'fr', 'de', 'zh', 'ja'), { minLength: 1, maxLength: 6 }),
          
          // Compression optimization
          optimizationEnabled: fc.boolean(),
          adaptiveCompression: fc.boolean(),
          
          // URCM semantic detection
          semanticDetectionEnabled: fc.boolean(),
          patternMatching: fc.boolean(),
          domainSpecificRules: fc.boolean(),
          contradictionSensitivity: fc.float({ min: 0, max: 1, noNaN: true, noInfinity: true }),
          maxOscillations: fc.integer({ min: 1, max: 100 }),
          
          // Performance monitoring
          performanceMonitoringEnabled: fc.boolean(),
          maxResponseTime: fc.integer({ min: 100, max: 10000 }),
          maxErrorRate: fc.float({ min: 0, max: 1, noNaN: true, noInfinity: true }),
          monitoringInterval: fc.integer({ min: 1000, max: 60000 }),
          
          // Scaling configuration
          horizontalScalingEnabled: fc.boolean(),
          minInstances: fc.integer({ min: 1, max: 5 }),
          maxInstances: fc.integer({ min: 5, max: 20 }),
          scaleUpThreshold: fc.float({ min: 0, max: 1, noNaN: true, noInfinity: true }),
          scaleDownThreshold: fc.float({ min: 0, max: 1, noNaN: true, noInfinity: true }),
          
          // Cache configuration
          semanticCacheEnabled: fc.boolean(),
          semanticCacheSize: fc.integer({ min: 100, max: 10000 }),
          semanticCacheTtl: fc.integer({ min: 1000, max: 3600000 }),
          retrievalCacheEnabled: fc.boolean(),
          
          // Audit configuration
          auditEnabled: fc.boolean(),
          auditDetailLevel: fc.constantFrom('minimal', 'standard', 'comprehensive'),
          explainabilityEnabled: fc.boolean(),
          expertReviewEnabled: fc.boolean(),
          complexityThreshold: fc.float({ min: 0, max: 1, noNaN: true, noInfinity: true }),
          
          // API configuration
          authenticationEnabled: fc.boolean(),
          rateLimitMaxRequests: fc.integer({ min: 1, max: 1000 }),
          compressionEnabled: fc.boolean()
        }),
        (config) => {
          const configManager = new ConfigManager();
          
          const configUpdate = {
            isre: {
              multiLanguage: {
                enabled: config.multiLanguageEnabled,
                consistencyThreshold: config.consistencyThreshold,
                autoCorrection: config.autoCorrection,
                supportedLanguages: config.supportedLanguages
              },
              compression: {
                optimizationEnabled: config.optimizationEnabled,
                adaptiveCompression: config.adaptiveCompression
              }
            },
            urcm: {
              semanticDetection: {
                enabled: config.semanticDetectionEnabled,
                patternMatching: config.patternMatching,
                domainSpecificRules: config.domainSpecificRules
              },
              contradictionSensitivity: config.contradictionSensitivity,
              maxOscillations: config.maxOscillations
            },
            performance: {
              monitoring: {
                enabled: config.performanceMonitoringEnabled,
                intervalMs: config.monitoringInterval
              },
              maxResponseTime: config.maxResponseTime,
              maxErrorRate: config.maxErrorRate
            },
            scaling: {
              horizontal: {
                enabled: config.horizontalScalingEnabled,
                minInstances: config.minInstances,
                maxInstances: Math.max(config.maxInstances, config.minInstances), // Ensure maxInstances >= minInstances
                scaleUpThreshold: config.scaleUpThreshold,
                scaleDownThreshold: config.scaleDownThreshold
              }
            },
            cache: {
              semantic: {
                enabled: config.semanticCacheEnabled,
                maxSize: config.semanticCacheSize,
                ttl: config.semanticCacheTtl
              },
              retrieval: {
                enabled: config.retrievalCacheEnabled
              }
            },
            audit: {
              enabled: config.auditEnabled,
              detailLevel: config.auditDetailLevel,
              explainability: {
                enabled: config.explainabilityEnabled,
                expertReview: {
                  enabled: config.expertReviewEnabled,
                  thresholds: {
                    complexity: config.complexityThreshold,
                    confidence: 0.6, // Fixed valid value
                    impact: 0.8 // Fixed valid value
                  }
                }
              }
            },
            api: {
              authentication: {
                enabled: config.authenticationEnabled
              },
              rateLimit: {
                maxRequests: config.rateLimitMaxRequests
              },
              compression: {
                enabled: config.compressionEnabled
              }
            }
          };

          // Property 1: Valid configurations should be accepted
          expect(() => configManager.updateConfig(configUpdate)).not.toThrow();
          
          // Property 2: Configuration should be applied correctly
          const appliedConfig = configManager.getConfig();
          expect(appliedConfig.isre.multiLanguage.enabled).toBe(config.multiLanguageEnabled);
          expect(appliedConfig.isre.multiLanguage.consistencyThreshold).toBeCloseTo(config.consistencyThreshold, 5);
          expect(appliedConfig.urcm.contradictionSensitivity).toBeCloseTo(config.contradictionSensitivity, 5);
          expect(appliedConfig.performance.maxResponseTime).toBe(config.maxResponseTime);
          expect(appliedConfig.scaling.horizontal.minInstances).toBe(config.minInstances);
          expect(appliedConfig.cache.semantic.enabled).toBe(config.semanticCacheEnabled);
          expect(appliedConfig.audit.enabled).toBe(config.auditEnabled);
          
          // Property 3: Supported languages should be preserved
          expect(appliedConfig.isre.multiLanguage.supportedLanguages).toEqual(config.supportedLanguages);
          
          // Property 4: Scaling constraints should be maintained
          expect(appliedConfig.scaling.horizontal.maxInstances).toBeGreaterThanOrEqual(appliedConfig.scaling.horizontal.minInstances);
          
          // Property 5: Cache TTL should be reasonable
          if (config.semanticCacheEnabled) {
            expect(appliedConfig.cache.semantic.ttl).toBeGreaterThanOrEqual(1000);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invalid extended configuration parameters', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          invalidConsistencyThreshold: fc.float({ min: -1, max: Math.fround(-0.1), noNaN: true, noInfinity: true }).chain(val => fc.constant(val))
            .chain(() => fc.float({ min: Math.fround(1.1), max: 2, noNaN: true, noInfinity: true })),
          invalidMaxOscillations: fc.integer({ min: -10, max: 0 }),
          invalidMaxResponseTime: fc.integer({ min: 1, max: 99 }),
          invalidErrorRate: fc.float({ min: -1, max: Math.fround(-0.1), noNaN: true, noInfinity: true }).chain(val => fc.constant(val))
            .chain(() => fc.float({ min: Math.fround(1.1), max: 2, noNaN: true, noInfinity: true })),
          invalidMinInstances: fc.integer({ min: -5, max: 0 }),
          invalidCacheSize: fc.integer({ min: -100, max: 0 }),
          invalidCacheTtl: fc.integer({ min: 1, max: 999 }),
          invalidComplexityThreshold: fc.float({ min: -1, max: Math.fround(-0.1), noNaN: true, noInfinity: true }).chain(val => fc.constant(val))
            .chain(() => fc.float({ min: Math.fround(1.1), max: 2, noNaN: true, noInfinity: true })),
          invalidRateLimit: fc.integer({ min: -10, max: 0 }),
          emptySupportedLanguages: fc.constant([])
        }),
        (invalidConfig) => {
          const configManager = new ConfigManager();
          
          // Test invalid consistency threshold
          expect(() => configManager.updateConfig({
            isre: {
              multiLanguage: {
                consistencyThreshold: invalidConfig.invalidConsistencyThreshold
              }
            }
          })).toThrow(/consistencyThreshold/);
          
          // Test invalid max oscillations
          expect(() => configManager.updateConfig({
            urcm: {
              maxOscillations: invalidConfig.invalidMaxOscillations
            }
          })).toThrow(/maxOscillations/);
          
          // Test invalid max response time
          expect(() => configManager.updateConfig({
            performance: {
              maxResponseTime: invalidConfig.invalidMaxResponseTime
            }
          })).toThrow(/maxResponseTime/);
          
          // Test invalid error rate
          expect(() => configManager.updateConfig({
            performance: {
              maxErrorRate: invalidConfig.invalidErrorRate
            }
          })).toThrow(/maxErrorRate/);
          
          // Test invalid min instances
          expect(() => configManager.updateConfig({
            scaling: {
              horizontal: {
                minInstances: invalidConfig.invalidMinInstances
              }
            }
          })).toThrow(/minInstances/);
          
          // Test invalid cache size
          expect(() => configManager.updateConfig({
            cache: {
              semantic: {
                maxSize: invalidConfig.invalidCacheSize
              }
            }
          })).toThrow(/maxSize/);
          
          // Test invalid cache TTL
          expect(() => configManager.updateConfig({
            cache: {
              semantic: {
                ttl: invalidConfig.invalidCacheTtl
              }
            }
          })).toThrow(/ttl/);
          
          // Test invalid complexity threshold
          expect(() => configManager.updateConfig({
            audit: {
              explainability: {
                expertReview: {
                  thresholds: {
                    complexity: invalidConfig.invalidComplexityThreshold
                  }
                }
              }
            }
          })).toThrow(/complexity/);
          
          // Test invalid rate limit
          expect(() => configManager.updateConfig({
            api: {
              rateLimit: {
                maxRequests: invalidConfig.invalidRateLimit
              }
            }
          })).toThrow(/maxRequests/);
          
          // Test empty supported languages
          expect(() => configManager.updateConfig({
            isre: {
              multiLanguage: {
                supportedLanguages: invalidConfig.emptySupportedLanguages
              }
            }
          })).toThrow(/supportedLanguages/);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should maintain configuration consistency across feature interactions', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          cacheEnabled: fc.boolean(),
          performanceMonitoring: fc.boolean(),
          auditEnabled: fc.boolean(),
          scalingEnabled: fc.boolean(),
          multiLanguageEnabled: fc.boolean(),
          compressionOptimization: fc.boolean()
        }),
        (featureFlags) => {
          const configManager = new ConfigManager();
          
          const configUpdate = {
            cache: {
              semantic: { enabled: featureFlags.cacheEnabled },
              retrieval: { enabled: featureFlags.cacheEnabled }
            },
            performance: {
              monitoring: { enabled: featureFlags.performanceMonitoring }
            },
            audit: {
              enabled: featureFlags.auditEnabled
            },
            scaling: {
              horizontal: { enabled: featureFlags.scalingEnabled }
            },
            isre: {
              multiLanguage: { enabled: featureFlags.multiLanguageEnabled },
              compression: { optimizationEnabled: featureFlags.compressionOptimization }
            }
          };

          configManager.updateConfig(configUpdate);
          const appliedConfig = configManager.getConfig();

          // Property 1: Feature flags should be applied consistently
          expect(appliedConfig.cache.semantic.enabled).toBe(featureFlags.cacheEnabled);
          expect(appliedConfig.cache.retrieval.enabled).toBe(featureFlags.cacheEnabled);
          expect(appliedConfig.performance.monitoring.enabled).toBe(featureFlags.performanceMonitoring);
          expect(appliedConfig.audit.enabled).toBe(featureFlags.auditEnabled);
          expect(appliedConfig.scaling.horizontal.enabled).toBe(featureFlags.scalingEnabled);
          expect(appliedConfig.isre.multiLanguage.enabled).toBe(featureFlags.multiLanguageEnabled);
          expect(appliedConfig.isre.compression.optimizationEnabled).toBe(featureFlags.compressionOptimization);

          // Property 2: If caching is disabled, cache sizes should still be valid
          if (!featureFlags.cacheEnabled) {
            expect(appliedConfig.cache.semantic.maxSize).toBeGreaterThan(0);
            expect(appliedConfig.cache.retrieval.maxSize).toBeGreaterThan(0);
          }

          // Property 3: If scaling is enabled, instance counts should be valid
          if (featureFlags.scalingEnabled) {
            expect(appliedConfig.scaling.horizontal.maxInstances).toBeGreaterThanOrEqual(
              appliedConfig.scaling.horizontal.minInstances
            );
          }

          // Property 4: If audit is enabled, explainability should have valid thresholds
          if (featureFlags.auditEnabled) {
            expect(appliedConfig.audit.explainability.expertReview.thresholds.complexity).toBeGreaterThanOrEqual(0);
            expect(appliedConfig.audit.explainability.expertReview.thresholds.complexity).toBeLessThanOrEqual(1);
          }
        }
      ),
      { numRuns: 75 }
    );
  });

  it('should support hot-reload for non-critical configuration changes', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          // Hot-reloadable configurations
          logLevel: fc.constantFrom('debug', 'info', 'warn', 'error'),
          cacheSize: fc.integer({ min: 100, max: 5000 }),
          cacheTtl: fc.integer({ min: 10000, max: 600000 }),
          rateLimitRequests: fc.integer({ min: 10, max: 500 }),
          auditDetailLevel: fc.constantFrom('minimal', 'standard', 'comprehensive'),
          monitoringInterval: fc.integer({ min: 1000, max: 30000 }),
          consistencyThreshold: fc.float({ min: Math.fround(0.5), max: Math.fround(0.95), noNaN: true, noInfinity: true }),
          
          // Non-hot-reloadable (critical) configurations
          port: fc.integer({ min: 3000, max: 8000 }),
          dimensions: fc.integer({ min: 128, max: 1024 })
        }),
        (config) => {
          const configManager = new ConfigManager();
          let changeEventFired = false;
          
          configManager.on('change', () => {
            changeEventFired = true;
          });

          // Hot-reloadable changes should work without restart
          const hotReloadableUpdate = {
            logLevel: config.logLevel,
            cache: {
              semantic: {
                maxSize: config.cacheSize,
                ttl: config.cacheTtl
              }
            },
            api: {
              rateLimit: {
                maxRequests: config.rateLimitRequests
              }
            },
            audit: {
              detailLevel: config.auditDetailLevel
            },
            performance: {
              monitoring: {
                intervalMs: config.monitoringInterval
              }
            },
            isre: {
              multiLanguage: {
                consistencyThreshold: config.consistencyThreshold
              }
            }
          };

          expect(() => configManager.updateConfig(hotReloadableUpdate)).not.toThrow();
          expect(changeEventFired).toBe(true);

          const appliedConfig = configManager.getConfig();
          expect(appliedConfig.logLevel).toBe(config.logLevel);
          expect(appliedConfig.cache.semantic.maxSize).toBe(config.cacheSize);
          expect(appliedConfig.cache.semantic.ttl).toBe(config.cacheTtl);
          expect(appliedConfig.api.rateLimit.maxRequests).toBe(config.rateLimitRequests);
          expect(appliedConfig.audit.detailLevel).toBe(config.auditDetailLevel);
          expect(appliedConfig.performance.monitoring.intervalMs).toBe(config.monitoringInterval);
          expect(appliedConfig.isre.multiLanguage.consistencyThreshold).toBeCloseTo(config.consistencyThreshold, 5);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should validate domain-specific configuration rules', async () => {
    await fc.assert(
      fc.property(
        fc.record({
          domain: fc.constantFrom('medical', 'legal', 'financial', 'general'),
          qualityThreshold: fc.float({ min: Math.fround(0.5), max: Math.fround(0.99), noNaN: true, noInfinity: true }),
          auditRequired: fc.boolean(),
          expertReviewRequired: fc.boolean()
        }),
        (domainConfig) => {
          const configManager = new ConfigManager();
          
          // Domain-specific quality thresholds
          const domainQualityThresholds = {
            medical: 0.95,
            legal: 0.9,
            financial: 0.85,
            general: 0.7
          };

          const expectedThreshold = domainQualityThresholds[domainConfig.domain];
          
          const configUpdate = {
            isre: {
              compression: {
                minSemanticDensity: Math.max(domainConfig.qualityThreshold, expectedThreshold)
              }
            },
            audit: {
              enabled: domainConfig.auditRequired || ['medical', 'legal', 'financial'].includes(domainConfig.domain),
              explainability: {
                expertReview: {
                  enabled: domainConfig.expertReviewRequired || ['medical', 'legal'].includes(domainConfig.domain)
                }
              }
            },
            urcm: {
              contradictionSensitivity: ['medical', 'legal'].includes(domainConfig.domain) ? 0.9 : 0.8
            }
          };

          configManager.updateConfig(configUpdate);
          const appliedConfig = configManager.getConfig();

          // Property 1: Domain-specific quality thresholds should be enforced
          expect(appliedConfig.isre.compression.minSemanticDensity).toBeGreaterThanOrEqual(expectedThreshold);

          // Property 2: Critical domains should have audit enabled
          if (['medical', 'legal', 'financial'].includes(domainConfig.domain)) {
            expect(appliedConfig.audit.enabled).toBe(true);
          }

          // Property 3: High-risk domains should have expert review enabled
          if (['medical', 'legal'].includes(domainConfig.domain)) {
            expect(appliedConfig.audit.explainability.expertReview.enabled).toBe(true);
            expect(appliedConfig.urcm.contradictionSensitivity).toBe(0.9);
          }
        }
      ),
      { numRuns: 40 }
    );
  });
});