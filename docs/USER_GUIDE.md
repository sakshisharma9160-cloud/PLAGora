# PLAGora User & Administrator Guide

This guide explains how to operate, configure, and self-host PLAGora for university departments, research institutions, and independent instructors.

---

## 1. Quick Navigation & Interface Walkthrough

PLAGora features primary operational views:

### A. Document Scanner (`/`)
* **Text Input**: Paste student submission or upload files (`.txt`, `.md`, `.py`).
* **Preset Demonstrations**: Test with pre-configured samples (Direct Copy-Paste, Synonym Paraphrasing, Mixed Essay with Quotes, Python Code Clone, Clean Original).
* **Fairness Settings Drawer**:
  - `Mask Quoted Text`: Automatically excludes passages in double quotes or blockquotes from plagiarism percentages.
  - `Mask References & Bibliography`: Excludes references lists and in-text citation brackets (`[1]`, `(Smith et al., 2021)`).
  - `Assignment Prompt Whitelist`: Paste instructions or boilerplate questions to prevent students from being penalized for repeating prompt text.
* **Algorithm Hyperparameters**:
  - Shingle length $k$ (3–8 words, default: 5).
  - Winnowing window size $w$ (2–8 shingles, default: 4).
  - Semantic similarity threshold $\tau$ (0.60–0.90, default: 0.78).

### B. Interactive Side-by-Side Inspector
* Synchronized side-by-side view showing **Submission Text** (left pane) and matched **Source Document** (right pane).
* Color-coded highlights:
  - **Emerald / Cyan**: Exact Winnowing fingerprint collision.
  - **Amber / Orange**: Lexical sequence alignment (Smith-Waterman).
  - **Indigo / Purple**: Semantic paraphrase embedding match.
  - **Blue**: Source-code normalized clone.
  - **Muted Gray**: Masked quote or whitelist text (neutralized from penalty).
* **Click-to-Inspect**: Clicking any highlighted passage instantly scrolls the opposing document into view and opens the detailed algorithmic metadata card.

### C. Corpus Manager (`/corpus`)
* Upload, index, and organize reference documents.
* View total tokens, indexed fingerprints, and MinHash signatures.
* One-click Reset to restore standard academic reference papers.

### D. Algorithm Benchmarks & Evaluation (`/benchmarks`)
* Run reproducible test cases across PAN Plagiarism, MRPC Paraphrase, and Code-Clone suites.
* Live calculation of **Precision**, **Recall**, **F1 Score**, and **Average Runtime (ms)**.

---

## 2. Tuning Detection Hyperparameters

| Parameter | Recommended Setting | Effect of Increasing | Effect of Decreasing |
| :--- | :--- | :--- | :--- |
| **Shingle length ($k$)** | 5 words | Stricter; ignores shorter common phrases. May miss small 3-word phrase copies. | More sensitive; catches tiny 3-word runs, but increases false positives on common idioms. |
| **Window size ($w$)** | 4 shingles | Smaller fingerprint index, faster comparisons. | Denser index, detects shorter fragments down to $k$ words. |
| **Semantic threshold ($\tau$)** | 0.78 | Only flags heavily synonymous sentences. | Flags more loose paraphrases; requires more human review. |
| **Min Match Words** | 5 words | Suppresses tiny incidental phrase overlap. | Captures very small partial fragments. |

---

## 3. Interpreting Reports Responsibly

> **Ethical Principle**: Similarity is evidence, NOT proof of academic dishonesty.

1. **Check Masked Spans**: Verify whether flagged text was actually a quoted passage where quotation marks were accidentally misplaced.
2. **Review SLM Explanations**: Use the SLM card to assess whether the overlap is `common_phrasing` (domain terminology) rather than `close_copy`.
3. **Inspect the Source Document**: Click the passage in the side-by-side inspector to review the full context of the original author.
4. **Export Auditable Evidence**: Use the **Export JSON** or **Export HTML Report** button to share a verifiable, reproducible packet with academic integrity committees.
