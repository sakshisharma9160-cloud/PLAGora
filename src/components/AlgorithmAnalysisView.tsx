import React, { useState } from 'react';
import { ScanReport } from '../types/detector';
import { 
  Calculator, 
  CheckCircle2, 
  Layers, 
  HelpCircle, 
  Sliders, 
  Sparkles, 
  FileText, 
  ArrowRight,
  TrendingUp,
  Percent,
  Check
} from 'lucide-react';

interface AlgorithmAnalysisViewProps {
  report: ScanReport | null;
  onOpenScanner?: () => void;
}

export const AlgorithmAnalysisView: React.FC<AlgorithmAnalysisViewProps> = ({
  report,
  onOpenScanner
}) => {
  const [interactiveWords, setInteractiveWords] = useState(150);
  const [interactiveMatched, setInteractiveMatched] = useState(60);

  const calculatedScore = Math.min(100, Math.round((interactiveMatched / Math.max(1, interactiveWords)) * 100));
  const calculatedOriginality = 100 - calculatedScore;

  // Real report calculations if available
  const reportTotalWords = report ? Math.round(report.unmaskedChars / 5.5) : 240;
  const reportMatchedWords = report ? Math.round(report.matchedChars / 5.5) : 108;
  const reportScore = report ? report.overallSimilarityPercent : 45;
  const reportOriginality = 100 - reportScore;

  return (
    <div className="space-y-8 py-2">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-700/50 p-6 sm:p-8 space-y-3 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-indigo-300">
          <Calculator className="w-3.5 h-3.5" />
          <span>Simple &amp; Explainable Mathematics</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Analysis &amp; Score Calculation
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          PLAGora uses simple, transparent algorithms so you always know <strong>exactly how the plagiarism score was calculated</strong>. No opaque black-box AI guessing.
        </p>
      </div>

      {/* 1. Core Mathematical Formula */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              How the Score is Calculated
            </h2>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
            Standard 0 – 100% Scale
          </span>
        </div>

        {/* Clean Formula Card */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-900/50 rounded-xl p-6 text-center space-y-3">
          <div className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
            Universal Calculation Formula
          </div>

          <div className="inline-block bg-slate-900/90 border border-slate-700/80 rounded-xl px-6 py-4 font-mono text-sm sm:text-lg font-bold text-slate-100 shadow-inner">
            <span className="text-rose-400">Plagiarism Score</span> = 
            <span className="text-cyan-300 ml-2">Matched Words</span> ÷ 
            <span className="text-white mx-1">Total Unmasked Words</span> × 
            <span className="text-amber-300 ml-1">100</span>
          </div>

          <div className="text-xs text-slate-400 max-w-lg mx-auto">
            Quotations in &quot;...&quot; and reference citations [1] are automatically masked out so they never penalize legitimate academic writing.
          </div>
        </div>

        {/* Active Audit Score Card (if report exists) */}
        {report && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">
                Active Audit Calculation: &ldquo;{report.submissionTitle}&rdquo;
              </span>
              <span className="text-xs font-mono text-slate-400">
                Total Words: ~{reportTotalWords}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="bg-slate-900 border border-rose-900/40 rounded-xl p-4">
                <div className="text-xs text-rose-300 font-semibold mb-1">Plagiarism Score</div>
                <div className="text-3xl font-extrabold font-mono text-rose-400">
                  {reportScore}%
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Matched content</div>
              </div>

              <div className="bg-slate-900 border border-emerald-900/40 rounded-xl p-4">
                <div className="text-xs text-emerald-300 font-semibold mb-1">Originality Score</div>
                <div className="text-3xl font-extrabold font-mono text-emerald-400">
                  {reportOriginality}%
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Unique content</div>
              </div>

              <div className="bg-slate-900 border border-cyan-900/40 rounded-xl p-4">
                <div className="text-xs text-cyan-300 font-semibold mb-1">Flagged Passages</div>
                <div className="text-3xl font-extrabold font-mono text-cyan-400">
                  {report.matches.length}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Contiguous spans</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. The 4 Simple Explainable Algorithms */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            The 4 Simple Algorithms Used by PLAGora
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Algo 1: Exact Phrase Matching */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/20 border border-emerald-800/40 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center font-mono">
                01
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                Exact Matches
              </span>
            </div>

            <h3 className="text-sm font-bold text-white">
              1. Exact Phrase Matching (Word N-Grams)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Splits text into sequences of 4 to 5 consecutive words (called shingles). If an exact phrase appears verbatim in any source document, it is immediately flagged.
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className="text-slate-500">Example:</span> &ldquo;transformer based solely on attention mechanisms&rdquo; &rarr; <strong className="text-emerald-400">100% Verbatim Hit</strong>
            </div>
          </div>

          {/* Algo 2: Common Vocabulary Overlap */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-cyan-950/20 border border-cyan-800/40 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center font-mono">
                02
              </span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/60">
                Word Sharing
              </span>
            </div>

            <h3 className="text-sm font-bold text-white">
              2. Vocabulary Overlap (Jaccard Word Similarity)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Counts how many unique words are shared between documents compared to the total pool of unique words. High vocabulary overlap flags potential copying.
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className="text-slate-500">Formula:</span> Shared Words ÷ Unique Total Words &times; 100%
            </div>
          </div>

          {/* Algo 3: Word Sequence Alignment */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/20 border border-amber-800/40 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center font-mono">
                03
              </span>
              <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider bg-amber-950 px-2 py-0.5 rounded border border-amber-800/60">
                Word Swaps
              </span>
            </div>

            <h3 className="text-sm font-bold text-white">
              3. Sequence Alignment (Word Order Checks)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Detects light edits where a student inserted or removed words (e.g. adding adjectives or removing adverbs) while keeping the exact sentence structure.
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className="text-slate-500">Example:</span> &ldquo;deep neural networks&rdquo; &harr; &ldquo;deep <em>complex</em> neural networks&rdquo;
            </div>
          </div>

          {/* Algo 4: Synonym & Paraphrase Match */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-purple-950/20 border border-purple-800/40 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 font-bold text-xs flex items-center justify-center font-mono">
                04
              </span>
              <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider bg-purple-950 px-2 py-0.5 rounded border border-purple-800/60">
                Paraphrase
              </span>
            </div>

            <h3 className="text-sm font-bold text-white">
              4. Synonym &amp; Paraphrase Matching
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Maps common words to their base roots (e.g., &quot;utilize&quot; &rarr; &quot;use&quot;, &quot;vital&quot; &rarr; &quot;crucial&quot;) to catch text rewritten using synonym-spinning tools.
            </p>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
              <span className="text-slate-500">Example:</span> &ldquo;Ocean acidification poses hazards&rdquo; &harr; &ldquo;Marine acidity presents threats&rdquo;
            </div>
          </div>

        </div>
      </div>

      {/* 3. Interactive Score Calculator Slider */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">
              Interactive Score Simulator
            </h3>
            <p className="text-xs text-slate-400">
              Adjust the sliders below to see how the score changes dynamically:
            </p>
          </div>
          <span className="text-sm font-bold font-mono text-indigo-400">
            {calculatedScore}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Total Unmasked Words in Document:</span>
              <span className="text-white font-bold">{interactiveWords}</span>
            </div>
            <input
              type="range"
              min={50}
              max={500}
              value={interactiveWords}
              onChange={(e) => setInteractiveWords(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-300">Matched Overlapping Words:</span>
              <span className="text-rose-400 font-bold">{interactiveMatched}</span>
            </div>
            <input
              type="range"
              min={0}
              max={interactiveWords}
              value={interactiveMatched}
              onChange={(e) => setInteractiveMatched(parseInt(e.target.value, 10))}
              className="w-full accent-rose-500"
            />
          </div>
        </div>

        <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="font-mono text-slate-300">
            Calculation: ({interactiveMatched} matched ÷ {interactiveWords} total) &times; 100 = <strong className="text-rose-400 font-bold text-sm">{calculatedScore}% Plagiarism</strong>
          </div>
          <div className="text-emerald-400 font-mono font-bold">
            {calculatedOriginality}% Original
          </div>
        </div>
      </div>
    </div>
  );
};
