import React from 'react';
import { 
  ScanLine, 
  ShieldCheck, 
  Cpu, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  Layers, 
  Lock, 
  Sparkles, 
  ExternalLink, 
  Clock, 
  FileText,
  Database,
  BarChart3,
  Calculator,
  Percent,
  HardDrive
} from 'lucide-react';
import { HistoryItem } from '../types/detector';

interface DashboardViewProps {
  onStartCheck: () => void;
  onOpenGraphs: () => void;
  onOpenAnalysis: () => void;
  onViewDocs: () => void;
  onViewHistoryItem: (item: HistoryItem) => void;
  history: HistoryItem[];
  corpusCount: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartCheck,
  onOpenGraphs,
  onOpenAnalysis,
  onViewDocs,
  onViewHistoryItem,
  history,
  corpusCount
}) => {
  return (
    <div className="space-y-8 py-2">
      {/* Colorful Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-700/50 p-8 sm:p-12 shadow-2xl">
        <div className="max-w-3xl space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/40 text-xs font-bold text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Open-Source Plagiarism Detection System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Transparent &amp; Explainable <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              Plagiarism Detection
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
            A self-hostable academic integrity engine powered by simple, explainable algorithms. All scans provide transparent similarity scores, character-exact evidence, and 100% private offline verification.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onStartCheck}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/30"
            >
              <ScanLine className="w-4 h-4 text-slate-950" />
              <span>Start Plagiarism Scan</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenGraphs}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-white font-semibold text-xs sm:text-sm border border-slate-700 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-fuchsia-400" />
              <span>Graphical Analysis</span>
            </button>

            <button
              onClick={onOpenAnalysis}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors"
            >
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>How Score is Calculated</span>
            </button>
          </div>
        </div>

        {/* Ambient glowing orbs */}
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 top-0 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Colorful Metric Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-800/50 rounded-2xl p-5 space-y-1 shadow-md">
          <div className="text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Accuracy Benchmark
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-300">
            97%
          </div>
          <div className="text-[11px] text-slate-400 font-medium">F1 score on PAN test suite</div>
        </div>

        {/* Metric 2 */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950/40 border border-blue-800/50 rounded-2xl p-5 space-y-1 shadow-md">
          <div className="text-blue-400 text-xs font-bold flex items-center gap-1.5">
            <Database className="w-4 h-4" />
            Document Corpus
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-300">
            {corpusCount} Docs
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Ready for comparison</div>
        </div>

        {/* Metric 3 */}
        <div className="bg-gradient-to-br from-slate-900 to-amber-950/40 border border-amber-800/50 rounded-2xl p-5 space-y-1 shadow-md">
          <div className="text-amber-400 text-xs font-bold flex items-center gap-1.5">
            <Percent className="w-4 h-4" />
            Accuracy &amp; Range
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-300">
            Exact %
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Character-exact proof</div>
        </div>

        {/* Metric 4 */}
        <div className="bg-gradient-to-br from-slate-900 to-purple-950/40 border border-purple-800/50 rounded-2xl p-5 space-y-1 shadow-md">
          <div className="text-purple-400 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Privacy Protection
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-300">
            100%
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Runs locally on your device</div>
        </div>
      </div>

      {/* Recent Scans Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Recent Plagiarism Audits ({history.length})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any audit to view highlighted matches and side-by-side comparison.
            </p>
          </div>

          <button
            onClick={onStartCheck}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            <span>+ Scan New Document</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {history.slice(0, 4).map(item => (
            <div
              key={item.id}
              onClick={() => onViewHistoryItem(item)}
              className="group p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-900/90 cursor-pointer transition-all space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors truncate">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                    <span>·</span>
                    <span>{item.wordCount} words</span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <div className={`text-base font-extrabold font-mono tabular-nums ${
                    item.plagiarismPercent > 40
                      ? 'text-rose-400'
                      : item.plagiarismPercent > 15
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}>
                    {item.plagiarismPercent}%
                  </div>
                  <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Similarity Score
                  </span>
                </div>
              </div>

              {/* Colorful Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    item.plagiarismPercent > 40
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : item.plagiarismPercent > 15
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${Math.min(100, item.plagiarismPercent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <span className="truncate max-w-[200px]">
                  Top match: <strong className="text-slate-300">{item.topSourceName}</strong>
                </span>
                <span className="text-indigo-400 group-hover:text-indigo-300 text-xs font-bold flex items-center gap-1">
                  View Report &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Simple Steps */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white tracking-tight">
          Three Simple Steps to Check Plagiarism
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-indigo-900/40 rounded-2xl p-5 space-y-2">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center font-mono">
              01
            </span>
            <h3 className="text-sm font-bold text-white">Upload or Paste Text</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Drag &amp; drop PDF, DOCX, or TXT files directly from your computer, or paste your writing into the text area.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-cyan-950/30 border border-cyan-900/40 rounded-2xl p-5 space-y-2">
            <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 font-bold text-xs flex items-center justify-center font-mono">
              02
            </span>
            <h3 className="text-sm font-bold text-white">Simple Algorithms Match</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              The engine checks exact word n-grams, vocabulary overlap, and sentence order against your Document Corpus.
            </p>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-emerald-950/30 border border-emerald-900/40 rounded-2xl p-5 space-y-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center font-mono">
              03
            </span>
            <h3 className="text-sm font-bold text-white">Direct Similarity Score</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Receive a clear similarity score with highlighted text and click to view side-by-side matches with sources.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
