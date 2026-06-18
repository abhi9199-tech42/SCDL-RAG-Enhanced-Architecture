import * as crypto from 'crypto';
import { SemanticCompressor, SemanticPrimitive } from '../types';

export class TextSemanticCompressor implements SemanticCompressor {
  private semanticMap: Map<string, string>;

  constructor(customMap?: Map<string, string>) {
    this.semanticMap = customMap || new Map([
      ["apple", "fruit"],
      ["pomme", "fruit"],
      ["manzana", "fruit"],
      ["banana", "fruit"],
      ["orange", "fruit"],
      ["grape", "fruit"],
      ["fruit", "fruit"],
      ["vegetable", "plant"],
      ["meat", "protein"],
      ["fish", "protein"],
      ["run", "action_move_fast"],
      ["walk", "action_move_slow"],
      ["jump", "action_move_jump"],
      ["sit", "action_move_sit"],
      ["lie", "action_move_lie"],
      ["quickly", "attribute_fast"],
      ["fast", "attribute_fast"],
      ["slowly", "attribute_slow"],
      ["slow", "attribute_slow"],
      ["beautiful", "attribute_beautiful"],
      ["ugly", "attribute_ugly"],
      ["happy", "emotion_happy"],
      ["sad", "emotion_sad"],
      ["angry", "emotion_angry"],
      ["calm", "emotion_calm"],
    ]);
  }

  get modality(): string {
    return "text";
  }

  private generateId(concept: string): string {
    return crypto.createHash('sha256').update(concept).digest('hex').substring(0, 12);
  }

  async compress(rawInput: any): Promise<SemanticPrimitive[]> {
    if (typeof rawInput !== 'string') {
      throw new Error("TextSemanticCompressor requires string input");
    }

    // 1. Simple normalization
    const normalized = rawInput.toLowerCase().replace(/[.,!?]/g, '').trim();
    const words = normalized.split(/\s+/);
    
    const primitives: SemanticPrimitive[] = [];

    for (const word of words) {
      if (!word) continue;

      // 2. Map word to semantic concept
      let concept = this.semanticMap.get(word);

      // Simple fuzzy fallback
      if (!concept) {
        for (const [key, val] of this.semanticMap.entries()) {
          if (word.length > 3 && word.substring(0, 3) === key.substring(0, 3)) {
            concept = val;
            break;
          }
        }
      }

      // Emoji support
      const emojiMap: Record<string, string> = { "🍎": "fruit", "🏃": "action_move_fast" };
      if (Object.prototype.hasOwnProperty.call(emojiMap, word)) {
        concept = emojiMap[word];
      }

      if (!concept) {
        concept = word;
      }

      // 3. Create deterministic SemanticPrimitive
      primitives.push({
        id: `sem_${this.generateId(concept)}`,
        concept: concept,
        modality: this.modality,
        semanticWeight: 1.0,
        compressionMetadata: {}
      });
    }

    return primitives;
  }
}
