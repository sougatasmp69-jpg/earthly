import React from 'react';
import { 
  Leaf, 
  Calendar, 
  BookOpen, 
  RotateCcw, 
  AlertTriangle, 
  Edit2, 
  LogOut,
  Bell
} from 'lucide-react';
import { WeeklyTarget, User } from '../types';

interface HeaderBarProps {
  weeklyTarget: WeeklyTarget;
  weeklyEmissionsKg: number;
  onOpenTargetModal: () => void;
  onOpenDecisions: () => void;
  onResetSeed: () => void;
  dateRangeLabel: string;
  currentUser?: User | null;
  onLogout?: () => void;
  activeView: 'dashboard' | 'diet-plan';
  onViewChange: (view: 'dashboard' | 'diet-plan') => void;
  onOpenReminders?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  weeklyTarget,
  weeklyEmissionsKg,
  onOpenTargetModal,
  onOpenDecisions,
  onResetSeed,
  dateRangeLabel,
  currentUser,
  onLogout,
  activeView,
  onViewChange,
  onOpenReminders
}) => {
  const targetKg = weeklyTarget.targetKg || 50;
  const percentage = Math.round((weeklyEmissionsKg / targetKg) * 100);
  const clampedProgress = Math.min(100, percentage);

  // DP1 color transitions: Green (<80%), Amber (80-99%), Rose/Red (100%+)
  let progressGradient = 'from-emerald-500 via-teal-400 to-cyan-400';
  let progressGlow = 'rgba(52, 211, 153, 0.4)';
  let statusBadge = (
    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
      On Track
    </span>
  );

  if (percentage >= 100) {
    progressGradient = 'from-rose-500 via-red-500 to-amber-500';
    progressGlow = 'rgba(244, 63, 94, 0.45)';
    statusBadge = (
      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3 text-rose-400" /> Over Target
      </span>
    );
  } else if (percentage >= 80) {
    progressGradient = 'from-amber-500 via-amber-400 to-orange-400';
    progressGlow = 'rgba(245, 158, 11, 0.4)';
    statusBadge = (
      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
        Approaching Limit
      </span>
    );
  }

  const displayName = currentUser?.name || 'Alex Morgan';

  return (
    <header className="w-full glass-panel-dark border-b border-white/10 sticky top-0 z-40 px-4 sm:px-6 py-3 transition-all backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3.5">
        
        {/* Left: App Brand, Title & View Switcher */}
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-purple-600 p-[1.5px] shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center">
                <Leaf className="w-4 h-4 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">Earthly</span>
                <span className="text-[9px] tracking-wider uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Carbon OS
                </span>
              </div>
              <h1 className="text-[11px] text-slate-400 font-medium">Carbon & Eco-Wellness</h1>
            </div>
          </div>

          {/* Navigation View Switcher (Carbon Tracker vs AI Diet Plan) */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-white/10 shadow-inner">
            <button
              onClick={() => onViewChange('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🌿 Footprint Tracker</span>
            </button>
            <button
              onClick={() => onViewChange('diet-plan')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeView === 'diet-plan'
                  ? 'bg-gradient-to-r from-purple-600 to-teal-500 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🥗 AI Diet Plan</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            </button>
          </div>

          {/* Mobile Actions */}
          <div className="flex lg:hidden items-center gap-2">
            {onOpenReminders && (
              <button
                id="btn-mobile-reminders"
                onClick={onOpenReminders}
                className="p-1.5 rounded-lg bg-slate-800/80 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300"
                title="Meal & Activity Reminders"
              >
                <Bell className="w-4 h-4" />
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-slate-300 hover:text-rose-400"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onOpenDecisions}
              className="p-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-slate-300 hover:text-white"
              title="Design Decisions"
            >
              <BookOpen className="w-4 h-4 text-purple-400" />
            </button>
          </div>
        </div>

        {/* Center: Weekly CO2 Target Progress Bar (Only show if in dashboard or compact in diet plan) */}
        {activeView === 'dashboard' ? (
          <div className="w-full lg:max-w-md xl:max-w-lg bg-slate-950/70 border border-white/10 rounded-2xl px-4 py-2 shadow-inner">
            <div className="flex items-center justify-between mb-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-300 font-medium text-[11px]">Weekly CO2 Target Progress</span>
                {statusBadge}
              </div>
              <span className="text-slate-100 font-bold tracking-wide text-xs">
                {weeklyEmissionsKg.toFixed(1)} <span className="text-slate-400 font-normal">of {targetKg.toFixed(0)} kg CO₂</span>
              </span>
            </div>

            {/* Progress Bar Track */}
            <div className="w-full bg-slate-900 border border-white/10 h-2.5 rounded-full overflow-hidden relative shadow-inner">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${progressGradient} transition-all duration-500 ease-out`}
                style={{ 
                  width: `${clampedProgress}%`,
                  boxShadow: `0 0 12px ${progressGlow}`
                }}
              />
            </div>

            {/* Bottom Labels */}
            <div className="flex items-center justify-between mt-1 text-[10px]">
              <span className="text-slate-400">
                <strong className="text-emerald-400">{weeklyEmissionsKg.toFixed(1)} kg</strong> used
              </span>
              <button 
                onClick={onOpenTargetModal}
                className="group flex items-center gap-1 text-slate-400 hover:text-teal-300 transition-colors cursor-pointer"
              >
                <span>Target: <strong className="text-slate-200 group-hover:text-teal-300">{targetKg.toFixed(0)} kg</strong></span>
                <Edit2 className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full lg:max-w-md xl:max-w-lg flex items-center justify-between bg-slate-950/60 border border-teal-500/20 rounded-2xl px-4 py-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Personalized Eco-Diet:</span>
              <span className="text-teal-300 font-bold">{currentUser?.name || 'Alex Morgan'}</span>
            </div>
            <button
              onClick={() => onViewChange('dashboard')}
              className="text-[11px] text-teal-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
            >
              <span>View Carbon Tracker</span> →
            </button>
          </div>
        )}

        {/* Right: Date Range & Icons */}
        <div className="hidden lg:flex items-center gap-2.5">
          
          {/* Reminders & Alarms Button */}
          {onOpenReminders && (
            <button
              id="btn-header-reminders"
              onClick={onOpenReminders}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-400/50 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-all shadow-sm cursor-pointer relative"
              title="Meal & Activity Reminders (Alarms)"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-400" />
              <span>Alarms</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
            </button>
          )}

          {/* Quick Decision Points Button */}
          <button
            onClick={onOpenDecisions}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-purple-500/30 hover:border-purple-400/50 text-xs font-semibold text-purple-300 hover:text-purple-200 transition-all shadow-sm cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Decisions</span>
          </button>

          {/* Reset Seed Button */}
          <button
            onClick={onResetSeed}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-teal-500/30 hover:border-teal-400/50 text-xs font-medium text-teal-300 hover:text-teal-200 transition-all shadow-sm cursor-pointer"
            title="Reset to 14 sample demo entries"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
            <span>Reset Demo</span>
          </button>

          {/* Date-range picker showing the current week */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-medium text-slate-200 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>{dateRangeLabel}</span>
          </div>

          {/* Profile Icon Avatar */}
          <div className="flex items-center gap-2 pl-1 border-l border-white/10">
            <div className="relative group cursor-pointer" title={`${displayName} (Click to log out)`} onClick={onLogout}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-teal-400 p-[1.5px]">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" 
                  alt={displayName} 
                  className="w-full h-full object-cover rounded-[9px]"
                />
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 absolute -bottom-0.5 -right-0.5 shadow-sm" />
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
