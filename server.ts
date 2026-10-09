import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { getInitialCorpus, BENCHMARK_TEST_SUITE } from './src/data/sampleCorpus';
import { runPlagiarismDetection } from './src/engine/pipeline';
import { tokenizeWithOffsets } from './src/engine/textUtils';
import { generateShingles, computeMinHashSignature } from './src/engine/winnowing';
import { DocumentRecord, DetectorConfig, BenchmarkSummary } from './src/types/detector';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory document corpus
let corpusStore: DocumentRecord[] = getInitialCorpus();

// Server-side Gemini initialization if key exists
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Default detector configuration
const DEFAULT_CONFIG: DetectorConfig = {
  shingleK: 5,
  windowSizeW: 4,
  minMatchWords: 5,
  semanticThreshold: 0.78,
  maskQuotes: true,
  maskReferences: true,
  whitelistText: '',
  enableSemantic: true,
  enableCodeNormalization: true,
  enableStylometry: true,
  enableSLM: true
};

// --- API Endpoints ---

// GET /api/corpus - List all corpus documents
app.get('/api/corpus', (req, res) => {
  res.json({
    total: corpusStore.length,
    documents: corpusStore.map(d => ({
      id: d.id,
      title: d.title,
      author: d.author,
      category: d.category,
      createdAt: d.createdAt,
      tokenCount: d.tokenCount,
      fingerprintCount: d.fingerprintCount,
      snippet: d.content.slice(0, 160) + '...'
    }))
  });
});

// POST /api/corpus - Add new document to reference corpus
app.post('/api/corpus', (req, res) => {
  const { title, content, author, category } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const tokens = tokenizeWithOffsets(content);
  const shingles = generateShingles(tokens, 5);
  const minHash = computeMinHashSignature(shingles.map(s => s.hash));

  const newDoc: DocumentRecord = {
    id: `corpus-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: title.trim(),
    author: author ? author.trim() : 'Unknown Author',
    category: category || 'academic',
    content: content.trim(),
    createdAt: new Date().toISOString(),
    tokenCount: tokens.length,
    fingerprintCount: shingles.length,
    minHashSig: minHash
  };

  corpusStore.push(newDoc);
  res.json({ success: true, document: newDoc });
});

// DELETE /api/corpus/:id - Remove document from corpus
app.delete('/api/corpus/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = corpusStore.length;
  corpusStore = corpusStore.filter(d => d.id !== id);
  if (corpusStore.length === initialLen) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json({ success: true, remaining: corpusStore.length });
});

// POST /api/corpus/reset - Reset to default demo corpus
app.post('/api/corpus/reset', (req, res) => {
  corpusStore = getInitialCorpus();
  res.json({ success: true, total: corpusStore.length });
});

// POST /api/scan - Execute multi-layer detection pipeline
app.post('/api/scan', (req, res) => {
  const { title, text, config } = req.body;
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Submission text is required' });
  }

  const mergedConfig: DetectorConfig = {
    ...DEFAULT_CONFIG,
    ...(config || {})
  };

  try {
    const report = runPlagiarismDetection(
      title || 'Untitled Document',
      text,
      corpusStore,
      mergedConfig
    );
    res.json(report);
  } catch (err: any) {
    console.error('Scan error:', err);
    res.status(500).json({ error: err.message || 'Error executing scan pipeline' });
  }
});

// POST /api/slm-explain - Small Language Model triage and attribution check (Section 6)
app.post('/api/slm-explain', async (req, res) => {
  const { passageA, passageB, sourceTitle, surroundingContext } = req.body;

  if (!passageA || !passageB) {
    return res.status(400).json({ error: 'Passage A and Passage B are required' });
  }

  // If Gemini API is available, invoke gemini-3.8-flash for explainable assistance
  if (aiClient) {
    try {
      const prompt = `You are helping a human reviewer evaluate text overlap for an academic/editorial audit.
Core design principle: The model is never the judge of plagiarism. You are strictly an assistive explainer.
Do not accuse anyone of plagiarism or make moral judgments.

Given:
PASSAGE A (Submission):
"${passageA.slice(0, 800)}"

PASSAGE B (Candidate Source from "${sourceTitle || 'Reference Document'}"):
"${passageB.slice(0, 800)}"

Surrounding context of A:
"${(surroundingContext || '').slice(0, 400)}"

Analyze the relationship between PASSAGE A and PASSAGE B:
1. Category must be one of:
   - "quotation" (enclosed in quotes or explicitly marked with attribution)
   - "close_copy" (near-verbatim identical phrasing and sequence)
   - "paraphrase" (same underlying concepts and logic using synonym substitutions or syntax shifts)
   - "common_phrasing" (standard idioms, technical terms, boilerplate or common knowledge)
   - "unrelated" (incidental lexical coincidence)
2. Explanation: Exactly 1 to 2 objective sentences explaining how the passages compare structurally and lexically.
3. Confidence: Number between 0.0 and 1.0.
4. Attribution: Boolean indicating whether Passage A appears properly attributed or cited in the surrounding context.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an objective linguistic auditor helping human reviewers analyze text overlap. Be precise, concise, and non-accusatory.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                description: 'One of: quotation, close_copy, paraphrase, common_phrasing, unrelated'
              },
              explanation: {
                type: Type.STRING,
                description: 'Max 2 sentences explaining structural and lexical relationship.'
              },
              confidence: {
                type: Type.NUMBER,
                description: 'Confidence between 0.0 and 1.0'
              },
              isProperlyAttributed: {
                type: Type.BOOLEAN,
                description: 'Whether passage appears attributed in surrounding context.'
              }
            },
            required: ['category', 'explanation', 'confidence']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        category: parsed.category || 'close_copy',
        explanation: parsed.explanation || 'Direct lexical overlap observed between submission and source text.',
        confidence: parsed.confidence || 0.9,
        isProperlyAttributed: Boolean(parsed.isProperlyAttributed),
        provider: 'Gemini 3.8 Flash (SLM Assisted)'
      });
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to local heuristic explainer:', err.message);
    }
  }

  // Offline / Fallback Heuristic SLM Explainer (deterministic rule-based triage)
  const isQuoted = passageA.includes('"') || passageA.includes('“') || passageA.startsWith('>');
  const wordsA = passageA.toLowerCase().split(/\s+/).filter(Boolean);
  const wordsB = new Set(passageB.toLowerCase().split(/\s+/).filter(Boolean));
  let shared = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) shared++;
  }
  const ratio = wordsA.length > 0 ? shared / wordsA.length : 0;

  let category = 'close_copy';
  let explanation = '';
  let confidence = 0.92;

  if (isQuoted) {
    category = 'quotation';
    explanation = 'Passage is enclosed in quotation marks and preserves verbatim source phraseology.';
    confidence = 0.95;
  } else if (ratio > 0.8) {
    category = 'close_copy';
    explanation = `Passage exhibits ${Math.round(ratio * 100)}% identical vocabulary and sentence structure compared to the source text.`;
    confidence = 0.94;
  } else if (ratio > 0.45) {
    category = 'paraphrase';
    explanation = 'Passage presents the same core concepts and claims using synonym substitution and slight word rearrangement.';
    confidence = 0.82;
  } else {
    category = 'common_phrasing';
    explanation = 'Overlap consists primarily of domain terminology or standard academic transitional phrases.';
    confidence = 0.70;
  }

  res.json({
    category,
    explanation,
    confidence,
    isProperlyAttributed: false,
    provider: 'Local Rule-Based SLM Heuristic'
  });
});

