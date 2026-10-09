import { SentenceWithOffset, TokenWithOffset, STOPWORDS } from './textUtils';

export interface StylometryProfile {
  avgSentenceLength: number;
  sentenceLengthStdDev: number;
  typeTokenRatio: number; // unique words / total words
  hapaxRatio: number;     // words appearing exactly once / total words
  functionWordRatio: number;
  styleShiftDetected: boolean;
  shiftPositions: number[];
}

export function analyzeStylometry(
  sentences: SentenceWithOffset[],
  tokens: TokenWithOffset[]
): StylometryProfile {
  if (sentences.length === 0 || tokens.length === 0) {
    return {
      avgSentenceLength: 0,
      sentenceLengthStdDev: 0,
      typeTokenRatio: 0,
      hapaxRatio: 0,
      functionWordRatio: 0,
      styleShiftDetected: false,
      shiftPositions: []
    };
  }

  // Sentence lengths in tokens
  const sentenceLengths = sentences.map(s => s.tokens.length);
  const totalTokens = sentenceLengths.reduce((a, b) => a + b, 0);
  const avgLen = totalTokens / Math.max(1, sentences.length);

  const variance = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - avgLen, 2), 0) / Math.max(1, sentences.length);
  const stdDev = Math.sqrt(variance);

  // Vocabulary frequencies
  const freqMap = new Map<string, number>();
  let functionWordCount = 0;

  for (const t of tokens) {
    const word = t.normalized;
    freqMap.set(word, (freqMap.get(word) || 0) + 1);
    if (STOPWORDS.has(word)) {
      functionWordCount++;
    }
  }

  const uniqueWords = freqMap.size;
  const ttr = uniqueWords / Math.max(1, tokens.length);

  let hapaxCount = 0;
  for (const count of freqMap.values()) {
    if (count === 1) hapaxCount++;
  }
  const hapaxRatio = hapaxCount / Math.max(1, tokens.length);
  const functionWordRatio = functionWordCount / Math.max(1, tokens.length);

  // Style shift detection: examine 3-sentence rolling windows
  const shiftPositions: number[] = [];
  if (sentences.length >= 6) {
    for (let i = 2; i < sentences.length - 2; i++) {
      const windowPrev = sentences.slice(i - 2, i);
      const windowNext = sentences.slice(i, i + 2);

      const avgPrev = windowPrev.reduce((acc, s) => acc + s.tokens.length, 0) / 2;
      const avgNext = windowNext.reduce((acc, s) => acc + s.tokens.length, 0) / 2;

      // Abrupt difference (> 2.2x or < 0.45x)
      if (Math.abs(avgNext - avgPrev) > 14 && (avgNext > avgPrev * 2.2 || avgPrev > avgNext * 2.2)) {
        shiftPositions.push(sentences[i].start);
      }
    }
  }

  return {
    avgSentenceLength: Number(avgLen.toFixed(1)),
    sentenceLengthStdDev: Number(stdDev.toFixed(1)),
    typeTokenRatio: Number(ttr.toFixed(3)),
    hapaxRatio: Number(hapaxRatio.toFixed(3)),
    functionWordRatio: Number(functionWordRatio.toFixed(3)),
    styleShiftDetected: shiftPositions.length > 0,
    shiftPositions
  };
}
