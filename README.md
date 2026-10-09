# PLAGora: Open-Source Plagiarism Detection System

> A transparent, self-hostable, privacy-preserving plagiarism detection engine combining deterministic fingerprinting, lexical sequence alignment, semantic embeddings, and explainable Small Language Model (SLM) triage.

---

## 1. Executive Summary & Design Principles

Commercial plagiarism detectors (Turnitin, Copyleaks, Grammarly) are closed black boxes with expensive institutional licenses, severe privacy risks (surrendering student intellectual property to private corporate databases), and opaque single-percentage scores without mathematical accountability.

**PLAGora** provides a fully open-source, local-first alternative built on three core pillars:

1. **The Language Model is Never the Judge**: Detection is powered by deterministic, mathematically verifiable algorithms (Winnowing, MinHash, Smith-Waterman alignment, vector embeddings). Flags point to exact character offsets and named algorithms.
2. **Transparent, Multi-Layer Detection**: From cheap exact-match hashes down to semantic paraphrase recognition and source-code token tiling.
3. **Fairness & Reproducibility**: Built-in quotation detection, automated bibliography/reference masking, and assignment prompt whitelist filtering to eliminate false positives.

---

## 2. Five-Layer Detection Architecture

```
                       +-------------------------------+
                       |    Document Ingestion &       |
                       | Unicode / Masking Filters     |
                       +---------------+---------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
         [Candidate Retrieval]                   [Submission Text]
         MinHash (64-perm LSH) &                 Sentence / Token offsets
         TF-IDF Cosine Pre-filter
                   |
                   +-------------------+-------------------+
                                       |
    +----------------------------------+----------------------------------+
    |                                  |                                  |
    v                                  v                                  v
[Layer 1: Exact Match]      [Layer 2: Lexical Match]     [Layer 3: Semantic Match]
Winnowing Algorithm         Smith-Waterman Alignment     Sentence Vector Embeddings
Rolling Hash / k-Shingles   Levenshtein Dist / BM25      Cosine Similarity >= 0.78
    |                                  |                                  |
    +----------------------------------+----------------------------------+
                                       |
    +----------------------------------+----------------------------------+
    |                                                                     |
    v                                                                     v
[Layer 4: Source Code Clones]                             [Layer 5: Stylometry Anomaly]
Normalized AST / Tokens ($VAR, $LIT)                      TTR, Hapax, Sentence Variance
    |                                                                     |
    +----------------------------------+----------------------------------+
                                       |
                                       v
                     +-----------------------------------+
                     | Score Aggregation & Priority Map  |
                     | Exact > Code > Lexical > Semantic |
                     +-----------------+-----------------+
                                       |
                                       v
                     +-----------------------------------+
                     |  Optional SLM Triage & Attribution|
                     |  (Assists human, does not judge)  |
                     +-----------------+-----------------+
                                       |
                                       v
                     +-----------------------------------+
                     | Side-by-Side Explainable Report   |
                     | Interactive UI / JSON Export      |
                     +-----------------------------------+
```

### Detection Layers:
* **Layer 1: Deterministic Winnowing (MOSS-style)**: Overlapping $k$-shingles with sliding window $w$ minimum hash selection. Detects exact verbatim copies $\ge (w + k - 1)$ tokens with zero false negatives.
* **Layer 2: Lexical Sequence Alignment**: Smith-Waterman dynamic programming local alignment for passages with minor edits, insertions, and word swaps.
* **Layer 3: Semantic Embeddings**: Multi-dimensional semantic sentence projection and synonym cluster expansion to flag conceptual paraphrasing and heavy rewording.
* **Layer 4: Source-Code Clones**: Comment-stripped, identifier-normalized token streams ($ID, $LIT) to detect renamed variable copies.
* **Layer 5: Stylometric Signal**: Sentence length standard deviation, Type-Token Ratio (TTR), and function word frequency shifts.
* **Assistive SLM Layer**: Small local LLM or server-side Gemini 3.8 Flash providing structured JSON classifications (`quotation`, `close_copy`, `paraphrase`, `common_phrasing`, `unrelated`) and attribution checks.

