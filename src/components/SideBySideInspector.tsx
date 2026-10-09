import React, { useState, useMemo } from 'react';
import { 
  ScanReport, 
  MatchRecord, 
  DocumentRecord,
  SLMCategory 
} from '../types/detector';
import { 
  Columns, 
  ExternalLink, 
  Sparkles, 
  Info, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Bot,
  RefreshCw,
  Hash
} from 'lucide-react';

interface SideBySideInspectorProps {
  report: ScanReport;
  corpus: DocumentRecord[];
  selectedSourceId: string | null;
  onSelectSourceId: (id: string) => void;
  onUpdateMatchSLM: (matchId: string, slmData: MatchRecord['slmExplanation']) => void;
}

export const SideBySideInspector: React.FC<SideBySideInspectorProps> = ({
  report,
  corpus,
  selectedSourceId,
  onSelectSourceId,
  onUpdateMatchSLM
}) => {
  // Currently active selected match
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(
    report.matches.length > 0 ? report.matches[0].id : null
  );
  const [isExplainingSLM, setIsExplainingSLM] = useState(false);

  // Default to first source if none selected
  const activeSourceId = selectedSourceId || (report.topSources.length > 0 ? report.topSources[0].docId : null);
  const activeSourceDoc = corpus.find(d => d.id === activeSourceId);

  // Filter matches relevant to the active source
  const filteredMatches = useMemo(() => {
    if (!activeSourceId) return report.matches;
    return report.matches.filter(m => m.sourceDocId === activeSourceId);
  }, [report.matches, activeSourceId]);

  const activeMatch = report.matches.find(m => m.id === selectedMatchId) || (filteredMatches.length > 0 ? filteredMatches[0] : null);

  // Request or re-run SLM explanation
  const handleRequestSLM = async (match: MatchRecord) => {
    setIsExplainingSLM(true);
    try {
      const surroundingContext = report.submissionText.slice(
        Math.max(0, match.subStart - 100),
        Math.min(report.submissionText.length, match.subEnd + 100)
      );

      const res = await fetch('/api/slm-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passageA: match.subText,
          passageB: match.srcText,
          sourceTitle: match.sourceDocTitle,
          surroundingContext
        })
      });

      if (!res.ok) throw new Error('SLM explanation failed');
      const data = await res.json();

      onUpdateMatchSLM(match.id, {
        category: data.category as SLMCategory,
        explanation: data.explanation,
        confidence: data.confidence,
        isProperlyAttributed: data.isProperlyAttributed,
        generatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsExplainingSLM(false);
    }
  };

  // Helper to color-code match methods
  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'winnowing':
        return { label: 'Exact Winnowing', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800' };
      case 'lexical':
        return { label: 'Lexical Alignment', color: 'text-amber-400 bg-amber-950/60 border-amber-800' };
      case 'semantic':
        return { label: 'Semantic Paraphrase', color: 'text-indigo-400 bg-indigo-950/60 border-indigo-800' };
      case 'code':
        return { label: 'Code Clone', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800' };
      default:
        return { label: method, color: 'text-slate-400 bg-slate-900 border-slate-700' };
    }
  };

  // Render text with clickable highlight marks
  const renderHighlightedSubmissionText = () => {
    const text = report.submissionText;
    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    // Collect all regions: matches and masked spans
    interface TextRegion {
      start: number;
      end: number;
      type: 'match' | 'mask';
      matchRecord?: MatchRecord;
      maskType?: string;
    }

    const regions: TextRegion[] = [];
    for (const m of filteredMatches) {
      regions.push({ start: m.subStart, end: m.subEnd, type: 'match', matchRecord: m });
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

      if (reg.type === 'match' && reg.matchRecord) {
        const m = reg.matchRecord;
        const isSelected = activeMatch?.id === m.id;
        let bgStyle = 'bg-emerald-500/20 text-emerald-200 border-b-2 border-emerald-400';
        if (m.method === 'lexical') bgStyle = 'bg-amber-500/20 text-amber-200 border-b-2 border-amber-400';
        if (m.method === 'semantic') bgStyle = 'bg-indigo-500/20 text-indigo-200 border-b-2 border-indigo-400';
        if (m.method === 'code') bgStyle = 'bg-cyan-500/20 text-cyan-200 border-b-2 border-cyan-400';

        if (isSelected) {
          bgStyle += ' ring-2 ring-white/80 ring-offset-1 ring-offset-slate-900 font-medium';
        }

        segments.push(
          <mark
            key={`match-${m.id}-${reg.start}`}
            onClick={() => setSelectedMatchId(m.id)}
            className={`cursor-pointer px-0.5 rounded transition-all inline ${bgStyle}`}
            title={`Click to inspect: ${m.method} (${Math.round(m.confidence * 100)}%)`}
          >
            {text.slice(reg.start, reg.end)}
          </mark>
        );
      } else if (reg.type === 'mask') {
        segments.push(
          <span
            key={`mask-${reg.start}`}
            className="text-slate-400 line-through decoration-slate-600 bg-slate-800/60 px-0.5 rounded inline"
            title={`[Fairness Filter] Masked ${reg.maskType} (neutralized)`}
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
  };

  // Render text for source document pane with highlights
  const renderHighlightedSourceText = () => {
    if (!activeSourceDoc) return <span className="text-slate-500">Source document not loaded.</span>;
    const text = activeSourceDoc.content;
    const segments: React.ReactNode[] = [];
    let lastIndex = 0;

    const sourceMatches = filteredMatches.filter(m => m.sourceDocId === activeSourceDoc.id);
    sourceMatches.sort((a, b) => a.srcStart - b.srcStart);

    for (const m of sourceMatches) {
      if (m.srcStart > lastIndex) {
        segments.push(
          <span key={`src-plain-${lastIndex}`}>
            {text.slice(lastIndex, m.srcStart)}
          </span>
        );
      }

      const isSelected = activeMatch?.id === m.id;
      let bgStyle = 'bg-emerald-500/20 text-emerald-200 border-b-2 border-emerald-400';
      if (m.method === 'lexical') bgStyle = 'bg-amber-500/20 text-amber-200 border-b-2 border-amber-400';
      if (m.method === 'semantic') bgStyle = 'bg-indigo-500/20 text-indigo-200 border-b-2 border-indigo-400';
      if (m.method === 'code') bgStyle = 'bg-cyan-500/20 text-cyan-200 border-b-2 border-cyan-400';

      if (isSelected) {
        bgStyle += ' ring-2 ring-white/80 ring-offset-1 ring-offset-slate-900 font-medium';
      }

      segments.push(
        <mark
          key={`src-match-${m.id}-${m.srcStart}`}
          onClick={() => setSelectedMatchId(m.id)}
          className={`cursor-pointer px-0.5 rounded transition-all inline ${bgStyle}`}
          title={`Matched by: ${m.method}`}
        >
          {text.slice(m.srcStart, m.srcEnd)}
        </mark>
      );

      lastIndex = Math.max(lastIndex, m.srcEnd);
    }

    if (lastIndex < text.length) {
      segments.push(
        <span key={`src-plain-${lastIndex}`}>
          {text.slice(lastIndex)}
        </span>
      );
    }

    return segments;
  };

  return (
    <div className="space-y-6">
      {/* Header and Source Document Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <Columns className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Interactive Side-by-Side Match Inspector
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Synchronized comparison with character-exact highlighting and deterministic algorithm verification.
          </p>
        </div>

        {/* Source Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 whitespace-nowrap">
            Comparing against:
          </label>
          <select
            value={activeSourceId || ''}
            onChange={e => onSelectSourceId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 max-w-[260px] truncate"
          >
            {report.topSources.map(s => (
              <option key={s.docId} value={s.docId}>
                {s.docTitle} ({s.similarityPercent}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dual Document Viewing Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Pane: Submission Text */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col h-[520px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Submission: {report.submissionTitle}
            </span>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
              <span>{filteredMatches.length} flagged spans</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto text-xs font-mono text-slate-300 leading-relaxed pr-2 whitespace-pre-wrap select-text">
            {renderHighlightedSubmissionText()}
          </div>
        </div>

        {/* Right Pane: Source Document Text */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col h-[520px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 truncate max-w-[340px]">
              Source: {activeSourceDoc?.title || 'Selected Reference'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {activeSourceDoc?.author || ''}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto text-xs font-mono text-slate-300 leading-relaxed pr-2 whitespace-pre-wrap select-text">
            {renderHighlightedSourceText()}
          </div>
        </div>
      </div>

      {/* Selected Passage Details & SLM Triage Explanation Drawer */}
      {activeMatch && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
            <div className="flex items-center gap-2.5">
              <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getMethodBadge(activeMatch.method).color}`}>
                {getMethodBadge(activeMatch.method).label}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Confidence: <span className="font-mono font-semibold text-white">{Math.round(activeMatch.confidence * 100)}%</span>
              </span>
              <span className="text-xs text-slate-400">
                · Offsets: <span className="font-mono text-slate-300">[{activeMatch.subStart}–{activeMatch.subEnd}]</span>
              </span>
            </div>

            <button
              onClick={() => handleRequestSLM(activeMatch)}
              disabled={isExplainingSLM}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isExplainingSLM ? 'animate-spin' : ''}`} />
              {activeMatch.slmExplanation ? 'Re-evaluate with SLM' : 'Request SLM Triage'}
            </button>
          </div>

          {/* Side-by-Side Excerpt Strings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1 font-sans">
                Submission Passage:
              </div>
              <div className="text-slate-200">
                &ldquo;{activeMatch.subText}&rdquo;
              </div>
            </div>

            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1 font-sans">
                Source Document Passage:
              </div>
              <div className="text-slate-200">
                &ldquo;{activeMatch.srcText}&rdquo;
              </div>
            </div>
          </div>

          {/* Deterministic Algorithm Verification Details */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-slate-300 font-semibold font-sans">
              Algorithmic Proof:
            </span>
            {activeMatch.details?.shingleCount && (
              <span>Shingles: <strong className="text-slate-200">{activeMatch.details.shingleCount}</strong></span>
            )}
            {activeMatch.details?.winnowingHashes && (
              <span>Hash Collisions: <strong className="text-slate-200">#{activeMatch.details.winnowingHashes[0]}</strong></span>
            )}
            {activeMatch.details?.smithWatermanScore && (
              <span>Alignment Score: <strong className="text-slate-200">{activeMatch.details.smithWatermanScore}</strong></span>
            )}
            {activeMatch.details?.cosineSim && (
              <span>Vector Cosine: <strong className="text-slate-200">{activeMatch.details.cosineSim}</strong></span>
            )}
          </div>

          {/* Section 6: Small Language Model (SLM) Assistive Triage Card */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950/30 border border-indigo-900/60 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-200">
                  SLM Assistive Triage
                </span>
                <span className="text-[10px] text-amber-400/90 bg-amber-950/40 border border-amber-800/60 px-1.5 py-0.5 rounded font-sans">
                  AI-generated explanation · verify before use
                </span>
              </div>
              {activeMatch.slmExplanation && (
                <span className="text-[11px] text-slate-400 font-mono">
                  Confidence: {Math.round(activeMatch.slmExplanation.confidence * 100)}%
                </span>
              )}
            </div>

            {activeMatch.slmExplanation ? (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Classified Category:</span>
                  <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-800 text-indigo-300 font-mono">
                    {activeMatch.slmExplanation.category}
                  </span>
                  {activeMatch.slmExplanation.isProperlyAttributed ? (
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Cited in context
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> No surrounding citation found
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {activeMatch.slmExplanation.explanation}
                </p>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-1">
                Click &quot;Request SLM Triage&quot; above to have the Small Language Model classify this passage as direct quotation, close copy, paraphrase, or common phrasing.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
