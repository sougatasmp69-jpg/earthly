import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  BookOpen, 
  RotateCcw, 
  Target
} from 'lucide-react';
import { WeeklyTarget } from '../types';

interface NavbarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  weeklyTarget: WeeklyTarget;
  weeklyEmissionsKg: number;
  onOpenTargetModal: () => void;
  onOpenDecisions: () => void;
  onResetSeed: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigate,
  weeklyTarget,
  weeklyEmissionsKg,
  onOpenTargetModal,
  onOpenDecisions,
  onResetSeed
}) => {
  const percentUsed = weeklyTarget.targetKg > 0 
    ? Math.round((weeklyEmissionsKg / weeklyTarget.targetKg) * 100) 
    : 0;

  const isOver = percentUsed >= 100;
  const isNear = percentUsed >= 80 && percentUsed < 100;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all shadow-sm">
      {/* Top Banner Notice */}
      <div className="bg-earthly-900 text-earthly-100 text-[11px] py-1 px-4 text-center font-medium flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>
          <strong>Earthly Carbon Tracker</strong> — Fixed Emission Factors & Automatic Calculations.
        </span>
        <button
          type="button"
          onClick={onOpenDecisions}
          className="underline hover:text-white font-semibold ml-1 cursor-pointer"
        >
          View DP1, DP2 & DP3 Decision Log →
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Title */}
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-earthly-800 to-earthly-500 flex items-center justify-center shadow-md shadow-earthly-900/10 group-hover:scale-105 transition-transform">
              <span className="text-xl">🌱</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 font-sans">
                  Earthly
                </span>
                <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md border border-emerald-200">
                  CO₂ Tracker
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium hidden sm:block">
                Personal Carbon Footprint & Target Analytics
              </p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-earthly-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-earthly-600" />
              <span>Emissions Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('log-activity')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'log-activity'
                  ? 'bg-earthly-700 text-white shadow-sm'
                  : 'bg-emerald-600/10 text-emerald-800 hover:bg-emerald-600/20'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Log Activity</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('history')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-earthly-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <History className="w-4 h-4 text-earthly-600" />
              <span>Activity History</span>
            </button>
          </nav>

          {/* Right Tools: Weekly Target Pill & Decisions */}
          <div className="flex items-center gap-2">
            
            {/* Weekly Target Status Quick Button */}
            <button
              type="button"
              onClick={onOpenTargetModal}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                isOver
                  ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                  : isNear
                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
              title="Click to adjust weekly CO2 target"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Target: {weeklyTarget.targetKg} kg</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                isOver ? 'bg-red-200 text-red-900' : isNear ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
              }`}>
                {percentUsed}%
              </span>
            </button>

            {/* Decisions Doc Trigger */}
            <button
              type="button"
              onClick={onOpenDecisions}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200"
              title="Read decisions on Over-Target Nudges (DP1), Input Bounds (DP2), and Week Definition (DP3)"
            >
              <BookOpen className="w-3.5 h-3.5 text-earthly-600" />
              <span>DECISIONS.md</span>
            </button>

            {/* Reset Demo Data Button */}
            <button
              type="button"
              onClick={onResetSeed}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              title="Reset sample activities to clean demo state"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-100 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-earthly-100 text-earthly-800' : 'text-slate-600'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => onNavigate('log-activity')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 whitespace-nowrap ${
              activeTab === 'log-activity' ? 'bg-earthly-700 text-white' : 'text-earthly-700 bg-earthly-50'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Log Activity
          </button>

          <button
            type="button"
            onClick={() => onNavigate('history')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1 whitespace-nowrap ${
              activeTab === 'history' ? 'bg-earthly-100 text-earthly-800' : 'text-slate-600'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            History
          </button>

          <button
            type="button"
            onClick={onOpenDecisions}
            className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 rounded-xl flex items-center gap-1 whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Decisions
          </button>
        </div>

      </div>
    </header>
  );
};
