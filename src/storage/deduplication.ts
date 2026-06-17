import { SemanticUnit } from '../types';
import { VectorStore, DeduplicationEngine, DeduplicationResult } from './types';

export class SemanticDeduplicationEngine implements DeduplicationEngine {
  constructor(
    private vectorStore: VectorStore,
    private similarityThreshold: number = 0.95
  ) {}

  async checkDuplicate(unit: SemanticUnit): Promise<DeduplicationResult> {
    // 1. Check exact ID match first
    const existing = await this.vectorStore.get(unit.id);
    if (existing) {
      return {
        isDuplicate: true,
        originalId: existing.id,
        confidence: 1.0,
        reason: "Exact ID match"
      };
    }

    // 2. Semantic Similarity Search
    // We assume the vector store is populated. 
    // We search for nearest neighbors.
    if (unit.semantics.semanticVector && unit.semantics.semanticVector.length > 0) {
      const candidates = await this.vectorStore.search(unit.semantics.semanticVector, 1);
      
      if (candidates.length > 0) {
        const bestMatch = candidates[0];
        // Re-calculate similarity to be sure (store search usually returns sorted but we want exact score)
        // Ideally search returns score, but interface returns Unit[]. 
        // We can check equality or assume search logic is correct.
        // Let's manually verify score here or assume strict threshold in search.
        // Since our InMemoryStore search returns sorted by score, candidates[0] is best.
        // But we need the score. 
        // Let's calculate it again locally or update interface. 
        // For now, calculate locally.
        const score = this.calculateSimilarity(unit.semantics.semanticVector, bestMatch.semantics.semanticVector);

        if (score >= this.similarityThreshold) {
          return {
            isDuplicate: true,
            originalId: bestMatch.id,
            confidence: score,
            reason: `High semantic similarity (${score.toFixed(4)})`
          };
        }
      }
    }

    // 3. Hash Check (if languageAgnosticHash is reliable)
    // This requires a secondary index or scanning. 
    // For in-memory store, we can scan or just rely on vector search catching it (identical content -> identical vector).

    return {
      isDuplicate: false,
      confidence: 0,
      reason: "No match found"
    };
  }

  async merge(newUnit: SemanticUnit, existingUnit: SemanticUnit): Promise<SemanticUnit> {
    // Merging logic:
    // 1. Keep the existing ID
    // 2. Append source references from newUnit to existingUnit
    // 3. Update metadata (e.g. last seen)
    // 4. Maybe average the vectors if they are slightly different? (For now, keep existing)

    const mergedSources = [
      ...existingUnit.sourceReferences,
      ...newUnit.sourceReferences
    ];

    // Deduplicate sources by ID or location
    const uniqueSources = Array.from(new Map(mergedSources.map(s => [s.sourceId + s.location, s])).values());

    return {
      ...existingUnit,
      sourceReferences: uniqueSources,
      metadata: {
        ...existingUnit.metadata,
        ...newUnit.metadata,
        mergedAt: new Date().toISOString(),
        mergeCount: (existingUnit.metadata?.mergeCount || 0) + 1
      }
    };
  }

  private calculateSimilarity(v1: number[], v2: number[]): number {
    // Duplicated from store for now, could be in util
    const len = Math.min(v1.length, v2.length);
    let dot = 0, mag1 = 0, mag2 = 0;
    for (let i = 0; i < len; i++) {
      dot += v1[i] * v2[i];
      mag1 += v1[i] * v1[i];
      mag2 += v2[i] * v2[i];
    }
    return (Math.sqrt(mag1) * Math.sqrt(mag2)) ? dot / (Math.sqrt(mag1) * Math.sqrt(mag2)) : 0;
  }
}
