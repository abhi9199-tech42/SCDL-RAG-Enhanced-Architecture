import { MeshNodeState, MeshSignal } from '../types';

export class MeshNode {
  public nodeId: string;
  private neighbors: MeshNode[] = [];
  private currentMu: number = 0;
  private previousMu: number = 0;
  private phase: number;
  private couplingStrength: number = 0.1;
  private active: boolean = true;

  constructor(nodeId: string) {
    this.nodeId = nodeId;
    this.phase = Math.random() * 2 * Math.PI;
  }

  connect(node: MeshNode): void {
    if (!this.neighbors.includes(node) && node !== this) {
      this.neighbors.push(node);
      // Reciprocal connection
      node.connect(this);
    }
  }

  updateLocalState(mu: number, phase?: number): void {
    this.previousMu = this.currentMu;
    this.currentMu = mu;
    if (phase !== undefined) {
      this.phase = phase % (2 * Math.PI);
    }
  }

  broadcastSignal(signalType: string = "sync"): number {
    if (!this.active) return 0;

    const deltaMu = this.currentMu - this.previousMu;
    const signal: MeshSignal = {
      senderId: this.nodeId,
      deltaMu,
      phaseAlignment: this.phase,
      timestamp: Date.now(),
      signalType
    };

    let sentCount = 0;
    for (const neighbor of this.neighbors) {
      try {
        neighbor.receiveSignal(signal);
        sentCount++;
      } catch (e) {
        // Log error
      }
    }
    return sentCount;
  }

  receiveSignal(signal: MeshSignal) {
    if (!this.active) return;

    // Simple Kuramoto-like update based on received signal
    // d_theta = K * sin(theta_neighbor - theta_self)
    const phaseDiff = signal.phaseAlignment - this.phase;
    const dTheta = this.couplingStrength * Math.sin(phaseDiff);
    
    this.phase += dTheta;
    this.phase %= (2 * Math.PI);
    
    // Update mu based on deltaMu (diffusion)
    this.currentMu += this.couplingStrength * signal.deltaMu;
  }

  getState(): MeshNodeState {
    return {
      nodeId: this.nodeId,
      currentMu: this.currentMu,
      previousMu: this.previousMu,
      phase: this.phase,
      couplingStrength: this.couplingStrength,
      neighbors: this.neighbors.map(n => n.nodeId)
    };
  }
}
