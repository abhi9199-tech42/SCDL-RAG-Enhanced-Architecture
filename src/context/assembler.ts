import { ContextAssembler, ContextAssemblyOptions, AssembledContext } from './types';
import { URCMProcessor, SemanticUnit } from '../types';
import { RetrievalResult } from '../retrieval/types';

export class ContextAssemblerImpl implements ContextAssembler {
  constructor(private urcmProcessor: URCMProcessor) {}

  async assemble(results: RetrievalResult[], options: ContextAssemblyOptions): Promise<AssembledContext> {
    const warnings: string[] = [];
    
    // 1. Sort candidates by score (descending)
    let candidates = results.sort((a, b) => b.score - a.score).map(r => r.unit);
    
    if (options.maxUnits && candidates.length > options.maxUnits) {
      candidates = candidates.slice(0, options.maxUnits);
    }

    const currentContext: SemanticUnit[] = [];
    let currentTokens = 0;
    
    // Helper for token estimation (approx 4 chars/token)
    const estimateTokens = (text: string) => Math.ceil((text || '').length / 4);

    for (const unit of candidates) {
      const unitTokens = estimateTokens(unit.content);
      
      // Check size limit
      if (currentTokens + unitTokens > options.maxTokens) {
        warnings.push(`Unit ${unit.id} skipped due to token limit.`);
        continue;
      }

      // Check coherence if prioritized
      if (options.prioritizeCoherence) {
        const tempContext = [...currentContext, unit];
        const coherence = await this.validateCoherence(tempContext);
        
        const threshold = options.coherenceThreshold || 0.5;
        if (coherence < threshold) {
          warnings.push(`Unit ${unit.id} skipped due to low coherence impact (${coherence.toFixed(2)} < ${threshold}).`);
          continue;
        }
      }

      currentContext.push(unit);
      currentTokens += unitTokens;
    }

    // Final coherence check
    const coherenceResult = await this.urcmProcessor.performOscillatoryReasoning(currentContext);
    
    // Format Content
    let content = "";
    if (options.format === 'json') {
      content = JSON.stringify(currentContext.map(u => ({ id: u.id, content: u.content })), null, 2);
    } else {
      content = currentContext.map(u => u.content).join('\n\n');
    }

    return {
      content,
      usedUnits: currentContext,
      coherenceScore: coherenceResult.coherenceScore,
      tokenCountEstimate: currentTokens,
      warnings
    };
  }

  async validateCoherence(units: SemanticUnit[]): Promise<number> {
    const result = await this.urcmProcessor.performOscillatoryReasoning(units);
    return result.coherenceScore;
  }
}
