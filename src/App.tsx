import React, { useState, useEffect } from 'react';
import { 
  ScanReport, 
  DetectorConfig, 
  DocumentRecord, 
  MatchRecord,
  HistoryItem 
} from './types/detector';
import { getInitialCorpus, PRESET_SUBMISSIONS } from './data/sampleCorpus';
import { getSampleHistory } from './data/sampleHistory';
import { runPlagiarismDetection } from './engine/pipeline';

// Components
import { Navigation, NavTab } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { CheckPlagiarismView } from './components/CheckPlagiarismView';
import { GraphicalAnalysisView } from './components/GraphicalAnalysisView';
import { CorpusManagerView } from './components/CorpusManagerView';
import { AlgorithmAnalysisView } from './components/AlgorithmAnalysisView';
import { HistoryView } from './components/HistoryView';
import { BenchmarksView } from './components/BenchmarksView';
import { GuideViewer } from './components/GuideViewer';
import { AboutView } from './components/AboutView';
import { SideBySideInspector } from './components/SideBySideInspector';
import { ExportModal } from './components/ExportModal';
import { ScanningModal } from './components/ScanningModal';
import { X } from 'lucide-react';

const DEFAULT_CONFIG: DetectorConfig = {
  shingleK: 5,
  windowSizeW: 4,
  minMatchWords: 5,
  semanticThreshold: 0.78,
  maskQuotes: true,
  maskReferences: true,
  whitelistText: '',
  enableSemantic: true,
  enableCodeNormalization: true,
  enableStylometry: true,
  enableSLM: true
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [submissionTitle, setSubmissionTitle] = useState('Verbatim Transformer Submissions');
  const [submissionText, setSubmissionText] = useState(PRESET_SUBMISSIONS[0].text);
  const [config, setConfig] = useState<DetectorConfig>(DEFAULT_CONFIG);
  const [corpus, setCorpus] = useState<DocumentRecord[]>(getInitialCorpus());
  const [report, setReport] = useState<ScanReport | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem('plagora_scan_history') || localStorage.getItem('openplag_scan_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return getSampleHistory();
  });

  const [isScanning, setIsScanning] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSideBySideModal, setShowSideBySideModal] = useState(false);
  const [showCorpusModal, setShowCorpusModal] = useState(false);
  const [selectedInspectSourceId, setSelectedInspectSourceId] = useState<string | null>(null);

  // Sync history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('plagora_scan_history', JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  // Load initial report from history so user has instant results ready to inspect
  useEffect(() => {
    if (!report && history.length > 0) {
      setReport(history[0].report);
    }
  }, []);

  // Trigger plagiarism check (displays animated scanning progress modal)
  const handleRunScan = () => {
    if (!submissionText.trim()) return;
    setIsScanning(true);
  };

  // Called when scanning animation completes or user skips
  const handleCompleteScan = () => {
    try {
      const scanResult = runPlagiarismDetection(
        submissionTitle.trim() || 'Untitled Document',
        submissionText,
        corpus,
        config
      );

      setReport(scanResult);
      if (scanResult.topSources.length > 0) {
        setSelectedInspectSourceId(scanResult.topSources[0].docId);
      }

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: `scan-${Date.now()}`,
        title: scanResult.submissionTitle,
        timestamp: scanResult.timestamp,
        wordCount: submissionText.split(/\s+/).length,
        plagiarismPercent: scanResult.overallSimilarityPercent,
        originalPercent: Math.max(0, 100 - scanResult.overallSimilarityPercent),
        similarityScore: scanResult.overallSimilarityPercent,
        matchedSourcesCount: scanResult.topSources.length,
        topSourceName: scanResult.topSources[0]?.docTitle || 'None',
        report: scanResult
      };

      setHistory(prev => [newHistoryItem, ...prev]);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Inspect specific history item
  const handleViewHistoryItem = (item: HistoryItem) => {
    setReport(item.report);
    setSubmissionTitle(item.title);
    setSubmissionText(item.report.submissionText);
    if (item.report.topSources.length > 0) {
      setSelectedInspectSourceId(item.report.topSources[0].docId);
    }
    setCurrentTab('scanner');
  };

  // Delete history item
  const handleDeleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  };

  // Clear all history
  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your plagiarism scan history?')) {
      setHistory([]);
    }
  };

  // Restore sample history
  const handleRestoreDemoHistory = () => {
    const demo = getSampleHistory();
    setHistory(demo);
    if (demo.length > 0) {
      setReport(demo[0].report);
    }
  };

  // Update a match's SLM explanation
  const handleUpdateMatchSLM = (matchId: string, slmData: MatchRecord['slmExplanation']) => {
    if (!report) return;
    setReport(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        matches: prev.matches.map(m => m.id === matchId ? { ...m, slmExplanation: slmData } : m)
      };
    });
  };

  // Add document to reference corpus
  const handleAddDocument = async (newDocData: { title: string; content: string; author?: string; category?: any }) => {
    const tokens = newDocData.content.split(/\s+/).length;
    const newDoc: DocumentRecord = {
      id: `corpus-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newDocData.title,
      author: newDocData.author || 'Local System Import',
      category: newDocData.category || 'academic',
      content: newDocData.content,
      createdAt: new Date().toISOString(),
      tokenCount: tokens,
      fingerprintCount: Math.max(1, Math.floor(tokens * 0.4))
    };
    setCorpus(prev => [newDoc, ...prev]);
  };

  // Delete document from corpus
  const handleDeleteDocument = async (id: string) => {
    setCorpus(prev => prev.filter(d => d.id !== id));
  };

  // Reset corpus to defaults
  const handleResetCorpus = async () => {
    setCorpus(getInitialCorpus());
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Responsive Navigation Bar */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        recentScansCount={history.length}
        corpusCount={corpus.length}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'dashboard' && (
          <DashboardView
            onStartCheck={() => setCurrentTab('scanner')}
            onOpenGraphs={() => setCurrentTab('graphs')}
            onOpenAnalysis={() => setCurrentTab('analysis')}
            onViewDocs={() => setCurrentTab('docs')}
            onViewHistoryItem={handleViewHistoryItem}
            history={history}
            corpusCount={corpus.length}
          />
        )}

        {currentTab === 'scanner' && (
          <CheckPlagiarismView
            submissionTitle={submissionTitle}
            setSubmissionTitle={setSubmissionTitle}
            submissionText={submissionText}
            setSubmissionText={setSubmissionText}
            config={config}
            setConfig={setConfig}
            report={report}
            isScanning={isScanning}
            onRunScan={handleRunScan}
            onOpenSideBySide={(sourceId) => {
              if (sourceId) setSelectedInspectSourceId(sourceId);
              setShowSideBySideModal(true);
            }}
            onOpenAnalysis={() => setCurrentTab('analysis')}
            onOpenGraphs={() => setCurrentTab('graphs')}
            corpusCount={corpus.length}
          />
        )}

        {currentTab === 'graphs' && (
          <GraphicalAnalysisView
            report={report}
            history={history}
            corpus={corpus}
            onOpenSideBySide={(sourceId) => {
              if (sourceId) setSelectedInspectSourceId(sourceId);
              setShowSideBySideModal(true);
            }}
            onOpenScanner={() => setCurrentTab('scanner')}
            onManageCorpus={() => setShowCorpusModal(true)}
          />
        )}

        {currentTab === 'analysis' && (
          <AlgorithmAnalysisView
            report={report}
            onOpenScanner={() => setCurrentTab('scanner')}
          />
        )}

        {currentTab === 'history' && (
          <HistoryView
            history={history}
            onSelectHistoryItem={handleViewHistoryItem}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
            onRestoreDemoHistory={handleRestoreDemoHistory}
          />
        )}

        {currentTab === 'benchmarks' && (
          <BenchmarksView />
        )}

        {currentTab === 'docs' && (
          <GuideViewer />
        )}

        {currentTab === 'about' && (
          <AboutView />
        )}
      </main>

      {/* Side-by-Side Dual Inspector Modal */}
      {showSideBySideModal && report && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-6xl w-full p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  Side-by-Side Match Inspector
                </h3>
                <p className="text-xs text-slate-400">
                  Inspect character-exact text overlap, matching source passages, and SLM triage classifications.
                </p>
              </div>
              <button
                onClick={() => setShowSideBySideModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <SideBySideInspector
              report={report}
              corpus={corpus}
              selectedSourceId={selectedInspectSourceId}
              onSelectSourceId={setSelectedInspectSourceId}
              onUpdateMatchSLM={handleUpdateMatchSLM}
            />

            <div className="pt-2 text-right border-t border-slate-800">
              <button
                onClick={() => setShowSideBySideModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Processing & Scanning Progress Modal */}
      <ScanningModal
        isOpen={isScanning}
        documentTitle={submissionTitle.trim() || 'Document'}
        wordCount={submissionText.trim() ? submissionText.trim().split(/\s+/).length : 0}
        corpusCount={corpus.length}
        onComplete={handleCompleteScan}
      />

      {/* Optional Corpus Manager Modal */}
      {showCorpusModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Reference Document Repository</h3>
                <p className="text-xs text-slate-400">Add or manage documents to compare submissions against.</p>
              </div>
              <button
                onClick={() => setShowCorpusModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <CorpusManagerView
              corpus={corpus}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
              onResetCorpus={handleResetCorpus}
            />
          </div>
        </div>
      )}

      {/* Export Report Modal */}
      {showExportModal && report && (
        <ExportModal
          report={report}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">PLAGora</span>
            <span>·</span>
            <span>College Open-Source Plagiarism Detection System</span>
            <span>·</span>
            <span className="text-indigo-400 font-mono">Transparent Similarity Scores</span>
          </div>

          <div className="text-[11px] text-slate-400 text-center sm:text-right">
            Core design principle: The language model is never the judge · Detection is done by explainable algorithms
          </div>
        </div>
      </footer>
    </div>
  );
}
