import { TokenWithOffset, STOPWORDS } from './textUtils';

export interface AlignmentResult {
  score: number;
  subTokenStart: number;
  subTokenEnd: number;
  srcTokenStart: number;
  srcTokenEnd: number;
  matchedTokens: number;
  similarity: number;
}

/**
 * Compute TF-IDF vector for a document
 */
export function computeTf(tokens: TokenWithOffset[]): Map<string, number> {
  const tf = new Map<string, number>();
  let total = 0;

  for (const t of tokens) {
    if (STOPWORDS.has(t.normalized) || t.normalized.length < 3) continue;
    tf.set(t.normalized, (tf.get(t.normalized) || 0) + 1);
    total++;
  }

  if (total === 0) return tf;

  // Sublinear TF scaling: 1 + ln(tf)
  const normalizedTf = new Map<string, number>();
  for (const [term, count] of tf.entries()) {
    normalizedTf.set(term, 1 + Math.log(count));
  }

  return normalizedTf;
}

/**
 * Compute cosine similarity between two TF vectors
 */
export function computeCosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const val of vecA.values()) {
    normA += val * val;
  }
  for (const val of vecB.values()) {
    normB += val * val;
  }

  if (normA === 0 || normB === 0) return 0;

  for (const [term, valA] of vecA.entries()) {
    const valB = vecB.get(term);
    if (valB) {
      dotProduct += valA * valB;
    }
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * BM25 score for ranking candidate passages
 */
export function computeBM25Score(
  queryTokens: TokenWithOffset[],
  docTokens: TokenWithOffset[],
  avgDocLen: number,
  k1 = 1.2,
  b = 0.75
): number {
  const docLen = docTokens.length;
  if (docLen === 0) return 0;

  const docFreq = new Map<string, number>();
  for (const t of docTokens) {
    if (!STOPWORDS.has(t.normalized)) {
      docFreq.set(t.normalized, (docFreq.get(t.normalized) || 0) + 1);
    }
  }

  let score = 0;
  for (const q of queryTokens) {
    if (STOPWORDS.has(q.normalized)) continue;
    const tf = docFreq.get(q.normalized) || 0;
    if (tf > 0) {
      const numerator = tf * (k1 + 1);
      const denominator = tf + k1 * (1 - b + b * (docLen / avgDocLen));
      score += numerator / denominator;
    }
  }

  return score;
}

/**
 * Smith-Waterman style Local Sequence Alignment algorithm
 * Matches passages with small insertions, deletions, or word swaps
 */
export function smithWatermanLocalAlign(
  subTokens: TokenWithOffset[],
  srcTokens: TokenWithOffset[],
  matchScore = 3,
  mismatchPenalty = -2,
  gapPenalty = -2,
  minScoreThreshold = 12
): AlignmentResult[] {
  const m = subTokens.length;
  const n = srcTokens.length;

  if (m === 0 || n === 0) return [];

  // Downsample or limit window if too large to ensure fast execution
  const maxTokens = 600;
  const subLimit = Math.min(m, maxTokens);
  const srcLimit = Math.min(n, maxTokens);

  // 1D flat arrays for performance
  const scoreMatrix = new Int32Array((subLimit + 1) * (srcLimit + 1));

  let maxScore = 0;
  let maxI = 0;
  let maxJ = 0;

  for (let i = 1; i <= subLimit; i++) {
    const subWord = subTokens[i - 1].normalized;
    const rowOffset = i * (srcLimit + 1);
    const prevRowOffset = (i - 1) * (srcLimit + 1);

    for (let j = 1; j <= srcLimit; j++) {
      const srcWord = srcTokens[j - 1].normalized;
      const isMatch = subWord === srcWord;
      const matchVal = isMatch ? matchScore : mismatchPenalty;

      const diag = scoreMatrix[prevRowOffset + (j - 1)] + matchVal;
      const up = scoreMatrix[prevRowOffset + j] + gapPenalty;
      const left = scoreMatrix[rowOffset + (j - 1)] + gapPenalty;

      const cellScore = Math.max(0, diag, up, left);
      scoreMatrix[rowOffset + j] = cellScore;

      if (cellScore > maxScore) {
        maxScore = cellScore;
        maxI = i;
        maxJ = j;
      }
    }
  }

  if (maxScore < minScoreThreshold) {
    return [];
  }

  // Traceback to find local alignment boundary
  let currI = maxI;
  let currJ = maxJ;
  let matchedCount = 0;

  while (currI > 0 && currJ > 0 && scoreMatrix[currI * (srcLimit + 1) + currJ] > 0) {
    const subWord = subTokens[currI - 1].normalized;
    const srcWord = srcTokens[currJ - 1].normalized;
    if (subWord === srcWord) {
      matchedCount++;
    }
    currI--;
    currJ--;
  }

  const length = Math.max(maxI - currI, maxJ - currJ);
  const similarity = length > 0 ? matchedCount / length : 0;

  return [{
    score: maxScore,
    subTokenStart: currI,
    subTokenEnd: maxI,
    srcTokenStart: currJ,
    srcTokenEnd: maxJ,
    matchedTokens: matchedCount,
    similarity
  }];
}
