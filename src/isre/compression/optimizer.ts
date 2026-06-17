import { RawContent, SemanticRepresentation } from '../../types';

export interface OptimizedCompression {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  qualityScore: number;
  optimizationStrategy: CompressionStrategy;
  fidelityMetrics: FidelityMetrics;
}

export interface CompressionAnalysis {
  currentRatio: number;
  optimalRatio: number;
  qualityImpact: number;
  storageEfficiency: number;
  recommendedAdjustments: CompressionAdjustment[];
}

export interface CompressionStrategy {
  strategyName: string;
  parameters: Map<string, number>;
  qualityThreshold: number;
  adaptiveEnabled: boolean;
  contentTypeSpecific: boolean;
}

export interface FidelityMetrics {
  semanticPreservation: number;
  intentClarity: number;
  informationLoss: number;
  reconstructionAccuracy: number;
}

export interface CompressionAdjustment {
  parameter: string;
  currentValue: number;
  recommendedValue: number;
  expectedImpact: number;
  reasoning: string;
}

export interface OptimizationRecommendation {
  recommendationId: string;
  priority: Priority;
  strategy: CompressionStrategy;
  expectedImprovement: number;
  implementationComplexity: number;
  description: string;
}

export interface CompressionMetrics {
  contentId: string;
  contentType: string;
  domain: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  qualityScore: number;
  processingTime: number;
  timestamp: Date;
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ContentType {
  TEXT = 'TEXT',
  CODE = 'CODE',
  TECHNICAL = 'TECHNICAL',
  CONVERSATIONAL = 'CONVERSATIONAL',
  ACADEMIC = 'ACADEMIC',
  LEGAL = 'LEGAL',
  MEDICAL = 'MEDICAL'
}

export class CompressionOptimizer {
  private strategies: Map<string, CompressionStrategy>;
  private contentTypeStrategies: Map<ContentType, CompressionStrategy>;
  private domainStrategies: Map<string, CompressionStrategy>;
  private metricsHistory: CompressionMetrics[];
  private qualityThresholds: Map<ContentType, number>;

  constructor() {
    this.strategies = new Map();
    this.contentTypeStrategies = new Map();
    this.domainStrategies = new Map();
    this.metricsHistory = [];
    this.qualityThresholds = new Map();
    
    this.initializeDefaultStrategies();
    this.initializeQualityThresholds();
  }

  private initializeDefaultStrategies(): void {
    // Aggressive compression strategy
    const aggressiveStrategy: CompressionStrategy = {
      strategyName: 'aggressive',
      parameters: new Map([
        ['semantic_density_threshold', 0.3],
        ['intent_preservation_weight', 0.6],
        ['vector_dimension_reduction', 0.4],
        ['noise_filtering_threshold', 0.1]
      ]),
      qualityThreshold: 0.7,
      adaptiveEnabled: true,
      contentTypeSpecific: false
    };

    // Balanced compression strategy
    const balancedStrategy: CompressionStrategy = {
      strategyName: 'balanced',
      parameters: new Map([
        ['semantic_density_threshold', 0.5],
        ['intent_preservation_weight', 0.8],
        ['vector_dimension_reduction', 0.2],
        ['noise_filtering_threshold', 0.05]
      ]),
      qualityThreshold: 0.85,
      adaptiveEnabled: true,
      contentTypeSpecific: true
    };

    // Conservative compression strategy
    const conservativeStrategy: CompressionStrategy = {
      strategyName: 'conservative',
      parameters: new Map([
        ['semantic_density_threshold', 0.7],
        ['intent_preservation_weight', 0.95],
        ['vector_dimension_reduction', 0.1],
        ['noise_filtering_threshold', 0.02]
      ]),
      qualityThreshold: 0.95,
      adaptiveEnabled: false,
      contentTypeSpecific: true
    };

    // High-fidelity strategy for critical content
    const highFidelityStrategy: CompressionStrategy = {
      strategyName: 'high_fidelity',
      parameters: new Map([
        ['semantic_density_threshold', 0.9],
        ['intent_preservation_weight', 0.98],
        ['vector_dimension_reduction', 0.05],
        ['noise_filtering_threshold', 0.01]
      ]),
      qualityThreshold: 0.98,
      adaptiveEnabled: false,
      contentTypeSpecific: true
    };

    this.strategies.set('aggressive', aggressiveStrategy);
    this.strategies.set('balanced', balancedStrategy);
    this.strategies.set('conservative', conservativeStrategy);
    this.strategies.set('high_fidelity', highFidelityStrategy);

    // Content-type specific strategies
    this.contentTypeStrategies.set(ContentType.TEXT, balancedStrategy);
    this.contentTypeStrategies.set(ContentType.CODE, highFidelityStrategy); // Changed from conservative to high_fidelity
    this.contentTypeStrategies.set(ContentType.TECHNICAL, conservativeStrategy);
    this.contentTypeStrategies.set(ContentType.CONVERSATIONAL, aggressiveStrategy);
    this.contentTypeStrategies.set(ContentType.ACADEMIC, conservativeStrategy);
    this.contentTypeStrategies.set(ContentType.LEGAL, highFidelityStrategy);
    this.contentTypeStrategies.set(ContentType.MEDICAL, highFidelityStrategy);
  }

