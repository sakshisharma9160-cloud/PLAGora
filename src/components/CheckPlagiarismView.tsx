import React, { useState, useRef } from 'react';
import { 
  ScanReport, 
  DetectorConfig, 
  DocumentRecord 
} from '../types/detector';
import { PRESET_SUBMISSIONS } from '../data/sampleCorpus';
import { SimilarityAnalytics } from './SimilarityAnalytics';
import { 
  Upload, 
  FileText, 
  FileCode, 
  FileCheck, 
  Sliders, 
  ShieldCheck, 
  X, 
  Sparkles, 
  ArrowRight, 
  ExternalLink, 
  Columns, 
  AlertCircle,
  CheckCircle2,
  Layers,
  Search,
  RefreshCw,
  Calculator,
  Download,
  BarChart3
} from 'lucide-react';
import { generateSummaryPdf } from '../utils/pdfGenerator';

interface CheckPlagiarismViewProps {
  submissionTitle: string;
  setSubmissionTitle: (val: string) => void;
  submissionText: string;
  setSubmissionText: (val: string) => void;
  config: DetectorConfig;
  setConfig: React.Dispatch<React.SetStateAction<DetectorConfig>>;
  report: ScanReport | null;
  isScanning: boolean;
  onRunScan: () => void;
  onOpenSideBySide: (sourceId?: string) => void;
  onOpenAnalysis?: () => void;
  onOpenGraphs?: () => void;
  corpusCount?: number;
}

