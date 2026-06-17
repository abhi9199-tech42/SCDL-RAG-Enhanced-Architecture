import { SemanticUnit } from '../types';
import { VectorStore } from './types';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';

export class FileVectorStore implements VectorStore {
  private units: Map<string, SemanticUnit> = new Map();
  private filePath: string;
  private isDirty: boolean = false;
  private saveInterval: NodeJS.Timeout | null = null;

  constructor(storageDir: string = './data', fileName: string = 'vector_store.json') {
    // Ensure absolute path
    const absStorageDir = path.resolve(storageDir);
    
    if (!fs.existsSync(absStorageDir)) {
      fs.mkdirSync(absStorageDir, { recursive: true });
    }
    this.filePath = path.join(absStorageDir, fileName);
    this.load();
    
    // Auto-save every 5 seconds if dirty
    this.saveInterval = setInterval(() => {
      if (this.isDirty) {
        this.save();
      }
    }, 5000);
  }

  private load(): void {
    if (fs.existsSync(this.filePath)) {
      try {
        const data = fs.readFileSync(this.filePath, 'utf-8');
        const json = JSON.parse(data);
        if (Array.isArray(json)) {
          this.units = new Map(json.map((u: SemanticUnit) => [u.id, u]));
          logger.info(`Loaded ${this.units.size} semantic units from ${this.filePath}`);
        }
      } catch (error) {
        logger.error(`Failed to load vector store from ${this.filePath}:`, error);
        // Backup corrupted file
        if (fs.existsSync(this.filePath)) {
            fs.renameSync(this.filePath, `${this.filePath}.bak.${Date.now()}`);
        }
      }
    }
  }

  private save(): void {
    try {
      const data = JSON.stringify(Array.from(this.units.values()), null, 2);
      fs.writeFileSync(this.filePath, data, 'utf-8');
      this.isDirty = false;
      logger.debug(`Saved ${this.units.size} semantic units to ${this.filePath}`);
    } catch (error) {
      logger.error(`Failed to save vector store to ${this.filePath}:`, error);
    }
  }

  async add(unit: SemanticUnit): Promise<string> {
    this.units.set(unit.id, unit);
    this.isDirty = true;
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
    const deleted = this.units.delete(id);
    if (deleted) {
        this.isDirty = true;
    }
    return deleted;
  }

  async count(): Promise<number> {
    return this.units.size;
  }
  
  async clear(): Promise<void> {
    this.units.clear();
    this.isDirty = true;
    this.save(); // Immediate save on clear
  }

  async close(): Promise<void> {
      if (this.saveInterval) {
          clearInterval(this.saveInterval);
      }
      if (this.isDirty) {
          this.save();
      }
  }

  private cosineSimilarity(v1: number[], v2: number[]): number {
    if (v1.length !== v2.length) {
      const len = Math.min(v1.length, v2.length);
      if (len === 0) return 0;
    }
    
    const len = Math.min(v1.length, v2.length);
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