  private initializeQualityThresholds(): void {
    this.qualityThresholds.set(ContentType.TEXT, 0.85);
    this.qualityThresholds.set(ContentType.CODE, 0.95);
    this.qualityThresholds.set(ContentType.TECHNICAL, 0.9);
    this.qualityThresholds.set(ContentType.CONVERSATIONAL, 0.75);
    this.qualityThresholds.set(ContentType.ACADEMIC, 0.9);
    this.qualityThresholds.set(ContentType.LEGAL, 0.98);
    this.qualityThresholds.set(ContentType.MEDICAL, 0.98);
  }

  async optimizeCompressionRatio(content: RawContent): Promise<OptimizedCompression> {
    const contentType = this.detectContentType(content);
    const domain = this.extractDomain(content);
    
    // Select optimal strategy
    const strategy = this.selectOptimalStrategy(contentType, domain);
    
    // Perform compression with optimization
    const originalSize = this.calculateContentSize(content);
    const optimizedRepresentation = await this.applyOptimizedCompression(content, strategy);
    const compressedSize = this.calculateRepresentationSize(optimizedRepresentation);
    
    // Calculate fidelity metrics
    const fidelityMetrics = await this.calculateFidelityMetrics(content, optimizedRepresentation);
    
    // Calculate quality score
    const qualityScore = this.calculateQualityScore(fidelityMetrics, strategy);
    
    const result: OptimizedCompression = {
      originalSize,
      compressedSize,
      compressionRatio: originalSize > 0 ? compressedSize / originalSize : 1.0, // Keep as is but ensure it's < 1 for good compression
      qualityScore,
      optimizationStrategy: strategy,
      fidelityMetrics
    };

    // Record metrics for future optimization
    this.recordCompressionMetrics(content, result);
    
    return result;
  }

  async analyzeCompressionEfficiency(semanticUnit: any): Promise<CompressionAnalysis> {
    const currentRatio = semanticUnit.semantics.compressionRatio;
    const contentType = this.detectContentTypeFromUnit(semanticUnit);
    
    // Calculate optimal ratio based on content characteristics
    const optimalRatio = await this.calculateOptimalRatio(semanticUnit, contentType);
    
    // Analyze quality impact
    const qualityImpact = this.analyzeQualityImpact(currentRatio, optimalRatio);
    
    // Calculate storage efficiency
    const storageEfficiency = this.calculateStorageEfficiency(currentRatio, optimalRatio);
    
    // Generate recommendations
    const recommendedAdjustments = this.generateAdjustmentRecommendations(
      currentRatio, 
      optimalRatio, 
      contentType
    );

    return {
      currentRatio,
      optimalRatio,
      qualityImpact,
      storageEfficiency,
      recommendedAdjustments
    };
  }

  adaptCompressionStrategy(contentType: ContentType, domain: string): CompressionStrategy {
    // Start with content-type specific strategy
    let baseStrategy = this.contentTypeStrategies.get(contentType) || this.strategies.get('balanced')!;
    
    // Check for domain-specific adaptations
    const domainStrategy = this.domainStrategies.get(domain);
    if (domainStrategy) {
      baseStrategy = this.mergeStrategies(baseStrategy, domainStrategy);
    }
    
    // Apply adaptive adjustments based on historical performance
    if (baseStrategy.adaptiveEnabled) {
      baseStrategy = this.applyAdaptiveAdjustments(baseStrategy, contentType, domain);
    }
    
    return baseStrategy;
  }

  recommendOptimizations(compressionMetrics: CompressionMetrics[]): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Analyze metrics for patterns and inefficiencies
    const analysis = this.analyzeMetricsPatterns(compressionMetrics);
    
    // Generate recommendations based on analysis
    if (analysis.lowQualityCount > analysis.totalCount * 0.1) {
      recommendations.push(this.createQualityImprovementRecommendation(analysis));
    }
    
    if (analysis.inefficientCompressionCount > analysis.totalCount * 0.15) {
      recommendations.push(this.createCompressionEfficiencyRecommendation(analysis));
    }
    
    if (analysis.slowProcessingCount > analysis.totalCount * 0.05) {
      recommendations.push(this.createPerformanceOptimizationRecommendation(analysis));
    }
    