export const CheckPlagiarismView: React.FC<CheckPlagiarismViewProps> = ({
  submissionTitle,
  setSubmissionTitle,
  submissionText,
  setSubmissionText,
  config,
  setConfig,
  report,
  isScanning,
  onRunScan,
  onOpenSideBySide,
  onOpenAnalysis,
  onOpenGraphs,
  corpusCount = 8
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute live character and word counts
  const wordCount = submissionText.trim() ? submissionText.trim().split(/\s+/).length : 0;
  const charCount = submissionText.length;

  // File parsing handler for TXT, DOCX, PDF, PY, MD
  const handleFileProcess = (file: File) => {
    setUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type || file.name.split('.').pop() || 'file'
    });

    if (!submissionTitle || submissionTitle === 'Untitled Document') {
      setSubmissionTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();

    if (file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.py')) {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) setSubmissionText(text);
      };
      reader.readAsText(file);
    } else {
      // For PDF or DOCX binary files, read as ArrayBuffer and extract plain text strings
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        if (buffer) {
          const uint8 = new Uint8Array(buffer);
          let rawString = '';
          // Fast ASCII & UTF-8 printable text extraction from document stream
          for (let i = 0; i < uint8.length && rawString.length < 50000; i++) {
            const byte = uint8[i];
            if ((byte >= 32 && byte <= 126) || byte === 10 || byte === 13) {
              rawString += String.fromCharCode(byte);
            }
          }
          // Clean up sequences of punctuation or binary garbage
          const cleaned = rawString
            .replace(/[^\x20-\x7E\n\r]/g, ' ')
            .replace(/ {3,}/g, ' ')
            .trim();

          if (cleaned.length > 50) {
            setSubmissionText(cleaned);
          } else {
            // Fallback message
            setSubmissionText(
              `[Extracted Text from ${file.name}]\n\nDocument uploaded successfully (${(file.size / 1024).toFixed(1)} KB).\nYou can review or edit the extracted text above, or paste complete formatting below.`
            );
          }
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = PRESET_SUBMISSIONS.find(p => p.id === presetId);
    if (preset) {
      setSubmissionTitle(preset.name);
      setSubmissionText(preset.text);
      setUploadedFile(null);
      if (preset.whitelistPrompt) {
        setConfig(prev => ({ ...prev, whitelistText: preset.whitelistPrompt || '' }));
      } else {
        setConfig(prev => ({ ...prev, whitelistText: '' }));
      }
    }
  };

  const originalPercent = report ? Math.max(0, 100 - report.overallSimilarityPercent) : 100;

  return (
    <div className="space-y-8">
      {/* Top Section Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Plagiarism Verification &amp; Document Audit
        </h1>
        <p className="text-xs text-slate-400">
          Upload documents or paste research essays, coding assignments, or articles to verify authenticity against the reference library.
        </p>
      </div>

      {/* Preset Demo Buttons (for instant testing without needing manual uploads) */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Quick Demo Test Cases (Click to populate instantly):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESET_SUBMISSIONS.map(p => (
            <button
              key={p.id}
              onClick={() => handleLoadPreset(p.id)}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-750 border border-slate-700/80 rounded-lg transition-colors truncate max-w-[280px]"
              title={p.description}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Dual Upload / Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 5 Cols: File Upload Dropzone & Document Title */}
        <div className="lg:col-span-5 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Document Title
            </label>
            <input
              type="text"
              value={submissionTitle}
              onChange={e => setSubmissionTitle(e.target.value)}
              placeholder="e.g. Term Paper: Attention Mechanisms"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Upload Document Section Supporting PDF, DOCX, TXT */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Upload Document (PDF, DOCX, TXT)
            </label>

            <div
              onDragEnter={() => setDragActive(true)}
              onDragLeave={() => setDragActive(false)}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                dragActive
                  ? 'border-indigo-400 bg-indigo-950/20'
                  : 'border-slate-700/80 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.docx,.doc,.md,.py"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
                <Upload className="w-5 h-5" />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-200">
                  Click to upload or drag &amp; drop
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supports <strong className="text-slate-300">PDF, DOCX, TXT</strong>, Markdown &amp; Python
                </p>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-1">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">.PDF</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">.DOCX</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">.TXT</span>
              </div>
            </div>

            {/* Uploaded File Badge with Processing Confirmation */}
            {uploadedFile && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between p-3 bg-emerald-950/40 border border-emerald-600/50 rounded-xl text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{uploadedFile.name}</div>
                      <div className="text-[11px] text-emerald-300 font-mono mt-0.5">
                        Extracted {wordCount.toLocaleString()} words · Ready for scanning ({(uploadedFile.size / 1024).toFixed(1)} KB)
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUploadedFile(null);
                      setSubmissionText('');
                    }}
                    className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors ml-2 shrink-0"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fairness & Settings Collapsible */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Fairness Filters &amp; Prompt Whitelist
              </span>
              <button
                onClick={() => setShowConfigDrawer(!showConfigDrawer)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                {showConfigDrawer ? 'Hide Filters' : 'Configure'}
              </button>
            </div>

            {showConfigDrawer && (
              <div className="pt-2 space-y-3 border-t border-slate-800">
                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Mask Quoted Text (&quot;...&quot;)</span>
                  <input
                    type="checkbox"
                    checked={config.maskQuotes}
                    onChange={e => setConfig(prev => ({ ...prev, maskQuotes: e.target.checked }))}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Mask References &amp; [1] Citations</span>
                  <input
                    type="checkbox"
                    checked={config.maskReferences}
                    onChange={e => setConfig(prev => ({ ...prev, maskReferences: e.target.checked }))}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Semantic Paraphrase Engine</span>
                  <input
                    type="checkbox"
                    checked={config.enableSemantic}
                    onChange={e => setConfig(prev => ({ ...prev, enableSemantic: e.target.checked }))}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Source-Code Variable Normalization</span>
                  <input
                    type="checkbox"
                    checked={config.enableCodeNormalization}
                    onChange={e => setConfig(prev => ({ ...prev, enableCodeNormalization: e.target.checked }))}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Assignment Prompt Whitelist (to exclude prompt text):
                  </label>
                  <textarea
                    rows={2}
                    value={config.whitelistText}
                    onChange={e => setConfig(prev => ({ ...prev, whitelistText: e.target.value }))}
                    placeholder="Paste instructor questions or boilerplate to ignore..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right 7 Cols: Text Input Area & Check Plagiarism Action */}
        <div className="lg:col-span-7 space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Or Paste Content Directly
              </label>
              <div className="text-[11px] font-mono text-slate-400">
                {wordCount.toLocaleString()} words · {charCount.toLocaleString()} characters
              </div>
            </div>

            <textarea
              rows={14}
              value={submissionText}
              onChange={e => setSubmissionText(e.target.value)}
              placeholder="Paste research paper, essay, student submission, or source code here..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 leading-relaxed resize-y"
            />
          </div>

          {/* High-visibility Check Plagiarism Action Button */}
          <button
            onClick={onRunScan}
            disabled={isScanning || !submissionText.trim()}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 active:from-indigo-700 active:to-indigo-700 disabled:opacity-50 text-white font-bold text-sm tracking-wide transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Auditing Against Multi-Layer Engine...</span>
              </>
            ) : (
              <>
                <FileCheck className="w-5 h-5" />
                <span>Check Plagiarism</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Dashboard (Rendered when report is ready) */}
      {report && (
        <div className="space-y-6 pt-4 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Plagiarism Audit Results: {report.submissionTitle}
                </h2>
                <span className="text-xs font-mono text-slate-400">
                  {report.durationMs}ms
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated against the reference corpus across Winnowing, Smith-Waterman alignment, and semantic embeddings.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => generateSummaryPdf(report)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-pink-600/25"
              >
                <Download className="w-4 h-4 text-white" />
                Download PDF Report
              </button>

              {onOpenGraphs && (
                <button
                  onClick={onOpenGraphs}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-fuchsia-950 to-purple-900 hover:bg-fuchsia-900 border border-fuchsia-700/60 text-fuchsia-200 text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  <BarChart3 className="w-4 h-4 text-fuchsia-400" />
                  Graphical Analysis
                </button>
              )}

              {onOpenAnalysis && (
                <button
                  onClick={onOpenAnalysis}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all shadow-sm"
                >
                  <Calculator className="w-4 h-4 text-amber-400" />
                  Calculation Math
                </button>
              )}

              <button
                onClick={() => onOpenSideBySide()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20"
              >
                <Columns className="w-4 h-4 text-white" />
                Side-by-Side
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Primary Results Scoreboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Overall Plagiarism Percentage */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 border border-rose-800/60 rounded-2xl p-5 space-y-2 shadow-lg">
              <span className="text-xs uppercase tracking-wider text-rose-300 font-bold block">
                Plagiarism Score
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-extrabold font-mono tabular-nums ${
                  report.overallSimilarityPercent > 40
                    ? 'text-rose-400'
                    : report.overallSimilarityPercent > 15
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}>
                  {report.overallSimilarityPercent}%
                </span>
                <span className="text-xs text-rose-300 font-semibold">
                  matched content
                </span>
              </div>

              {/* Visual Similarity / Progress Indicator */}
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    report.overallSimilarityPercent > 40
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : report.overallSimilarityPercent > 15
                      ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${Math.min(100, report.overallSimilarityPercent)}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 font-mono pt-1">
                <span>0% (Clean)</span>
                <span>Threshold: 15%</span>
                <span>100% (Verbatim)</span>
              </div>
            </div>

            {/* 2. Original Content Percentage */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-800/60 rounded-2xl p-5 space-y-2 shadow-lg">
              <span className="text-xs uppercase tracking-wider text-emerald-300 font-bold block">
                Original Content Score
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold font-mono tabular-nums text-emerald-400">
                  {originalPercent.toFixed(1)}%
                </span>
                <span className="text-xs text-emerald-300 font-semibold">
                  unique writing
                </span>
              </div>

              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, originalPercent)}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-400 font-mono pt-1">
                Unmasked chars: {report.unmaskedChars.toLocaleString()}
              </div>
            </div>

            {/* 3. Similarity Score & Character Metrics */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                Similarity Score Breakdown
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                <div>
                  <span className="text-slate-500 block text-[10px]">TOTAL CHARS</span>
                  <span className="text-white font-bold">{report.totalChars.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">MATCHED CHARS</span>
                  <span className="text-indigo-400 font-bold">{report.matchedChars.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">FLAGGED SPANS</span>
                  <span className="text-amber-400 font-bold">{report.matches.length}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">MASKED QUOTES</span>
                  <span className="text-cyan-400 font-bold">{report.maskedSpans.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Graphs & Complete Similarity Analysis */}
          <SimilarityAnalytics
            report={report}
            onSelectPassage={(m) => onOpenSideBySide(m.sourceDocId)}
          />

          {/* Matching Sources / Documents Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Matching Sources &amp; Reference Documents ({report.topSources.length})
            </h3>

            {report.topSources.length === 0 ? (
              <div className="text-xs text-emerald-400 py-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero matching sources detected. The submission appears to be entirely original work.</span>
              </div>
            ) : (
              <div className="border border-slate-800 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">Source Document</th>
                      <th className="py-2.5 px-3 font-medium text-right">Matched Chars</th>
                      <th className="py-2.5 px-3 font-medium text-right">Similarity %</th>
                      <th className="py-2.5 px-3 font-medium text-right">Passages</th>
                      <th className="py-2.5 px-3 font-medium text-center">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {report.topSources.map(src => (
                      <tr key={src.docId} className="hover:bg-slate-850 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-200">
                          {src.docTitle}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                          {src.matchedChars.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-400">
                          {src.similarityPercent}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                          {src.matchCount}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => onOpenSideBySide(src.docId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800/60 rounded transition-colors"
                          >
                            Inspect
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

          {/* Highlighted Matching Text Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Highlighted Matching Text
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-400" /> Exact Winnowing
                </span>
                <span className="flex items-center gap-1.5 text-amber-300">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-400" /> Lexical Alignment
                </span>
                <span className="flex items-center gap-1.5 text-indigo-300">
                  <span className="w-2.5 h-2.5 rounded bg-indigo-500/30 border border-indigo-400" /> Semantic Paraphrase
                </span>
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <span className="w-2.5 h-2.5 rounded bg-cyan-500/30 border border-cyan-400" /> Code Clone
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-600" /> Masked Quote (Neutralized)
                </span>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 max-h-[400px] overflow-y-auto text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
              {(() => {
                const text = report.submissionText;
                const segments: React.ReactNode[] = [];
                let lastIndex = 0;

                interface TextRegion {
                  start: number;
                  end: number;
                  type: 'match' | 'mask';
                  method?: string;
                  maskType?: string;
                  confidence?: number;
                }

                const regions: TextRegion[] = [];
                for (const m of report.matches) {
                  regions.push({ start: m.subStart, end: m.subEnd, type: 'match', method: m.method, confidence: m.confidence });
                }
                for (const mask of report.maskedSpans) {
                  regions.push({ start: mask.start, end: mask.end, type: 'mask', maskType: mask.type });
                }

                regions.sort((a, b) => a.start - b.start);

                for (let i = 0; i < regions.length; i++) {
                  const reg = regions[i];
                  if (reg.start > lastIndex) {
                    segments.push(
                      <span key={`plain-${lastIndex}`}>
                        {text.slice(lastIndex, reg.start)}
                      </span>
                    );
                  }

                  if (reg.type === 'match') {
                    let bg = 'bg-emerald-500/25 text-emerald-200 border-b border-emerald-400';
                    if (reg.method === 'lexical') bg = 'bg-amber-500/25 text-amber-200 border-b border-amber-400';
                    if (reg.method === 'semantic') bg = 'bg-indigo-500/25 text-indigo-200 border-b border-indigo-400';
                    if (reg.method === 'code') bg = 'bg-cyan-500/25 text-cyan-200 border-b border-cyan-400';

                    segments.push(
                      <mark
                        key={`m-${reg.start}-${reg.end}`}
                        className={`px-0.5 rounded ${bg}`}
                        title={`Flagged: ${reg.method} (${Math.round((reg.confidence || 0.9) * 100)}%)`}
                      >
                        {text.slice(reg.start, reg.end)}
                      </mark>
                    );
                  } else {
                    segments.push(
                      <span
                        key={`mask-${reg.start}`}
                        className="text-slate-400 line-through bg-slate-800/80 px-0.5 rounded"
                        title={`[Fairness Filter] Masked ${reg.maskType}`}
                      >
                        {text.slice(reg.start, reg.end)}
                      </span>
                    );
                  }

                  lastIndex = Math.max(lastIndex, reg.end);
                }

                if (lastIndex < text.length) {
                  segments.push(
                    <span key={`plain-${lastIndex}`}>
                      {text.slice(lastIndex)}
                    </span>
                  );
                }

                return segments;
              })()}
            </div>
          </div>

          {/* Official PDF Summary Report Card (In Last) */}
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-purple-950/70 border border-indigo-700/60 p-6 sm:p-8 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-300">
                  <Download className="w-3.5 h-3.5 text-rose-300" />
                  <span>Official PDF Document Certificate</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  Summary Report in PDF Format
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                  Download an audit report in PDF format containing document metadata, exact similarity and originality scores, detection algorithm breakdowns, and matched excerpts.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={() => generateSummaryPdf(report)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-pink-600/30 transition-all hover:scale-102"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Download PDF Summary Report</span>
                </button>

                {onOpenGraphs && (
                  <button
                    onClick={onOpenGraphs}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors"
                  >
                    <BarChart3 className="w-4 h-4 text-fuchsia-400" />
                    <span>View Graphs</span>
                  </button>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-indigo-900/40 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono">
              <span>Audit ID: #{report.id.slice(0, 8)} · Timestamp: {new Date(report.timestamp).toLocaleString()}</span>
              <span className="text-emerald-400">Ready for print &amp; PDF distribution</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
