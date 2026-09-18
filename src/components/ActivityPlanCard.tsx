import React, { useState } from 'react';
import { 
  Activity, 
  RotateCcw, 
  Flame, 
  Clock, 
  Calendar, 
  ShieldAlert, 
  Sparkles, 
  HeartPulse, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  ChevronDown,
  Info,
  Footprints,
  Dumbbell,
  Compass
} from 'lucide-react';
import { ActivityPlan, DayActivityRoutine, ExerciseItem, User } from '../types';

interface ActivityPlanCardProps {
  activityPlan: ActivityPlan | null;
  currentUser: User;
  onRegenerate: () => Promise<void>;
  isRegenerating?: boolean;
  onEditMetrics?: () => void;
}

export const ActivityPlanCard: React.FC<ActivityPlanCardProps> = ({
  activityPlan,
  currentUser,
  onRegenerate,
  isRegenerating = false,
  onEditMetrics
}) => {
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [localRegenLoading, setLocalRegenLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegenerateClick = async () => {
    if (isRegenerating || localRegenLoading) return;
    setErrorMsg(null);
    setLocalRegenLoading(true);
    try {
      await onRegenerate();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to regenerate activity plan. Please try again.');
    } finally {
      setLocalRegenLoading(false);
    }
  };

  const toggleExerciseExpand = (id: string) => {
    setExpandedExerciseId(prev => (prev === id ? null : id));
  };

  const getIntensityBadge = (intensity: string) => {
    switch (intensity) {
      case 'Low':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Moderate':
        return 'bg-teal-500/15 text-teal-300 border-teal-500/30';
      case 'Moderate-High':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-700/30 text-slate-300 border-slate-600/30';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cardio':
        return <Footprints className="w-4 h-4 text-cyan-400" />;
      case 'strength':
        return <Dumbbell className="w-4 h-4 text-purple-400" />;
      case 'mobility':
        return <Activity className="w-4 h-4 text-teal-400" />;
      case 'flexibility':
        return <HeartPulse className="w-4 h-4 text-rose-400" />;
      default:
        return <Compass className="w-4 h-4 text-emerald-400" />;
    }
  };

  if (!activityPlan) {
    return (
      <div className="glass-card-dark rounded-3xl p-8 border border-white/10 text-center space-y-4 animate-fade-in">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
          <Activity className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">No Fitness Activity Plan Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Complete your profile metrics with weight and height to generate your tailored 7-day movement routine.
          </p>
        </div>
        <button
          onClick={handleRegenerateClick}
          disabled={localRegenLoading}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-bold text-xs hover:opacity-95 transition-all cursor-pointer shadow-lg shadow-teal-500/20 inline-flex items-center gap-2"
        >
          {localRegenLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Building your activity plan...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Activity Plan Now</span>
            </>
          )}
        </button>
      </div>
    );
  }

  const daysList = activityPlan.schedule || [];
  const filteredDays = selectedDay === 'all' 
    ? daysList 
    : daysList.filter(d => d.day.toLowerCase() === selectedDay.toLowerCase());

  const activeDaysCount = daysList.filter(d => !d.isRestDay).length;
  const totalWeeklyMinutes = daysList.reduce((acc, d) => acc + d.totalDurationMinutes, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Intro Banner & Status Card */}
      <div className="glass-card-dark rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-teal-400 animate-pulse" /> Weight-Tailored Routine
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                {activityPlan.fitnessLevel}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>🏃 AI-Generated Fitness Activity Plan</span>
            </h3>

            {/* Intro statement as specified in prompt */}
            <p className="text-sm font-medium text-teal-200/90 mt-1">
              Based on your current weight, here's a plan to help you get fitter.
            </p>

            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {activityPlan.introSummary}
            </p>
          </div>

          {/* Regenerate Plan Action */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {onEditMetrics && (
              <button
                onClick={onEditMetrics}
                className="px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Edit Weight ({currentUser.weightKg || activityPlan.weightKg} kg)
              </button>
            )}
            <button
              onClick={handleRegenerateClick}
              disabled={isRegenerating || localRegenLoading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-teal-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating || localRegenLoading ? 'animate-spin' : ''}`} />
              <span>{isRegenerating || localRegenLoading ? 'Building Plan...' : 'Regenerate Plan'}</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights Metric Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Frequency</span>
              <span className="text-sm font-extrabold text-white">{activeDaysCount} Days / Week</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Weekly Time</span>
              <span className="text-sm font-extrabold text-white">{totalWeeklyMinutes} Mins</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Weekly Burn</span>
              <span className="text-sm font-extrabold text-white">~{activityPlan.weeklyCalorieBurnEstimate} kcal</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Body Metrics</span>
              <span className="text-sm font-extrabold text-white font-mono">{activityPlan.weightKg} kg • BMI {activityPlan.bmi}</span>
            </div>
          </div>

        </div>

      </div>

      {/* Error alert with retry */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 animate-shake">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={handleRegenerateClick}
            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-white font-bold text-xs cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Day Selector Pill Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-white/10 overflow-x-auto max-w-full">
          <button
            onClick={() => setSelectedDay('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDay === 'all'
                ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Full Week View
          </button>
          {daysList.map(d => (
            <button
              key={d.day}
              onClick={() => setSelectedDay(d.day)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedDay.toLowerCase() === d.day.toLowerCase()
                  ? 'bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-extrabold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {d.day.slice(0, 3)}
              {d.isRestDay && <span className="ml-1 text-[9px] opacity-70">💤</span>}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-teal-400" />
          <span>Low-impact routines designed for joints & longevity</span>
        </div>
      </div>

      {/* Schedule Routine Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredDays.map((dayPlan: DayActivityRoutine) => (
          <div 
            key={dayPlan.day}
            className={`glass-card-dark rounded-3xl p-5 sm:p-6 border transition-all ${
              dayPlan.isRestDay 
                ? 'border-purple-500/20 bg-purple-950/10' 
                : 'border-white/10 hover:border-teal-500/30'
            }`}
          >
            {/* Day Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm ${
                  dayPlan.isRestDay 
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                    : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                }`}>
                  {dayPlan.day.slice(0, 3)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">{dayPlan.day}</h4>
                    {dayPlan.isRestDay ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Active Rest & Recovery
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                        Active Training
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 font-medium">{dayPlan.focusTitle}</p>
                </div>
              </div>

              {/* Day Quick Stats */}
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-white/5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <strong>{dayPlan.totalDurationMinutes} min</strong>
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-white/5 text-slate-300">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <strong>~{dayPlan.estimatedCalorieBurn} kcal</strong>
                </span>
              </div>
            </div>

            {/* Exercise List for the Day */}
            <div className="mt-4 space-y-3">
              {dayPlan.routine.map((ex: ExerciseItem, idx: number) => {
                const isExpanded = expandedExerciseId === ex.id;

                return (
                  <div 
                    key={ex.id || idx}
                    className="rounded-2xl bg-slate-950/60 border border-white/5 p-4 hover:border-white/15 transition-all"
                  >
                    <div 
                      onClick={() => toggleExerciseExpand(ex.id)}
                      className="flex items-start sm:items-center justify-between gap-3 cursor-pointer select-none"
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-900 border border-white/10 flex-shrink-0 mt-0.5 sm:mt-0">
                          {getCategoryIcon(ex.category)}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-white">{ex.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getIntensityBadge(ex.intensity)}`}>
                              {ex.intensity} Intensity
                            </span>
                            <span className="text-[10px] uppercase font-semibold text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-white/5">
                              {ex.category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                            {ex.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs font-bold text-teal-300 whitespace-nowrap">
                          {ex.durationMinutes} min
                        </span>
                        <div className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Collapsible Details: Warmup, Cooldown, Heart Rate, Equipment & Safety */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-fade-in">
                        
                        <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-white/5">
                          <strong className="text-teal-300 font-bold block flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Warm-Up Protocol
                          </strong>
                          <p className="text-slate-300 text-[11px] leading-relaxed">{ex.warmup}</p>
                        </div>

                        <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-white/5">
                          <strong className="text-purple-300 font-bold block flex items-center gap-1.5">
                            <HeartPulse className="w-3.5 h-3.5" /> Cool-Down & Stretch
                          </strong>
                          <p className="text-slate-300 text-[11px] leading-relaxed">{ex.cooldown}</p>
                        </div>

                        <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-white/5">
                          <strong className="text-amber-300 font-bold block flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5" /> Form & Safety Tip
                          </strong>
                          <p className="text-slate-300 text-[11px] leading-relaxed">{ex.safetyTip}</p>
                        </div>

                        <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/60 border border-white/5">
                          <strong className="text-cyan-300 font-bold block flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5" /> Target Zone & Gear
                          </strong>
                          <p className="text-slate-300 text-[11px] leading-relaxed">
                            {ex.targetHeartRate ? `Heart Zone: ${ex.targetHeartRate} • ` : ''}
                            Gear: {ex.equipmentNeeded}
                          </p>
                        </div>

                      </div>
                    )}

                  </div>
                );
              })}
            </div>

            {/* Wellness Note footer */}
            {dayPlan.wellnessNote && (
              <div className="mt-3.5 flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900/40 px-3 py-2 rounded-xl border border-white/5">
                <Info className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                <span>💡 {dayPlan.wellnessNote}</span>
              </div>
            )}

          </div>
        ))}
      </div>

      {/* Weekly Milestones Card */}
      {activityPlan.weeklyMilestones && activityPlan.weeklyMilestones.length > 0 && (
        <div className="glass-card-dark rounded-3xl p-6 border border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h4 className="text-base font-bold text-white">Actionable Weekly Milestones</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activityPlan.weeklyMilestones.map((milestone, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{milestone}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prominent Required Medical Disclaimer */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block font-bold text-amber-100 text-xs uppercase tracking-wider">
            Important Fitness & Health Disclaimer
          </strong>
          <p className="leading-relaxed text-amber-200/90 text-[11px]">
            {activityPlan.disclaimer || 'This is an AI-generated suggestion, not medical advice. Consult a professional before starting any new fitness routine, especially if you have existing health conditions.'}
          </p>
        </div>
      </div>

    </div>
  );
};