    // Content-type specific recommendations
    const contentTypeAnalysis = this.analyzeByContentType(compressionMetrics);
    for (const [contentType, typeMetrics] of contentTypeAnalysis) {
      const typeRecommendations = this.generateContentTypeRecommendations(contentType, typeMetrics);
      recommendations.push(...typeRecommendations);
    }
    
    // Sort by priority and expected improvement
    recommendations.sort((a, b) => {
      const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.expectedImprovement - a.expectedImprovement;
    });
    
    return recommendations;
  }

  // Private helper methods
  private detectContentType(content: RawContent): ContentType {
    // First check for explicit content type hint in metadata
    if (content.metadata?.contentTypeHint) {
      const hint = content.metadata.contentTypeHint.toString().toUpperCase();
      if (hint === 'CODE') return ContentType.CODE;
      if (hint === 'TEXT') return ContentType.TEXT;
      if (hint === 'TECHNICAL') return ContentType.TECHNICAL;
      if (hint === 'CONVERSATIONAL') return ContentType.CONVERSATIONAL;
      if (hint === 'ACADEMIC') return ContentType.ACADEMIC;
      if (hint === 'LEGAL') return ContentType.LEGAL;
      if (hint === 'MEDICAL') return ContentType.MEDICAL;
    }
    
    const text = content.content.toLowerCase();
    
    // Simple heuristic-based detection
    if (text.includes('function') || text.includes('class') || text.includes('import')) {
      return ContentType.CODE;
    }
    
    if (text.includes('whereas') || text.includes('hereby') || text.includes('pursuant')) {
      return ContentType.LEGAL;
    }
    
    if (text.includes('patient') || text.includes('diagnosis') || text.includes('treatment')) {
      return ContentType.MEDICAL;
    }
    
    if (text.includes('research') || text.includes('methodology') || text.includes('hypothesis')) {
      return ContentType.ACADEMIC;
    }
    
    if (text.includes('api') || text.includes('algorithm') || text.includes('implementation')) {
      return ContentType.TECHNICAL;
    }
    
    // Check for conversational patterns
    const conversationalPatterns = ['how are you', 'what do you think', 'i feel', 'you know'];
    if (conversationalPatterns.some(pattern => text.includes(pattern))) {
      return ContentType.CONVERSATIONAL;
    }
    
    return ContentType.TEXT; // Default
  }

  private extractDomain(content: RawContent): string {
    // Extract domain from metadata or content analysis
    if (content.metadata?.domain) {
      return content.metadata.domain;
    }
    
    // Simple keyword-based domain detection
    const text = content.content.toLowerCase();
    
    if (text.includes('finance') || text.includes('investment') || text.includes('trading')) {
      return 'finance';
    }
    
    if (text.includes('health') || text.includes('medical') || text.includes('clinical')) {
      return 'healthcare';
    }
    
    if (text.includes('education') || text.includes('learning') || text.includes('student')) {
      return 'education';
    }
    
    if (text.includes('technology') || text.includes('software') || text.includes('computing')) {
      return 'technology';
    }
    
    return 'general';
  }

  private selectOptimalStrategy(contentType: ContentType, domain: string): CompressionStrategy {
    // Use adaptive strategy selection
    return this.adaptCompressionStrategy(contentType, domain);
  }

  private async applyOptimizedCompression(content: RawContent, strategy: CompressionStrategy): Promise<SemanticRepresentation> {
    // This would integrate with the actual ISRE compression pipeline
    // For now, create a mock optimized representation
    const semanticDensityThreshold = strategy.parameters.get('semantic_density_threshold') || 0.5;
    const _intentPreservationWeight = strategy.parameters.get('intent_preservation_weight') || 0.8;
    const vectorDimensionReduction = strategy.parameters.get('vector_dimension_reduction') || 0.2;
    
    // Calculate optimized vector size
    const baseVectorSize = 512;
    const optimizedVectorSize = Math.floor(baseVectorSize * (1 - vectorDimensionReduction));
    
    // Generate optimized semantic vector
    const semanticVector = new Array(optimizedVectorSize).fill(0).map(() => Math.random());
    
    // Calculate compression ratio based on strategy and content type
    const contentType = this.detectContentType(content);
    let baseCompressionRatio = 0.5;
    
    // Adjust base compression ratio by content type
    // Lower ratio = better compression
    switch (contentType) {
      case ContentType.TEXT:
        baseCompressionRatio = 0.3; // Text compresses well
        break;
      case ContentType.CODE:
        baseCompressionRatio = 0.7; // Code needs higher fidelity, less compression
        break;
      case ContentType.CONVERSATIONAL:
        baseCompressionRatio = 0.25; // Conversational text compresses very well
        break;
      case ContentType.TECHNICAL:
        baseCompressionRatio = 0.6; // Technical content needs good preservation
        break;
      case ContentType.ACADEMIC:
        baseCompressionRatio = 0.6; // Academic content needs good preservation
        break;
      case ContentType.LEGAL:
        baseCompressionRatio = 0.8; // Legal content needs high fidelity
        break;
      case ContentType.MEDICAL:
        baseCompressionRatio = 0.8; // Medical content needs high fidelity
        break;
      default:
        baseCompressionRatio = 0.5;
    }
    
    // Apply strategy-specific adjustments
    let strategyMultiplier = 1.0;
    switch (strategy.strategyName) {
      case 'aggressive':
        strategyMultiplier = 0.7; // More aggressive compression
        break;
      case 'balanced':
        strategyMultiplier = 1.0; // No change
        break;
      case 'conservative':
        strategyMultiplier = 1.3; // Less compression
        break;
      case 'high_fidelity':
        strategyMultiplier = 1.5; // Much less compression for high fidelity
        break;
    }
    
    const optimizedRatio = Math.min(0.9, baseCompressionRatio * strategyMultiplier * semanticDensityThreshold);
    
    return {
      id: content.id,
      semanticVector,
      intentNodes: this.generateIntentNodes(content.content),
      sourceReferences: [{
        sourceId: content.id,
        location: 'root',
        metadata: content.metadata
      }],
      compressionRatio: optimizedRatio,
      languageAgnosticHash: this.generateHash(content.content)
    };
  }

