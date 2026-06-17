import { randomBytes } from 'crypto';

function secureRandom(): number {
  return randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF;
}

export class AttractorNetwork {
  private size: number;
  private couplingStrength: number;
  private phases: number[];
  private frequencies: number[];

  constructor(size: number, couplingStrength: number = 2.0) {
    this.size = size;
    this.couplingStrength = couplingStrength;
    this.phases = new Array(size).fill(0).map(() => secureRandom() * 2 * Math.PI);
    this.frequencies = new Array(size).fill(0).map(() => (secureRandom() - 0.5) * 0.2);
  }

  setPhases(phases: number[]) {
    if (phases.length !== this.size) {
      throw new Error(`Phase array size mismatch. Expected ${this.size}, got ${phases.length}`);
    }
    this.phases = phases.map(p => p % (2 * Math.PI));
  }

  getPhases(): number[] {
    return [...this.phases];
  }

  step(dt: number = 0.01): number[] {
    const newPhases = [...this.phases];
    const K_over_N = this.couplingStrength / this.size;

    for (let i = 0; i < this.size; i++) {
      let interaction = 0;
      for (let j = 0; j < this.size; j++) {
        interaction += Math.sin(this.phases[j] - this.phases[i]);
      }
      
      const dTheta = this.frequencies[i] + K_over_N * interaction;
      newPhases[i] += dTheta * dt;
      newPhases[i] %= (2 * Math.PI);
      if (newPhases[i] < 0) newPhases[i] += 2 * Math.PI;
    }

    this.phases = newPhases;
    return this.phases;
  }

  getOrderParameter(): number {
    // r = |(1/N) * Σ e^(i*θj)|
    let sumCos = 0;
    let sumSin = 0;
    
    for (const phase of this.phases) {
      sumCos += Math.cos(phase);
      sumSin += Math.sin(phase);
    }

    const meanCos = sumCos / this.size;
    const meanSin = sumSin / this.size;

    return Math.sqrt(meanCos * meanCos + meanSin * meanSin);
  }
}