// POST /api/benchmarks/run - Run PAN and MRPC evaluation benchmark
app.post('/api/benchmarks/run', (req, res) => {
  const results: Record<string, BenchmarkSummary> = {};
  const datasetGroups = ['PAN', 'MRPC', 'Code-Clone'];

  for (const ds of datasetGroups) {
    const cases = BENCHMARK_TEST_SUITE.filter(c => c.dataset === ds);
    if (cases.length === 0) continue;

    let tp = 0;
    let fp = 0;
    let tn = 0;
    let fn = 0;
    let totalTime = 0;

    for (const testCase of cases) {
      const start = Date.now();
      const tempCorpus: DocumentRecord[] = [{
        id: 'bench-src',
        title: 'Benchmark Source',
        category: 'academic',
        content: testCase.sourceText,
        createdAt: new Date().toISOString(),
        tokenCount: testCase.sourceText.split(/\s+/).length,
        fingerprintCount: 20
      }];

      const report = runPlagiarismDetection(
        testCase.title,
        testCase.submissionText,
        tempCorpus,
        {
          ...DEFAULT_CONFIG,
          shingleK: 4,
          minMatchWords: 4,
          semanticThreshold: 0.72
        }
      );

      const elapsed = Date.now() - start;
      totalTime += elapsed;

      const detectedPlagiarism = report.matches.length > 0 && report.overallSimilarityPercent > 12;

      if (testCase.groundTruthPlagiarized && detectedPlagiarism) {
        tp++;
      } else if (!testCase.groundTruthPlagiarized && detectedPlagiarism) {
        fp++;
      } else if (!testCase.groundTruthPlagiarized && !detectedPlagiarism) {
        tn++;
      } else {
        fn++;
      }
    }

    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 1;
    const recall = (tp + fn) > 0 ? tp / (tp + fn) : 1;
    const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    results[ds] = {
      dataset: ds,
      totalCases: cases.length,
      truePositives: tp,
      falsePositives: fp,
      trueNegatives: tn,
      falseNegatives: fn,
      precision: Number(precision.toFixed(3)),
      recall: Number(recall.toFixed(3)),
      f1: Number(f1.toFixed(3)),
      avgRuntimeMs: Number((totalTime / Math.max(1, cases.length)).toFixed(1))
    };
  }

  res.json({
    suites: results,
    timestamp: new Date().toISOString()
  });
});

// Setup Vite middlewares in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OpenPlag] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
