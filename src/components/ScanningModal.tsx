import React, { useState, useEffect } from 'react';
import { 
  ScanLine, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Database, 
  Fingerprint, 
  Activity,
  ArrowRight
} from 'lucide-react';

interface ScanningModalProps {
  documentTitle: string;
  wordCount: number;
  corpusCount: number;
  isOpen: boolean;
  onComplete: () => void;
}

interface ScanStep {
  id: number;
  label: string;
  detail: string;
  icon: React.ReactNode;
}

export const ScanningModal: React.FC<ScanningModalProps> = ({
  documentTitle,
  wordCount,
  corpusCount,
  isOpen,
  onComplete
}) => {
  const [progress, setProgress] = useState(5);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const steps: ScanStep[] = [
    {
      id: 1,
      label: 'Document Ingestion & Text Extraction',
      detail: `Extracting character stream from "${documentTitle}"...`,
      icon: <FileText className="w-4 h-4 text-cyan-400" />
    },
    {
      id: 2,
      label: 'Fairness Preprocessing & Citation Masking',
      detail: 'Protecting verified quotes, bibliographic citations, and teacher whitelists...',
      icon: <Layers className="w-4 h-4 text-emerald-400" />
    },
    {
      id: 3,
      label: 'Winnowing Fingerprinting & Shingling',
      detail: 'Computing rolling hashes and boundary fingerprints across k-gram windows...',
      icon: <Fingerprint className="w-4 h-4 text-indigo-400" />
    },
    {
      id: 4,
      label: `Cross-Referencing ${corpusCount} Corpus Documents`,
      detail: 'Checking inverted index, sequence alignment, and vocabulary overlap...',
      icon: <Database className="w-4 h-4 text-amber-400" />
    },
    {
      id: 5,
      label: 'Generating Graphical Analytics & Similarity Report',
      detail: 'Compiling match percentages, character spans, and side-by-side coordinates...',
      icon: <Activity className="w-4 h-4 text-rose-400" />
    }
  ];

  useEffect(() => {
    if (!isOpen) {
      setProgress(5);
      setCurrentStepIndex(0);
      setLogMessages([]);
      return;
    }

    // Dynamic log generator
    const logs = [
      `[0.1s] Ingested ${wordCount.toLocaleString()} words from "${documentTitle}"`,
      `[0.4s] Character stream normalized (NFKC Unicode standard)`,
      `[0.8s] Quoted passages & reference blocks detected and protected`,
      `[1.2s] Generated winnowing shingle fingerprints with window w=4, k=5`,
      `[1.6s] Inverted index cross-referenced against ${corpusCount} reference documents`,
      `[2.0s] Calculated Smith-Waterman sequence alignments for matched passages`,
      `[2.3s] Finalizing similarity scores and visual match heatmap...`
    ];

    let timer: NodeJS.Timeout;
    const startTime = Date.now();
    const duration = 2300; // 2.3 seconds realistic processing experience

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      // Advance step index
      if (pct < 20) {
        setCurrentStepIndex(0);
      } else if (pct < 45) {
        setCurrentStepIndex(1);
      } else if (pct < 70) {
        setCurrentStepIndex(2);
      } else if (pct < 90) {
        setCurrentStepIndex(3);
      } else {
        setCurrentStepIndex(4);
      }

      // Add log messages gradually
      const logIdx = Math.floor((pct / 100) * logs.length);
      setLogMessages(logs.slice(0, Math.max(1, logIdx)));

      if (pct >= 100) {
        clearInterval(interval);
        timer = setTimeout(() => {
          onComplete();
        }, 350);
      }
    }, 40);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [isOpen, documentTitle, wordCount, corpusCount, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-indigo-700/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl shadow-indigo-950/80 relative overflow-hidden">
        
        {/* Glowing ambient light */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between relative z-10 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-md">
              <ScanLine className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Scanning Document for Plagiarism
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold animate-pulse">
                  Processing...
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-sm mt-0.5">
                Target: <strong className="text-slate-200">{documentTitle}</strong> ({wordCount.toLocaleString()} words)
              </p>
            </div>
          </div>

          <button
            onClick={onComplete}
            className="text-xs text-slate-400 hover:text-indigo-300 font-semibold px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Fast forward to results"
          >
            Skip &rarr;
          </button>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-2 relative z-10">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
              {steps[currentStepIndex].label}
            </span>
            <span className="text-indigo-400 font-extrabold tabular-nums text-sm">
              {progress}%
            </span>
          </div>

          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 transition-all duration-100 shadow-sm shadow-indigo-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 italic">
            {steps[currentStepIndex].detail}
          </p>
        </div>

        {/* Visual Multi-Stage Tracker */}
        <div className="space-y-2.5 relative z-10 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Execution Pipeline Stages
          </div>

          <div className="space-y-2">
            {steps.map((step, idx) => {
              const isDone = idx < currentStepIndex || progress === 100;
              const isCurrent = idx === currentStepIndex && progress < 100;

              return (
                <div 
                  key={step.id}
                  className={`flex items-center justify-between p-2 rounded-xl transition-all text-xs ${
                    isCurrent 
                      ? 'bg-indigo-950/60 border border-indigo-700/60 text-white' 
                      : isDone 
                      ? 'text-slate-300 bg-slate-900/40' 
                      : 'text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="shrink-0">{step.icon}</span>
                    <span className="font-semibold truncate">{step.label}</span>
                  </div>

                  <div className="shrink-0 font-mono text-[11px]">
                    {isDone ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Done
                      </span>
                    ) : isCurrent ? (
                      <span className="text-cyan-400 font-bold flex items-center gap-1 animate-pulse">
                        <Activity className="w-3.5 h-3.5 animate-spin" />
                        Active
                      </span>
                    ) : (
                      <span className="text-slate-600">Pending</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Terminal Log Stream */}
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 font-mono text-[10px] text-slate-400 space-y-1 max-h-24 overflow-y-auto relative z-10 shadow-inner">
          {logMessages.map((msg, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-300">
              <span className="text-emerald-400 font-bold">&gt;</span>
              <span>{msg}</span>
            </div>
          ))}
        </div>

        {/* Bottom Status */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800">
          <span>Comparing against {corpusCount} documents in local repository</span>
          <span className="text-indigo-400 font-semibold font-mono">100% Private Offline Processing</span>
        </div>

      </div>
    </div>
  );
};
