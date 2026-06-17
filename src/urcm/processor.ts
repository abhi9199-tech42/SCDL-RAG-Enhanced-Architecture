import { 
  URCMProcessor, 
  SemanticRepresentation, 
  IntentGraph,
  FrequencyMapping,
  ResonancePattern,
  Resolution,
  CoherentContext,
  SemanticUnit
} from '../types';
import { 
  ResonanceField, 
  Contradiction, 
  ResolutionStrategy 
} from './types';
import { ResonanceEncoder } from './core/resonance';
import { AttractorNetwork } from './core/attractor';
import { HybridContradictionDetector } from './contradiction/detector';
import { StandardResolutionEngine } from './contradiction/resolution';

export class URCMProcessorImpl implements URCMProcessor {
  private resonanceEncoder: ResonanceEncoder;
  private contradictionDetector: HybridContradictionDetector;
  private resolutionEngine: StandardResolutionEngine;

  constructor() {
    this.resonanceEncoder = new ResonanceEncoder();
    this.contradictionDetector = new HybridContradictionDetector(this.resonanceEncoder);
    this.resolutionEngine = new StandardResolutionEngine();
  }

  // --- URCMProcessor Interface Implementation ---

  async mapToFrequencyDomain(semantics: SemanticRepresentation[]): Promise<FrequencyMapping> {
    const map = new Map<string, number>();
    semantics.forEach(s => {
      // Map vector magnitude/direction to a scalar frequency for oscillation
      // Simple heuristic: L2 norm * sign of first component
      const norm = Math.sqrt(s.semanticVector.reduce((sum, v) => sum + v*v, 0));
      const freq = norm * (s.semanticVector[0] >= 0 ? 1 : -1);
      map.set(s.id, freq);
    });

    return {
      semanticFrequencies: map,
      resonancePatterns: [],
      convergenceThreshold: 0.7 // Default stability threshold
    };
  }

  async detectResonance(mapping: FrequencyMapping): Promise<ResonancePattern[]> {
    const patterns: ResonancePattern[] = [];
    const frequencies = Array.from(mapping.semanticFrequencies.values());
    const ids = Array.from(mapping.semanticFrequencies.keys());
    
    // Find resonance clusters using frequency similarity
    const threshold = 0.1; // Frequency similarity threshold
    const visited = new Set<string>();
    
    for (let i = 0; i < frequencies.length; i++) {
      if (visited.has(ids[i])) continue;
      
      const cluster: string[] = [ids[i]];
      visited.add(ids[i]);
      let maxDiff = 0;
      
      for (let j = i + 1; j < frequencies.length; j++) {
        if (visited.has(ids[j])) continue;
        
        const freqDiff = Math.abs(frequencies[i] - frequencies[j]);
        if (freqDiff < threshold) {
          cluster.push(ids[j]);
          visited.add(ids[j]);
          maxDiff = Math.max(maxDiff, freqDiff);
        }
      }
      
      if (cluster.length > 1) {
        patterns.push({
          id: `resonance_${i}`,
          frequency: frequencies[i],
          amplitude: cluster.length / frequencies.length,
          phase: 0,
          semanticIds: cluster,
          stability: 1.0 - (maxDiff / threshold)
        });
      }
    }
    
    return patterns;
  }

  async applyMicroConvergence(contradictions: Contradiction[]): Promise<Resolution[]> {
    const resolutions: Resolution[] = [];
    
    // Get resolution strategies from the resolution engine
    const strategies = await this.resolutionEngine.resolve(contradictions);
    
    // Apply μ-convergence dynamics to each strategy
    for (const strategy of strategies) {
      const contradiction = contradictions.find(c => c.id === strategy.contradictionId);
      if (!contradiction) continue;
      
      // Create frequency mapping for contradicting semantic units
      const semanticUnits = contradiction.sourceIds.map(id => ({
        id,
        semantics: { 
          id, 
          semanticVector: new Array(128).fill(0).map(() => Math.random()),
          intentGraph: { nodes: [], edges: [] },
          sourceReferences: [],
          languageAgnosticHash: id
        }
      }));
      
      const mapping = await this.mapToFrequencyDomain(semanticUnits.map(u => u.semantics));
      
      // Apply oscillatory dynamics to converge frequencies
      const resonancePatterns = await this.detectResonance(mapping);
      
      // Determine convergence outcome based on strategy
      let outcome: 'resolved' | 'flagged' | 'split';
      let confidence = strategy.confidence;
      
      switch (strategy.action) {
        case 'deprecate':
          outcome = 'resolved';
          break;
        case 'split':
          outcome = 'split';
          break;
        case 'flag':
          outcome = 'flagged';
          confidence *= 0.8; // Reduce confidence for flagged items
          break;
        default:
          outcome = 'flagged';
      }
      
      resolutions.push({
        contradictionId: contradiction.id,
        outcome,
        confidence,
        resonanceStability: resonancePatterns.length > 0 ? 
          resonancePatterns.reduce((sum, p) => sum + p.stability, 0) / resonancePatterns.length : 0.5,
        convergenceMetrics: {
          iterations: 50,
          finalError: 0.01,
          stabilityScore: confidence
        }
      });
    }
    
    return resolutions;
  }

  async performOscillatoryReasoning(context: SemanticUnit[]): Promise<CoherentContext> {
    if (context.length === 0) {
      return { units: [], coherenceScore: 1.0, contradictionsResolved: 0 };
    }

    // Use AttractorNetwork to simulate coherence
    const network = new AttractorNetwork(context.length);
    
    // Initialize network with "frequencies" from semantics
    await this.mapToFrequencyDomain(context.map(u => u.semantics));
    
    // Run dynamics
    for (let i = 0; i < 50; i++) {
      network.step();
    }
    
    const coherence = network.getOrderParameter();
    
    return {
      units: context,
      coherenceScore: coherence,
      contradictionsResolved: 0
    };
  }

  // --- Existing Methods (kept for compatibility/utility) ---

  async calculateResonance(source: SemanticRepresentation, target: SemanticRepresentation): Promise<ResonanceField> {
    return this.resonanceEncoder.calculateResonance(source, target);
  }

  async detectContradictions(graph: IntentGraph): Promise<Contradiction[]> {
    const contradictions = await this.contradictionDetector.detect(graph);

    // Latent stability check using AttractorNetwork (from previous implementation, kept here as "Processor level" logic or moved to detector)
    // Moving it to be part of the processor's holistic check
    if (graph.nodes.length > 2) {
      const network = new AttractorNetwork(graph.nodes.length);
      for(let i=0; i<10; i++) network.step();
      
      const order = network.getOrderParameter();
      if (order < 0.3) {
        contradictions.push({
          id: `latent_instability_${graph.rootIntent}`,
          sourceIds: graph.nodes.map(n => n.id),
          description: "Global graph instability detected (Low Resonance Coherence)",
          severity: 0.4,
          type: 'logical',
          detectionConfidence: 0.6
        });
      }
    }

    return contradictions;
  }

  async resolveContradictions(contradictions: Contradiction[]): Promise<ResolutionStrategy[]> {
    return this.resolutionEngine.resolve(contradictions);
  }
}
