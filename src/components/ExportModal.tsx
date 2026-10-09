import React from 'react';
import { ScanReport } from '../types/detector';
import { Download, FileCode, FileText, X, FileDown } from 'lucide-react';
import { generateSummaryPdf } from '../utils/pdfGenerator';

interface ExportModalProps {
  report: ScanReport;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ report, onClose }) => {
  const handleDownloadPDF = () => {
    generateSummaryPdf(report);
  };
  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `plagora_audit_${report.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>PLAGora Audit Report - ${report.submissionTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; max-width: 1000px; margin: 0 auto; line-height: 1.5; }
    h1 { color: #818cf8; font-size: 1.5rem; margin-bottom: 0.25rem; }
    .meta { font-family: monospace; font-size: 0.85rem; color: #94a3b8; margin-bottom: 1.5rem; }
    .score-card { background: #1e293b; border: 1px solid #334155; border-radius: 0.5rem; padding: 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
    .score-val { font-size: 2rem; font-weight: bold; color: ${report.overallSimilarityPercent > 30 ? '#f43f5e' : '#34d399'}; }
    .match-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; margin-top: 1rem; }
    .match-table th, .match-table td { border: 1px solid #334155; padding: 0.6rem 0.75rem; text-align: left; }
    .match-table th { background: #1e293b; color: #cbd5e1; }
    .badge { font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 0.25rem; }
    .badge-winnowing { background: #064e3b; color: #34d399; }
    .badge-lexical { background: #78350f; color: #fbbf24; }
    .badge-semantic { background: #312e81; color: #a5b4fc; }
    .badge-code { background: #164e63; color: #22d3ee; }
    .slm-box { background: #1e1b4b; border-left: 3px solid #6366f1; padding: 0.5rem 0.75rem; margin-top: 0.5rem; font-size: 0.8rem; color: #c7d2fe; }
  </style>
</head>
<body>
  <h1>PLAGora Audit Report</h1>
  <div class="meta">
    Document: ${report.submissionTitle} · Audit ID: ${report.id} · Date: ${new Date(report.timestamp).toLocaleString()}
  </div>

  <div class="score-card">
    <div>
      <div>Overall Verified Text Overlap</div>
      <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 0.25rem;">
        Unmasked chars: ${report.unmaskedChars} · Matched: ${report.matchedChars} · Runtime: ${report.durationMs}ms
      </div>
    </div>
    <div class="score-val">${report.overallSimilarityPercent}%</div>
  </div>

  <h2>Flagged Passages (${report.matches.length})</h2>
  <table class="match-table">
    <thead>
      <tr>
        <th>Method</th>
        <th>Source Document</th>
        <th>Confidence</th>
        <th>Submission Excerpt</th>
        <th>Source Excerpt</th>
      </tr>
    </thead>
    <tbody>
      ${report.matches.map(m => `
        <tr>
          <td><span class="badge badge-${m.method}">${m.method}</span></td>
          <td>${m.sourceDocTitle}</td>
          <td>${Math.round(m.confidence * 100)}%</td>
          <td>&ldquo;${m.subText.slice(0, 140)}...&rdquo;</td>
          <td>&ldquo;${m.srcText.slice(0, 140)}...&rdquo;
            ${m.slmExplanation ? `<div class="slm-box"><strong>SLM:</strong> ${m.slmExplanation.category} - ${m.slmExplanation.explanation}</div>` : ''}
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `plagora_audit_${report.id}.html`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white">
            Export Verification Report
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Export full audit findings for <strong>{report.submissionTitle}</strong> as reproducible evidence for academic or editorial review.
        </p>

        <div className="space-y-3 pt-2">
          <button
            onClick={handleDownloadPDF}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-pink-700/60 hover:border-pink-500 bg-gradient-to-r from-rose-950/40 via-slate-800 to-purple-950/40 hover:bg-slate-800 text-left transition-all shadow-md group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs">
                PDF
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">Summary Report in PDF Format</div>
                <div className="text-[11px] text-slate-400">Formal printable PDF with scores, tables &amp; evidence</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={handleDownloadJSON}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-700 hover:border-indigo-500 bg-slate-800/60 hover:bg-slate-800 text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileCode className="w-5 h-5 text-indigo-400" />
              <div>
                <div className="text-xs font-semibold text-white">JSON Machine Packet</div>
                <div className="text-[11px] text-slate-400">Complete raw match records, offsets &amp; hashes</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400" />
          </button>

          <button
            onClick={handleDownloadHTML}
            className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-700 hover:border-emerald-500 bg-slate-800/60 hover:bg-slate-800 text-left transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs font-semibold text-white">HTML Side-by-Side Report</div>
                <div className="text-[11px] text-slate-400">Printable, standalone document with styling</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-slate-400 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
