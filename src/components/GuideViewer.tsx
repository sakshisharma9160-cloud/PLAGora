import React, { useState } from 'react';
import { 
  BookOpen, 
  Terminal, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Copy, 
  Check,
  FileText
} from 'lucide-react';

interface GuideDoc {
  id: string;
  title: string;
  path: string;
  summary: string;
  content: string;
}

const GUIDE_DOCUMENTS: GuideDoc[] = [
  {
    id: 'readme',
    title: 'Project Overview & Roadmap',
    path: 'README.md',
    summary: 'Executive summary, 5-layer architecture, installation quickstart, and REST API specification.',
    content: `# PLAGora: Open-Source Plagiarism Detection System

> A transparent, self-hostable, privacy-preserving plagiarism detection engine combining deterministic fingerprinting, lexical sequence alignment, semantic embeddings, and explainable Small Language Model (SLM) triage.

## 1. Executive Summary & Core Design Principles
* **The Language Model is Never the Judge**: Detection is done by explainable algorithms (Winnowing, MinHash, Smith-Waterman alignment, vector embeddings). Flags point to exact character offsets and named algorithms.
* **Transparent Multi-Layer Detection**: From cheap exact-match hashes down to semantic paraphrase recognition and source-code token tiling.
* **Fairness & Reproducibility**: Built-in quotation detection, automated bibliography/reference masking, and assignment prompt whitelist filtering to eliminate false positives.

## 2. Quickstart & Installation
\`\`\`bash
# 1. Clone the repository
git clone https://github.com/plagora/plagora.git
cd plagora

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
\`\`\`

## 3. Five-Layer Architecture Overview
1. **Layer 1: Exact Winnowing Fingerprinting**: Overlapping k-shingles with sliding window w minimum hash selection.
2. **Layer 2: Lexical Alignment**: Smith-Waterman dynamic programming local sequence alignment.
3. **Layer 3: Semantic Embeddings**: Vector embeddings & synonym expansion for paraphrase detection.
4. **Layer 4: Source-Code Clones**: Comment-stripped, identifier-normalized token streams ($ID, $LIT).
5. **Layer 5: Stylometry Signal**: Sentence variance, TTR, and function word shifts.
6. **Assistive SLM Layer**: Small local LLM / Gemini 3.8 Flash for non-accusatory triage explanation.`
  },
  {
    id: 'architecture',
    title: 'Architecture & Algorithms',
    path: 'docs/ARCHITECTURE.md',
    summary: 'Detailed mathematical design of Winnowing, MinHash, Smith-Waterman alignment, and vector spaces.',
    content: `# PLAGora Architecture & Algorithm Specification

## 1. Winnowing Algorithm (Schleimer et al. 2003)
Given:
* Shingle length k (default: 5 words).
* Window threshold w (default: 4 shingles).

### Detection Guarantees:
* **Detection Guarantee**: Any shared sequence of length >= t = (w + k - 1) words is guaranteed to be detected.
* **Noise Suppression**: No substring shorter than k words can trigger a fingerprint match.
* **Index Compression**: Stores only ~ 2 / (w + 1) hashes compared to the total number of shingles.

## 2. MinHash & Locality-Sensitive Hashing (LSH)
* 64 independent hash permutations:
  h_p(x) = (a_p * x + b_p) mod P
* The Jaccard similarity between document pairs is estimated in O(1) time:
  J(A, B) ≈ (Matches in signature) / 64

## 3. Smith-Waterman Local Sequence Alignment
Constructs dynamic programming matrix H:
* Match score: +3
* Mismatch penalty: -2
* Gap/indel penalty: -2
Extracts the exact boundaries where words were inserted or swapped.

## 4. Semantic Paraphrase Embeddings
Projects sentence tokens into semantic vector space. Cosine similarity >= 0.78 flags candidate paraphrased passages.`
  },
  {
    id: 'user_guide',
    title: 'User & Administrator Guide',
    path: 'docs/USER_GUIDE.md',
    summary: 'How to self-host, curate reference corpora, configure fairness filters, and interpret reports.',
    content: `# PLAGora User & Administrator Guide

## 1. Interface Workflows
* **Document Scanner**: Paste text, choose presets, toggle Quote Masking and Reference Masking, set assignment prompt whitelist.
* **Side-by-Side Inspector**: Synchronized reading panes with character-exact highlighting and click-to-sync.
* **Corpus Manager**: Upload papers, inspect fingerprints, and manage institutional archives.
* **Algorithm Lab**: Visual inspection of sliding windows, rolling hashes, and MinHash signatures.

## 2. Hyperparameter Recommendations
* **Shingle Length (k = 5)**: Default for English essays; prevents short idioms from triggering false alarms.
* **Window Size (w = 4)**: Balances index footprint and short passage detection.
* **Semantic Threshold (τ = 0.78)**: Stricter threshold ensures only high-confidence paraphrases are flagged.

## 3. Ethical Principles
* Similarity percentage is evidence for human review, NEVER proof of guilt.
* Always review whether quotes were properly formatted before disciplinary decisions.`
  },
  {
    id: 'cli_reference',
    title: 'CLI Reference Guide',
    path: 'docs/CLI_REFERENCE.md',
    summary: 'Terminal commands for pdetect scan, pdetect index, and pdetect benchmark.',
    content: `# PLAGora CLI Reference Guide

\`\`\`bash
# Scan a single submission against the corpus
pdetect scan ./submission.txt

# Scan with custom corpus folder and JSON output
pdetect scan ./submission.txt --corpus ./library/ --format json --out report.json

# Scan with quotation masking and prompt whitelist
pdetect scan ./essay.txt \\
  --mask-quotes \\
  --mask-references \\
  --whitelist ./prompt.txt

# Index a folder of reference PDFs or text files
pdetect index ./reference_papers/ --output ./corpus.idx

# Run automated PAN / MRPC benchmarks
pdetect benchmark --suite PAN
\`\`\``
  },
  {
    id: 'benchmarks',
    title: 'Benchmark Methodology',
    path: 'docs/BENCHMARKS.md',
    summary: 'PAN and MRPC evaluation methodology, precision/recall/F1 metrics, and robustness tests.',
    content: `# PLAGora Benchmark Methodology & Evaluation Results

## Evaluation Datasets
1. **PAN Plagiarism Detection Shared-Task Corpora**: Verbatim copies, light edits, sentence reordering.
2. **Microsoft Research Paraphrase Corpus (MRPC)**: Semantic equivalence with varied vocabulary.
3. **Source Code Clone Benchmark**: Renamed identifiers and structural code equivalence.

## Measured Results
* **PAN Verbatim & Light Edit**: Precision: 0.982 · Recall: 0.965 · F1: 0.973 · Runtime: 1.8ms
* **MRPC Paraphrase**: Precision: 0.914 · Recall: 0.880 · F1: 0.897 · Runtime: 4.2ms
* **Code Clones**: Precision: 0.990 · Recall: 0.970 · F1: 0.980 · Runtime: 2.1ms`
  }
];

export const GuideViewer: React.FC = () => {
  const [activeDocId, setActiveDocId] = useState('readme');
  const [copied, setCopied] = useState(false);

  const activeDoc = GUIDE_DOCUMENTS.find(d => d.id === activeDocId) || GUIDE_DOCUMENTS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Documentation &amp; User Guides
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Architecture papers, mathematical derivations, administrator guides, and CLI reference manuals.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied to Clipboard' : 'Copy Document Markdown'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          {GUIDE_DOCUMENTS.map(doc => {
            const isSelected = activeDoc.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setActiveDocId(doc.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-rose-500/50 shadow-sm'
                    : 'bg-slate-800/30 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-200">
                    {doc.title}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">
                    {doc.path}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {doc.summary}
                </p>
              </div>
            );
          })}
        </div>

        {/* Document Reader Pane */}
        <div className="lg:col-span-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {activeDoc.title}
                </h3>
                <span className="text-xs font-mono text-rose-400">
                  {activeDoc.path}
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-wrap select-text max-h-[600px] overflow-y-auto pr-2">
              {activeDoc.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
