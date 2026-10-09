import React, { useState } from 'react';
import { 
  ScanReport, 
  DetectorConfig 
} from '../types/detector';
import { PRESET_SUBMISSIONS } from '../data/sampleCorpus';
import { 
  Sliders, 
  ShieldCheck, 
  FileCheck, 
  Layers, 
  ArrowRight, 
  HelpCircle,
  Code2,
  FileCode,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface ScannerViewProps {
  submissionTitle: string;
  setSubmissionTitle: (val: string) => void;
  submissionText: string;
  setSubmissionText: (val: string) => void;
  config: DetectorConfig;
  setConfig: React.Dispatch<React.SetStateAction<DetectorConfig>>;
  report: ScanReport | null;
  isScanning: boolean;
  onRunScan: () => void;
  onSelectInspectSource: (sourceDocId: string) => void;
}

export const ScannerView: React.FC<ScannerViewProps> = ({
  submissionTitle,
  setSubmissionTitle,
  submissionText,
  setSubmissionText,
  config,
  setConfig,
  report,
  isScanning,
  onRunScan,
  onSelectInspectSource
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const wordCount = submissionText.trim() ? submissionText.trim().split(/\s+/).length : 0;
  const charCount = submissionText.length;

  const handleLoadPreset = (presetId: string) => {
    const preset = PRESET_SUBMISSIONS.find(p => p.id === presetId);
    if (preset) {
      setSubmissionTitle(preset.name);
      setSubmissionText(preset.text);
      if (preset.whitelistPrompt) {
        setConfig(prev => ({ ...prev, whitelistText: preset.whitelistPrompt || '' }));
      } else {
        setConfig(prev => ({ ...prev, whitelistText: '' }));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Preset Selector Bar */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-300">
              Load Test Presets:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PRESET_SUBMISSIONS.map(p => (
              <button
                key={p.id}
                onClick={() => handleLoadPreset(p.id)}
                className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-700 border border-slate-700/80 rounded-md transition-colors truncate max-w-[210px]"
                title={p.description}
              >
                {p.name.split('(')[0].trim()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Text Input & Submission Info */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Document / Submission Title
              </label>
              <input
                type="text"
                value={submissionTitle}
                onChange={e => setSubmissionTitle(e.target.value)}
                placeholder="e.g. Student Research Paper - Transformer Architectures"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-400">
                  Submission Text Content
                </label>
                <div className="text-[12px] text-slate-400 font-mono tabular-nums">
                  {wordCount.toLocaleString()} words · {charCount.toLocaleString()} chars
                </div>
              </div>
              <textarea
                value={submissionText}
                onChange={e => setSubmissionText(e.target.value)}
                rows={12}
                placeholder="Paste the document text, code, or essay to inspect for plagiarism..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-y"
              />
            </div>

            {/* Assignment Whitelist Text (e.g. Prompt Questions) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Assignment Prompt / Template Whitelist (Optional)
                </label>
                <span className="text-[11px] text-slate-500">
                  Text matching this will be masked out of plagiarism score
                </span>
              </div>
              <textarea
                value={config.whitelistText}
                onChange={e => setConfig(prev => ({ ...prev, whitelistText: e.target.value }))}
                rows={2}
                placeholder="Paste assignment questions, lab prompts, or required institutional boilerplate to exclude..."
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-lg p-2.5 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Preprocessing & Algorithm Configuration */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Fairness & Algorithm Tuning
                </h3>
              </div>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
              </button>
            </div>

            {/* Fairness Filters (Toggles) */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Fairness Preprocessing Filters
              </span>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <div>
                  <span className="font-medium text-slate-200 block">Mask Quoted Text</span>
                  <span className="text-[11px] text-slate-400">Exclude passages in &quot;...&quot; or &gt; quotes</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.maskQuotes}
                  onChange={e => setConfig(prev => ({ ...prev, maskQuotes: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <div>
                  <span className="font-medium text-slate-200 block">Mask References & Citations</span>
                  <span className="text-[11px] text-slate-400">Exclude bibliographies and [1] brackets</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.maskReferences}
                  onChange={e => setConfig(prev => ({ ...prev, maskReferences: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <div>
                  <span className="font-medium text-slate-200 block">Semantic Paraphrase Engine</span>
                  <span className="text-[11px] text-slate-400">Sentence embeddings &amp; synonym mapping</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableSemantic}
                  onChange={e => setConfig(prev => ({ ...prev, enableSemantic: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <div>
                  <span className="font-medium text-slate-200 block">Source-Code Normalization</span>
                  <span className="text-[11px] text-slate-400">Normalize variables ($VAR, $LIT)</span>
                </div>
                <input
                  type="checkbox"
                  checked={config.enableCodeNormalization}
                  onChange={e => setConfig(prev => ({ ...prev, enableCodeNormalization: e.target.checked }))}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
              </label>
            </div>

            {/* Advanced Tuners */}
            {showAdvanced && (
              <div className="pt-3 border-t border-slate-700/60 space-y-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Deterministic Math Parameters
                </span>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">Shingle Length (k-words)</span>
                    <span className="font-mono text-indigo-400">{config.shingleK} words</span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={8}
                    value={config.shingleK}
                    onChange={e => setConfig(prev => ({ ...prev, shingleK: parseInt(e.target.value, 10) }))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>3 (Sensitive)</span>
                    <span>8 (Strict)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">Winnowing Window (w)</span>
                    <span className="font-mono text-indigo-400">{config.windowSizeW} shingles</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={8}
                    value={config.windowSizeW}
                    onChange={e => setConfig(prev => ({ ...prev, windowSizeW: parseInt(e.target.value, 10) }))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>2 (Dense index)</span>
                    <span>8 (Compact)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">Semantic Paraphrase Threshold (τ)</span>
                    <span className="font-mono text-indigo-400">{config.semanticThreshold.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0.65}
                    max={0.90}
                    step={0.01}
                    value={config.semanticThreshold}
                    onChange={e => setConfig(prev => ({ ...prev, semanticThreshold: parseFloat(e.target.value) }))}
                    className="w-full accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0.65 (Fuzzy)</span>
                    <span>0.90 (Exact)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Run Button in Side Panel */}
            <button
              onClick={onRunScan}
              disabled={isScanning || !submissionText.trim()}
              className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              {isScanning ? 'Executing Multi-Layer Audit...' : 'Execute Plagiarism Scan'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary Section (when report is available) */}
      {report && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Audit Findings: {report.submissionTitle}
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  {report.timestamp.slice(0, 10)} · {report.durationMs}ms
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                <span>Total chars: {report.totalChars.toLocaleString()}</span>
                <span>·</span>
                <span>Unmasked chars: {report.unmaskedChars.toLocaleString()}</span>
                <span>·</span>
                <span>Matched chars: {report.matchedChars.toLocaleString()}</span>
              </div>
            </div>

            {/* Overall Score Dial */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                  Overall Overlap
                </span>
                <span className={`text-2xl font-bold font-mono tabular-nums ${
                  report.overallSimilarityPercent > 40
                    ? 'text-rose-400'
                    : report.overallSimilarityPercent > 15
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {report.overallSimilarityPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Layer Breakdown Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-400 mb-1">Exact Winnowing</div>
              <div className="text-base font-bold font-mono text-emerald-400">
                {report.layerBreakdown.exactWinnowing.toLocaleString()} <span className="text-xs font-normal text-slate-400">chars</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">MOSS hash collision</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-400 mb-1">Lexical Alignment</div>
              <div className="text-base font-bold font-mono text-amber-400">
                {report.layerBreakdown.lexicalAlignment.toLocaleString()} <span className="text-xs font-normal text-slate-400">chars</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Smith-Waterman edits</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-400 mb-1">Semantic Paraphrase</div>
              <div className="text-base font-bold font-mono text-indigo-400">
                {report.layerBreakdown.semanticParaphrase.toLocaleString()} <span className="text-xs font-normal text-slate-400">chars</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Synonym &amp; vector cosine</div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
              <div className="text-[11px] text-slate-400 mb-1">Source Code Clones</div>
              <div className="text-base font-bold font-mono text-cyan-400">
                {report.layerBreakdown.codeClones.toLocaleString()} <span className="text-xs font-normal text-slate-400">chars</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Normalized token tiling</div>
            </div>
          </div>

          {/* Top Sources Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Matched Reference Sources ({report.topSources.length})
            </h3>

            {report.topSources.length === 0 ? (
              <div className="text-xs text-slate-400 py-3 italic">
                No significant overlap detected against the reference corpus. Document appears original.
              </div>
            ) : (
              <div className="border border-slate-700/80 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-mono border-b border-slate-700/80">
                    <tr>
                      <th className="py-2 px-3 font-medium">Source Document</th>
                      <th className="py-2 px-3 font-medium text-right">Matched Chars</th>
                      <th className="py-2 px-3 font-medium text-right">Similarity</th>
                      <th className="py-2 px-3 font-medium text-right">Passages</th>
                      <th className="py-2 px-3 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {report.topSources.map(src => (
                      <tr key={src.docId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-200">
                          {src.docTitle}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                          {src.matchedChars.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-indigo-400">
                          {src.similarityPercent}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                          {src.matchCount}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => onSelectInspectSource(src.docId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-700/50 rounded transition-colors"
                          >
                            Side-by-Side
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Stylometry Profiling (if enabled) */}
          {report.stylometryStats && (
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-300">
                  Stylometric Analysis (Layer 5)
                </span>
                {report.stylometryStats.styleShiftDetected ? (
                  <span className="flex items-center gap-1 text-amber-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Internal stylistic variation detected
                  </span>
                ) : (
                  <span className="text-emerald-400 font-medium">
                    Consistent authorial style
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400 font-mono">
                <div>Avg Sentence Len: <span className="text-slate-200">{report.stylometryStats.avgSentenceLength}</span></div>
                <div>Len StdDev: <span className="text-slate-200">{report.stylometryStats.sentenceLengthStdDev}</span></div>
                <div>Type-Token Ratio: <span className="text-slate-200">{report.stylometryStats.typeTokenRatio}</span></div>
                <div>Hapax Ratio: <span className="text-slate-200">{report.stylometryStats.hapaxRatio}</span></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