---

## 3. Quickstart & Installation

### Prerequisites
* Node.js v20+ and npm (or Python 3.10+ for Python SDK)
* Modern web browser

### Running the Full-Stack Web Application
```bash
# Clone the repository
git clone https://github.com/openplag/openplag.git
cd openplag

# Install dependencies
npm install

# Start the development server (runs full-stack on http://localhost:3000)
npm run dev

# Or build for production
npm run build
npm start
```

### Environment Configuration (`.env`)
```bash
# Optional: GEMINI_API_KEY for assistive Small Language Model (SLM) explanations.
# If omitted, PLAGora automatically uses the built-in deterministic offline SLM heuristic.
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
```

---

## 4. REST API Reference

### `POST /api/scan`
Executes the multi-layer detection pipeline against the indexed corpus.

**Request Body:**
```json
{
  "title": "Student Essay on Marine Ecology",
  "text": "Ocean acidification represents one of the most critical anthropogenic threats...",
  "config": {
    "shingleK": 5,
    "windowSizeW": 4,
    "minMatchWords": 5,
    "semanticThreshold": 0.78,
    "maskQuotes": true,
    "maskReferences": true,
    "whitelistText": "ASSIGNMENT PROMPT: Write an analysis on ocean chemistry.",
    "enableSemantic": true,
    "enableCodeNormalization": true,
    "enableStylometry": true,
    "enableSLM": true
  }
}
```

**Response:**
```json
{
  "id": "report-1712000000000",
  "overallSimilarityPercent": 48.5,
  "unmaskedChars": 1250,
  "matchedChars": 606,
  "layerBreakdown": {
    "exactWinnowing": 340,
    "lexicalAlignment": 150,
    "semanticParaphrase": 116,
    "codeClones": 0
  },
  "matches": [
    {
      "id": "match-winnow-1",
      "sourceDocTitle": "Ocean Acidification and Marine Biodiversity in Coral Reef Ecosystems",
      "method": "winnowing",
      "subStart": 112,
      "subEnd": 452,
      "confidence": 0.99,
      "subText": "...",
      "srcText": "..."
    }
  ]
}
```

### `POST /api/slm-explain`
Requests an assistive, non-accusatory triage explanation for a matched passage pair.

**Request Body:**
```json
{
  "passageA": "Hard corals depend on the saturation state of calcium carbonate minerals...",
  "passageB": "Scleractinian corals rely on the saturation state of calcium carbonate minerals...",
  "sourceTitle": "Marine Coral Ecosystems Research"
}
```

**Response:**
```json
{
  "category": "paraphrase",
  "explanation": "Passage presents the same core claims using synonym substitutions (hard corals -> scleractinian corals) and syntax simplification.",
  "confidence": 0.88,
  "isProperlyAttributed": false,
  "provider": "Gemini 3.8 Flash (SLM Assisted)"
}
```

---

## 5. Guide Files in this Repository

* [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): Detailed algorithm specifications (Winnowing mathematical guarantees, MinHash LSH, Smith-Waterman alignment, vector space math).
* [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md): Self-hosting guide, corpus curation, adjusting thresholds ($k$, $w$, $\tau$), quote masking, and report interpretation.
* [`docs/BENCHMARKS.md`](docs/BENCHMARKS.md): PAN-Plagiarism and MRPC evaluation results, passage-level Precision, Recall, and F1 metrics.
* [`docs/CLI_REFERENCE.md`](docs/CLI_REFERENCE.md): Command-line interface syntax for batch folder scanning, corpus indexing, and benchmark tests.

---

## 6. License & Academic Attribution

Distributed under the **Apache 2.0 License** with explicit patent grant. Designed to support teachers, open-access journals, and research institutions worldwide.
