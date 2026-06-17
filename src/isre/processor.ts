import { 
  ISREProcessor, 
  RawContent, 
  SemanticRepresentation, 
  IntentGraph, 
  QueryIntent, 
  SemanticUnit,
  SourceReference 
} from '../types';
import { TextSemanticCompressor } from './compression/text';
import { IntentGraphBuilder } from './graph/builder';
import { SemanticCompressor } from './types';
import * as crypto from 'crypto';

export class ISREProcessorImpl implements ISREProcessor {
  private compressors: Map<string, SemanticCompressor>;
  private graphBuilder: IntentGraphBuilder;

  constructor() {
    this.compressors = new Map();
    this.graphBuilder = new IntentGraphBuilder();
    
    // Register default compressors
    this.registerCompressor(new TextSemanticCompressor());
  }

  registerCompressor(compressor: SemanticCompressor) {
    this.compressors.set(compressor.modality, compressor);
  }

  async compressSemantics(rawData: RawContent): Promise<SemanticRepresentation> {
    const modality = rawData.contentType === 'text' ? 'text' : rawData.contentType;
    const compressor = this.compressors.get(modality);

    if (!compressor) {
      throw new Error(`No compressor found for modality: ${modality}`);
    }

    const primitives = await compressor.compress(rawData.content);
    
    // Create semantic vector based on actual content analysis
    const semanticVector = this.generateSemanticVector(rawData.content, primitives);
    
    // Generate language agnostic hash
    const hash = crypto.createHash('sha256')
      .update(primitives.map(p => p.concept).sort().join('|'))
      .digest('hex');

    // Build intent graph with proper edges
    const intentGraph = await this.graphBuilder.buildFromPrimitives(primitives);

    return {
      id: rawData.id,
      semanticVector,
      intentNodes: intentGraph.nodes,
      intentGraph,
      sourceReferences: [{
        sourceId: rawData.id,
        location: 'root',
        metadata: rawData.metadata
      }],
      compressionRatio: 0.5, // Mock ratio
      languageAgnosticHash: hash
    };
  }

  private generateSemanticVector(content: string, primitives: any[]): number[] {
    // Generate semantic vector based on content analysis
    const vector = new Array(128).fill(0);
    
    // Use content characteristics to generate meaningful vectors
    const words = content.toLowerCase().split(/\s+/);
    const wordFreq = new Map<string, number>();
    
    // Calculate word frequencies
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    // Generate vector components based on:
    // 1. Content length (normalized)
    vector[0] = Math.min(content.length / 1000, 1.0);
    
    // 2. Vocabulary diversity
    vector[1] = wordFreq.size / words.length;
    
    // 3. Semantic primitives influence
    primitives.forEach((primitive, idx) => {
      if (idx < 126) { // Leave room for other features
        vector[idx + 2] = primitive.confidence || 0.5;
      }
    });
    
    // 4. Hash-based features for consistency
    const hash = crypto.createHash('md5').update(content).digest('hex');
    for (let i = 0; i < 32 && i < 94; i++) {
      vector[i + 32] = parseInt(hash[i], 16) / 15.0;
    }
    
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      return vector.map(val => val / magnitude);
    }
    
    return vector;
  }

  async constructIntentGraph(semantics: SemanticRepresentation): Promise<IntentGraph> {
    // Reconstruct primitives from intent nodes in representation if needed
    // For now, we assume the representation already has nodes that we can refine or just return
    // In a full implementation, this might merge multiple representations or refine the graph
    
    // Here we can re-run builder or return existing structure
    // Since compressSemantics already used the builder to make nodes, we can just wrap it
    // But typically this step might involve higher-level reasoning
    
    return {
      nodes: semantics.intentGraph?.nodes || [],
      edges: semantics.intentGraph?.edges || [],
      rootIntent: (semantics.intentGraph?.nodes && semantics.intentGraph.nodes.length > 0) ? semantics.intentGraph.nodes[0].id : '',
      confidenceScore: 0.9
    };
  }

  async analyzeQueryIntent(query: string): Promise<QueryIntent> {
    const rawContent: RawContent = {
      id: `query_${Date.now()}`,
      content: query,
      contentType: 'text'
    };

    const semantics = await this.compressSemantics(rawContent);
    const intentGraph = await this.constructIntentGraph(semantics);

    return {
      rawQuery: query,
      structuredIntent: intentGraph,
      primaryIntent: intentGraph.rootIntent,
      entities: {}, // Extract entities
      constraints: {} // Extract constraints
    };
  }

  traceToSource(semanticUnit: SemanticUnit): SourceReference[] {
    return semanticUnit.sourceReferences;
  }
}
