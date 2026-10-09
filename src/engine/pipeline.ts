import {
  DetectorConfig,
  DocumentRecord,
  MatchRecord,
  ScanReport,
  MaskedSpan
} from '../types/detector';
import {
  tokenizeWithOffsets,
  findQuotedSpans,
  findReferenceSpans,
  findWhitelistSpans,
  segmentSentences,
  isRangeMasked
} from './textUtils';
import {
  generateShingles,
  winnow,
  computeMinHashSignature,
  estimateJaccardSimilarity
} from './winnowing';
import {
  computeTf,
  computeCosineSimilarity,
  smithWatermanLocalAlign
} from './lexical';
import { findSemanticParaphrases } from './semantic';
import { tokenizeCode, compareCodeTokens } from './codeTiling';
import { analyzeStylometry } from './stylometry';

/**
 * Execute detection pipeline
 */
export function runPlagiarismDetection(
  submissionTitle: string,
  submissionText: string,
  corpus: DocumentRecord[],
  config: DetectorConfig
): ScanReport {
  const startTime = Date.now();

  // 1. Preprocessing & Masking
  const maskedSpans: MaskedSpan[] = [];

  if (config.maskQuotes) {
    maskedSpans.push(...findQuotedSpans(submissionText));
  }
  if (config.maskReferences) {
    maskedSpans.push(...findReferenceSpans(submissionText));
  }
  if (config.whitelistText && config.whitelistText.trim().length > 0) {
    maskedSpans.push(...findWhitelistSpans(submissionText, config.whitelistText));
  }

  // Segment tokens and sentences
  const subTokens = tokenizeWithOffsets(submissionText);
  const subSentences = segmentSentences(submissionText);

  // Compute submission MinHash and TF-IDF
  const subShinglesForMinHash = generateShingles(subTokens, config.shingleK, maskedSpans);
  const subMinHash = computeMinHashSignature(subShinglesForMinHash.map(s => s.hash));
  const subTf = computeTf(subTokens);

  // 2. Candidate Filtering
  // Rank corpus documents by MinHash Jaccard similarity and TF-IDF cosine similarity
  interface CandidateDoc {
    doc: DocumentRecord;
    jaccard: number;
    cosine: number;
    tokens: ReturnType<typeof tokenizeWithOffsets>;
    sentences: ReturnType<typeof segmentSentences>;
  }

  const candidates: CandidateDoc[] = [];

  for (const doc of corpus) {
    const docTokens = tokenizeWithOffsets(doc.content);
    const docSentences = segmentSentences(doc.content);
    const docShingles = generateShingles(docTokens, config.shingleK);
    const docMinHash = doc.minHashSig || computeMinHashSignature(docShingles.map(s => s.hash));
    const jaccard = estimateJaccardSimilarity(subMinHash, docMinHash);

    const docTf = computeTf(docTokens);
    const cosine = computeCosineSimilarity(subTf, docTf);

    candidates.push({
      doc,
      jaccard,
      cosine,
      tokens: docTokens,
      sentences: docSentences
    });
  }

  // Sort candidates by max(jaccard, cosine)
  candidates.sort((a, b) => Math.max(b.jaccard, b.cosine) - Math.max(a.jaccard, a.cosine));

  const rawMatches: MatchRecord[] = [];
  let matchCounter = 1;

  // Process top candidate documents (or all if small corpus)
  for (const candidate of candidates) {
    const { doc, tokens: docTokens, sentences: docSentences } = candidate;

    // --- Layer 1: Exact Winnowing Fingerprinting ---
    const subShingles = generateShingles(subTokens, config.shingleK, maskedSpans);
    const docShingles = generateShingles(docTokens, config.shingleK);

    const subFps = winnow(subShingles, config.windowSizeW);
    const docFps = winnow(docShingles, config.windowSizeW);

    const docFpMap = new Map<number, typeof docFps[0]>();
    for (const fp of docFps) {
      docFpMap.set(fp.hash, fp);
    }

    // Identify fingerprint collisions
    const winnowHits: Array<{ subStart: number; subEnd: number; srcStart: number; srcEnd: number; hash: number }> = [];
    for (const subFp of subFps) {
      const docHit = docFpMap.get(subFp.hash);
      if (docHit) {
        winnowHits.push({
          subStart: subFp.charStart,
          subEnd: subFp.charEnd,
          srcStart: docHit.charStart,
          srcEnd: docHit.charEnd,
          hash: subFp.hash
        });
      }
    }

    // Merge adjacent winnowing hits into continuous passages
    if (winnowHits.length > 0) {
      winnowHits.sort((a, b) => a.subStart - b.subStart);

      let currentPassage = {
        subStart: winnowHits[0].subStart,
        subEnd: winnowHits[0].subEnd,
        srcStart: winnowHits[0].srcStart,
        srcEnd: winnowHits[0].srcEnd,
        hashes: [winnowHits[0].hash]
      };

      for (let i = 1; i < winnowHits.length; i++) {
        const hit = winnowHits[i];
        // If close in submission text (within 90 chars / ~15 words)
        if (hit.subStart <= currentPassage.subEnd + 90) {
          currentPassage.subEnd = Math.max(currentPassage.subEnd, hit.subEnd);
          currentPassage.srcEnd = Math.max(currentPassage.srcEnd, hit.srcEnd);
          currentPassage.srcStart = Math.min(currentPassage.srcStart, hit.srcStart);
          currentPassage.hashes.push(hit.hash);
        } else {
          // Push passage if long enough
          const subText = submissionText.slice(currentPassage.subStart, currentPassage.subEnd);
          const srcText = doc.content.slice(currentPassage.srcStart, currentPassage.srcEnd);

          if (subText.trim().split(/\s+/).length >= config.minMatchWords) {
            rawMatches.push({
              id: `match-winnow-${matchCounter++}`,
              sourceDocId: doc.id,
              sourceDocTitle: doc.title,
              subStart: currentPassage.subStart,
              subEnd: currentPassage.subEnd,
              srcStart: currentPassage.srcStart,
              srcEnd: currentPassage.srcEnd,
              subText,
              srcText,
              method: 'winnowing',
              confidence: 0.99,
              details: {
                shingleCount: currentPassage.hashes.length,
                winnowingHashes: currentPassage.hashes.slice(0, 5)
              }
            });
          }

          currentPassage = {
            subStart: hit.subStart,
            subEnd: hit.subEnd,
            srcStart: hit.srcStart,
            srcEnd: hit.srcEnd,
            hashes: [hit.hash]
          };
        }
      }

      // Push final passage
      const subText = submissionText.slice(currentPassage.subStart, currentPassage.subEnd);
      const srcText = doc.content.slice(currentPassage.srcStart, currentPassage.srcEnd);
      if (subText.trim().split(/\s+/).length >= config.minMatchWords) {
        rawMatches.push({
          id: `match-winnow-${matchCounter++}`,
          sourceDocId: doc.id,
          sourceDocTitle: doc.title,
          subStart: currentPassage.subStart,
          subEnd: currentPassage.subEnd,
          srcStart: currentPassage.srcStart,
          srcEnd: currentPassage.srcEnd,
          subText,
          srcText,
          method: 'winnowing',
          confidence: 0.99,
          details: {
            shingleCount: currentPassage.hashes.length,
            winnowingHashes: currentPassage.hashes.slice(0, 5)
          }
        });
      }
    }

    // --- Layer 2: Lexical Smith-Waterman Alignment ---
    // If candidate has moderate TF-IDF or Jaccard similarity, run sequence alignment
    if (candidate.cosine >= 0.15 || candidate.jaccard >= 0.08) {
      const alignments = smithWatermanLocalAlign(subTokens, docTokens);
      for (const al of alignments) {
        if (al.matchedTokens >= config.minMatchWords && al.similarity >= 0.65) {
          const subStart = subTokens[al.subTokenStart].start;
          const subEnd = subTokens[al.subTokenEnd - 1].end;
          const srcStart = docTokens[al.srcTokenStart].start;
          const srcEnd = docTokens[al.srcTokenEnd - 1].end;

          if (!isRangeMasked(subStart, subEnd, maskedSpans)) {
            rawMatches.push({
              id: `match-lexical-${matchCounter++}`,
              sourceDocId: doc.id,
              sourceDocTitle: doc.title,
              subStart,
              subEnd,
              srcStart,
              srcEnd,
              subText: submissionText.slice(subStart, subEnd),
              srcText: doc.content.slice(srcStart, srcEnd),
              method: 'lexical',
              confidence: Number(al.similarity.toFixed(2)),
              details: {
                smithWatermanScore: al.score
              }
            });
          }
        }
      }
    }

    // --- Layer 3: Semantic Embedding Paraphrase Matching ---
    if (config.enableSemantic && (candidate.cosine >= 0.1 || candidate.jaccard >= 0.05)) {
      const semanticHits = findSemanticParaphrases(
        subSentences,
        docSentences,
        config.semanticThreshold
      );

      for (const hit of semanticHits) {
        if (!isRangeMasked(hit.subSentence.start, hit.subSentence.end, maskedSpans)) {
          rawMatches.push({
            id: `match-semantic-${matchCounter++}`,
            sourceDocId: doc.id,
            sourceDocTitle: doc.title,
            subStart: hit.subSentence.start,
            subEnd: hit.subSentence.end,
            srcStart: hit.srcSentence.start,
            srcEnd: hit.srcSentence.end,
            subText: hit.subSentence.text,
            srcText: hit.srcSentence.text,
            method: 'semantic',
            confidence: Number(hit.similarity.toFixed(2)),
            details: {
              cosineSim: Number(hit.similarity.toFixed(3))
            }
          });
        }
      }
    }

    // --- Layer 4: Source-Code Clone Detection ---
    if (config.enableCodeNormalization) {
      const subCodeTokens = tokenizeCode(submissionText);
      const docCodeTokens = tokenizeCode(doc.content);

      if (subCodeTokens.length >= 15 && docCodeTokens.length >= 15) {
        const codeHits = compareCodeTokens(subCodeTokens, docCodeTokens, 6, 4);
        for (const hit of codeHits) {
          if (!isRangeMasked(hit.subStart, hit.subEnd, maskedSpans)) {
            rawMatches.push({
              id: `match-code-${matchCounter++}`,
              sourceDocId: doc.id,
              sourceDocTitle: doc.title,
              subStart: hit.subStart,
              subEnd: hit.subEnd,
              srcStart: hit.srcStart,
              srcEnd: hit.srcEnd,
              subText: submissionText.slice(hit.subStart, hit.subEnd),
              srcText: doc.content.slice(hit.srcStart, hit.srcEnd),
              method: 'code',
              confidence: 0.95
            });
          }
        }
      }
    }
  }

  // --- Layer 5: Stylometry Analysis ---
  let stylometryStats = undefined;
  if (config.enableStylometry) {
    stylometryStats = analyzeStylometry(subSentences, subTokens);
  }

  // --- Step 4.7 Combining the Scores: Priority & Overlap Resolution ---
  // Core rule: Exact matches (winnowing) take priority over lexical and semantic matches.
  // Overlapping matches from different methods are merged or resolved.
  const methodPriority: Record<string, number> = {
    winnowing: 4,
    code: 3,
    lexical: 2,
    semantic: 1,
    stylometry: 0
  };

  // Sort by start position, then higher priority method
  rawMatches.sort((a, b) => {
    if (a.subStart !== b.subStart) return a.subStart - b.subStart;
    return (methodPriority[b.method] || 0) - (methodPriority[a.method] || 0);
  });

  const finalMatches: MatchRecord[] = [];

  for (const match of rawMatches) {
    // Check overlap with already accepted higher-priority matches
    let dominated = false;
    for (const existing of finalMatches) {
      const overlapStart = Math.max(match.subStart, existing.subStart);
      const overlapEnd = Math.min(match.subEnd, existing.subEnd);
      if (overlapEnd > overlapStart) {
        const overlapLen = overlapEnd - overlapStart;
        const matchLen = match.subEnd - match.subStart;
        // If > 70% of this match is already covered by an equal or higher priority match
        if (overlapLen / matchLen > 0.70) {
          dominated = true;
          break;
        }
      }
    }

    if (!dominated) {
      finalMatches.push(match);
    }
  }

  // Calculate matched characters on submission text
  const totalChars = submissionText.length;
  const matchedCharSet = new Set<number>();

  for (const m of finalMatches) {
    for (let c = m.subStart; c < m.subEnd; c++) {
      matchedCharSet.add(c);
    }
  }

  const maskedCharSet = new Set<number>();
  for (const mask of maskedSpans) {
    for (let c = mask.start; c < mask.end; c++) {
      maskedCharSet.add(c);
    }
  }

  let unmaskedChars = 0;
  for (let c = 0; c < totalChars; c++) {
    if (!maskedCharSet.has(c)) {
      unmaskedChars++;
    }
  }
  if (unmaskedChars === 0) unmaskedChars = totalChars;

  // Only count matched chars that were unmasked
  let actualMatchedChars = 0;
  for (const c of matchedCharSet) {
    if (!maskedCharSet.has(c)) {
      actualMatchedChars++;
    }
  }

  const overallSimilarityPercent = Number(((actualMatchedChars / unmaskedChars) * 100).toFixed(2));

  // Layer breakdown
  const layerBreakdown = {
    exactWinnowing: 0,
    lexicalAlignment: 0,
    semanticParaphrase: 0,
    codeClones: 0
  };

  for (const m of finalMatches) {
    const chars = m.subEnd - m.subStart;
    if (m.method === 'winnowing') layerBreakdown.exactWinnowing += chars;
    else if (m.method === 'lexical') layerBreakdown.lexicalAlignment += chars;
    else if (m.method === 'semantic') layerBreakdown.semanticParaphrase += chars;
    else if (m.method === 'code') layerBreakdown.codeClones += chars;
  }

  // Top source documents breakdown
  const sourceMap = new Map<string, { docId: string; docTitle: string; matchedChars: number; matchCount: number }>();
  for (const m of finalMatches) {
    const existing = sourceMap.get(m.sourceDocId) || {
      docId: m.sourceDocId,
      docTitle: m.sourceDocTitle,
      matchedChars: 0,
      matchCount: 0
    };
    existing.matchedChars += (m.subEnd - m.subStart);
    existing.matchCount += 1;
    sourceMap.set(m.sourceDocId, existing);
  }

  const topSources = Array.from(sourceMap.values()).map(s => ({
    ...s,
    similarityPercent: Number(((s.matchedChars / unmaskedChars) * 100).toFixed(2))
  })).sort((a, b) => b.matchedChars - a.matchedChars);

  return {
    id: `report-${Date.now()}`,
    submissionTitle: submissionTitle || 'Untitled Submission',
    submissionText,
    timestamp: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    config,
    totalChars,
    unmaskedChars,
    matchedChars: actualMatchedChars,
    overallSimilarityPercent: Math.min(100, overallSimilarityPercent),
    layerBreakdown,
    maskedSpans,
    matches: finalMatches,
    topSources,
    stylometryStats
  };
}
