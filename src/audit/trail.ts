import { AuditTrail, DecisionRecord } from './types';
import { logger } from '../utils/logger';

export class InMemoryAuditTrail implements AuditTrail {
  private records: Map<string, DecisionRecord> = new Map();
  private entityIndex: Map<string, string[]> = new Map(); // entityId -> recordId[]

  async logDecision(data: Omit<DecisionRecord, 'id' | 'timestamp'>): Promise<string> {
    const id = `dec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const record: DecisionRecord = {
      ...data,
      id,
      timestamp: new Date().toISOString()
    };
    
    this.records.set(id, record);
    
    // Index entities
    this.extractAndIndexEntities(id, data.inputSummary);
    this.extractAndIndexEntities(id, data.outcome);
    if (data.evidence) {
        data.evidence.forEach(e => {
            if (e.sourceId) this.addToIndex(e.sourceId, id);
        });
    }

    // Also log to persistent logger
    logger.info('Decision Logged', { decisionId: id, type: data.type, component: data.component });

    return id;
  }

  async getDecision(id: string): Promise<DecisionRecord | null> {
    return this.records.get(id) || null;
  }

  async getTrace(entityId: string): Promise<DecisionRecord[]> {
    const ids = this.entityIndex.get(entityId) || [];
    return ids.map(id => this.records.get(id)!).filter(Boolean).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  async generateExplanation(decisionId: string): Promise<string> {
    const record = await this.getDecision(decisionId);
    if (!record) return "Decision not found.";

    let explanation = `Decision (${record.type}) by ${record.component} at ${record.timestamp}\n`;
    explanation += `Outcome: ${JSON.stringify(record.outcome)}\n`;
    explanation += `Reasoning: ${record.reasoning}\n`;
    if (record.evidence.length > 0) {
      explanation += `Key Factors:\n`;
      record.evidence.sort((a, b) => b.weight - a.weight).forEach(e => {
        explanation += `  - ${e.factor} (Weight: ${e.weight.toFixed(2)}): ${e.description}\n`;
      });
    }
    return explanation;
  }

  getDecisionsByEntity(entityId: string): DecisionRecord[] {
    const ids = this.entityIndex.get(entityId) || [];
    return ids.map(id => this.records.get(id)!).filter(Boolean).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  }

  private extractAndIndexEntities(recordId: string, obj: any) {
    if (!obj) return;
    
    // Check if obj itself has an id
    if (typeof obj === 'object' && obj !== null) {
      if ('id' in obj && typeof obj.id === 'string') {
        this.addToIndex(obj.id, recordId);
      }
      
      // If array, iterate
      if (Array.isArray(obj)) {
        obj.forEach(item => this.extractAndIndexEntities(recordId, item));
      } 
      // If object, recurse (shallow or deep? let's do shallow keys for now to avoid loops)
      else {
        // Simple recursion for nested objects usually found in our types (e.g. semantics)
        for (const key in obj) {
          if (typeof obj[key] === 'object') {
             // Limited recursion
             if (obj[key] && 'id' in obj[key]) {
                 this.extractAndIndexEntities(recordId, obj[key]);
             }
          }
        }
      }
    }
  }

  private addToIndex(entityId: string, recordId: string) {
    const list = this.entityIndex.get(entityId) || [];
    if (!list.includes(recordId)) {
      list.push(recordId);
      this.entityIndex.set(entityId, list);
    }
  }
}
