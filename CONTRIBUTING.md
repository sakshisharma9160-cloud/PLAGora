# Contributing to OpenPlag

Thank you for your interest in improving OpenPlag, the open-source, explainable plagiarism detection engine.

## Code of Conduct & Core Design Principles

1. **The Language Model is Never the Judge**: All plagiarism detections must be grounded in mathematically verifiable algorithms (Winnowing, MinHash, Smith-Waterman alignment, vector cosine similarity). Contributions that make an LLM the arbiter of guilt will be rejected.
2. **Privacy First**: Never commit real student work. Always use synthetic or openly licensed test corpora.
3. **Public Benchmarking**: Accuracy claims must be accompanied by reproducible test results on PAN, MRPC, or the benchmark suite in `/benchmarks`.

## Development Setup

```bash
git clone https://github.com/openplag/openplag.git
cd openplag
npm install
npm run dev
```

## Pull Request Guidelines

1. Ensure `npm run lint` and `npm run build` pass without warnings.
2. If introducing or tuning algorithm thresholds, include corresponding benchmark results in `docs/BENCHMARKS.md`.
3. Adhere to the Apache 2.0 license.
