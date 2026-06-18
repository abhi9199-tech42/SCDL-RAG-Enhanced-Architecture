import { describe, it, expect } from 'vitest';
import { generateId, generateDeterministicId } from '../../utils/id';
import { cosineSimilarity, vectorAdd, vectorScale, vectorNorm } from '../../utils/vector';

describe('Utils: generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should include prefix when provided', () => {
    const id = generateId('test');
    expect(id).toMatch(/^test_/);
  });

  it('should generate IDs without prefix', () => {
    const id = generateId();
    expect(id).toMatch(/^[a-z0-9]+_[a-f0-9]+_[a-z0-9]+$/);
  });

  it('should generate multiple unique IDs rapidly', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId('batch'));
    }
    expect(ids.size).toBe(100);
  });
});

describe('Utils: generateDeterministicId', () => {
  it('should return same ID for same input', () => {
    const id1 = generateDeterministicId('hello');
    const id2 = generateDeterministicId('hello');
    expect(id1).toBe(id2);
  });

  it('should return different IDs for different inputs', () => {
    const id1 = generateDeterministicId('hello');
    const id2 = generateDeterministicId('world');
    expect(id1).not.toBe(id2);
  });

  it('should return 16 character hex string', () => {
    const id = generateDeterministicId('test');
    expect(id).toMatch(/^[a-f0-9]{16}$/);
  });
});

describe('Utils: cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1.0);
  });

  it('should return 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0.0);
  });

  it('should return -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1.0);
  });

  it('should handle zero vectors', () => {
    expect(cosineSimilarity([0, 0], [1, 0])).toBe(0);
  });

  it('should handle different length vectors', () => {
    const result = cosineSimilarity([1, 2, 3], [4, 5]);
    expect(typeof result).toBe('number');
    expect(result).not.toBeNaN();
  });
});

describe('Utils: vectorAdd', () => {
  it('should add two vectors element-wise', () => {
    expect(vectorAdd([1, 2, 3], [4, 5, 6])).toEqual([5, 7, 9]);
  });

  it('should handle different length vectors', () => {
    expect(vectorAdd([1, 2], [3])).toEqual([4]);
  });

  it('should handle empty vectors', () => {
    expect(vectorAdd([], [])).toEqual([]);
  });
});

describe('Utils: vectorScale', () => {
  it('should scale vector by scalar', () => {
    expect(vectorScale([1, 2, 3], 2)).toEqual([2, 4, 6]);
  });

  it('should handle zero scalar', () => {
    expect(vectorScale([1, 2, 3], 0)).toEqual([0, 0, 0]);
  });

  it('should handle negative scalar', () => {
    expect(vectorScale([1, -2, 3], -1)).toEqual([-1, 2, -3]);
  });
});

describe('Utils: vectorNorm', () => {
  it('should compute L2 norm of vector', () => {
    expect(vectorNorm([3, 4])).toBe(5);
  });

  it('should return 0 for zero vector', () => {
    expect(vectorNorm([0, 0, 0])).toBe(0);
  });

  it('should return 1 for unit vector', () => {
    expect(vectorNorm([1, 0, 0])).toBe(1);
  });
});
