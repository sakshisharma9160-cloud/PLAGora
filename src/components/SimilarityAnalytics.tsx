import React, { useState } from 'react';
import { ScanReport, MatchRecord } from '../types/detector';
import { 
  BarChart3, 
  PieChart, 
  Activity, 
  Layers, 
  ShieldCheck, 
  TrendingUp, 
  FileText,
  AlertTriangle,
  CheckCircle2,
  Cpu
} from 'lucide-react';

interface SimilarityAnalyticsProps {
  report: ScanReport;
  onSelectPassage?: (match: MatchRecord) => void;
}

export const SimilarityAnalytics: React.FC<SimilarityAnalyticsProps> = ({
  report,
  onSelectPassage
}) => {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);

  const totalChars = report.totalChars || 1;
  const unmaskedChars = report.unmaskedChars || totalChars;
  const originalChars = Math.max(0, unmaskedChars - report.matchedChars);
  const originalPercent = Math.max(0, 100 - report.overallSimilarityPercent);

  // Layer percentages relative to total matched
  const totalLayerChars = Math.max(1, 
    report.layerBreakdown.exactWinnowing +
    report.layerBreakdown.lexicalAlignment +
    report.layerBreakdown.semanticParaphrase +
    report.layerBreakdown.codeClones
  );

  const winnowPercent = ((report.layerBreakdown.exactWinnowing / totalLayerChars) * 100).toFixed(1);
  const lexicalPercent = ((report.layerBreakdown.lexicalAlignment / totalLayerChars) * 100).toFixed(1);
  const semanticPercent = ((report.layerBreakdown.semanticParaphrase / totalLayerChars) * 100).toFixed(1);
  const codePercent = ((report.layerBreakdown.codeClones / totalLayerChars) * 100).toFixed(1);

  // Analytics Metrics
  const longestSpan = report.matches.reduce((max, m) => Math.max(max, m.subEnd - m.subStart), 0);
  const longestSpanWords = Math.round(longestSpan / 5.5); // approx 5.5 chars/word
  const wordCount = Math.round(totalChars / 5.5);
  const matchDensity = wordCount > 0 ? ((report.matches.length / wordCount) * 1000).toFixed(1) : '0';

  // Verbatim vs Paraphrased ratio
  const verbatimChars = report.layerBreakdown.exactWinnowing + report.layerBreakdown.codeClones;
  const paraphraseChars = report.layerBreakdown.lexicalAlignment + report.layerBreakdown.semanticParaphrase;
  const verbatimRatio = totalLayerChars > 0 ? Math.round((verbatimChars / totalLayerChars) * 100) : 0;
  const paraphraseRatio = 100 - verbatimRatio;

  // Masked quotes & references stats
  const totalMaskedChars = report.maskedSpans.reduce((sum, m) => sum + (m.end - m.start), 0);
  const quoteMaskPercent = ((totalMaskedChars / totalChars) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Analytics Section Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            Complete Similarity Analysis &amp; Visual Graphs
          </h3>
          <p className="text-xs text-slate-400">
            Algorithmic decomposition of overlap distribution, source impact, and academic integrity metrics.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Audit ID: {report.id}
        </span>
      </div>

      {/* 1. Document Overlap Heatmap Timeline Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-cyan-400" />
            Document Passage Heatmap (0% to 100% position)
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Click segment to inspect passage
          </span>
        </div>

        {/* Heatmap interactive track */}
        <div className="relative h-9 bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex items-center">
          {report.matches.map((m, idx) => {
            const leftPct = Math.max(0, Math.min(100, (m.subStart / totalChars) * 100));
            const widthPct = Math.max(0.8, Math.min(100 - leftPct, ((m.subEnd - m.subStart) / totalChars) * 100));

            let colorClass = 'bg-emerald-500 hover:bg-emerald-400';
            if (m.method === 'lexical') colorClass = 'bg-amber-500 hover:bg-amber-400';
            if (m.method === 'semantic') colorClass = 'bg-indigo-500 hover:bg-indigo-400';
            if (m.method === 'code') colorClass = 'bg-cyan-500 hover:bg-cyan-400';

            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveSegmentIndex(idx);
                  if (onSelectPassage) onSelectPassage(m);
                }}
                className={`absolute top-0 bottom-0 transition-opacity cursor-pointer ${colorClass} ${
                  activeSegmentIndex === idx ? 'ring-2 ring-white z-10' : 'opacity-85 hover:opacity-100'
                }`}
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                title={`[${m.method.toUpperCase()}] ${m.sourceDocTitle} (${Math.round((m.subEnd - m.subStart))} chars)`}
              />
            );
          })}

          {/* Masked quote spans rendered in muted gray stripes */}
          {report.maskedSpans.map((mask, idx) => {
            const leftPct = Math.max(0, Math.min(100, (mask.start / totalChars) * 100));
            const widthPct = Math.max(0.5, Math.min(100 - leftPct, ((mask.end - mask.start) / totalChars) * 100));
            return (
              <div
                key={`mask-${idx}`}
                className="absolute top-0 bottom-0 bg-slate-700/60 pointer-events-none"
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                title={`[Masked ${mask.type}] Neutralized from penalty`}
              />
            );
          })}
        </div>

        {/* Heatmap Legend & Position Indicators */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
          <span>Start (0%)</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Winnowing
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Lexical
            </span>
            <span className="flex items-center gap-1 text-indigo-400">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> Semantic
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-600" /> Masked Quotes
            </span>
          </div>
          <span>End (100%)</span>
        </div>
      </div>

      {/* 2. Visual Charts Grid: Donut Breakdown + Layer Distribution + Source Impacts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Chart 1: Original vs Plagiarized Donut Visualization */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-emerald-400" />
              Content Composition
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Unmasked base</span>
          </div>

          <div className="flex items-center justify-center py-2">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background Circle */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="text-slate-800"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="transparent"
                />
                {/* Plagiarism Arc */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className={report.overallSimilarityPercent > 40 ? 'text-rose-500' : report.overallSimilarityPercent > 15 ? 'text-amber-500' : 'text-emerald-500'}
                  strokeWidth="4"
                  strokeDasharray={`${report.overallSimilarityPercent}, 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold font-mono text-white tabular-nums">
                  {report.overallSimilarityPercent}%
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-tight">
                  Overlap
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-1 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Original Content
              </span>
              <span className="font-bold text-emerald-400">{originalPercent.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${report.overallSimilarityPercent > 40 ? 'bg-rose-500' : 'bg-amber-500'}`} /> Flagged Overlap
              </span>
              <span className="font-bold text-rose-400">{report.overallSimilarityPercent}%</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Multi-Layer Algorithm Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              Algorithm Breakdown
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Share of matches</span>
          </div>

          <div className="space-y-3 pt-1">
            {/* Exact Winnowing */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-emerald-300 font-sans font-medium">Exact Phrase Matches</span>
                <span className="text-emerald-400 font-bold">{winnowPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${winnowPercent}%` }} />
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {report.layerBreakdown.exactWinnowing.toLocaleString()} chars · Verbatim phrase n-grams
              </div>
            </div>

            {/* Lexical Alignment */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-amber-300 font-sans font-medium">Sequence Word Alignment</span>
                <span className="text-amber-400 font-bold">{lexicalPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${lexicalPercent}%` }} />
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {report.layerBreakdown.lexicalAlignment.toLocaleString()} chars · Word order edits &amp; swaps
              </div>
            </div>

            {/* Semantic Paraphrase */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-indigo-300 font-sans font-medium">Synonym &amp; Paraphrase</span>
                <span className="text-indigo-400 font-bold">{semanticPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${semanticPercent}%` }} />
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {report.layerBreakdown.semanticParaphrase.toLocaleString()} chars · Reworded concepts
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3: Source Document Impact Share */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Source Contribution Share
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Match Score</span>
          </div>

          <div className="space-y-3 pt-1">
            {report.topSources.length === 0 ? (
              <div className="text-xs text-slate-500 italic py-6 text-center">
                No external sources matched.
              </div>
            ) : (
              report.topSources.slice(0, 3).map((src, i) => (
                <div key={src.docId} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 truncate max-w-[180px] font-medium" title={src.docTitle}>
                      {src.docTitle}
                    </span>
                    <span className="text-indigo-400 font-mono font-bold">{src.similarityPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${i === 0 ? 'bg-indigo-500' : i === 1 ? 'bg-cyan-500' : 'bg-purple-500'}`}
                      style={{ width: `${Math.min(100, (src.similarityPercent / (report.overallSimilarityPercent || 1)) * 100)}%` }} 
                    />
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {src.matchedChars.toLocaleString()} chars · {src.matchCount} passage{src.matchCount === 1 ? '' : 's'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Complete Deep Analysis Integrity Metrics */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Deep Academic Integrity Analysis
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
            <span className="text-slate-500 text-[10px] block font-sans">VERBATIM VS PARAPHRASE</span>
            <div className="text-white font-bold text-base mt-1">
              {verbatimRatio}% <span className="text-xs text-slate-400 font-normal">/ {paraphraseRatio}%</span>
            </div>
            <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
              {verbatimRatio > 60 ? 'Predominantly copy-paste' : 'Heavy rewording'}
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
            <span className="text-slate-500 text-[10px] block font-sans">LONGEST RUN SPAN</span>
            <div className="text-cyan-400 font-bold text-base mt-1">
              ~{longestSpanWords} <span className="text-xs text-slate-400 font-normal">words</span>
            </div>
            <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
              {longestSpan.toLocaleString()} contiguous chars
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
            <span className="text-slate-500 text-[10px] block font-sans">MATCH DENSITY</span>
            <div className="text-amber-400 font-bold text-base mt-1">
              {matchDensity} <span className="text-xs text-slate-400 font-normal">/ 1k words</span>
            </div>
            <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
              {report.matches.length} total passage clusters
            </span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
            <span className="text-slate-500 text-[10px] block font-sans">MASKED QUOTES &amp; REFS</span>
            <div className="text-emerald-400 font-bold text-base mt-1">
              {quoteMaskPercent}% <span className="text-xs text-slate-400 font-normal">of doc</span>
            </div>
            <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
              {report.maskedSpans.length} legitimate spans protected
            </span>
          </div>
        </div>

        {/* Stylometry Authorial Consistency Index if enabled */}
        {report.stylometryStats && (
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <span className="text-white font-semibold block">Stylometric Authorial Invariance (Layer 5)</span>
                <span className="text-slate-400 text-[11px]">
                  Sentence variance: {report.stylometryStats.sentenceLengthStdDev} · Vocabulary richness (TTR): {report.stylometryStats.typeTokenRatio} · Hapax ratio: {report.stylometryStats.hapaxRatio}
                </span>
              </div>
            </div>

            {report.stylometryStats.styleShiftDetected ? (
              <span className="px-2.5 py-1 rounded bg-amber-950 border border-amber-800 text-amber-300 font-mono text-[11px] font-semibold flex items-center gap-1.5 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Abrupt Style Shifts Detected
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono text-[11px] font-semibold flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Uniform Writing Style
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
