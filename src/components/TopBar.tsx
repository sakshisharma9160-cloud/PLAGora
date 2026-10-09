import React from 'react';
import { 
  FileText, 
  Columns, 
  Database, 
  Sliders, 
  Award, 
  BookOpen, 
  Play, 
  Download, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

export type ActiveTab = 'scanner' | 'inspector' | 'corpus' | 'algorithm_lab' | 'benchmarks' | 'guides';

interface TopBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onRunScan: () => void;
  isScanning: boolean;
  hasReport: boolean;
  onExport: () => void;
  onLoadPreset: (presetId: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  onRunScan,
  isScanning,
  hasReport,
  onExport,
  onLoadPreset
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white shadow-sm shadow-indigo-500/20 text-xs font-mono">
            PL
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white leading-none">
              PLAG<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">ora</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono tracking-tight mt-0.5">
              Open-Source Detection Engine
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (single-line, clean unboxed controls) */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <button
            onClick={() => onTabChange('scanner')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'scanner'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4 text-indigo-400" />
            Scanner
          </button>

          <button
            onClick={() => onTabChange('inspector')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'inspector'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Columns className="w-4 h-4 text-emerald-400" />
            Side-by-Side Inspector
            {hasReport && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 ml-0.5 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => onTabChange('corpus')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'corpus'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Database className="w-4 h-4 text-cyan-400" />
            Corpus
          </button>

          <button
            onClick={() => onTabChange('algorithm_lab')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'algorithm_lab'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            Algorithm Lab
          </button>

          <button
            onClick={() => onTabChange('benchmarks')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'benchmarks'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Award className="w-4 h-4 text-purple-400" />
            Benchmarks
          </button>

          <button
            onClick={() => onTabChange('guides')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'guides'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-rose-400" />
            Docs & Guides
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {hasReport && (
            <button
              onClick={onExport}
              title="Export Report"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          )}

          <button
            onClick={onRunScan}
            disabled={isScanning}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm shadow-indigo-600/30 whitespace-nowrap"
          >
            <Play className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Auditing Document...' : 'Run Scan'}
          </button>
        </div>
      </div>
    </header>
  );
};
