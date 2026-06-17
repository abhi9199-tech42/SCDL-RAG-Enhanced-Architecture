import { SystemConfig, DEFAULT_CONFIG } from './types';
import { EventEmitter } from 'events';
import { z } from 'zod';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

const ConfigSchema = z.object({
  env: z.enum(['development', 'production', 'test']),
  version: z.string(),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
  isre: z.object({
    compression: z.object({
      minSemanticDensity: z.number().min(0).max(1),
      maxTokens: z.number().positive(),
      enabled: z.boolean(),
      optimizationEnabled: z.boolean(),
      adaptiveCompression: z.boolean()
    }),
    graph: z.object({
      maxDepth: z.number().min(1),
      minEdgeWeight: z.number().min(0).max(1),
      maxNodes: z.number().positive()
    }),
    multiLanguage: z.object({
      enabled: z.boolean(),
      consistencyThreshold: z.number().min(0).max(1),
      autoCorrection: z.boolean(),
      supportedLanguages: z.array(z.string()).min(1)
    })
  }),
  vectorStore: z.object({
    dimensions: z.number().positive(),
    similarityThreshold: z.number().min(0).max(1),
    batchSize: z.number().positive(),
    maxCandidates: z.number().positive(),
    caching: z.object({
      enabled: z.boolean(),
      ttl: z.number().positive(),
      maxSize: z.number().positive()
    })
  }),
  urcm: z.object({
    resonanceThreshold: z.number().min(0).max(1),
    contradictionSensitivity: z.number().min(0).max(1),
    maxOscillations: z.number().min(1),
    stabilizationFactor: z.number().min(0).max(1),
    semanticDetection: z.object({
      enabled: z.boolean(),
      patternMatching: z.boolean(),
      domainSpecificRules: z.boolean()
    })
  }),
  retrieval: z.object({
    weights: z.object({
      vectorSimilarity: z.number(),
      intentAlignment: z.number()
    }).refine(data => Math.abs(data.vectorSimilarity + data.intentAlignment - 1.0) <= 0.001, {
      message: "Vector similarity and intent alignment weights must sum to 1.0"
    }),
    maxResults: z.number().positive(),
    minScore: z.number().min(0).max(1),
    explainability: z.object({
      enabled: z.boolean(),
      detailLevel: z.enum(['basic', 'detailed', 'comprehensive']),
      includeAlternatives: z.boolean()
    })
  }),
  performance: z.object({
    maxResponseTime: z.number().min(100),
    maxMemoryUsage: z.number().positive(),
    maxErrorRate: z.number().min(0).max(1),
    minThroughput: z.number().nonnegative(),
    maxConcurrentRequests: z.number().positive(),
    monitoring: z.object({
      enabled: z.boolean(),
      intervalMs: z.number().positive(),
      metricsRetention: z.number().positive()
    }),
    optimization: z.object({
      autoOptimization: z.boolean(),
      recommendationThreshold: z.number().min(0).max(1),
      implementationDelay: z.number().nonnegative()
    })
  }),
  scaling: z.object({
    horizontal: z.object({
      enabled: z.boolean(),
      minInstances: z.number().min(1),
      maxInstances: z.number().positive(),
      scaleUpThreshold: z.number().min(0).max(1),
      scaleDownThreshold: z.number().min(0).max(1),
      cooldownPeriod: z.number().nonnegative()
    }).refine(data => data.minInstances <= data.maxInstances, {
      message: "minInstances cannot be greater than maxInstances",
      path: ["minInstances"]
    }),
    circuitBreaker: z.object({
      enabled: z.boolean(),
      failureThreshold: z.number().positive(),
      recoveryTimeout: z.number().positive(),
      monitoringWindow: z.number().positive()
    }),
    loadBalancing: z.object({
      algorithm: z.enum(['round_robin', 'least_connections', 'weighted', 'least_response_time']),
      healthCheckInterval: z.number().positive(),
      failoverEnabled: z.boolean()
    })
  }),
  cache: z.object({
    semantic: z.object({
      enabled: z.boolean(),
      maxSize: z.number().positive(),
      ttl: z.number().min(1000),
      evictionPolicy: z.enum(['lru', 'lfu', 'fifo', 'random'])
    }),
    retrieval: z.object({
      enabled: z.boolean(),
      maxSize: z.number().positive(),
      ttl: z.number().min(1000),
      keyStrategy: z.enum(['query_hash', 'intent_signature', 'hybrid'])
    }),
    compression: z.object({
      enabled: z.boolean(),
      compressionLevel: z.number().min(0).max(9),
      algorithm: z.enum(['gzip', 'lz4', 'snappy'])
    })
  }),
  audit: z.object({
    enabled: z.boolean(),
    detailLevel: z.enum(['minimal', 'standard', 'comprehensive']),
    retention: z.object({
      days: z.number().positive(),
      maxRecords: z.number().positive(),
      compressionEnabled: z.boolean()
    }),
    explainability: z.object({
      enabled: z.boolean(),
      autoGeneration: z.boolean(),
      expertReview: z.object({
        enabled: z.boolean(),
        thresholds: z.object({
          complexity: z.number().min(0).max(1),
          confidence: z.number().min(0).max(1),
          impact: z.number().min(0).max(1)
        })
      })
    })
  }),
  api: z.object({
    port: z.number().positive().max(65535),
    host: z.string(),
    corsOrigins: z.array(z.string()),
    rateLimit: z.object({
      windowMs: z.number().positive(),
      maxRequests: z.number().positive()
    }),
    authentication: z.object({
      enabled: z.boolean(),
      type: z.enum(['jwt', 'api_key', 'oauth']),
      secretKey: z.string().optional()
    }),
    compression: z.object({
      enabled: z.boolean(),
      threshold: z.number().nonnegative(),
      level: z.number().min(0).max(9)
    })
  })
});

