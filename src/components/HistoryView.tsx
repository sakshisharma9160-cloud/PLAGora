import React, { useState } from 'react';
import { HistoryItem } from '../types/detector';
import { 
  History, 
  Search, 
  Trash2, 
  FileText, 
  ArrowRight, 
  Download, 
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileDown
} from 'lucide-react';
import { generateSummaryPdf } from '../utils/pdfGenerator';

interface HistoryViewProps {
  history: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
  onRestoreDemoHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onSelectHistoryItem,
  onDeleteHistoryItem,
  onClearHistory,
  onRestoreDemoHistory
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = history.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.topSourceName && item.topSourceName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleExportJSON = (item: HistoryItem) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(item.report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `plagora_audit_${item.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 rounded-xl p-5">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Audit History &amp; Previous Scans
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Logs of all past student and paper audits with saved character offsets, source matches, and similarity scores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRestoreDemoHistory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Load Sample History
          </button>

          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-300 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-800/60 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear History
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
        <input
          type="text"
          placeholder="Filter history by document title or matching source..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* History Cards List */}
      {filteredHistory.length === 0 ? (
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-12 text-center space-y-3">
          <History className="w-8 h-8 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">
            No Plagiarism Checks Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm ? 'No results matched your search term.' : 'Run a plagiarism check from the Check Plagiarism tab, or click "Load Sample History" above to inspect demo audits.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map(item => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 sm:p-5 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {item.title}
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                    {item.id}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                  <span>·</span>
                  <span>{item.wordCount} words</span>
                  <span>·</span>
                  <span>{item.matchedSourcesCount} matched source{item.matchedSourcesCount === 1 ? '' : 's'}</span>
                </div>

                <div className="text-xs text-slate-400 truncate pt-0.5">
                  Top match: <span className="text-slate-300 font-medium">{item.topSourceName || 'None'}</span>
                </div>
              </div>

              {/* Score Badges & Action Buttons */}
              <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
                <div className="text-right">
                  <div className="flex items-baseline gap-1.5 justify-end">
                    <span className={`text-xl font-extrabold font-mono tabular-nums ${
                      item.plagiarismPercent > 40
                        ? 'text-rose-400'
                        : item.plagiarismPercent > 15
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}>
                      {item.plagiarismPercent}%
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 font-medium">
                    {item.originalPercent}% original
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onSelectHistoryItem(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/80 rounded-lg transition-colors"
                  >
                    <span>View Report</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => generateSummaryPdf(item.report)}
                    className="p-1.5 text-pink-400 hover:text-pink-300 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Download Summary Report in PDF format"
                  >
                    <FileDown className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleExportJSON(item)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    title="Export JSON"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteHistoryItem(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
