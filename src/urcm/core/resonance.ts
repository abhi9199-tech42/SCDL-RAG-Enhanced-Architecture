import { SemanticRepresentation } from '../../types';
import { ResonanceField } from '../types';

export class ResonanceEncoder {
  private inputDim: number;
  private resonanceDim: number;
  private W_in: number[][];
  private W_res: number[][];

  constructor(inputDim: number = 24, resonanceDim: number = 64) {
    this.inputDim = inputDim;
    this.resonanceDim = resonanceDim;
    this.W_in = this.randomMatrix(inputDim, resonanceDim);
    this.W_res = this.randomMatrix(resonanceDim, resonanceDim, 0.5); // Scaled for stability
  }

  private randomMatrix(rows: number, cols: number, scale: number = 1.0): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: number[] = [];
      for (let j = 0; j < cols; j++) {
        row.push((Math.random() * 2 - 1) * scale);
      }
      matrix.push(row);
    }
    return matrix;
  }

  // Simple vector addition
  private addVectors(v1: number[], v2: number[]): number[] {
    return v1.map((val, i) => val + (v2[i] || 0));
  }

  // Simple cosine similarity
  private cosineSimilarity(v1: number[], v2: number[]): number {
    const dot = v1.reduce((sum, val, i) => sum + val * v2[i], 0);
    const mag1 = Math.sqrt(v1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(v2.reduce((sum, val) => sum + val * val, 0));
    return mag1 && mag2 ? dot / (mag1 * mag2) : 0;
  }

  async calculateResonance(source: SemanticRepresentation, target: SemanticRepresentation): Promise<ResonanceField> {
    // Simulate resonance calculation based on semantic vectors
    // In a real system, we would project these through the reservoir (W_res)
    
    // Mocking the projection for now using the semantic vectors directly if available
    // or generating synthetic ones if not.
    const v1 = source.semanticVector || new Array(this.resonanceDim).fill(0).map(() => Math.random());
    const v2 = target.semanticVector || new Array(this.resonanceDim).fill(0).map(() => Math.random());

    // Align dimensions if needed (simple truncation or padding)
    const len = Math.min(v1.length, v2.length);
    const v1t = v1.slice(0, len);
    const v2t = v2.slice(0, len);

    const coherence = this.cosineSimilarity(v1t, v2t);
    
    // Calculate phase alignment (mocked based on coherence)
    // Higher coherence -> closer phase alignment (near 0)
    const phaseAlignment = (1 - coherence) * Math.PI;

    return {
      sourceId: source.id,
      targetId: target.id,
      coherence,
      intensity: (coherence + 1) / 2, // 0..1
      frequencyMatrix: [v1t, v2t], // Store the interacting vectors
      phaseAlignment
    };
  }
}