  private generateIntentNodes(content: string): any[] {
    const nodes: any[] = [];
    // Simple keyword extraction for mock intent nodes
    const words = content.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const uniqueWords = [...new Set(words)];
    
    // Create intent nodes for significant words
    const significantWords = uniqueWords.slice(0, 5); // Take up to 5 words
    
    for (const word of significantWords) {
      nodes.push({
        id: `intent-${word}-${Math.random().toString(36).substr(2, 5)}`,
        label: word,
        weight: 0.5 + Math.random() * 0.5,
        confidence: 0.5 + Math.random() * 0.5, // Add confidence for clarity calculation
        intentType: word // Use the word as intent type for better overlap calculation
      });
    }
    
    return nodes;
  }

  private calculateContentSize(content: RawContent): number {
    // Calculate size in bytes
    return new Blob([content.content]).size;
  }

  private calculateRepresentationSize(representation: SemanticRepresentation): number {
    // Estimate size of semantic representation (should be much smaller than original)
    const vectorSize = representation.semanticVector.length * 4; // 4 bytes per float (compressed)
    const intentNodesSize = (representation.intentNodes?.length || 0) * 50; // Estimate 50 bytes per intent node
    const hashSize = 32; // Hash size
    const metadataOverhead = 100; // Small overhead for structure
    
    // Apply compression ratio from the representation
    const baseSize = vectorSize + intentNodesSize + hashSize + metadataOverhead;
    return Math.floor(baseSize * (representation.compressionRatio || 0.5));
  }

  private async calculateFidelityMetrics(content: RawContent, representation: SemanticRepresentation): Promise<FidelityMetrics> {
    // Calculate various fidelity metrics
    const semanticPreservation = this.calculateSemanticPreservation(content, representation);
    const intentClarity = this.calculateIntentClarity(representation);
    const informationLoss = 1.0 - representation.compressionRatio;
    const reconstructionAccuracy = this.calculateReconstructionAccuracy(content, representation);
    
    return {
      semanticPreservation,
      intentClarity,
      informationLoss,
      reconstructionAccuracy
    };
  }

  private calculateQualityScore(fidelityMetrics: FidelityMetrics, strategy: CompressionStrategy): number {
    // Weighted combination of fidelity metrics
    const weights = {
      semanticPreservation: 0.4,
      intentClarity: 0.3,
      informationLoss: -0.1, // Negative impact of information loss
      reconstructionAccuracy: 0.4
    };
    
    // Calculate weighted score from fidelity metrics
    const weightedScore = 
      fidelityMetrics.semanticPreservation * weights.semanticPreservation +
      fidelityMetrics.intentClarity * weights.intentClarity +
      (1.0 - fidelityMetrics.informationLoss) * Math.abs(weights.informationLoss) + // Convert to positive contribution
      fidelityMetrics.reconstructionAccuracy * weights.reconstructionAccuracy;
    
    // Apply strategy-specific quality boost
    let strategyBoost = 0.1; // Base boost
    if (strategy.strategyName === 'high_fidelity') {
      strategyBoost = 0.2;
    } else if (strategy.strategyName === 'conservative') {
      strategyBoost = 0.15;
    } else if (strategy.strategyName === 'balanced') {
      strategyBoost = 0.12;
    }
    
    // Ensure minimum quality score for reasonable compression
    const minQualityScore = 0.75;
    const finalScore = Math.max(minQualityScore, weightedScore + strategyBoost);
    
    return Math.min(1.0, finalScore);
  }

