# PLAGora Architecture & Algorithm Specification

This document details the mathematical design and algorithmic implementation of each layer in the PLAGora engine.

---

## 1. Preprocessing & Text Normalization Pipeline

Plagiarism detection requires retaining precise character offsets $[start, end]$ so that highlights in the original submission map 1:1 onto the source document.

1. **Unicode NFKC Normalization**:
   Resolves homoglyph attacks (e.g. Cyrillic `а` / `о` substituted for Latin `a` / `o`), zero-width spaces (`\u200B`), and ligatures.
2. **Quotation Masking**:
   Identifies matching pairs of quotes (`"..."`, `“...”`, `‘...’`, blockquote `> ...`). Characters falling within quotation spans are marked with a mask flag and excluded from plagiarism percentage tallies.
3. **Bibliography & Reference Stripping**:
   Locates terminal bibliography sections (e.g. `References:`, `Works Cited:`, `Bibliography:`) as well as inline bracketed citations (`[1]`, `(Smith et al., 2021)`).
4. **Institutional Whitelist Masking**:
   Educators frequently include essay prompts or lab starter templates in their instructions. Any substring registered in the active whitelist is dynamically masked out.

---

## 2. Layer 1: Deterministic Fingerprinting (Winnowing & MinHash)

### The Winnowing Algorithm (Schleimer et al. 2003)
Winnowing is the algorithm behind Stanford MOSS. Given:
* Shingle length $k$ (default: 5 words).
* Window threshold $w$ (default: 4 shingles).

#### Algorithm:
1. Tokenize text into normalized tokens: $T = [t_0, t_1, \dots, t_n]$.
2. Form word $k$-shingles: $s_i = (t_i, t_{i+1}, \dots, t_{i+k-1})$.
3. Hash each shingle using 32-bit FNV-1a: $h_i = \text{hash}(s_i)$.
4. In each sliding window of length $w$:
   $$W_i = [h_i, h_{i+1}, \dots, h_{i+w-1}]$$
   select the minimum hash. In the event of a tie, select the rightmost minimum.
5. Record selected tuple $(\text{hash}, \text{position}, \text{charStart}, \text{charEnd})$.

#### Guarantees:
* **Detection Guarantee**: Any shared sequence of length $\ge t = (w + k - 1)$ words is guaranteed to be detected.
* **Noise Suppression**: No substring shorter than $k$ words can trigger a fingerprint match.
* **Index Compression**: Stores only $\approx \frac{2}{w+1}$ hashes compared to the total number of shingles.

### MinHash & Locality-Sensitive Hashing (LSH)
To search hundreds or thousands of corpus documents in sub-linear time:
* Compute 64 independent hash permutations:
  $$h_p(x) = (a_p \cdot x + b_p) \pmod P$$
* MinHash signature $\vec{S}_D$ records $\min_{x \in D} h_p(x)$ for each permutation $p$.
* The Jaccard similarity is estimated by:
  $$J(D_1, D_2) \approx \frac{1}{64} \sum_{p=1}^{64} \mathbb{I}(\vec{S}_{D_1}[p] == \vec{S}_{D_2}[p])$$

---

## 3. Layer 2: Lexical Sequence Alignment

### TF-IDF Document Ranking
Term Frequency uses sublinear logarithmic scaling to avoid over-weighting long documents:
$$\text{TF}(t, d) = 1 + \ln(\text{count}(t, d))$$
$$\text{Cosine}(A, B) = \frac{\sum \text{TF}_A(t) \cdot \text{TF}_B(t)}{\|\vec{TF}_A\| \cdot \|\vec{TF}_B\|}$$

### Smith-Waterman Local Alignment
For candidate passages identified with lexical similarity, a dynamic programming matrix $H$ is constructed:
$$H_{i, j} = \max \begin{cases}
0 \\
H_{i-1, j-1} + s(a_i, b_j) & \text{(Match: } +3, \text{ Mismatch: } -2) \\
H_{i-1, j} - 2 & \text{(Deletion penalty)} \\
H_{i, j-1} - 2 & \text{(Insertion penalty)}
\end{cases}$$
The traceback from $\max(H)$ produces the exact contiguous span of text where word insertions or synonym swaps occurred.

---

## 4. Layer 3: Semantic Embeddings (Paraphrase Detection)

When a student rewrites an essay using an automated paraphraser or synonym-spinner:
* Token overlap drops, defeating basic string matching.
* Sentence-level semantic embeddings project sentences into dense vector spaces ($\mathbb{R}^{64}$ or $\mathbb{R}^{384}$).
* Cosine similarity is evaluated:
  $$\text{sim}(S_A, S_B) = \frac{S_A \cdot S_B}{\|S_A\| \|S_B\|}$$
* Pairs with $\text{sim} \ge \tau$ (default: 0.78) are flagged as candidate paraphrases.

---

## 5. Layer 4: Source-Code Clone Detection

Programming assignments require syntax-aware tokenization:
* Comments (`#`, `//`, `/* */`) are stripped.
* Variable names, function names, and identifiers are mapped to `$VAR`.
* Literal numbers and strings are mapped to `$LIT`.
* Language keywords (`def`, `class`, `for`, `if`, `while`, `return`) are preserved.
* Winnowing is executed over the normalized token stream, making identifier renaming completely ineffective at evading detection.

---

## 6. Layer 5: Stylometry Anomaly Detection

Stylometry detects abrupt shifts in writing style across a single document:
1. **Sentence Length Variance**: Standard deviation of word counts per sentence.
2. **Type-Token Ratio (TTR)**: Vocabulary richness $|V| / N$.
3. **Hapax Legomena Ratio**: Percentage of words occurring exactly once.
4. **Function Word Distribution**: Pronouns and preposition ratios across sliding windows of sentences.
*An abrupt shift in style flags an internal consistency warning for the human reviewer.*

---

## 7. Layer 6: Small Language Model (SLM) Triage

Section 6 of the report strictly outlines the role of the language model:
> **Core Rule: The language model is never the judge.** LLM outputs are non-deterministic, can hallucinate, and are not auditable in the way that a hash match is. The SLM only helps humans interpret results.

* **Prompt Isolation**: Passages are delimited with strict data envelopes. Document instructions inside passages are ignored (prompt injection defense).
* **Schema Validation**: Returns structured JSON with fields `category`, `explanation` (max 2 sentences), `confidence`, and `isProperlyAttributed`.
* **Categories**:
  1. `quotation`: Enclosed in quotation marks with citation.
  2. `close_copy`: Verbatim or near-verbatim text duplication.
  3. `paraphrase`: Same underlying logic and evidence with reworded vocabulary.
  4. `common_phrasing`: Boilerplate or standard transitional idiom.
  5. `unrelated`: Superficial vocabulary overlap without conceptual relation.
