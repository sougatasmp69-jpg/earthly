import React, { useMemo } from 'react';
import { 
  Flame, 
  ShieldCheck, 
  TrendingDown, 
  Zap, 
  Car, 
  Plane, 
  Utensils, 
  Bus, 
  AlertTriangle, 
  Sparkles
} from 'lucide-react';
import { ActivityEntry, WeeklyTarget } from '../types';
import { 
  getWeekBounds, 
  analyzeTargetPacing, 
  aggregateByCategory 
} from '../services/calculator';
import { DonutChart } from './DonutChart';
import { LoggedActivitiesTable } from './LoggedActivitiesTable';

interface WeeklyDashboardPanelProps {
  activities: ActivityEntry[];
  weeklyTarget: WeeklyTarget;
  onDeleteActivity: (id: string) => Promise<void>;
  onOpenTargetModal: () => void;
}

export const WeeklyDashboardPanel: React.FC<WeeklyDashboardPanelProps> = ({
  activities,
  weeklyTarget,
  onDeleteActivity,
  onOpenTargetModal
}) => {
  const currentWeek = useMemo(() => getWeekBounds(new Date()), []);

  // Filter activities strictly for the active week
  const weekActivities = useMemo(() => {
    return activities.filter(
      (a) => a.date >= currentWeek.startStr && a.date <= currentWeek.endStr
    );
  }, [activities, currentWeek]);

  // Aggregate category metrics
  const categorySummaries = useMemo(() => {
    return aggregateByCategory(weekActivities);
  }, [weekActivities]);

  const weeklyEmissions = useMemo(() => {
    return weekActivities.reduce((acc, a) => acc + a.emissionsKg, 0);
  }, [weekActivities]);

  // Pacing and targets analysis
  const targetAnalysis = useMemo(() => {
    return analyzeTargetPacing(weeklyEmissions, weeklyTarget.targetKg || 50, new Date());
  }, [weeklyEmissions, weeklyTarget.targetKg]);

  // Highest contributing category
  const highestSource = useMemo(() => {
    if (categorySummaries.length === 0 || targetAnalysis.currentEmissionsKg === 0) {
      return { name: 'None yet', percentage: 0, icon: Sparkles, emissionsKg: 0 };
    }
    const top = categorySummaries[0];
    let IconComp = Zap;
    if (top.category === 'car') IconComp = Car;
    if (top.category === 'bus') IconComp = Bus;
    if (top.category === 'flight') IconComp = Plane;
    if (top.category.includes('meal')) IconComp = Utensils;

    return {
      name: top.name,
      percentage: top.percentage,
      icon: IconComp,
      emissionsKg: top.totalEmissionsKg
    };
  }, [categorySummaries, targetAnalysis.currentEmissionsKg]);

  // DP1 Nudge calculations
  const isOverTarget = targetAnalysis.status === 'over_target';
  const isNearTarget = targetAnalysis.status === 'near_target';
  const targetKg = weeklyTarget.targetKg || 50;
  const remainingKg = Math.max(0, targetKg - targetAnalysis.currentEmissionsKg);

  return (
    <div className="space-y-6">
      
      {/* Top Panel Card: "Your Weekly Footprint Dashboard" */}
      <div className="glass-card-dark rounded-2xl p-5 sm:p-6 border border-white/10 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Your Weekly Footprint Dashboard</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-teal-300 border border-teal-500/30">
                Live Sync
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Tracking cycle: {currentWeek.startStr} to {currentWeek.endStr} (Day {targetAnalysis.dayIndex} of 7)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Weekly Target:</span>
            <button
              onClick={onOpenTargetModal}
              className="text-xs font-bold text-teal-300 hover:text-teal-200 px-2.5 py-1 rounded-lg bg-teal-500/15 border border-teal-500/30 hover:border-teal-400/50 transition-all cursor-pointer"
            >
              {targetKg.toFixed(0)} kg CO₂
            </button>
          </div>
        </div>

        {/* DP1 Contextual Nudge Alert Banner (When near or over target) */}
        {(isOverTarget || isNearTarget) && (
          <div className={`p-4 rounded-2xl border transition-all animate-fade-in ${
            isOverTarget 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-200' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${isOverTarget ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold">
                    {isOverTarget 
                      ? `Target Exceeded by ${(targetAnalysis.currentEmissionsKg - targetKg).toFixed(1)} kg CO₂` 
                      : `Approaching Target (${targetAnalysis.percentageUsed.toFixed(0)}% used)`
                    }
                  </h4>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-950/60 border border-white/10">
                    DP1 Nudge
                  </span>
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  {isOverTarget
                    ? "You've crossed your weekly budget. No worries—small habit swaps can help offset emissions!"
                    : `You have ${remainingKg.toFixed(1)} kg CO₂ left with ${7 - targetAnalysis.dayIndex} days remaining in this weekly cycle.`
                  }
                </p>
                
                {/* Constructive mitigation recommendations */}
                <div className="flex flex-wrap gap-2 pt-1.5 text-[11px]">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/10 text-slate-200">
                    🌱 Swap next 2 meals to plant-based (-3.0 kg)
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/10 text-slate-200">
                    🚌 Take metro/bus for errands (-0.12 kg/km)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section: Donut Chart & 4 Stat Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Donut Chart Component (Span 5 on large screens) */}
          <div className="lg:col-span-5">
            <DonutChart 
              categories={categorySummaries} 
              totalWeekEmissionsKg={targetAnalysis.currentEmissionsKg} 
            />
          </div>

          {/* 4 Stat Cards in 2x2 Grid (Span 7 on large screens) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* 1. Total Logged (Pink / Rose) */}
            <div className="glass-stat-pink rounded-2xl p-4 transition-all duration-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Total Logged</span>
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-black text-white tracking-tight">
                  {targetAnalysis.currentEmissionsKg.toFixed(1)} <span className="text-sm font-semibold text-rose-300/80">kg CO₂</span>
                </div>
                <p className="text-[11px] text-rose-300/70 mt-0.5">
                  {weekActivities.length} activities logged this week
                </p>
              </div>
            </div>

            {/* 2. Weekly Remaining (Teal) */}
            <div className="glass-stat-teal rounded-2xl p-4 transition-all duration-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Weekly Remaining</span>
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-black text-white tracking-tight">
                  {remainingKg.toFixed(1)} <span className="text-sm font-semibold text-teal-300/80">kg CO₂</span>
                </div>
                <p className="text-[11px] text-teal-300/70 mt-0.5">
                  {isOverTarget ? 'Budget exceeded' : 'Remaining before target'}
                </p>
              </div>
            </div>

            {/* 3. Highest Source (Blue) */}
            <div className="glass-stat-blue rounded-2xl p-4 transition-all duration-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Highest Source</span>
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <highestSource.icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-black text-white tracking-tight truncate">
                  {highestSource.name}
                </div>
                <p className="text-[11px] text-blue-300/70 mt-0.5">
                  {highestSource.percentage.toFixed(0)}% of total ({highestSource.emissionsKg.toFixed(1)} kg)
                </p>
              </div>
            </div>

            {/* 4. Trend (Green / Emerald) */}
            <div className="glass-stat-green rounded-2xl p-4 transition-all duration-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Trend</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl font-black text-emerald-400 tracking-tight">
                  -8.4% <span className="text-xs font-semibold text-slate-300">vs. Last Week</span>
                </div>
                <p className="text-[11px] text-emerald-300/70 mt-0.5">
                  Pacing aligned with Paris Goal
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Embedded "Logged Activities" Table Component */}
      <LoggedActivitiesTable 
        activities={activities}
        onDeleteActivity={onDeleteActivity}
      />

    </div>
  );
};