function isObject(item: any): boolean {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

export class ConfigManager extends EventEmitter {
  private config: SystemConfig;

  constructor(initialConfig?: DeepPartial<SystemConfig>) {
    super();
    this.config = this.mergeConfig(DEFAULT_CONFIG, initialConfig || {});
    this.validate(this.config);
  }

  public getConfig(): SystemConfig {
    // Return a copy to prevent direct mutation
    return JSON.parse(JSON.stringify(this.config));
  }

  public updateConfig(updates: DeepPartial<SystemConfig>): void {
    const newConfig = this.mergeConfig(this.config, updates);
    this.validate(newConfig);
    this.config = newConfig;
    this.emit('change', this.getConfig());
  }

  public reset(): void {
    this.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    this.emit('change', this.getConfig());
  }

  private mergeConfig(target: any, source: any): any {
    const output = { ...target };
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.mergeConfig(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  private validate(config: SystemConfig): void {
    try {
      ConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const issue = error.issues[0];
        const path = issue.path.join('.');
        
        // Backwards compatibility for error messages expected by tests
        if (path.includes('minSemanticDensity')) throw new Error('Invalid minSemanticDensity: must be between 0 and 1');
        if (path.includes('maxDepth')) throw new Error('Invalid maxDepth: must be at least 1');
        if (path.includes('consistencyThreshold')) throw new Error('Invalid consistencyThreshold: must be between 0 and 1');
        if (path.includes('supportedLanguages')) throw new Error('Invalid supportedLanguages: must have at least one language');
        if (path.includes('vectorStore.dimensions')) throw new Error('Invalid dimensions: must be positive');
        if (path.includes('similarityThreshold')) throw new Error('Invalid similarityThreshold: must be between 0 and 1');
        if (path.includes('resonanceThreshold')) throw new Error('Invalid resonanceThreshold: must be between 0 and 1');
        if (path.includes('contradictionSensitivity')) throw new Error('Invalid contradictionSensitivity: must be between 0 and 1');
        if (path.includes('maxOscillations')) throw new Error('Invalid maxOscillations: must be at least 1');
        if (path.includes('weights')) throw new Error('Invalid weights: vectorSimilarity + intentAlignment must equal 1');
        if (path.includes('maxResponseTime')) throw new Error('Invalid maxResponseTime: must be at least 100ms');

        throw new Error(`Validation Error: ${issue.message} at ${path}`);
      }
      throw error;
    }
  }
}

export const configManager = new ConfigManager();
