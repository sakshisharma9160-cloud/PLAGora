import React, { useState, useMemo } from 'react';
import { 
  tokenizeWithOffsets 
} from '../engine/textUtils';
import { 
  generateShingles, 
  winnow, 
  computeMinHashSignature, 
  hashString 
} from '../engine/winnowing';
import { 
  Sliders, 
  Hash, 
  Cpu, 
  Layers, 
  Activity, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const AlgorithmLabView: React.FC = () => {
  const [demoText, setDemoText] = useState(
    'The Transformer network architecture is based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. In scaled dot-product attention, the input consists of queries, keys, and values.'
  );
  const [k, setK] = useState(4);
  const [w, setW] = useState(3);

  // Compute live tokens
  const tokens = useMemo(() => tokenizeWithOffsets(demoText), [demoText]);

  // Compute live shingles
  const shingles = useMemo(() => generateShingles(tokens, k), [tokens, k]);

  // Compute winnowed fingerprints
  const fingerprints = useMemo(() => winnow(shingles, w), [shingles, w]);

  // Compute MinHash signature
  const minHashSig = useMemo(
    () => computeMinHashSignature(shingles.map(s => s.hash)),
    [shingles]
  );

  const selectedHashMap = useMemo(() => {
    const set = new Set<number>();
    for (const fp of fingerprints) set.add(fp.hash);
    return set;
  }, [fingerprints]);

  // Mathematical detection guarantee:
  const guaranteedDetectionWords = w + k - 1;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Algorithm Mathematical Workbench &amp; Interactive Lab
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          Step-by-step visual dissection of the Winnowing algorithm, sliding window minimums, and MinHash permutations.
        </p>
      </div>

      {/* Interactive Controls & Input */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Interactive Test String
            </label>
            <textarea
              rows={3}
              value={demoText}
              onChange={e => setDemoText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
            />

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pt-1">
              <span>Tokens: <strong className="text-white">{tokens.length}</strong></span>
              <span>·</span>
              <span>Shingles: <strong className="text-white">{shingles.length}</strong></span>
              <span>·</span>
              <span>Winnowed Hashes: <strong className="text-amber-400">{fingerprints.length}</strong></span>
              <span>·</span>
              <span>Index Compression: <strong className="text-emerald-400">
                {shingles.length > 0 ? `${Math.round((1 - fingerprints.length / shingles.length) * 100)}%` : '0%'}
              </strong></span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Winnowing Hyperparameters
            </h3>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Shingle Length (k)</span>
                <span className="font-mono text-amber-400 font-semibold">{k} words</span>
              </div>
              <input
                type="range"
                min={2}
                max={6}
                value={k}
                onChange={e => setK(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500"
              />
              <span className="text-[10px] text-slate-500">Noise threshold: matches &lt; {k} words ignored</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Window Size (w)</span>
                <span className="font-mono text-amber-400 font-semibold">{w} shingles</span>
              </div>
              <input
                type="range"
                min={2}
                max={6}
                value={w}
                onChange={e => setW(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500"
              />
              <span className="text-[10px] text-slate-500">Sliding frame width</span>
            </div>

            <div className="bg-amber-950/30 border border-amber-900/60 rounded-lg p-3 text-xs">
              <div className="text-amber-300 font-semibold mb-1">Schleimer et al. Invariant:</div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                Guarantee: Any match $\ge$ <strong>{guaranteedDetectionWords} words</strong> ($w + k - 1 = {w} + {k} - 1$) is guaranteed to be detected.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Winnowing Shingle & Hash Breakdown Table */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Shingle Rolling Hashes &amp; Selected Fingerprints
          </h3>
          <span className="text-[11px] text-slate-400">
            Highlighted rows are the selected minimums in each sliding window of {w}
          </span>
        </div>

        <div className="border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2 px-3 w-12 text-center">#</th>
                <th className="py-2 px-3">Word {k}-Shingle</th>
                <th className="py-2 px-3 text-right">FNV-1a Hash</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {shingles.map((sh, idx) => {
                const isSelected = selectedHashMap.has(sh.hash);
                return (
                  <tr
                    key={idx}
                    className={isSelected ? 'bg-amber-500/10 text-amber-200' : 'text-slate-400 hover:bg-slate-800/30'}
                  >
                    <td className="py-1.5 px-3 text-center text-slate-500">
                      {idx}
                    </td>
                    <td className="py-1.5 px-3 font-sans text-slate-200 font-medium">
                      &ldquo;{sh.shingle}&rdquo;
                    </td>
                    <td className="py-1.5 px-3 text-right">
                      {sh.hash.toString(16).toUpperCase()}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      {isSelected ? (
                        <span className="text-[10px] font-bold uppercase text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                          Fingerprint
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600">Suppressed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MinHash Signature Grid */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            MinHash 64-Permutation Signature Vector (LSH Bucket)
          </h3>
          <span className="text-[11px] text-slate-400">
            Permutations: $h_p(x) = (a_p \cdot x + b_p) \pmod P$
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-16 gap-1.5">
          {minHashSig.map((val, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded p-1 text-center font-mono text-[10px] text-cyan-400 truncate"
              title={`Permutation ${idx}: ${val}`}
            >
              {val.toString(16).slice(-4)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
