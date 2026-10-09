import { MaskedSpan } from '../types/detector';

export interface TokenWithOffset {
  token: string;
  normalized: string;
  start: number;
  end: number;
}

export interface SentenceWithOffset {
  text: string;
  start: number;
  end: number;
  tokens: TokenWithOffset[];
}

export const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself',
  'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most',
  'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our',
  'ours', 'ourselves', 'out', 'over', 'own', 's', 'same', 'she', 'should', 'so', 'some', 'such',
  'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'would', 'you',
  'your', 'yours', 'yourself', 'yourselves'
]);

/**
 * Unicode normalization and whitespace cleanup
 */
export function normalizeText(text: string): string {
  return text.normalize('NFKC');
}

/**
 * Tokenize text into words while keeping character offsets in the original text
 */
export function tokenizeWithOffsets(text: string): TokenWithOffset[] {
  const tokens: TokenWithOffset[] = [];
  const regex = /[\p{L}\p{N}]+/gu;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const word = match[0];
    tokens.push({
      token: word,
      normalized: word.toLowerCase(),
      start: match.index,
      end: match.index + word.length
    });
  }

  return tokens;
}

/**
 * Detect and mask quoted text ("...", '...', “...”, «...», blockquotes)
 */
export function findQuotedSpans(text: string): MaskedSpan[] {
  const spans: MaskedSpan[] = [];
  // Match standard double quotes, curved quotes, and single quotes with min 12 characters
  const quoteRegex = /(["“«][^"”»]{10,}["”»])|(?:^|\n)(>[ \t]+[^\n]+(?:\n>[ \t]+[^\n]+)*)/gm;
  let match: RegExpExecArray | null;

  while ((match = quoteRegex.exec(text)) !== null) {
    spans.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'quote',
      text: match[0]
    });
  }

  return spans;
}

/**
 * Detect and mask Bibliography / References / Works Cited sections
 */
export function findReferenceSpans(text: string): MaskedSpan[] {
  const spans: MaskedSpan[] = [];
  
  // Look for section headers like "References", "Bibliography", "Works Cited"
  const refHeaderRegex = /(?:\n\s*|^)(?:references|bibliography|works cited|literature cited)\s*[:\n]/i;
  const headerMatch = refHeaderRegex.exec(text);
  if (headerMatch) {
    const start = headerMatch.index;
    spans.push({
      start,
      end: text.length,
      type: 'reference',
      text: text.slice(start)
    });
  }

  // Also catch in-text bracketed citations like [1], [2, 3], (Smith et al., 2021)
  const citationRegex = /\[\d+(?:[–,-]\s*\d+)*\]|\((?:[A-Z][a-z]+(?:\s+et\s+al\.)?,\s*(?:19|20)\d{2}[a-z]?)\)/g;
  let citMatch: RegExpExecArray | null;
  while ((citMatch = citationRegex.exec(text)) !== null) {
    spans.push({
      start: citMatch.index,
      end: citMatch.index + citMatch[0].length,
      type: 'reference',
      text: citMatch[0]
    });
  }

  return spans;
}

/**
 * Find whitelist spans from teacher assignment questions or boilerplate
 */
export function findWhitelistSpans(text: string, whitelistText: string): MaskedSpan[] {
  if (!whitelistText || whitelistText.trim().length < 8) return [];
  const spans: MaskedSpan[] = [];

  const lines = whitelistText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length >= 10);

  const lowerText = text.toLowerCase();

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    let pos = lowerText.indexOf(lowerLine);
    while (pos !== -1) {
      spans.push({
        start: pos,
        end: pos + line.length,
        type: 'whitelist',
        text: text.slice(pos, pos + line.length)
      });
      pos = lowerText.indexOf(lowerLine, pos + 1);
    }
  }

  return spans;
}

/**
 * Check if a character position or span falls inside any masked region
 */
export function isRangeMasked(start: number, end: number, maskedSpans: MaskedSpan[]): boolean {
  for (const mask of maskedSpans) {
    // If overlap ratio is significant (>60% of the token or span falls in mask)
    const overlapStart = Math.max(start, mask.start);
    const overlapEnd = Math.min(end, mask.end);
    if (overlapEnd > overlapStart) {
      const spanLen = Math.max(1, end - start);
      if ((overlapEnd - overlapStart) / spanLen > 0.5) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Segment text into sentences with character offsets
 */
export function segmentSentences(text: string): SentenceWithOffset[] {
  const sentences: SentenceWithOffset[] = [];
  // Regex splitting on punctuation followed by whitespace and capital letter
  const sentenceRegex = /[^.!?\n]+(?:[.!?]+|\n+|$)/g;
  let match: RegExpExecArray | null;

  while ((match = sentenceRegex.exec(text)) !== null) {
    const raw = match[0];
    const trimmed = raw.trim();
    if (trimmed.length > 0) {
      const start = match.index + raw.indexOf(trimmed);
      const end = start + trimmed.length;
      const tokens = tokenizeWithOffsets(trimmed).map(t => ({
        ...t,
        start: t.start + start,
        end: t.end + start
      }));
      sentences.push({
        text: trimmed,
        start,
        end,
        tokens
      });
    }
  }

  return sentences;
}
