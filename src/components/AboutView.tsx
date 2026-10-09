import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  FileText, 
  Lock, 
  Code2, 
  GraduationCap, 
  ExternalLink,
  Github,
  CheckCircle2,
  Heart
} from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Title */}
      <div className="space-y-2 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-xs font-semibold text-indigo-300">
          <GraduationCap className="w-3.5 h-3.5" />
          <span>University Open-Source Initiative</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          About PLAGora
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          An open-source, privacy-first alternative to proprietary plagiarism detection tools, built for universities, researchers, and developers.
        </p>
      </div>

      {/* The Problem & Why We Built This */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight">
          The Problem with Commercial Plagiarism Checkers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-2">
            <h3 className="font-semibold text-rose-300">Institutional Monopoly &amp; Cost</h3>
            <p>
              Tools like Turnitin and Copyleaks require expensive enterprise contracts. Smaller colleges, independent educators, and developing-nation institutions are routinely priced out.
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-2">
            <h3 className="font-semibold text-amber-300">Black-Box Opacity</h3>
            <p>
              Commercial detectors output a single &quot;similarity score&quot; with minimal explanation of how it was derived. Accusing a student based on an un-auditable number is scientifically and ethically flawed.
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-2">
            <h3 className="font-semibold text-cyan-300">Student Privacy Surrender</h3>
            <p>
              Uploading papers to commercial clouds transfers student copyright and raises strict GDPR, FERPA, and DPDP privacy issues. Student drafts become proprietary vendor training sets.
            </p>
          </div>
          <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-2">
            <h3 className="font-semibold text-purple-300">False Positives on Boilerplate</h3>
            <p>
              Legitimate quotations, reference sections, and assignment prompts frequently trigger unfair penalties unless the system offers tunable, transparent masking.
            </p>
          </div>
        </div>
      </div>

      {/* Core Design Principles */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight">
          Core Design Principles
        </h2>
        <div className="space-y-3 text-xs text-slate-300">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <strong className="text-white block">The Language Model is Never the Judge</strong>
              Detection is strictly performed by deterministic, reproducible algorithms (Winnowing, MinHash, Smith-Waterman alignment, vector cosine similarity). The language model only assists humans in reading and triaging flagged matches.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <strong className="text-white block">Self-Hostable &amp; Offline First</strong>
              Runs locally on modest hardware without needing cloud GPUs. Documents never leave the campus network or personal laptop.
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <strong className="text-white block">Fairness by Design</strong>
              Includes built-in quotation masking, bibliography exclusion, and assignment prompt whitelisting to protect students from false accusations.
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack & Academic Pedigree */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white tracking-tight">
          Technical Architecture &amp; References
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
            <div className="text-slate-500 text-[10px]">FINGERPRINTING</div>
            <div className="text-emerald-400 font-bold mt-1">Winnowing (MOSS)</div>
            <div className="text-[10px] text-slate-500">Schleimer et al. 2003</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
            <div className="text-slate-500 text-[10px]">INDEXING</div>
            <div className="text-cyan-400 font-bold mt-1">MinHash &amp; LSH</div>
            <div className="text-[10px] text-slate-500">64-Permutations</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
            <div className="text-slate-500 text-[10px]">ALIGNMENT</div>
            <div className="text-amber-400 font-bold mt-1">Smith-Waterman</div>
            <div className="text-[10px] text-slate-500">Dynamic Programming</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
            <div className="text-slate-500 text-[10px]">FRONTEND</div>
            <div className="text-purple-400 font-bold mt-1">React 19 &amp; Vite</div>
            <div className="text-[10px] text-slate-500">Tailwind CSS v4</div>
          </div>
        </div>
      </div>

      {/* Open-Source License & Collaboration */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-sm font-bold text-white">
            Distributed under the Apache 2.0 License
          </h3>
          <p className="text-xs text-slate-400">
            Free to inspect, audit, modify, and self-host for educational and non-profit usage.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Heart className="w-4 h-4 text-rose-500 inline fill-rose-500" />
          <span>Made for transparent academic integrity</span>
        </div>
      </div>
    </div>
  );
};
