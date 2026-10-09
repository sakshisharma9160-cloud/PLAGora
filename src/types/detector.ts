export type MatchMethod = 'winnowing' | 'lexical' | 'semantic' | 'code' | 'stylometry';

export type SLMCategory = 'quotation' | 'close_copy' | 'paraphrase' | 'common_phrasing' | 'unrelated';

export interface MaskedSpan {
  start: number;
  end: number;
  type: 'quote' | 'reference' | 'whitelist';
  text: string;
}

export interface MatchRecord {
  id: string;
  sourceDocId: string;
  sourceDocTitle: string;
  subStart: number;
  subEnd: number;
  srcStart: number;
  srcEnd: number;
  subText: string;
  srcText: string;
  method: MatchMethod;
  confidence: number;
  details?: {
    shingleCount?: number;
    winnowingHashes?: number[];
    jaccardSim?: number;
    smithWatermanScore?: number;
    cosineSim?: number;
    normalizedTokens?: string[];
  };
  slmExplanation?: {
    category: SLMCategory;
    explanation: string;
    confidence: number;
    isProperlyAttributed?: boolean;
    generatedAt: string;
  };
}

export interface DocumentRecord {
  id: string;
  title: string;
  author?: string;
  content: string;
  category: 'academic' | 'literature' | 'technical' | 'code';
  createdAt: string;
  tokenCount: number;
  fingerprintCount: number;
  minHashSig?: number[];
}

export interface DetectorConfig {
  shingleK: number;          // e.g. 5 words
  windowSizeW: number;       // e.g. 4 shingles
  minMatchWords: number;     // e.g. 6 words
  semanticThreshold: number; // e.g. 0.78
  maskQuotes: boolean;       // whether to ignore "..."
  maskReferences: boolean;   // whether to ignore References section
  whitelistText: string;     // assignment question / template text to ignore
  enableSemantic: boolean;
  enableCodeNormalization: boolean;
  enableStylometry: boolean;
  enableSLM: boolean;
}

export interface ScanReport {
  id: string;
  submissionTitle: string;
  submissionText: string;
  timestamp: string;
  durationMs: number;
  config: DetectorConfig;
  totalChars: number;
  unmaskedChars: number;
  matchedChars: number;
  overallSimilarityPercent: number;
  layerBreakdown: {
    exactWinnowing: number;
    lexicalAlignment: number;
    semanticParaphrase: number;
    codeClones: number;
  };
  maskedSpans: MaskedSpan[];
  matches: MatchRecord[];
  topSources: Array<{
    docId: string;
    docTitle: string;
    matchedChars: number;
    similarityPercent: number;
    matchCount: number;
  }>;
  stylometryStats?: {
    avgSentenceLength: number;
    sentenceLengthStdDev: number;
    typeTokenRatio: number;
    hapaxRatio: number;
    styleShiftDetected: boolean;
    shiftPositions?: number[];
  };
}

export interface BenchmarkCase {
  id: string;
  title: string;
  dataset: 'PAN' | 'MRPC' | 'Synthetic-Paraphrase' | 'Code-Clone';
  submissionText: string;
  sourceText: string;
  groundTruthPlagiarized: boolean;
  groundTruthType: 'exact' | 'light_edit' | 'heavy_paraphrase' | 'clean';
}

export interface BenchmarkSummary {
  dataset: string;
  totalCases: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1: number;
  avgRuntimeMs: number;
}

export interface HistoryItem {
  id: string;
  title: string;
  timestamp: string;
  wordCount: number;
  plagiarismPercent: number;
  originalPercent: number;
  similarityScore: number;
  matchedSourcesCount: number;
  topSourceName?: string;
  report: ScanReport;
}

