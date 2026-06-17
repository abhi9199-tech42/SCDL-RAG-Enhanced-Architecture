import { RetrievalEngine, RetrievalResult, RetrievalOptions } from './types';
import { VectorStore } from '../storage/types';
import { ISREProcessor, IntentGraph } from '../types';

export class IntentAwareRetrievalEngine implements RetrievalEngine {
  constructor(
    private vectorStore: VectorStore,
    private isreProcessor: ISREProcessor
  ) {}

  async retrieve(query: string, intentGraph?: IntentGraph, options?: RetrievalOptions): Promise<RetrievalResult[]> {
    const limit = options?.limit || 10;
    
    // 1. Process Query Intent if not provided
    let queryIntent = intentGraph;
    let queryVector: number[] = [];

    if (!queryIntent) {
      // Assuming ISREProcessor has a way to get vector or graph from query
      // The interface analyzeQueryIntent returns QueryIntent which has structuredIntent
      const analysis = await this.isreProcessor.analyzeQueryIntent(query);
      queryIntent = analysis.structuredIntent;
      
      // Also need vector for initial retrieval. 
      // Assuming compressSemantics can take text/query too or we have a text encoder helper.
      // For now, let's assume compressSemantics works on raw content
      const semantics = await this.isreProcessor.compressSemantics({
        id: 'query-' + Date.now(),
        content: query,
        contentType: 'text'
      });
      queryVector = semantics.semanticVector;
    } else {
      // If intent graph provided, we still need vector. 
      // Ideally provided alongside, but here we might have to re-encode or assume it's passed.
      // For this implementation, let's re-encode query text if available or assume vector is needed.
      // But wait, the interface says `query: string`. So we can always encode `query`.
      const semantics = await this.isreProcessor.compressSemantics({
        id: 'query-' + Date.now(),
        content: query,
        contentType: 'text'
      });
      queryVector = semantics.semanticVector;
    }

    // 2. Vector Retrieval (Candidate Generation)
    // Get more candidates than limit to allow for re-ranking
    const candidates = await this.vectorStore.search(queryVector, limit * 3);

    // 3. Intent-Aware Re-ranking
    const results: RetrievalResult[] = candidates.map(candidate => {
      const vectorScore = this.calculateVectorSimilarity(queryVector, candidate.semantics.semanticVector);
      const intentScore = this.calculateIntentAlignment(queryIntent!, candidate.semantics.intentNodes || []);
      
      // Weighted Combination
      // Requirements say "prioritize semantic consistency over surface similarity"
      // So Intent Score should have high weight.
      const finalScore = (vectorScore * 0.3) + (intentScore * 0.7);

      return {
        unit: candidate,
        score: finalScore,
        explanation: `Vector Sim: ${vectorScore.toFixed(2)}, Intent Align: ${intentScore.toFixed(2)}`,
        metrics: {
          vectorSimilarity: vectorScore,
          intentAlignment: intentScore,
          structuralMatch: intentScore // simplified
        }
      };
    });

    // Sort by final score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, limit);
  }

  private calculateVectorSimilarity(v1: number[], v2: number[]): number {
    // Basic cosine similarity
    const len = Math.min(v1.length, v2.length);
    if (len === 0) return 0;
    let dot = 0, mag1 = 0, mag2 = 0;
    for (let i = 0; i < len; i++) {
      dot += v1[i] * v2[i];
      mag1 += v1[i] * v1[i];
      mag2 += v2[i] * v2[i];
    }
    return (Math.sqrt(mag1) * Math.sqrt(mag2)) ? dot / (Math.sqrt(mag1) * Math.sqrt(mag2)) : 0;
  }

  private calculateIntentAlignment(queryGraph: IntentGraph, candidateNodes: any[]): number {
    // Heuristic: Overlap of node labels / concepts
    // Real implementation would align graph structures (e.g. subgraph isomorphism or kernel match)
    
    if (!queryGraph.nodes.length || !candidateNodes.length) return 0;

    const queryConcepts = new Set(queryGraph.nodes.map(n => n.label.toLowerCase()));
    const candidateConcepts = new Set(candidateNodes.map(n => n.label.toLowerCase()));
    
    let matchCount = 0;
    for (const concept of queryConcepts) {
      if (candidateConcepts.has(concept)) {
        matchCount++;
      }
    }

    return matchCount / Math.max(queryConcepts.size, 1);
  }
}
