import { SentenceWithOffset } from './textUtils';
import { hashString } from './winnowing';

const EMBEDDING_DIM = 64;

// Common semantic clusters / synonym mappings for paraphrase detection
const SYNONYM_GROUPS: string[][] = [
  ['utilize', 'use', 'apply', 'employ', 'leverage', 'adopt'],
  ['demonstrate', 'show', 'indicate', 'reveal', 'exhibit', 'display', 'illustrate'],
  ['significant', 'substantial', 'major', 'notable', 'considerable', 'critical', 'pivotal'],
  ['increase', 'rise', 'grow', 'escalate', 'expand', 'augment', 'surge'],
  ['decrease', 'reduce', 'drop', 'diminish', 'decline', 'plummet', 'shrink'],
  ['create', 'generate', 'produce', 'develop', 'construct', 'form', 'build'],
  ['investigate', 'examine', 'explore', 'analyze', 'study', 'scrutinize', 'assess'],
  ['vital', 'crucial', 'essential', 'important', 'indispensable', 'key'],
  ['method', 'approach', 'technique', 'strategy', 'procedure', 'methodology'],
  ['consequence', 'result', 'outcome', 'effect', 'ramification', 'aftermath'],
  ['propose', 'suggest', 'recommend', 'advocate', 'posit', 'put forward'],
  ['complex', 'intricate', 'complicated', 'sophisticated', 'elaborate'],
  ['rapid', 'fast', 'swift', 'quick', 'speedy', 'brisk'],
  ['accurate', 'precise', 'exact', 'correct', 'flawless']
];

// Invert into fast lookup map
const SYNONYM_CANONICAL = new Map<string, string>();
for (const group of SYNONYM_GROUPS) {
  const root = group[0];
  for (const word of group) {
    SYNONYM_CANONICAL.set(word, root);
  }
}

/**
 * Deterministic pseudo-embedding generator using sub-word n-gram hashing
 * and synonym projection to simulate sentence-transformers embedding spaces.
 */
export function computeSentenceEmbedding(sentence: SentenceWithOffset): Float32Array {
  const vec = new Float32Array(EMBEDDING_DIM);
  const tokens = sentence.tokens;

  if (tokens.length === 0) return vec;

  for (const token of tokens) {
    const rawWord = token.normalized;
    const canonWord = SYNONYM_CANONICAL.get(rawWord) || rawWord;

    // Project word into embedding dimensions
    const h = hashString(canonWord);
    const dim1 = h % EMBEDDING_DIM;
    const dim2 = (h >>> 8) % EMBEDDING_DIM;
    const dim3 = (h >>> 16) % EMBEDDING_DIM;

    const sign1 = (h & 1) ? 1.0 : -1.0;
    const sign2 = (h & 2) ? 1.0 : -1.0;
    const sign3 = (h & 4) ? 1.0 : -1.0;

    vec[dim1] += sign1 * 1.5;
    vec[dim2] += sign2 * 1.0;
    vec[dim3] += sign3 * 0.8;

    // Character 3-grams for morphological root sharing
    for (let i = 0; i <= canonWord.length - 3; i++) {
      const tri = canonWord.slice(i, i + 3);
      const th = hashString(tri);
      const tDim = th % EMBEDDING_DIM;
      const tSign = (th & 1) ? 0.3 : -0.3;
      vec[tDim] += tSign;
    }
  }

  // L2 normalize
  let sumSq = 0;
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    sumSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(sumSq);
  if (norm > 0) {
    for (let i = 0; i < EMBEDDING_DIM; i++) {
      vec[i] /= norm;
    }
  }

  return vec;
}

/**
 * Cosine similarity between two float vectors
 */
export function cosineSimilarityVec(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    dot += a[i] * b[i];
  }
  return Math.max(0, Math.min(1, dot));
}

export interface SemanticMatchPair {
  subSentence: SentenceWithOffset;
  srcSentence: SentenceWithOffset;
  similarity: number;
}

/**
 * Scan sentences from submission against sentences from source document
 */
export function findSemanticParaphrases(
  subSentences: SentenceWithOffset[],
  srcSentences: SentenceWithOffset[],
  threshold = 0.78
): SemanticMatchPair[] {
  const matches: SemanticMatchPair[] = [];

  const subEmbeddings = subSentences.map(s => computeSentenceEmbedding(s));
  const srcEmbeddings = srcSentences.map(s => computeSentenceEmbedding(s));

  for (let i = 0; i < subSentences.length; i++) {
    // Skip very short fragments
    if (subSentences[i].tokens.length < 5) continue;

    let bestSim = 0;
    let bestJ = -1;

    for (let j = 0; j < srcSentences.length; j++) {
      if (srcSentences[j].tokens.length < 5) continue;

      const sim = cosineSimilarityVec(subEmbeddings[i], srcEmbeddings[j]);
      if (sim > bestSim) {
        bestSim = sim;
        bestJ = j;
      }
    }

    if (bestSim >= threshold && bestJ !== -1) {
      matches.push({
        subSentence: subSentences[i],
        srcSentence: srcSentences[bestJ],
        similarity: bestSim
      });
    }
  }

  return matches;
}
