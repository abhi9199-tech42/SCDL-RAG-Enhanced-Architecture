import { describe, it, expect, beforeEach } from 'vitest';
import { ConfigManager } from '../../config/manager';
import { DEFAULT_CONFIG } from '../../config/types';

describe('Extended Configuration Management Unit Tests', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  describe('Multi-Language Configuration', () => {
    it('should validate multi-language consistency thresholds', () => {
      expect(() => configManager.updateConfig({
        isre: {
          multiLanguage: {
            consistencyThreshold: 0.85
          }
        }
      })).not.toThrow();

      const config = configManager.getConfig();
      expect(config.isre.multiLanguage.consistencyThreshold).toBe(0.85);
    });

    it('should reject invalid consistency thresholds', () => {
      expect(() => configManager.updateConfig({
        isre: {
          multiLanguage: {
            consistencyThreshold: -0.1
          }
        }
      })).toThrow(/consistencyThreshold/);

      expect(() => configManager.updateConfig({
        isre: {
          multiLanguage: {
            consistencyThreshold: 1.5
          }
        }
      })).toThrow(/consistencyThreshold/);
    });

    it('should validate supported languages list', () => {
      expect(() => configManager.updateConfig({
        isre: {
          multiLanguage: {
            supportedLanguages: ['en', 'es', 'fr']
          }
        }
      })).not.toThrow();

      expect(() => configManager.updateConfig({
        isre: {
          multiLanguage: {
            supportedLanguages: []
          }
        }
      })).toThrow(/supportedLanguages/);
    });

    it('should handle auto-correction settings', () => {
      configManager.updateConfig({
        isre: {
          multiLanguage: {
            autoCorrection: false
          }
        }
      });

      const config = configManager.getConfig();
      expect(config.isre.multiLanguage.autoCorrection).toBe(false);
    });
  });

  describe('Compression Optimization Configuration', () => {
    it('should enable/disable compression optimization', () => {
      configManager.updateConfig({
        isre: {
          compression: {
            optimizationEnabled: false,
            adaptiveCompression: false
          }
        }
      });

      const config = configManager.getConfig();
      expect(config.isre.compression.optimizationEnabled).toBe(false);
      expect(config.isre.compression.adaptiveCompression).toBe(false);
    });

    it('should maintain compression quality thresholds', () => {
      configManager.updateConfig({
        isre: {
          compression: {
            minSemanticDensity: 0.75
          }
        }
      });

      const config = configManager.getConfig();
      expect(config.isre.compression.minSemanticDensity).toBe(0.75);
    });
  });

  describe('URCM Semantic Detection Configuration', () => {
    it('should configure semantic detection features', () => {
      configManager.updateConfig({
        urcm: {
          semanticDetection: {
            enabled: true,
            patternMatching: false,
            domainSpecificRules: true
          }
        }
      });

      const config = configManager.getConfig();
      expect(config.urcm.semanticDetection.enabled).toBe(true);
      expect(config.urcm.semanticDetection.patternMatching).toBe(false);
      expect(config.urcm.semanticDetection.domainSpecificRules).toBe(true);
    });

    it('should validate contradiction sensitivity', () => {
      expect(() => configManager.updateConfig({
        urcm: {
          contradictionSensitivity: 0.9
        }
      })).not.toThrow();

      expect(() => configManager.updateConfig({
        urcm: {
          contradictionSensitivity: -0.1
        }
      })).toThrow(/contradictionSensitivity/);

      expect(() => configManager.updateConfig({
        urcm: {
          contradictionSensitivity: 1.5
        }
      })).toThrow(/contradictionSensitivity/);
    });

    it('should validate max oscillations', () => {
      expect(() => configManager.updateConfig({
        urcm: {
          maxOscillations: 50
        }
      })).not.toThrow();

      expect(() => configManager.updateConfig({
        urcm: {
          maxOscillations: 0
        }
      })).toThrow(/maxOscillations/);

      expect(() => configManager.updateConfig({
        urcm: {
          maxOscillations: -5
        }
      })).toThrow(/maxOscillations/);
    });
  });

  describe('Performance Monitoring Configuration', () => {
    it('should configure performance monitoring settings', () => {
      configManager.updateConfig({
        performance: {
          monitoring: {
            enabled: true,
            intervalMs: 10000,
            metricsRetention: 2000
          }
        }
      });

      const config = configManager.getConfig();
      expect(config.performance.monitoring.enabled).toBe(true);
      expect(config.performance.monitoring.intervalMs).toBe(10000);
      expect(config.performance.monitoring.metricsRetention).toBe(2000);
    });

    it('should validate performance thresholds', () => {
      expect(() => configManager.updateConfig({
        performance: {
          maxResponseTime: 2000,
          maxErrorRate: 0.1
        }
      })).not.toThrow();

      expect(() => configManager.updateConfig({
        performance: {
          maxResponseTime: 50
        }
      })).toThrow(/maxResponseTime/);

      expect(() => configManager.updateConfig({
        performance: {
          maxErrorRate: -0.1
        }
      })).toThrow(/maxErrorRate/);

      expect(() => configManager.updateConfig({
        performance: {
          maxErrorRate: 1.5
        }
      })).toThrow(/maxErrorRate/);
    });

    it('should configure optimization settings', () => {
      configManager.updateConfig({
        performance: {
          optimization: {
            autoOptimization: true,
            recommendationThreshold: 0.8,
            implementationDelay: 600000
          }
        }
      });

      const config = configManager.getConfig();
      expect(config.performance.optimization.autoOptimization).toBe(true);
      expect(config.performance.optimization.recommendationThreshold).toBe(0.8);
      expect(config.performance.optimization.implementationDelay).toBe(600000);
    });
  });

  describe('Scaling Configuration', () => {
    it('should configure horizontal scaling', () => {
      configManager.updateConfig({
        scaling: {
          horizontal: {
            enabled: true,
            minInstances: 2,
            maxInstances: 8,
            scaleUpThreshold: 0.75,
            scaleDownThreshold: 0.25
          }
        }
      });

      const config = configManager.getConfig();
      expect(config.scaling.horizontal.enabled).toBe(true);
      expect(config.scaling.horizontal.minInstances).toBe(2);
      expect(config.scaling.horizontal.maxInstances).toBe(8);
      expect(config.scaling.horizontal.scaleUpThreshold).toBe(0.75);
      expect(config.scaling.horizontal.scaleDownThreshold).toBe(0.25);
    });

    it('should validate scaling instance counts', () => {
      expect(() => configManager.updateConfig({
        scaling: {
          horizontal: {
            minInstances: 0
          }
        }
      })).toThrow(/minInstances/);

      expect(() => configManager.updateConfig({
        scaling: {
          horizontal: {
            minInstances: 5,
            maxInstances: 3
          }
        }
      })).toThrow(/maxInstances/);
    });

    it('should validate scaling thresholds', () => {
      expect(() => configManager.updateConfig({
        scaling: {
          horizontal: {
            scaleUpThreshold: -0.1
          }
        }
      })).toThrow(/scaleUpThreshold/);

      expect(() => configManager.updateConfig({
        scaling: {
          horizontal: {
            scaleUpThreshold: 1.5
          }
        }
      })).toThrow(/scaleUpThreshold/);
    });

    it('should configure circuit breaker settings', () => {
      configManager.updateConfig({
        scaling: {
          circuitBreaker: {
            enabled: true,
            failureThreshold: 10,
            recoveryTimeout: 60000,
            monitoringWindow: 120000
          }
        }
      });

      const config = configManager.getConfig();
      expect(config.scaling.circuitBreaker.enabled).toBe(true);
      expect(config.scaling.circuitBreaker.failureThreshold).toBe(10);
      expect(config.scaling.circuitBreaker.recoveryTimeout).toBe(60000);
      expect(config.scaling.circuitBreaker.monitoringWindow).toBe(120000);
    });

    it('should configure load balancing', () => {
      configManager.updateConfig({
        scaling: {
          loadBalancing: {
            algorithm: 'least_connections',
            healthCheckInterval: 15000,
            failoverEnabled: false
          }
        }
      });

      const config = configManager.getConfig();
      expect(config.scaling.loadBalancing.algorithm).toBe('least_connections');
      expect(config.scaling.loadBalancing.healthCheckInterval).toBe(15000);
      expect(config.scaling.loadBalancing.failoverEnabled).toBe(false);
    });
  });

  describe('Cache Configuration', () => {
    it('should configure semantic cache settings', () => {
      configManager.updateConfig({
        cache: {
          semantic: {
            enabled: true,
            maxSize: 2000,
            ttl: 600000,
            evictionPolicy: 'lfu'
          }
        }
      });

      const config = configManager.getConfig();
      expect(config.cache.semantic.enabled).toBe(true);
      expect(config.cache.semantic.maxSize).toBe(2000);
      expect(config.cache.semantic.ttl).toBe(600000);
      expect(config.cache.semantic.evictionPolicy).toBe('lfu');
    });

    it('should validate cache parameters', () => {
      expect(() => configManager.updateConfig({
        cache: {
          semantic: {
            maxSize: 0
          }
        }
      })).toThrow(/maxSize/);

      expect(() => configManager.updateConfig({
        cache: {
          semantic: {
            ttl: -500
          }
        }
      })).toThrow(/ttl/);
    });

    it('should configure retrieval cache settings', () => {
      configManager.updateConfig({
        cache: {
          retrieval: {
            enabled: false,
            maxSize: 200,
            ttl: 120000,
            keyStrategy: 'intent_signature'
          }
        }
      });

      const config = configManager.getConfig();
      expect(config.cache.retrieval.enabled).toBe(false);
      expect(config.cache.retrieval.maxSize).toBe(200);
      expect(config.cache.retrieval.ttl).toBe(120000);
      expect(config.cache.retrieval.keyStrategy).toBe('intent_signature');
    });

    it('should configure compression cache settings', () => {
      configManager.updateConfig({
        cache: {
          compression: {
            enabled: true,
            compressionLevel: 9,
            algorithm: 'lz4'
          }
        }
      });

      const config = configManager.getConfig();
      expect(config.cache.compression.enabled).toBe(true);
      expect(config.cache.compression.compressionLevel).toBe(9);
      expect(config.cache.compression.algorithm).toBe('lz4');
    });
  });

  describe('Audit Configuration', () => {
    it('should configure audit settings', () => {
      configManager.updateConfig({
        audit: {
          enabled: true,
          detailLevel: 'comprehensive',
          retention: {
            days: 90,
            maxRecords: 50000,
            compressionEnabled: true
          }
        }
      });

      const config = configManager.getConfig();
      expect(config.audit.enabled).toBe(true);
      expect(config.audit.detailLevel).toBe('comprehensive');
      expect(config.audit.retention.days).toBe(90);
      expect(config.audit.retention.maxRecords).toBe(50000);
      expect(config.audit.retention.compressionEnabled).toBe(true);
    });

    it('should validate audit retention settings', () => {
      expect(() => configManager.updateConfig({
        audit: {
          retention: {
            days: 0
          }
        }
      })).toThrow(/retention\.days/);

      expect(() => configManager.updateConfig({
        audit: {
          retention: {
            days: -5
          }
        }
      })).toThrow(/retention\.days/);
    });

    it('should configure explainability settings', () => {
      configManager.updateConfig({
        audit: {
          explainability: {
            enabled: true,
            autoGeneration: false,
            expertReview: {
              enabled: true,
              thresholds: {
                complexity: 0.8,
                confidence: 0.5,
                impact: 0.9
              }
            }
          }
        }
      });

      const config = configManager.getConfig();
      expect(config.audit.explainability.enabled).toBe(true);
      expect(config.audit.explainability.autoGeneration).toBe(false);
      expect(config.audit.explainability.expertReview.enabled).toBe(true);
      expect(config.audit.explainability.expertReview.thresholds.complexity).toBe(0.8);
      expect(config.audit.explainability.expertReview.thresholds.confidence).toBe(0.5);
      expect(config.audit.explainability.expertReview.thresholds.impact).toBe(0.9);
    });

    it('should validate expert review thresholds', () => {
      expect(() => configManager.updateConfig({
        audit: {
          explainability: {
            expertReview: {
              thresholds: {
                complexity: -0.1
              }
            }
          }
        }
      })).toThrow(/thresholds\.complexity/);

      expect(() => configManager.updateConfig({
        audit: {
          explainability: {
            expertReview: {
              thresholds: {
                complexity: 1.5
              }
            }
          }
        }
      })).toThrow(/thresholds\.complexity/);
    });
  });

  describe('API Configuration', () => {
    it('should configure authentication settings', () => {
      configManager.updateConfig({
        api: {
          authentication: {
            enabled: true,
            type: 'oauth',
            secretKey: 'test-secret-key'
          }
        }
      });

      const config = configManager.getConfig();
      expect(config.api.authentication.enabled).toBe(true);
      expect(config.api.authentication.type).toBe('oauth');
      expect(config.api.authentication.secretKey).toBe('test-secret-key');
    });

    it('should validate rate limiting settings', () => {
      expect(() => configManager.updateConfig({
        api: {
          rateLimit: {
            maxRequests: 200
          }
        }
      })).not.toThrow();

      expect(() => configManager.updateConfig({
        api: {
          rateLimit: {
            maxRequests: 0
          }
        }
      })).toThrow(/maxRequests/);

      expect(() => configManager.updateConfig({
        api: {
          rateLimit: {
            maxRequests: -10
          }
        }
      })).toThrow(/maxRequests/);
    });

    it('should configure compression settings', () => {
      configManager.updateConfig({
        api: {
          compression: {
            enabled: true,
            threshold: 2048,
            level: 9
          }
        }
      });

      const config = configManager.getConfig();
      expect(config.api.compression.enabled).toBe(true);
      expect(config.api.compression.threshold).toBe(2048);
      expect(config.api.compression.level).toBe(9);
    });
  });

  describe('Configuration Hot-Reload', () => {
    it('should emit change events on configuration updates', () => {
      let changeEventFired = false;
      let receivedConfig = null;

      configManager.on('change', (newConfig) => {
        changeEventFired = true;
        receivedConfig = newConfig;
      });

      configManager.updateConfig({
        logLevel: 'debug'
      });

      expect(changeEventFired).toBe(true);
      expect(receivedConfig).toBeDefined();
      expect((receivedConfig as any).logLevel).toBe('debug');
    });

    it('should support multiple configuration updates', () => {
      let changeCount = 0;

      configManager.on('change', () => {
        changeCount++;
      });

      configManager.updateConfig({ logLevel: 'debug' });
      configManager.updateConfig({ logLevel: 'info' });
      configManager.updateConfig({ logLevel: 'warn' });

      expect(changeCount).toBe(3);
    });

    it('should maintain configuration state across updates', () => {
      configManager.updateConfig({
        cache: {
          semantic: {
            enabled: true,
            maxSize: 1500
          }
        }
      });

      configManager.updateConfig({
        cache: {
          semantic: {
            ttl: 400000
          }
        }
      });

      const config = configManager.getConfig();
      expect(config.cache.semantic.enabled).toBe(true);
      expect(config.cache.semantic.maxSize).toBe(1500);
      expect(config.cache.semantic.ttl).toBe(400000);
    });
  });

  describe('Configuration Reset', () => {
    it('should reset to default configuration', () => {
      configManager.updateConfig({
        logLevel: 'debug',
        cache: {
          semantic: {
            maxSize: 5000
          }
        }
      });

      configManager.reset();

      const config = configManager.getConfig();
      expect(config.logLevel).toBe(DEFAULT_CONFIG.logLevel);
      expect(config.cache.semantic.maxSize).toBe(DEFAULT_CONFIG.cache.semantic.maxSize);
    });

    it('should emit change event on reset', () => {
      let changeEventFired = false;

      configManager.on('change', () => {
        changeEventFired = true;
      });

      configManager.reset();

      expect(changeEventFired).toBe(true);
    });
  });
});