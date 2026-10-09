import React, { useState } from 'react';
import { BenchmarkSummary } from '../types/detector';
import { BENCHMARK_TEST_SUITE } from '../data/sampleCorpus';
import { 
  Award, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Target,
  BarChart3,
  Cpu
} from 'lucide-react';

export const BenchmarksView: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [summaries, setSummaries] = useState<Record<string, BenchmarkSummary> | null>(null);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);

  const handleRunBenchmarks = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/benchmarks/run', {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Benchmark run failed');
      const data = await res.json();
      setSummaries(data.suites);
      setLastRunTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800/40 border border-slate-700/60 rounded-xl p-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Academic Benchmark Suite &amp; Accuracy Verification
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Publicly verifiable evaluation on PAN Shared Tasks, Microsoft Research Paraphrase Corpus (MRPC), and Code Clones.
          </p>
        </div>

        <button
          onClick={handleRunBenchmarks}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm shadow-purple-600/30 whitespace-nowrap"
        >
          <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running Test Suites...' : 'Run Benchmark Evaluation'}
        </button>
      </div>

      {/* Summary Scorecards if run */}
      {summaries ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Last evaluated: <strong className="text-slate-200">{lastRunTime}</strong></span>
            <span>Hardware target: Commodity CPU</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(summaries).map(([name, s]) => (
              <div key={name} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                  <h3 className="text-sm font-bold text-white">{name} Suite</h3>
                  <span className="text-xs font-mono text-purple-400 font-semibold">
                    F1: {s.f1}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-500">PRECISION</div>
                    <div className="text-emerald-400 font-bold text-sm mt-0.5">{s.precision}</div>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-500">RECALL</div>
                    <div className="text-cyan-400 font-bold text-sm mt-0.5">{s.recall}</div>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-500">CASES (TP/FP)</div>
                    <div className="text-slate-200 font-bold text-sm mt-0.5">{s.truePositives}/{s.falsePositives}</div>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                    <div className="text-[10px] text-slate-500">LATENCY</div>
                    <div className="text-amber-400 font-bold text-sm mt-0.5">{s.avgRuntimeMs}ms</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-8 text-center space-y-2">
          <BarChart3 className="w-8 h-8 text-purple-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">
            No Active Benchmark Run
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click &quot;Run Benchmark Evaluation&quot; above to execute automated test cases across PAN, MRPC, and Code Clone datasets.
          </p>
        </div>
      )}

      {/* Test Cases Table */}
      <div className="bg-slate-800/40 border border-slate-700 rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
          Standard Benchmark Test Corpus Cases ({BENCHMARK_TEST_SUITE.length})
        </h3>

        <div className="border border-slate-800 rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Test Case</th>
                <th className="py-2 px-3">Dataset</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3 text-center">Ground Truth</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {BENCHMARK_TEST_SUITE.map(c => (
                <tr key={c.id} className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                    {c.title}
                  </td>
                  <td className="py-2.5 px-3 text-purple-400 font-semibold">
                    {c.dataset}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {c.groundTruthType}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {c.groundTruthPlagiarized ? (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900">
                        PLAGIARIZED
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900">
                        ORIGINAL (TN)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
