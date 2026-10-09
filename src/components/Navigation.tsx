import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ScanLine, 
  BarChart3, 
  Calculator, 
  History, 
  Award, 
  BookOpen, 
  Info, 
  Menu, 
  X,
  PlusCircle,
  Sparkles
} from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'scanner' 
  | 'graphs' 
  | 'analysis' 
  | 'history' 
  | 'benchmarks' 
  | 'docs' 
  | 'about';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  recentScansCount: number;
  corpusCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  recentScansCount,
  corpusCount
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode; color: string; badge?: string | number }> = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: <LayoutDashboard className="w-4 h-4 text-cyan-400" />,
      color: 'text-cyan-400'
    },
    { 
      id: 'scanner', 
      label: 'Scanner', 
      icon: <ScanLine className="w-4 h-4 text-emerald-400" />,
      color: 'text-emerald-400'
    },
    { 
      id: 'graphs', 
      label: 'Graphical Analysis', 
      icon: <BarChart3 className="w-4 h-4 text-fuchsia-400" />,
      color: 'text-fuchsia-400'
    },
    { 
      id: 'analysis', 
      label: 'Analysis / Algorithms', 
      icon: <Calculator className="w-4 h-4 text-amber-400" />,
      color: 'text-amber-400'
    },
    { 
      id: 'history', 
      label: 'History', 
      icon: <History className="w-4 h-4 text-violet-400" />,
      color: 'text-violet-400',
      badge: recentScansCount 
    },
    { 
      id: 'benchmarks', 
      label: 'Benchmarks', 
      icon: <Award className="w-4 h-4 text-rose-400" />,
      color: 'text-rose-400'
    },
    { 
      id: 'docs', 
      label: 'Documentation', 
      icon: <BookOpen className="w-4 h-4 text-pink-400" />,
      color: 'text-pink-400'
    },
    { 
      id: 'about', 
      label: 'About', 
      icon: <Info className="w-4 h-4 text-teal-400" />,
      color: 'text-teal-400'
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-indigo-900/40 text-slate-100 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Brand Lockup */}
        <div 
          onClick={() => onSelectTab('dashboard')} 
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-black text-white shadow-md shadow-purple-500/30 group-hover:scale-105 transition-transform text-xs font-mono">
            PL
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-white leading-none">
                PLAG<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">ora</span>
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                v1.2 Open Source
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium tracking-tight mt-0.5">
              Explainable Plagiarism Detector
            </span>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden xl:flex items-center gap-1 text-xs font-semibold">
          {navItems.map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-950 to-slate-800 text-white shadow-md border border-indigo-700/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Medium screens condensed nav */}
        <nav className="hidden md:flex xl:hidden items-center gap-1 text-xs font-semibold">
          {navItems.slice(0, 5).map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-950 text-white border border-indigo-700/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label.split('/')[0].trim()}</span>
              </button>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNavClick('scanner')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:from-indigo-700 active:to-purple-700 rounded-xl transition-all shadow-md shadow-indigo-600/30 whitespace-nowrap"
          >
            <ScanLine className="w-3.5 h-3.5 text-emerald-300" />
            <span>Scan Document</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-1">
          {navItems.map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-indigo-950 text-white border border-indigo-800'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
