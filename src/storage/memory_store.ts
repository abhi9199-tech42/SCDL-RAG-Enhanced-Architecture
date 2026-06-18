import { SemanticUnit } from '../types';
import { VectorStore } from './types';
import { cosineSimilarity } from '../utils/vector';

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
      
      const score = cosineSimilarity(queryVector, unit.semantics.semanticVector);
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


}
