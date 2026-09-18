import React, { useEffect } from 'react';
import { ActiveReminderAlert } from '../types';

interface InAppReminderAlertProps {
  alert: ActiveReminderAlert | null;
  onDismiss: () => void;
  onSnooze: (alert: ActiveReminderAlert) => void;
  onViewPlan: (target: 'diet' | 'activity') => void;
}

export const InAppReminderAlert: React.FC<InAppReminderAlertProps> = ({
  alert,
  onDismiss,
  onSnooze,
  onViewPlan
}) => {
  useEffect(() => {
    if (!alert) return;

    // Auto-dismiss after 30 seconds if not interacted with
    const timer = setTimeout(() => {
      onDismiss();
    }, 30000);

    return () => clearTimeout(timer);
  }, [alert, onDismiss]);

  if (!alert) return null;

  const isFitness = alert.type === 'activity';
  const borderGlow = isFitness 
    ? 'border-amber-500/40 shadow-[0_0_35px_rgba(245,158,11,0.25)]' 
    : 'border-emerald-500/40 shadow-[0_0_35px_rgba(16,185,129,0.25)]';
  const badgeBg = isFitness 
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  const iconBg = isFitness 
    ? 'bg-gradient-to-tr from-amber-500 to-orange-500 shadow-amber-500/30' 
    : 'bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-emerald-500/30';

  return (
    <div className="fixed top-5 right-5 z-[9999] max-w-md w-[calc(100vw-2.5rem)] animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-auto">
      <div className={`relative overflow-hidden rounded-2xl bg-slate-900/95 backdrop-blur-xl border ${borderGlow} p-5 text-white shadow-2xl transition-all`}>
        {/* Ambient Top Glow Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${isFitness ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-500' : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500'}`} />

        <div className="flex items-start gap-3.5">
          {/* Pulsing Icon */}
          <div className="relative flex-shrink-0 mt-0.5">
            <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center text-xl shadow-lg ring-4 ring-white/10 animate-bounce`}>
              {isFitness ? '⚡' : '🥗'}
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          {/* Alert Content */}
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-semibold text-sm text-slate-200">
                {alert.title}
              </span>
              {alert.badge && (
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeBg}`}>
                  {alert.badge}
                </span>
              )}
              <span className="text-[11px] text-slate-400 ml-auto font-mono">
                {alert.time}
              </span>
            </div>

            <h4 className="text-base font-bold text-white tracking-tight leading-snug mb-1">
              {alert.subtitle}
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mb-3.5">
              {alert.details}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="btn-view-reminder-plan"
                onClick={() => {
                  onViewPlan(alert.planTarget);
                  onDismiss();
                }}
                className="flex-1 min-w-[120px] py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>{alert.planTarget === 'activity' ? '⚡ Open Workout' : '🥗 Open Diet Plan'}</span>
              </button>

              <button
                id="btn-snooze-reminder"
                onClick={() => onSnooze(alert)}
                className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-all active:scale-95"
                title="Remind again in 10 minutes"
              >
                💤 Snooze 10m
              </button>

              <button
                id="btn-dismiss-reminder"
                onClick={onDismiss}
                className="py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 text-xs font-medium transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Close X */}
          <button
            onClick={onDismiss}
            aria-label="Close notification"
            className="flex-shrink-0 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
