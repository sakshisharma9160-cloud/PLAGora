import { winnow, generateShingles } from './winnowing';
import { TokenWithOffset } from './textUtils';

const CODE_KEYWORDS = new Set([
  'def', 'class', 'function', 'return', 'if', 'else', 'elif', 'for', 'while',
  'in', 'import', 'from', 'as', 'try', 'except', 'catch', 'finally', 'with',
  'const', 'let', 'var', 'async', 'await', 'switch', 'case', 'break', 'continue',
  'public', 'private', 'protected', 'static', 'void', 'int', 'float', 'double', 'bool'
]);

export interface NormalizedCodeToken {
  type: 'KEYWORD' | 'ID' | 'LIT' | 'OP';
  token: string;
  normalized: string;
  start: number;
  end: number;
}

/**
 * Tokenize and normalize programming code
 */
export function tokenizeCode(code: string): NormalizedCodeToken[] {
  // Strip single-line and multi-line comments
  const stripped = code; // we tokenize directly with regex to retain char offsets

  const tokens: NormalizedCodeToken[] = [];
  // Regex to match identifiers, numbers, strings, and operators
  const tokenRegex = /(?:\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)|("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')|(\b[a-zA-Z_]\w*\b)|(\b\d+(?:\.\d+)?\b)|([+\-*/=<>!&|^%~]+|[{}()[\];,])/g;

  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(stripped)) !== null) {
    const [full, strLit, ident, numLit, op] = match;

    // Skip comments
    if (full.startsWith('//') || full.startsWith('/*') || full.startsWith('#')) {
      continue;
    }

    const start = match.index;
    const end = start + full.length;

    if (ident) {
      if (CODE_KEYWORDS.has(ident)) {
        tokens.push({ type: 'KEYWORD', token: ident, normalized: ident, start, end });
      } else {
        tokens.push({ type: 'ID', token: ident, normalized: '$VAR', start, end });
      }
    } else if (strLit || numLit) {
      tokens.push({ type: 'LIT', token: full, normalized: '$LIT', start, end });
    } else if (op) {
      tokens.push({ type: 'OP', token: full, normalized: op, start, end });
    }
  }

  return tokens;
}

/**
 * Compare code token sequences
 */
export function compareCodeTokens(
  subCodeTokens: NormalizedCodeToken[],
  srcCodeTokens: NormalizedCodeToken[],
  k = 6,
  w = 4
): Array<{ subStart: number; subEnd: number; srcStart: number; srcEnd: number; matchedLength: number }> {
  // Map normalized tokens to TokenWithOffset shape
  const subAsTokens: TokenWithOffset[] = subCodeTokens.map(t => ({
    token: t.token,
    normalized: t.normalized,
    start: t.start,
    end: t.end
  }));

  const srcAsTokens: TokenWithOffset[] = srcCodeTokens.map(t => ({
    token: t.token,
    normalized: t.normalized,
    start: t.start,
    end: t.end
  }));

  const subShingles = generateShingles(subAsTokens, k);
  const srcShingles = generateShingles(srcAsTokens, k);

  const subFingerprints = winnow(subShingles, w);
  const srcFingerprints = winnow(srcShingles, w);

  const srcMap = new Map<number, typeof srcFingerprints[0]>();
  for (const fp of srcFingerprints) {
    srcMap.set(fp.hash, fp);
  }

  const matches: Array<{ subStart: number; subEnd: number; srcStart: number; srcEnd: number; matchedLength: number }> = [];

  for (const subFp of subFingerprints) {
    const hit = srcMap.get(subFp.hash);
    if (hit) {
      matches.push({
        subStart: subFp.charStart,
        subEnd: subFp.charEnd,
        srcStart: hit.charStart,
        srcEnd: hit.charEnd,
        matchedLength: subFp.charEnd - subFp.charStart
      });
    }
  }

  return matches;
}
