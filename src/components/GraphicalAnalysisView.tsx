import React, { useState } from 'react';
import { 
  ScanReport, 
  HistoryItem,
  DocumentRecord 
} from '../types/detector';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Layers, 
  Download, 
  Columns, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Database, 
  ArrowRight,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { generateSummaryPdf } from '../utils/pdfGenerator';

interface GraphicalAnalysisViewProps {
  report: ScanReport | null;
  history: HistoryItem[];
  corpus: DocumentRecord[];
  onOpenSideBySide: (sourceId?: string) => void;
  onOpenScanner: () => void;
  onManageCorpus?: () => void;
}

export const GraphicalAnalysisView: React.FC<GraphicalAnalysisViewProps> = ({
  report,
  history,
  corpus,
  onOpenSideBySide,
  onOpenScanner,
  onManageCorpus
}) => {
  const [selectedReportId, setSelectedReportId] = useState<string>(report?.id || (history[0]?.id || ''));
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);

  // Find active report (either current report or historical item)
  const activeReport: ScanReport | null = React.useMemo(() => {
    if (report && report.id === selectedReportId) return report;
    const historyItem = history.find(h => h.id === selectedReportId || h.report.id === selectedReportId);
    if (historyItem) return historyItem.report;
    return report || (history[0] ? history[0].report : null);
  }, [report, history, selectedReportId]);

  if (!activeReport) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
          <BarChart3 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">No Graphical Data Available Yet</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Scan a document or choose a sample to generate similarity graphs, source distribution charts, and PDF reports.
          </p>
        </div>
        <button
          onClick={onOpenScanner}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all"
        >
          <span>Start Plagiarism Scan</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const overallScore = activeReport.overallSimilarityPercent;
  const originalPercent = Math.max(0, 100 - overallScore);

  // Risk Classification
  const isHighRisk = overallScore > 40;
  const isModerateRisk = overallScore > 15 && overallScore <= 40;
  const isLowRisk = overallScore <= 15;

  // Algorithm proportions
  const totalChars = Math.max(1, activeReport.totalChars || activeReport.submissionText.length);
  const winnowShare = Math.min(100, Math.round((activeReport.layerBreakdown.exactWinnowing / totalChars) * 100));
  const lexicalShare = Math.min(100, Math.round((activeReport.layerBreakdown.lexicalAlignment / totalChars) * 100));
  const semanticShare = Math.min(100, Math.round((activeReport.layerBreakdown.semanticParaphrase / totalChars) * 100));

  // Compute 20 virtual segments for document heatmap
  const totalHeatSegments = 20;
  const heatSegments = Array.from({ length: totalHeatSegments }, (_, idx) => {
    const segStart = (idx / totalHeatSegments) * totalChars;
    const segEnd = ((idx + 1) / totalHeatSegments) * totalChars;
    
    // Check if any match overlaps this slice
    const overlappingMatches = activeReport.matches.filter(m => 
      (m.subStart < segEnd && m.subEnd > segStart)
    );

    const hasMatch = overlappingMatches.length > 0;
    const matchCount = overlappingMatches.length;
    const primaryMatch = overlappingMatches[0];

    return {
      index: idx,
      startPct: Math.round((idx / totalHeatSegments) * 100),
      endPct: Math.round(((idx + 1) / totalHeatSegments) * 100),
      hasMatch,
      matchCount,
      primaryMatch
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner & Control Zone */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-purple-950/40 border border-indigo-800/40 p-6 sm:p-8 space-y-4 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-xs font-bold text-cyan-300">
              <BarChart3 className="w-3.5 h-3.5 text-cyan-300" />
              <span>Graphical Analysis &amp; Visual Analytics</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Similarity Breakdown &amp; Graphs
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              In-depth visual representation of plagiarism density, algorithm contributions, and source attribution.
            </p>
          </div>

          {/* Action Buttons: PDF Export & Inspector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Audit Document Selector */}
            {history.length > 1 && (
              <div className="relative">
                <select
                  value={selectedReportId}
                  onChange={(e) => setSelectedReportId(e.target.value)}
                  aria-label="Select Audited Document"
                  className="bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer pr-8"
                >
                  {history.map(item => (
                    <option key={item.id} value={item.report.id || item.id}>
                      {item.title} ({item.plagiarismPercent}%)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => generateSummaryPdf(activeReport)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-pink-600/30 transition-all hover:scale-102"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Download PDF Summary Report</span>
            </button>

            <button
              onClick={() => onOpenSideBySide()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 hover:text-white font-semibold text-xs transition-colors"
            >
              <Columns className="w-4 h-4" />
              <span>Side-by-Side</span>
            </button>
          </div>
        </div>

        {/* Selected Document Info Ribbon */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-indigo-900/40 text-xs text-slate-300 relative z-10">
          <span className="font-bold text-white flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-400" />
            {activeReport.submissionTitle}
          </span>
          <span>·</span>
          <span>{(activeReport.totalChars || activeReport.submissionText.length).toLocaleString()} characters</span>
          <span>·</span>
          <span>{activeReport.matches.length} matched passage{activeReport.matches.length === 1 ? '' : 's'}</span>
          <span>·</span>
          <span>Scanned against {corpus.length} reference documents</span>
        </div>
      </div>

      {/* Row 1: High-Impact Visual Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Card 1: Circular Gauge & Risk Tier */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Overall Similarity Gauge</h3>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              isHighRisk 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                : isModerateRisk 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            }`}>
              {isHighRisk ? 'High Similarity' : isModerateRisk ? 'Moderate' : 'Acceptable'}
            </span>
          </div>

          {/* Radial Donut Visualization */}
          <div className="flex flex-col items-center justify-center py-2 relative">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-slate-800"
                  strokeWidth="11"
                  fill="transparent"
                />
                {/* Original Content Ring (Emerald) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className="stroke-emerald-500/40"
                  strokeWidth="11"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 * (1 - originalPercent / 100)}
                />
                {/* Plagiarism Overlap Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  className={isHighRisk ? 'stroke-rose-500' : isModerateRisk ? 'stroke-amber-500' : 'stroke-emerald-400'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 * (1 - overallScore / 100)}
                />
              </svg>

              {/* Inner Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-4xl font-black font-mono tracking-tight ${
                  isHighRisk ? 'text-rose-400' : isModerateRisk ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {overallScore}%
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Similarity Score
                </span>
              </div>
            </div>
          </div>

          {/* Metric Comparison Badges */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Originality
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {originalPercent.toFixed(1)}%
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                <span className={`w-2 h-2 rounded-full ${isHighRisk ? 'bg-rose-500' : 'bg-amber-400'}`} />
                Plagiarism
              </div>
              <div className={`text-xl font-bold font-mono ${isHighRisk ? 'text-rose-400' : 'text-amber-400'}`}>
                {overallScore}%
              </div>
            </div>
          </div>
        </div>

        {/* Chart Card 2: Algorithm Breakdown Stack */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Algorithm Contribution</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Detection Stack</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Shows how each transparent detection algorithm contributed to the flagged overlap.
            </p>
          </div>

          <div className="space-y-4">
            {/* Winnowing Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Exact Word n-Grams (Winnowing)
                </span>
                <span className="text-emerald-400 font-mono font-bold">{winnowShare}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${winnowShare}%` }} 
                />
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {activeReport.layerBreakdown.exactWinnowing.toLocaleString()} characters verbatim
              </div>
            </div>

            {/* Sequence Alignment Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Sequence Alignment (Word Swaps)
                </span>
                <span className="text-amber-400 font-mono font-bold">{lexicalShare}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${lexicalShare}%` }} 
                />
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {activeReport.layerBreakdown.lexicalAlignment.toLocaleString()} characters structured match
              </div>
            </div>

            {/* Semantic Paraphrase Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-indigo-300 font-semibold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  Semantic Paraphrase (Synonyms)
                </span>
                <span className="text-indigo-400 font-mono font-bold">{semanticShare}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-400 rounded-full transition-all duration-500"
                  style={{ width: `${semanticShare}%` }} 
                />
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {activeReport.layerBreakdown.semanticParaphrase.toLocaleString()} characters concept paraphrase
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-[11px] text-slate-400">
            All algorithms operate deterministically with mathematical explainability.
          </div>
        </div>

        {/* Chart Card 3: Risk Evaluation & Policy Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Policy Compliance Tier</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Standards</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              University and academic integrity thresholds based on overlap ratio.
            </p>
          </div>

          <div className="space-y-3">
            {/* Low Risk Tier */}
            <div className={`p-3 rounded-2xl border transition-all ${
              isLowRisk 
                ? 'bg-emerald-950/60 border-emerald-500/60 ring-1 ring-emerald-500/40' 
                : 'bg-slate-950/60 border-slate-800/80 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Tier 1: Acceptable (0% - 15%)
                </span>
                {isLowRisk && <span className="text-[10px] font-bold text-emerald-400 uppercase font-mono">Current Status</span>}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Typical incidental common phrasing, standard terminology, or masked quotes.
              </p>
            </div>

            {/* Moderate Risk Tier */}
            <div className={`p-3 rounded-2xl border transition-all ${
              isModerateRisk 
                ? 'bg-amber-950/60 border-amber-500/60 ring-1 ring-amber-500/40' 
                : 'bg-slate-950/60 border-slate-800/80 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Tier 2: Review Recommended (16% - 40%)
                </span>
                {isModerateRisk && <span className="text-[10px] font-bold text-amber-400 uppercase font-mono">Current Status</span>}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Significant overlap requiring instructor inspection of citations and paraphrases.
              </p>
            </div>

            {/* High Risk Tier */}
            <div className={`p-3 rounded-2xl border transition-all ${
              isHighRisk 
                ? 'bg-rose-950/60 border-rose-500/60 ring-1 ring-rose-500/40' 
                : 'bg-slate-950/60 border-slate-800/80 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Tier 3: Substantial Plagiarism (&gt;40%)
                </span>
                {isHighRisk && <span className="text-[10px] font-bold text-rose-400 uppercase font-mono">Current Status</span>}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Heavy contiguous copying or uncredited reliance on external repositories.
              </p>
            </div>
          </div>

          <button
            onClick={() => generateSummaryPdf(activeReport)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-pink-400" />
            <span>Generate Official PDF Audit Certificate</span>
          </button>
        </div>

      </div>

      {/* Row 2: Document Match Ribbon / Heatmap */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Document Length Match Density Heatmap
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Visual coordinate map of the document from start (0%) to end (100%). Red blocks indicate detected matches.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {activeReport.matches.length} Flagged Segments
          </span>
        </div>

        {/* Heatmap Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>0% (Document Start)</span>
            <span>50% (Midway)</span>
            <span>100% (Document End)</span>
          </div>

          <div className="grid grid-cols-20 gap-1.5 h-10 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            {heatSegments.map((seg) => {
              const isSelected = selectedSegment === seg.index;
              return (
                <button
                  key={seg.index}
                  onClick={() => setSelectedSegment(seg.index)}
                  title={`Segment ${seg.startPct}% - ${seg.endPct}%: ${seg.hasMatch ? `${seg.matchCount} match(es)` : 'Clean / Original'}`}
                  className={`h-full rounded-lg transition-all transform hover:scale-110 focus:outline-none relative ${
                    seg.hasMatch
                      ? 'bg-gradient-to-t from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 shadow-sm shadow-rose-500/40'
                      : 'bg-slate-800/80 hover:bg-slate-700/80'
                  } ${isSelected ? 'ring-2 ring-white scale-110 z-10' : ''}`}
                />
              );
            })}
          </div>
        </div>

        {/* Selected Segment Drill-Down */}
        {selectedSegment !== null && (
          <div className="bg-slate-950 rounded-2xl p-4 border border-indigo-900/40 space-y-2 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">
                Inspect Segment [{heatSegments[selectedSegment].startPct}% &ndash; {heatSegments[selectedSegment].endPct}% of text]
              </span>
              <button
                onClick={() => setSelectedSegment(null)}
                className="text-slate-400 hover:text-white text-[11px]"
              >
                Close &times;
              </button>
            </div>
            {heatSegments[selectedSegment].hasMatch && heatSegments[selectedSegment].primaryMatch ? (
              <div className="space-y-1.5 text-xs">
                <div className="text-rose-400 font-semibold font-mono">
                  Matched against: <span className="text-white">{heatSegments[selectedSegment].primaryMatch.sourceDocTitle}</span> ({heatSegments[selectedSegment].primaryMatch.method})
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-rose-900/40 text-slate-300 italic font-mono text-[11px]">
                  &ldquo;{heatSegments[selectedSegment].primaryMatch.subText.slice(0, 160)}...&rdquo;
                </div>
                <button
                  onClick={() => onOpenSideBySide(heatSegments[selectedSegment].primaryMatch?.sourceDocId)}
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-bold inline-flex items-center gap-1"
                >
                  Open in Side-by-Side Inspector &rarr;
                </button>
              </div>
            ) : (
              <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                This section of the document consists of 100% original writing with no flagged matches.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Row 3: Matched Sources Contribution Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Source Attribution &amp; Overlap Comparison
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked comparison of matched reference documents by similarity score.
            </p>
          </div>
          <span className="text-xs font-mono text-indigo-400">
            {activeReport.topSources.length} Matched Document Sources
          </span>
        </div>

        {activeReport.topSources.length === 0 ? (
          <div className="text-center py-10 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">No External Sources Matched</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              This submission does not exhibit suspicious overlap with any document in the current repository.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeReport.topSources.map((src, index) => {
              const barColors = [
                'from-rose-500 to-pink-500',
                'from-amber-500 to-orange-500',
                'from-indigo-500 to-purple-500',
                'from-cyan-500 to-blue-500',
                'from-emerald-500 to-teal-500'
              ];
              const activeColor = barColors[index % barColors.length];

              return (
                <div key={src.docId} className="space-y-1.5 p-3 rounded-2xl bg-slate-950/70 border border-slate-850 hover:border-slate-750 transition-all">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center font-mono font-bold text-[10px] text-slate-300 shrink-0">
                        #{index + 1}
                      </span>
                      <span className="font-semibold text-slate-200 truncate max-w-xs sm:max-w-md" title={src.docTitle}>
                        {src.docTitle}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                        {src.matchedChars.toLocaleString()} chars · {src.matchCount} passage{src.matchCount === 1 ? '' : 's'}
                      </span>
                      <span className="font-mono font-extrabold text-sm text-indigo-400">
                        {src.similarityPercent}%
                      </span>
                      <button
                        onClick={() => onOpenSideBySide(src.docId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-300 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 transition-colors"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Bar Chart */}
                  <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${activeColor} transition-all duration-700`}
                      style={{ width: `${Math.min(100, src.similarityPercent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Row 4: Historical Comparison Trend (if multiple scans exist) */}
      {history.length > 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Cross-Document Historical Audit Trend
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Compare plagiarism percentages across all documents audited in this session.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {history.length} Audits
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {history.slice(0, 4).map(item => (
              <div 
                key={item.id}
                onClick={() => setSelectedReportId(item.report.id || item.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                  item.report.id === activeReport.id
                    ? 'bg-indigo-950/70 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/40'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="text-xs font-bold text-slate-200 truncate" title={item.title}>
                  {item.title}
                </div>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-xs text-slate-500">Score:</span>
                  <span className={`text-base font-extrabold ${
                    item.plagiarismPercent > 40 ? 'text-rose-400' : item.plagiarismPercent > 15 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {item.plagiarismPercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      item.plagiarismPercent > 40 ? 'bg-rose-500' : item.plagiarismPercent > 15 ? 'bg-amber-500' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, item.plagiarismPercent)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA for PDF and Scan */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-800/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-sm font-bold text-white">Need an official audit report for records?</h4>
          <p className="text-xs text-slate-300">
            Export a comprehensive PDF summary with character counts, algorithm breakdowns, and matched excerpts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => generateSummaryPdf(activeReport)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-md shadow-pink-600/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Summary</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-colors"
          >
            <span>Scan Another Document</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
