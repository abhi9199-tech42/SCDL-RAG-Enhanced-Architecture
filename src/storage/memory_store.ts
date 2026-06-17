import { SemanticUnit } from '../types';
import { VectorStore } from './types';

export class InMemoryVectorStore implements VectorStore {
  private units: Map<string, SemanticUnit> = new Map();

  async add(unit: SemanticUnit): Promise<string> {
    this.units.set(unit.id, unit);
    return unit.id;
  }

  async search(queryVector: number[], limit: number = 10): Promise<SemanticUnit[]> {
    const results: { unit: SemanticUnit; score: number }[] = [];

    for (const unit of this.units.values()) {
      if (!unit.semantics.semanticVector || unit.semantics.semanticVector.length === 0) {
        continue;
      }
      
      const score = this.cosineSimilarity(queryVector, unit.semantics.semanticVector);
      results.push({ unit, score });
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(r => r.unit);
  }

  async get(id: string): Promise<SemanticUnit | null> {
    return this.units.get(id) || null;
  }

  async delete(id: string): Promise<boolean> {
    return this.units.delete(id);
  }

  async count(): Promise<number> {
    return this.units.size;
  }
  
  async clear(): Promise<void> {
    this.units.clear();
  }

  private cosineSimilarity(v1: number[], v2: number[]): number {
    const len = Math.min(v1.length, v2.length);
    if (len === 0) return 0;
    
    let dot = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < len; i++) {
      dot += v1[i] * v2[i];
      mag1 += v1[i] * v1[i];
      mag2 += v2[i] * v2[i];
    }

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    return (mag1 && mag2) ? dot / (mag1 * mag2) : 0;
  }
}