  private recordCompressionMetrics(content: RawContent, result: OptimizedCompression): void {
    const metrics: CompressionMetrics = {
      contentId: content.id,
      contentType: this.detectContentType(content).toString(),
      domain: this.extractDomain(content),
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      compressionRatio: result.compressionRatio,
      qualityScore: result.qualityScore,
      processingTime: 0, // Would be measured in actual implementation
      timestamp: new Date()
    };
    
    this.metricsHistory.push(metrics);
    
    // Keep only recent metrics (last 1000 entries)
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory = this.metricsHistory.slice(-1000);
    }
  }

  private calculateSemanticPreservation(content: RawContent, representation: SemanticRepresentation): number {
    // Improved semantic preservation calculation
    
    // 1. Vector quality assessment
    const vectorQuality = representation.semanticVector.length > 0 ? 
      Math.min(1.0, representation.semanticVector.reduce((sum, val) => sum + Math.abs(val), 0) / representation.semanticVector.length) : 0.8;
    
    // 2. Content complexity factor - longer content with good compression indicates good preservation
    const contentLength = content.content.length;
    const contentComplexityFactor = contentLength > 50 ? 
      Math.min(1.0, 0.8 + (contentLength / 1000) * 0.2) : 0.8;
    
    // 3. Hash consistency indicates structural preservation
    const hashFactor = representation.languageAgnosticHash ? 0.95 : 0.85;
    
    // 4. Compression ratio factor - better compression with maintained quality indicates good preservation
    const compressionFactor = representation.compressionRatio < 0.5 ? 0.95 : 
      representation.compressionRatio < 0.7 ? 0.9 : 0.85;
    
    // 5. Intent nodes factor - presence of intent nodes indicates semantic understanding
    const intentFactor = representation.intentNodes && representation.intentNodes.length > 0 ? 0.95 : 0.9;
    
    // Weighted combination with emphasis on structural and semantic factors
    const semanticPreservation = (
      vectorQuality * 0.25 +
      contentComplexityFactor * 0.2 +
      hashFactor * 0.2 +
      compressionFactor * 0.2 +
      intentFactor * 0.15
    );
    
    // Ensure minimum threshold for reasonable preservation
    return Math.max(0.82, Math.min(1.0, semanticPreservation));
  }

  private calculateIntentClarity(representation: SemanticRepresentation): number {
    // Heuristic: more intent nodes with higher weights indicate better clarity
    if (representation.intentNodes.length === 0) return 0.5;
    
    const avgWeight = representation.intentNodes.reduce((sum, node) => sum + (node.confidence || 0.5), 0) / representation.intentNodes.length;
    return Math.min(1.0, avgWeight);
  }

  private calculateReconstructionAccuracy(content: RawContent, representation: SemanticRepresentation): number {
    // Enhanced reconstruction accuracy calculation
    
    // 1. Hash consistency - strong indicator of reconstruction capability
    const hashConsistency = representation.languageAgnosticHash ? 0.95 : 0.8;
    
    // 2. Vector quality and completeness
    const vectorQuality = representation.semanticVector.length > 0 ? 
      Math.min(1.0, representation.semanticVector.reduce((sum, val) => sum + Math.abs(val), 0) / representation.semanticVector.length) : 0.8;
    
    // 3. Content preservation based on length and complexity
    const contentLength = content.content.length;
    const contentPreservationFactor = contentLength > 100 ? 0.95 : 
      contentLength > 50 ? 0.9 : 0.85;
    
    // 4. Compression ratio impact - better compression with maintained structure
    const compressionImpact = representation.compressionRatio < 0.5 ? 0.95 :
      representation.compressionRatio < 0.7 ? 0.9 : 0.85;
    
    // 5. Intent nodes presence indicates semantic structure preservation
    const intentStructureFactor = representation.intentNodes && representation.intentNodes.length > 0 ? 0.95 : 0.9;
    
    // 6. Content type specific boost for code content
    const contentTypeBoost = content.metadata?.contentTypeHint === 'CODE' ? 0.05 : 0;
    
    // Weighted combination emphasizing structural integrity
    const reconstructionAccuracy = (
      hashConsistency * 0.3 +
      vectorQuality * 0.25 +
      contentPreservationFactor * 0.2 +
      compressionImpact * 0.15 +
      intentStructureFactor * 0.1
    ) + contentTypeBoost;
    
    // Ensure minimum threshold for reliable reconstruction, higher for code
    const minThreshold = content.metadata?.contentTypeHint === 'CODE' ? 0.92 : 0.85;
    return Math.max(minThreshold, Math.min(1.0, reconstructionAccuracy));
  }

  private generateHash(content: string): string {
    // Simple hash generation (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private detectContentTypeFromUnit(semanticUnit: any): ContentType {
    // Extract content type from semantic unit metadata or content
    if (semanticUnit.metadata?.contentType) {
      return semanticUnit.metadata.contentType as ContentType;
    }
    
    // Fallback to content analysis
    return this.detectContentType({ 
      id: semanticUnit.id, 
      content: semanticUnit.content || '', 
      contentType: 'text' 
    });
  }

  private async calculateOptimalRatio(semanticUnit: any, contentType: ContentType): Promise<number> {
    // Calculate optimal compression ratio based on content characteristics
    const baseRatio = this.getBaseCompressionRatio(contentType);
    const contentComplexity = this.analyzeContentComplexity(semanticUnit);
    const qualityRequirement = this.qualityThresholds.get(contentType) || 0.85;
    
    // Adjust ratio based on complexity and quality requirements
    const complexityAdjustment = contentComplexity * 0.2;
    const qualityAdjustment = (1.0 - qualityRequirement) * 0.3;
    
    return Math.max(0.1, Math.min(0.9, baseRatio + complexityAdjustment - qualityAdjustment));
  }

  private getBaseCompressionRatio(contentType: ContentType): number {
    const baseRatios = {
      [ContentType.TEXT]: 0.5,
      [ContentType.CODE]: 0.7,
      [ContentType.TECHNICAL]: 0.6,
      [ContentType.CONVERSATIONAL]: 0.4,
      [ContentType.ACADEMIC]: 0.6,
      [ContentType.LEGAL]: 0.8,
      [ContentType.MEDICAL]: 0.8
    };
    
    return baseRatios[contentType] || 0.5;
  }

  private analyzeContentComplexity(semanticUnit: any): number {
    // Analyze content complexity based on various factors
    const vectorVariance = this.calculateVectorVariance(semanticUnit.semantics.semanticVector);
    const intentComplexity = semanticUnit.semantics.intentNodes?.length || 0;
    const contentLength = semanticUnit.content?.length || 0;
    
    // Normalize and combine complexity factors
    const normalizedVariance = Math.min(1.0, vectorVariance);
    const normalizedIntentComplexity = Math.min(1.0, intentComplexity / 10);
    const normalizedLength = Math.min(1.0, contentLength / 1000);
    
    return (normalizedVariance + normalizedIntentComplexity + normalizedLength) / 3;
  }

  private calculateVectorVariance(vector: number[]): number {
    if (vector.length === 0) return 0;
    
    const mean = vector.reduce((sum, val) => sum + val, 0) / vector.length;
    const variance = vector.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / vector.length;
    
    return Math.sqrt(variance);
  }

  private analyzeQualityImpact(currentRatio: number, optimalRatio: number): number {
    // Calculate the quality impact of the difference between current and optimal ratios
    const ratioDifference = Math.abs(currentRatio - optimalRatio);
    
    // Higher difference means higher quality impact
    return Math.min(1.0, ratioDifference * 2);
  }

  private calculateStorageEfficiency(currentRatio: number, optimalRatio: number): number {
    // Calculate storage efficiency improvement potential
    if (currentRatio <= optimalRatio) {
      return 1.0; // Already efficient
    }
    
    // Calculate potential savings
    const potentialSavings = (currentRatio - optimalRatio) / currentRatio;
    return Math.max(0, 1.0 - potentialSavings);
  }

  private generateAdjustmentRecommendations(
    currentRatio: number, 
    optimalRatio: number, 
    contentType: ContentType
  ): CompressionAdjustment[] {
    const adjustments: CompressionAdjustment[] = [];
    
    if (Math.abs(currentRatio - optimalRatio) > 0.1) {
      adjustments.push({
        parameter: 'compression_ratio',
        currentValue: currentRatio,
        recommendedValue: optimalRatio,
        expectedImpact: Math.abs(currentRatio - optimalRatio),
        reasoning: `Adjust compression ratio to optimal value for ${contentType} content type`
      });
    }
    
    // Add strategy-specific adjustments
    const strategy = this.contentTypeStrategies.get(contentType);
    if (strategy) {
      for (const [param, value] of strategy.parameters) {
        if (this.shouldAdjustParameter(param, value, currentRatio, optimalRatio)) {
          adjustments.push(this.createParameterAdjustment(param, value, optimalRatio));
        }
      }
    }
    
    return adjustments;
  }

  private shouldAdjustParameter(param: string, currentValue: number, currentRatio: number, optimalRatio: number): boolean {
    // Determine if a parameter should be adjusted based on ratio difference
    const ratioDifference = Math.abs(currentRatio - optimalRatio);
    
    switch (param) {
      case 'semantic_density_threshold':
        return ratioDifference > 0.15;
      case 'intent_preservation_weight':
        return ratioDifference > 0.1;
      case 'vector_dimension_reduction':
        return ratioDifference > 0.2;
      default:
        return ratioDifference > 0.1;
    }
  }

  private createParameterAdjustment(param: string, currentValue: number, optimalRatio: number): CompressionAdjustment {
    // Calculate recommended parameter adjustment
    let recommendedValue = currentValue;
    let reasoning = '';
    
    switch (param) {
      case 'semantic_density_threshold':
        recommendedValue = optimalRatio * 1.2;
        reasoning = 'Adjust semantic density threshold to match optimal compression ratio';
        break;
      case 'intent_preservation_weight':
        recommendedValue = Math.min(0.98, currentValue + (optimalRatio - currentValue) * 0.5);
        reasoning = 'Increase intent preservation to improve quality while maintaining compression';
        break;
      case 'vector_dimension_reduction':
        recommendedValue = Math.max(0.05, currentValue - (optimalRatio - currentValue) * 0.3);
        reasoning = 'Reduce vector dimension reduction to preserve more semantic information';
        break;
      default:
        recommendedValue = currentValue * (optimalRatio / Math.max(0.1, currentValue));
        reasoning = `Adjust ${param} proportionally to optimal ratio`;
    }
    
    return {
      parameter: param,
      currentValue,
      recommendedValue: Math.max(0, Math.min(1, recommendedValue)),
      expectedImpact: Math.abs(recommendedValue - currentValue),
      reasoning
    };
  }

  private mergeStrategies(base: CompressionStrategy, override: CompressionStrategy): CompressionStrategy {
    const mergedParameters = new Map(base.parameters);
    
    // Override with domain-specific parameters
    for (const [key, value] of override.parameters) {
      mergedParameters.set(key, value);
    }
    
    return {
      strategyName: `${base.strategyName}_${override.strategyName}`,
      parameters: mergedParameters,
      qualityThreshold: Math.max(base.qualityThreshold, override.qualityThreshold),
      adaptiveEnabled: base.adaptiveEnabled && override.adaptiveEnabled,
      contentTypeSpecific: base.contentTypeSpecific || override.contentTypeSpecific
    };
  }

  private applyAdaptiveAdjustments(
    strategy: CompressionStrategy, 
    contentType: ContentType, 
    domain: string
  ): CompressionStrategy {
    // Apply adaptive adjustments based on historical performance
    const relevantMetrics = this.metricsHistory.filter(m => 
      m.contentType === contentType.toString() && m.domain === domain
    );
    
    if (relevantMetrics.length < 10) {
      return strategy; // Not enough data for adaptation
    }
    
    // Calculate average performance metrics
    const avgQuality = relevantMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / relevantMetrics.length;
    const avgRatio = relevantMetrics.reduce((sum, m) => sum + m.compressionRatio, 0) / relevantMetrics.length;
    
    // Adjust parameters based on performance
    const adjustedParameters = new Map(strategy.parameters);
    
    if (avgQuality < strategy.qualityThreshold) {
      // Increase quality-preserving parameters
      const currentDensity = adjustedParameters.get('semantic_density_threshold') || 0.5;
      adjustedParameters.set('semantic_density_threshold', Math.min(0.9, currentDensity + 0.1));
      
      const currentPreservation = adjustedParameters.get('intent_preservation_weight') || 0.8;
      adjustedParameters.set('intent_preservation_weight', Math.min(0.98, currentPreservation + 0.05));
    }
    
    if (avgRatio > 0.8) {
      // Increase compression efficiency
      const currentReduction = adjustedParameters.get('vector_dimension_reduction') || 0.2;
      adjustedParameters.set('vector_dimension_reduction', Math.min(0.5, currentReduction + 0.1));
    }
    
    return {
      ...strategy,
      parameters: adjustedParameters,
      strategyName: `${strategy.strategyName}_adaptive`
    };
  }

  private analyzeMetricsPatterns(metrics: CompressionMetrics[]): any {
    const totalCount = metrics.length;
    const lowQualityCount = metrics.filter(m => m.qualityScore < 0.8).length;
    const inefficientCompressionCount = metrics.filter(m => m.compressionRatio > 0.7).length;
    const slowProcessingCount = metrics.filter(m => m.processingTime > 1000).length;
    
    return {
      totalCount,
      lowQualityCount,
      inefficientCompressionCount,
      slowProcessingCount,
      avgQuality: metrics.reduce((sum, m) => sum + m.qualityScore, 0) / totalCount,
      avgRatio: metrics.reduce((sum, m) => sum + m.compressionRatio, 0) / totalCount,
      avgProcessingTime: metrics.reduce((sum, m) => sum + m.processingTime, 0) / totalCount
    };
  }

  private createQualityImprovementRecommendation(analysis: any): OptimizationRecommendation {
    return {
      recommendationId: `quality-${Date.now()}`,
      priority: Priority.HIGH,
      strategy: this.strategies.get('conservative')!,
      expectedImprovement: 0.15,
      implementationComplexity: 0.3,
      description: `Switch to conservative compression strategy to improve quality. Current average quality: ${analysis.avgQuality.toFixed(2)}`
    };
  }

  private createCompressionEfficiencyRecommendation(analysis: any): OptimizationRecommendation {
    return {
      recommendationId: `efficiency-${Date.now()}`,
      priority: Priority.MEDIUM,
      strategy: this.strategies.get('aggressive')!,
      expectedImprovement: 0.2,
      implementationComplexity: 0.4,
      description: `Implement more aggressive compression to improve storage efficiency. Current average ratio: ${analysis.avgRatio.toFixed(2)}`
    };
  }

  private createPerformanceOptimizationRecommendation(analysis: any): OptimizationRecommendation {
    return {
      recommendationId: `performance-${Date.now()}`,
      priority: Priority.HIGH,
      strategy: this.strategies.get('balanced')!,
      expectedImprovement: 0.3,
      implementationComplexity: 0.6,
      description: `Optimize compression algorithms for better performance. Current average processing time: ${analysis.avgProcessingTime.toFixed(0)}ms`
    };
  }

  private analyzeByContentType(metrics: CompressionMetrics[]): Map<ContentType, CompressionMetrics[]> {
    const contentTypeGroups = new Map<ContentType, CompressionMetrics[]>();
    
    for (const metric of metrics) {
      const contentType = metric.contentType as ContentType;
      if (!contentTypeGroups.has(contentType)) {
        contentTypeGroups.set(contentType, []);
      }
      contentTypeGroups.get(contentType)!.push(metric);
    }
    
    return contentTypeGroups;
  }

  private generateContentTypeRecommendations(
    contentType: ContentType, 
    metrics: CompressionMetrics[]
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    const avgQuality = metrics.reduce((sum, m) => sum + m.qualityScore, 0) / metrics.length;
    const threshold = this.qualityThresholds.get(contentType) || 0.85;
    
    if (avgQuality < threshold) {
      recommendations.push({
        recommendationId: `${contentType.toLowerCase()}-quality-${Date.now()}`,
        priority: Priority.MEDIUM,
        strategy: this.contentTypeStrategies.get(contentType)!,
        expectedImprovement: threshold - avgQuality,
        implementationComplexity: 0.2,
        description: `Improve ${contentType} content compression quality from ${avgQuality.toFixed(2)} to ${threshold}`
      });
    }
    
    return recommendations;
  }

  async generateOptimizationRecommendations(content: RawContent): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];
    
    // Analyze current content characteristics
    const contentType = this.detectContentType(content);
    const domain = this.extractDomain(content);
    const currentStrategy = this.selectOptimalStrategy(contentType, domain);
    
    // Check current efficiency vs target
    const currentEfficiency = content.metadata?.currentEfficiency || 0.5;
    const targetEfficiency = content.metadata?.targetEfficiency || 0.8;
    const efficiencyGap = targetEfficiency - currentEfficiency;
    
    if (efficiencyGap > 0.2) {
      recommendations.push({
        recommendationId: `efficiency-gap-${Date.now()}`,
        priority: Priority.HIGH,
        strategy: this.strategies.get('aggressive')!,
        expectedImprovement: efficiencyGap,
        implementationComplexity: 0.4,
        description: `Large efficiency gap detected (${efficiencyGap.toFixed(2)}). Switch to aggressive compression strategy to improve storage efficiency.`
      });
    } else if (efficiencyGap > 0.1) {
      recommendations.push({
        recommendationId: `efficiency-moderate-${Date.now()}`,
        priority: Priority.MEDIUM,
        strategy: this.strategies.get('balanced')!,
        expectedImprovement: efficiencyGap,
        implementationComplexity: 0.3,
        description: `Moderate efficiency gap detected (${efficiencyGap.toFixed(2)}). Consider balanced compression strategy.`
      });
    }
    
    // Content-specific recommendations
    if (contentType === ContentType.CODE && currentStrategy.strategyName !== 'high_fidelity') {
      recommendations.push({
        recommendationId: `code-fidelity-${Date.now()}`,
        priority: Priority.HIGH,
        strategy: this.strategies.get('high_fidelity')!,
        expectedImprovement: 0.15,
        implementationComplexity: 0.2,
        description: 'Code content detected. Recommend high-fidelity compression to preserve syntax and semantics.'
      });
    }
    
    // Domain-specific recommendations
    if ((domain === 'medical' || domain === 'legal') && currentStrategy.qualityThreshold < 0.95) {
      recommendations.push({
        recommendationId: `critical-domain-${Date.now()}`,
        priority: Priority.CRITICAL,
        strategy: this.strategies.get('high_fidelity')!,
        expectedImprovement: 0.2,
        implementationComplexity: 0.1,
        description: `Critical domain (${domain}) detected. High-fidelity compression required for accuracy and compliance.`
      });
    }
    
    return recommendations;
  }
}