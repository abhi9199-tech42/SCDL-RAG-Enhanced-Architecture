import { Contradiction, ResolutionStrategy } from '../types';

export interface ResonanceField {
  sourceId: string;
  targetId: string;
  coherence: number; // 0 to 1
  intensity: number;
  frequencyMatrix: number[][]; // Simplified representation
  phaseAlignment: number; // 0 to 2PI
}

export interface ResolutionPlan {
  contradictionId: string;
  action: 'merge' | 'split' | 'deprecate' | 'flag';
  confidence: number;
  reasoning: string;
}

export interface MeshSignal {
  senderId: string;
  deltaMu: number;
  phaseAlignment: number;
  timestamp: number;
  signalType: string;
}

export interface MeshNodeState {
  nodeId: string;
  currentMu: number;
  previousMu: number;
  phase: number;
  couplingStrength: number;
  neighbors: string[];
}

export type { Contradiction, ResolutionStrategy };
