export function cosineSimilarity(v1: number[], v2: number[]): number {
  const len = Math.min(v1.length, v2.length);
  if (len === 0) return 0;

  let dot = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < len; i++) {
    dot += v1[i] * v2[i];
    mag1 += v1[i] * v1[i];
    mag2 += v2[i] * v2[i];
  }

  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);

  return (mag1 && mag2) ? dot / (mag1 * mag2) : 0;
}

export function vectorAdd(v1: number[], v2: number[]): number[] {
  const len = Math.min(v1.length, v2.length);
  const result = new Array(len);
  for (let i = 0; i < len; i++) {
    result[i] = v1[i] + v2[i];
  }
  return result;
}

export function vectorScale(v: number[], scalar: number): number[] {
  return v.map(x => x * scalar);
}

export function vectorNorm(v: number[]): number {
  return Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
}
