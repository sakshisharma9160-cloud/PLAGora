# PLAGora CLI Reference Guide

The PLAGora Command-Line Interface (`pdetect`) enables batch document audits, corpus indexing, and benchmark executions from headless servers, automated CI/CD pipelines, or shell scripts.

---

## 1. Installation

```bash
# Run directly via Node / tsx
npx tsx src/cli.ts [command] [options]

# Or via Python package (planned in Phase 1 roadmap)
pip install pdetect
pdetect --help
```

---

## 2. Command Overview

### `pdetect scan`
Compares a target file or folder against the indexed reference corpus.

```bash
# Basic single file scan
pdetect scan path/to/submission.txt

# Scan with custom corpus directory
pdetect scan path/to/submission.txt --corpus ./reference_corpus/

# Scan with quotation masking and assignment whitelist
pdetect scan submission.txt \
  --mask-quotes \
  --mask-references \
  --whitelist ./prompts/assignment1.txt \
  --format json \
  --out report.json
```

**Options:**
* `-k, --shingle-k <num>`: Shingle word length (default: `5`).
* `-w, --window-w <num>`: Winnowing window size (default: `4`).
* `-t, --threshold <num>`: Semantic similarity threshold (default: `0.78`).
* `--mask-quotes`: Mask text in quotation marks (default: `true`).
* `--mask-references`: Mask References/Bibliography sections (default: `true`).
* `--whitelist <path>`: Path to text file containing prompt or boilerplate text.
* `--format <type>`: Output format: `terminal`, `json`, or `html` (default: `terminal`).
* `--explain`: Request Small Language Model (SLM) triage explanation for flagged matches.

---

### `pdetect index`
Generates fingerprints and MinHash signatures for a directory of reference documents.

```bash
# Index a folder of reference papers
pdetect index ./corpus_folder/ --output ./corpus.idx

# View corpus statistics
pdetect index --inspect ./corpus.idx
```

---

### `pdetect benchmark`
Executes automated accuracy and latency benchmarks against PAN and MRPC test suites.

```bash
# Run all benchmark suites
pdetect benchmark

# Run specific suite with detailed passage breakdown
pdetect benchmark --suite PAN --verbose
```
