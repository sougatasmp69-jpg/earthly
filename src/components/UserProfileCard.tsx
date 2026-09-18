import React from 'react';
import { LogOut, ShieldCheck, Sparkles, Ruler, Weight, UserCog, Bell } from 'lucide-react';
import { User } from '../types';

interface UserProfileCardProps {
  currentUser: User | null;
  onLogout: () => void;
  onViewDietPlan?: () => void;
  onEditProfile?: () => void;
  onOpenReminders?: () => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  currentUser,
  onLogout,
  onViewDietPlan,
  onEditProfile,
  onOpenReminders
}) => {
  const displayName = currentUser?.name || 'Alex Morgan';
  const displayPhone = currentUser?.phoneNumber || '+1 (555) 019-2834';
  const height = currentUser?.heightCm || 175;
  const weight = currentUser?.weightKg || 68;

  return (
    <div className="glass-card-dark rounded-2xl p-4 border border-white/10 shadow-xl space-y-3">
      
      {/* Top: Avatar & Info */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-teal-400 p-[1.5px] shadow-md">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" 
                alt={displayName} 
                className="w-full h-full object-cover rounded-[10px]"
              />
            </div>
            <span className="w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 absolute -bottom-0.5 -right-0.5 shadow-sm" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white leading-tight">{displayName}</span>
              <span className="p-0.5 rounded bg-emerald-500/20 text-emerald-400" title="Verified Eco Tracker">
                <ShieldCheck className="w-3 h-3" />
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">{displayPhone}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onEditProfile && (
            <button
              onClick={onEditProfile}
              className="p-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-teal-300 transition-colors cursor-pointer"
              title="Edit Profile & Body Metrics"
            >
              <UserCog className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-rose-400 transition-colors cursor-pointer"
            title="Sign out / Switch account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log out</span>
          </button>
        </div>
      </div>

      {/* Middle: Physical Metrics Tag Bar */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/60 border border-white/5 text-slate-300">
          <Ruler className="w-3.5 h-3.5 text-teal-400" />
          <span>Height: <strong className="text-white font-mono">{height} cm</strong></span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/60 border border-white/5 text-slate-300">
          <Weight className="w-3.5 h-3.5 text-purple-400" />
          <span>Weight: <strong className="text-white font-mono">{weight} kg</strong></span>
        </div>
      </div>

      {/* Bottom: AI Diet & Fitness Plan Shortcut & Reminders */}
      <div className="flex flex-col sm:flex-row items-center gap-2">
        {onViewDietPlan && (
          <button
            onClick={onViewDietPlan}
            className="flex-1 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-950/40 via-teal-950/40 to-emerald-950/40 hover:from-purple-900/50 hover:via-teal-900/50 hover:to-emerald-900/50 border border-teal-500/30 text-teal-300 hover:text-teal-200 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span>AI Health & Routine</span>
            </span>
            <span className="text-xs">→</span>
          </button>
        )}
        {onOpenReminders && (
          <button
            id="btn-profile-reminders"
            onClick={onOpenReminders}
            className="w-full sm:w-auto py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-400/60 text-emerald-300 hover:text-emerald-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            title="Meal & Activity Reminders"
          >
            <Bell className="w-3.5 h-3.5 text-emerald-400" />
            <span>Alarms</span>
          </button>
        )}
      </div>

    </div>
  );
};
