export interface ISREConfig {
  compression: {
    minSemanticDensity: number;
    maxTokens: number;
    enabled: boolean;
    optimizationEnabled: boolean;
    adaptiveCompression: boolean;
  };
  graph: {
    maxDepth: number;
    minEdgeWeight: number;
    maxNodes: number;
  };
  multiLanguage: {
    enabled: boolean;
    consistencyThreshold: number;
    autoCorrection: boolean;
    supportedLanguages: string[];
  };
}

export interface VectorStoreConfig {
  dimensions: number;
  similarityThreshold: number;
  batchSize: number;
  maxCandidates: number;
  caching: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
}

export interface URCMConfig {
  resonanceThreshold: number;
  contradictionSensitivity: number;
  maxOscillations: number;
  stabilizationFactor: number;
  semanticDetection: {
    enabled: boolean;
    patternMatching: boolean;
    domainSpecificRules: boolean;
  };
}

export interface RetrievalConfig {
  weights: {
    vectorSimilarity: number;
    intentAlignment: number;
  };
  maxResults: number;
  minScore: number;
  explainability: {
    enabled: boolean;
    detailLevel: 'basic' | 'detailed' | 'comprehensive';
    includeAlternatives: boolean;
  };
}

export interface PerformanceConfig {
  maxResponseTime: number;
  maxMemoryUsage: number;
  maxErrorRate: number;
  minThroughput: number;
  maxConcurrentRequests: number;
  monitoring: {
    enabled: boolean;
    intervalMs: number;
    metricsRetention: number;
  };
  optimization: {
    autoOptimization: boolean;
    recommendationThreshold: number;
    implementationDelay: number;
  };
}

export interface ScalingConfig {
  horizontal: {
    enabled: boolean;
    minInstances: number;
    maxInstances: number;
    scaleUpThreshold: number;
    scaleDownThreshold: number;
    cooldownPeriod: number;
  };
  circuitBreaker: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringWindow: number;
  };
  loadBalancing: {
    algorithm: 'round_robin' | 'least_connections' | 'weighted' | 'least_response_time';
    healthCheckInterval: number;
    failoverEnabled: boolean;
  };
}

export interface CacheConfig {
  semantic: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
    evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'random';
  };
  retrieval: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
    keyStrategy: 'query_hash' | 'intent_signature' | 'hybrid';
  };
  compression: {
    enabled: boolean;
    compressionLevel: number;
    algorithm: 'gzip' | 'lz4' | 'snappy';
  };
}

export interface AuditConfig {
  enabled: boolean;
  detailLevel: 'minimal' | 'standard' | 'comprehensive';
  retention: {
    days: number;
    maxRecords: number;
    compressionEnabled: boolean;
  };
  explainability: {
    enabled: boolean;
    autoGeneration: boolean;
    expertReview: {
      enabled: boolean;
      thresholds: {
        complexity: number;
        confidence: number;
        impact: number;
      };
    };
  };
}

export interface ApiConfig {
  port: number;
  host: string;
  corsOrigins: string[];
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  authentication: {
    enabled: boolean;
    type: 'jwt' | 'api_key' | 'oauth';
    secretKey?: string;
  };
  compression: {
    enabled: boolean;
    threshold: number;
    level: number;
  };
}

export interface SystemConfig {
  env: 'development' | 'production' | 'test';
  version: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  isre: ISREConfig;
  vectorStore: VectorStoreConfig;
  urcm: URCMConfig;
  retrieval: RetrievalConfig;
  performance: PerformanceConfig;
  scaling: ScalingConfig;
  cache: CacheConfig;
  audit: AuditConfig;
  api: ApiConfig;
}

export const DEFAULT_CONFIG: SystemConfig = {
  env: 'development',
  version: '1.0.0',
  logLevel: 'info',
  isre: {
    compression: {
      minSemanticDensity: 0.5,
      maxTokens: 512,
      enabled: true,
      optimizationEnabled: true,
      adaptiveCompression: true
    },
    graph: {
      maxDepth: 3,
      minEdgeWeight: 0.3,
      maxNodes: 100
    },
    multiLanguage: {
      enabled: true,
      consistencyThreshold: 0.8,
      autoCorrection: true,
      supportedLanguages: ['en', 'es', 'fr', 'de', 'zh', 'ja']
    }
  },
  vectorStore: {
    dimensions: 384,
    similarityThreshold: 0.75,
    batchSize: 100,
    maxCandidates: 1000,
    caching: {
      enabled: true,
      ttl: 300000, // 5 minutes
      maxSize: 1000
    }
  },
  urcm: {
    resonanceThreshold: 0.6,
    contradictionSensitivity: 0.8,
    maxOscillations: 10,
    stabilizationFactor: 0.95,
    semanticDetection: {
      enabled: true,
      patternMatching: true,
      domainSpecificRules: true
    }
  },
  retrieval: {
    weights: {
      vectorSimilarity: 0.3,
      intentAlignment: 0.7
    },
    maxResults: 20,
    minScore: 0.5,
    explainability: {
      enabled: true,
      detailLevel: 'detailed',
      includeAlternatives: true
    }
  },
  performance: {
    maxResponseTime: 1000,
    maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
    maxErrorRate: 0.05,
    minThroughput: 10,
    maxConcurrentRequests: 100,
    monitoring: {
      enabled: true,
      intervalMs: 5000,
      metricsRetention: 1000
    },
    optimization: {
      autoOptimization: false,
      recommendationThreshold: 0.7,
      implementationDelay: 300000 // 5 minutes
    }
  },
  scaling: {
    horizontal: {
      enabled: false,
      minInstances: 1,
      maxInstances: 10,
      scaleUpThreshold: 0.8,
      scaleDownThreshold: 0.3,
      cooldownPeriod: 300000 // 5 minutes
    },
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringWindow: 60000
    },
    loadBalancing: {
      algorithm: 'round_robin',
      healthCheckInterval: 30000,
      failoverEnabled: true
    }
  },
  cache: {
    semantic: {
      enabled: true,
      maxSize: 1000,
      ttl: 300000,
      evictionPolicy: 'lru'
    },
    retrieval: {
      enabled: true,
      maxSize: 500,
      ttl: 180000, // 3 minutes
      keyStrategy: 'hybrid'
    },
    compression: {
      enabled: true,
      compressionLevel: 6,
      algorithm: 'gzip'
    }
  },
  audit: {
    enabled: true,
    detailLevel: 'standard',
    retention: {
      days: 30,
      maxRecords: 10000,
      compressionEnabled: true
    },
    explainability: {
      enabled: true,
      autoGeneration: true,
      expertReview: {
        enabled: true,
        thresholds: {
          complexity: 0.7,
          confidence: 0.6,
          impact: 0.8
        }
      }
    }
  },
  api: {
    port: 3000,
    host: '0.0.0.0',
    corsOrigins: ['*'],
    rateLimit: {
      windowMs: 60000,
      maxRequests: 100
    },
    authentication: {
      enabled: false,
      type: 'jwt'
    },
    compression: {
      enabled: true,
      threshold: 1024,
      level: 6
    }
  }
};
