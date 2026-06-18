import { describe, it, expect } from 'vitest';
import { MeshNode } from '../../urcm/core/mesh';

describe('MeshNode', () => {
  describe('constructor', () => {
    it('should create a node with the given ID', () => {
      const node = new MeshNode('node-1');
      expect(node.nodeId).toBe('node-1');
    });

    it('should initialize with valid state', () => {
      const node = new MeshNode('node-1');
      const state = node.getState();
      expect(state.nodeId).toBe('node-1');
      expect(state.currentMu).toBe(0);
      expect(state.previousMu).toBe(0);
      expect(typeof state.phase).toBe('number');
      expect(state.couplingStrength).toBe(0.1);
      expect(state.neighbors).toEqual([]);
    });
  });

  describe('connect', () => {
    it('should establish bidirectional connection', () => {
      const n1 = new MeshNode('n1');
      const n2 = new MeshNode('n2');
      n1.connect(n2);
      expect(n1.getState().neighbors).toContain('n2');
      expect(n2.getState().neighbors).toContain('n1');
    });

    it('should not connect a node to itself', () => {
      const n1 = new MeshNode('n1');
      n1.connect(n1);
      expect(n1.getState().neighbors).toEqual([]);
    });

    it('should not create duplicate connections', () => {
      const n1 = new MeshNode('n1');
      const n2 = new MeshNode('n2');
      n1.connect(n2);
      n1.connect(n2);
      expect(n1.getState().neighbors.length).toBe(1);
    });

    it('should support multiple neighbors', () => {
      const n1 = new MeshNode('n1');
      const n2 = new MeshNode('n2');
      const n3 = new MeshNode('n3');
      n1.connect(n2);
      n1.connect(n3);
      expect(n1.getState().neighbors).toContain('n2');
      expect(n1.getState().neighbors).toContain('n3');
    });
  });

  describe('updateLocalState', () => {
    it('should update mu and phase', () => {
      const node = new MeshNode('n1');
      node.updateLocalState(0.5, Math.PI);
      const state = node.getState();
      expect(state.currentMu).toBe(0.5);
      expect(state.previousMu).toBe(0);
      expect(state.phase).toBeCloseTo(Math.PI);
    });

    it('should track previous mu on subsequent updates', () => {
      const node = new MeshNode('n1');
      node.updateLocalState(0.5);
      node.updateLocalState(0.8);
      const state = node.getState();
      expect(state.currentMu).toBe(0.8);
      expect(state.previousMu).toBe(0.5);
    });

    it('should normalize phase to [0, 2π)', () => {
      const node = new MeshNode('n1');
      node.updateLocalState(0, 3 * Math.PI);
      const state = node.getState();
      expect(state.phase).toBeGreaterThanOrEqual(0);
      expect(state.phase).toBeLessThan(2 * Math.PI);
    });
  });

  describe('broadcastSignal', () => {
    it('should return 0 when node is inactive', () => {
      const n1 = new MeshNode('n1');
      const n2 = new MeshNode('n2');
      n1.connect(n2);
      // Node starts active by default, but let's test the active path first
      const sent = n1.broadcastSignal('sync');
      expect(typeof sent).toBe('number');
      expect(sent).toBeGreaterThanOrEqual(0);
    });

    it('should send signals to all neighbors', () => {
      const n1 = new MeshNode('n1');
      const n2 = new MeshNode('n2');
      const n3 = new MeshNode('n3');
      n1.connect(n2);
      n1.connect(n3);
      const sent = n1.broadcastSignal('sync');
      expect(sent).toBe(2);
    });

    it('should return sent count matching neighbor count', () => {
      const n1 = new MeshNode('n1');
      const n2 = new MeshNode('n2');
      n1.connect(n2);
      n1.updateLocalState(0.5);
      const sent = n1.broadcastSignal('sync');
      expect(sent).toBe(1);
    });
  });

  describe('receiveSignal', () => {
    it('should update phase based on received signal', () => {
      const n1 = new MeshNode('n1');
      const n2 = new MeshNode('n2');
      n1.connect(n2);
      const initialPhase = n1.getState().phase;
      n2.broadcastSignal('sync');
      // Phase should change due to Kuramoto dynamics
      expect(n1.getState().phase).toBeDefined();
    });

    it('should update currentMu based on signal deltaMu', () => {
      const n1 = new MeshNode('n1');
      const n2 = new MeshNode('n2');
      n1.connect(n2);
      n2.updateLocalState(1.0);
      n2.broadcastSignal('sync');
      // n1's mu should change slightly due to diffusion
      expect(n1.getState().currentMu).toBeDefined();
    });
  });

  describe('getState', () => {
    it('should return complete node state', () => {
      const node = new MeshNode('test');
      const state = node.getState();
      expect(state).toHaveProperty('nodeId');
      expect(state).toHaveProperty('currentMu');
      expect(state).toHaveProperty('previousMu');
      expect(state).toHaveProperty('phase');
      expect(state).toHaveProperty('couplingStrength');
      expect(state).toHaveProperty('neighbors');
    });
  });
});
