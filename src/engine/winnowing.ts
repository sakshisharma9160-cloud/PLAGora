import { TokenWithOffset, isRangeMasked } from './textUtils';
import { MaskedSpan } from '../types/detector';

export interface Fingerprint {
  hash: number;
  tokenIndex: number;
  charStart: number;
  charEnd: number;
  shingleText: string;
}

/**
 * 32-bit FNV-1a hash of a string
 */
export function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Generate word k-shingles from token list
 */
export function generateShingles(
  tokens: TokenWithOffset[],
  k: number,
  maskedSpans: MaskedSpan[] = []
): Array<{ shingle: string; hash: number; tokenIndex: number; charStart: number; charEnd: number }> {
  const shingles: Array<{ shingle: string; hash: number; tokenIndex: number; charStart: number; charEnd: number }> = [];

  for (let i = 0; i <= tokens.length - k; i++) {
    const slice = tokens.slice(i, i + k);
    const charStart = slice[0].start;
    const charEnd = slice[k - 1].end;

    // Skip if shingle overlaps masked quote/reference/whitelist
    if (isRangeMasked(charStart, charEnd, maskedSpans)) {
      continue;
    }

    const shingle = slice.map(t => t.normalized).join(' ');
    const hash = hashString(shingle);

    shingles.push({
      shingle,
      hash,
      tokenIndex: i,
      charStart,
      charEnd
    });
  }

  return shingles;
}

/**
 * Winnowing algorithm (Schleimer, Wilkerson, Aiken - SIGMOD 2003 / MOSS)
 *
 * Given a sequence of hashes h_0 ... h_n and window size w:
 * In each window of size w, select the minimum hash.
 * If multiple minimums occur, pick the rightmost one.
 * Guarantees that any match of length >= t = (w + k - 1) words is detected.
 */
export function winnow(
  shingles: Array<{ shingle: string; hash: number; tokenIndex: number; charStart: number; charEnd: number }>,
  w: number
): Fingerprint[] {
  if (shingles.length === 0) return [];
  if (shingles.length <= w) {
    // If fewer than w shingles, select the global minimum
    let minIdx = 0;
    for (let i = 1; i < shingles.length; i++) {
      if (shingles[i].hash <= shingles[minIdx].hash) {
        minIdx = i;
      }
    }
    const item = shingles[minIdx];
    return [{
      hash: item.hash,
      tokenIndex: item.tokenIndex,
      charStart: item.charStart,
      charEnd: item.charEnd,
      shingleText: item.shingle
    }];
  }

  const fingerprints: Fingerprint[] = [];
  let prevMinIndex = -1;

  for (let i = 0; i <= shingles.length - w; i++) {
    const window = shingles.slice(i, i + w);
    let minIdxInWindow = 0;
    for (let j = 1; j < window.length; j++) {
      // Pick rightmost minimum
      if (window[j].hash <= window[minIdxInWindow].hash) {
        minIdxInWindow = j;
      }
    }

    const globalMinIdx = i + minIdxInWindow;
    if (globalMinIdx !== prevMinIndex) {
      const selected = shingles[globalMinIdx];
      fingerprints.push({
        hash: selected.hash,
        tokenIndex: selected.tokenIndex,
        charStart: selected.charStart,
        charEnd: selected.charEnd,
        shingleText: selected.shingle
      });
      prevMinIndex = globalMinIdx;
    }
  }

  return fingerprints;
}

/**
 * MinHash Signature computation (64 hash permutations) for fast Jaccard estimation
 */
const NUM_PERMUTATIONS = 64;
const LARGE_PRIME = 4294967291; // 2^32 - 5

// Deterministic coefficients for MinHash
const HASH_COEFFS_A = Array.from({ length: NUM_PERMUTATIONS }, (_, i) => (i * 2654435761 + 1013904223) >>> 0);
const HASH_COEFFS_B = Array.from({ length: NUM_PERMUTATIONS }, (_, i) => (i * 1013904223 + 2654435761) >>> 0);

export function computeMinHashSignature(shingleHashes: number[]): number[] {
  if (shingleHashes.length === 0) {
    return Array(NUM_PERMUTATIONS).fill(0);
  }

  const signature: number[] = Array(NUM_PERMUTATIONS).fill(0xFFFFFFFF);

  for (const h of shingleHashes) {
    for (let i = 0; i < NUM_PERMUTATIONS; i++) {
      const a = HASH_COEFFS_A[i];
      const b = HASH_COEFFS_B[i];
      const permuted = ((Math.imul(a, h) + b) % LARGE_PRIME) >>> 0;
      if (permuted < signature[i]) {
        signature[i] = permuted;
      }
    }
  }

  return signature;
}

/**
 * Estimate Jaccard similarity between two MinHash signatures
 */
export function estimateJaccardSimilarity(sigA: number[], sigB: number[]): number {
  if (!sigA.length || !sigB.length || sigA.length !== sigB.length) return 0;
  let matches = 0;
  for (let i = 0; i < sigA.length; i++) {
    if (sigA[i] === sigB[i]) matches++;
  }
  return matches / sigA.length;
}

/**
 * 64-bit SimHash for near-duplicate document estimation
 */
export function computeSimHash(tokens: TokenWithOffset[]): string {
  const v = new Array(64).fill(0);

  for (const token of tokens) {
    const h1 = hashString(token.normalized);
    const h2 = hashString(token.normalized + '_salt');

    for (let b = 0; b < 32; b++) {
      const bit1 = (h1 >> b) & 1;
      v[b] += bit1 ? 1 : -1;
    }
    for (let b = 0; b < 32; b++) {
      const bit2 = (h2 >> b) & 1;
      v[32 + b] += bit2 ? 1 : -1;
    }
  }

  let fingerprint = '';
  for (let i = 0; i < 64; i++) {
    fingerprint += v[i] > 0 ? '1' : '0';
  }
  return fingerprint;
}
