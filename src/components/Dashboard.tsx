import React, { useMemo } from 'react';
import { ActivityEntry, WeeklyTarget, ActivityCategory, CATEGORY_CONFIGS } from '../types';
import { 
  getWeekBounds, 
  analyzeTargetPacing, 
  aggregateByCategory, 
  aggregateByDayOfWeek 
} from '../services/calculator';
import { 
  Target, 
  Flame, 
  Leaf, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Calendar, 
  PlusCircle, 
  Info,
  Car,
  Bus,
  Plane,
  Zap,
  Salad,
  Utensils,
  ShieldCheck
} from 'lucide-react';

interface DashboardProps {
  activities: ActivityEntry[];
  weeklyTarget: WeeklyTarget;
  onNavigateToLog: () => void;
  onOpenTargetModal: () => void;
  onOpenDecisions: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  activities,
  weeklyTarget,
  onNavigateToLog,
  onOpenTargetModal,
  onOpenDecisions
}) => {
  const weekBounds = useMemo(() => getWeekBounds(new Date()), []);

  // Filter activities for this current week (Mon-Sun)
  const currentWeekActivities = useMemo(() => {
    return activities.filter(a => a.date >= weekBounds.startStr && a.date <= weekBounds.endStr);
  }, [activities, weekBounds]);

  const totalWeeklyEmissionsKg = useMemo(() => {
    return Math.round(currentWeekActivities.reduce((acc, a) => acc + a.emissionsKg, 0) * 100) / 100;
  }, [currentWeekActivities]);

  const pacing = useMemo(() => {
    return analyzeTargetPacing(totalWeeklyEmissionsKg, weeklyTarget.targetKg, new Date());
  }, [totalWeeklyEmissionsKg, weeklyTarget.targetKg]);

  const categoryBreakdown = useMemo(() => {
    return aggregateByCategory(currentWeekActivities);
  }, [currentWeekActivities]);

  const dailyBreakdown = useMemo(() => {
    return aggregateByDayOfWeek(currentWeekActivities, weekBounds.monday);
  }, [currentWeekActivities, weekBounds.monday]);

  // Environmental impact equivalence
  const treesRequiredToOffset = Math.round((totalWeeklyEmissionsKg / 21) * 10) / 10; // ~21kg CO2/tree/year
  const highestCategory = categoryBreakdown.find(c => c.totalEmissionsKg > 0);

  const getCategoryIcon = (cat: ActivityCategory) => {
    switch (cat) {
      case 'car': return <Car className="w-4 h-4 text-orange-600" />;
      case 'bus': return <Bus className="w-4 h-4 text-sky-600" />;
      case 'flight': return <Plane className="w-4 h-4 text-purple-600" />;
      case 'electricity': return <Zap className="w-4 h-4 text-amber-600" />;
      case 'veg_meal': return <Salad className="w-4 h-4 text-emerald-600" />;
      case 'non_veg_meal': return <Utensils className="w-4 h-4 text-red-600" />;
      default: return <Leaf className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-earthly-100 text-earthly-800 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-earthly-600" />
            <span>Weekly Carbon Intelligence Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Emissions Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-earthly-600" />
            <span>
              Tracking Week: <strong>{weekBounds.startStr}</strong> to <strong>{weekBounds.endStr}</strong> (Monday – Sunday · Day {pacing.dayIndex} of 7)
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onNavigateToLog}
            className="px-5 py-2.5 text-xs font-black text-white bg-earthly-700 hover:bg-earthly-800 rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Activity</span>
          </button>
        </div>
      </div>

      {/* DP1 Over-Target Nudge Banner */}
      <div className={`p-5 rounded-3xl border transition-all shadow-sm ${
        pacing.nudgeLevel === 'red'
          ? 'bg-red-50/90 border-red-200 text-red-950'
          : pacing.nudgeLevel === 'amber'
          ? 'bg-amber-50/90 border-amber-200 text-amber-950'
          : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              {pacing.nudgeLevel === 'red' ? (
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              ) : pacing.nudgeLevel === 'amber' ? (
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              )}
              <h3 className="text-sm font-extrabold">
                {pacing.nudgeTitle}
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-white/80 border">
                DP1 Nudge
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-700">
              {pacing.nudgeMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenDecisions}
            className="text-[11px] font-bold text-earthly-800 hover:underline flex items-center gap-1 self-start md:self-auto flex-shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>DP1 Tone Rationale →</span>
          </button>
        </div>

        {/* Actionable Recommendations */}
        {pacing.actionableTips.length > 0 && (
          <div className="mt-3.5 pt-3 border-t border-slate-200/60 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-[11px] text-slate-800">💡 Actionable mitigation tips:</span>
            {pacing.actionableTips.map((tip, idx) => (
              <span 
                key={idx} 
                className="px-2.5 py-1 rounded-xl bg-white text-slate-700 font-medium text-[11px] border border-slate-200 shadow-2xs"
              >
                {tip}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Weekly Emissions */}
        <div className="glass-card p-6 rounded-3xl bg-white border border-slate-200/90 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Weekly CO₂
            </span>
            <div className="w-8 h-8 rounded-xl bg-earthly-100 text-earthly-800 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900">
                {totalWeeklyEmissionsKg.toFixed(1)}
              </span>
              <span className="text-sm font-bold text-slate-500">kg CO₂</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {currentWeekActivities.length} activities logged this week
            </span>
          </div>
        </div>

        {/* Card 2: Weekly Target & Progress */}
        <div 
          onClick={onOpenTargetModal}
          className="glass-card p-6 rounded-3xl bg-white border border-slate-200/90 flex flex-col justify-between cursor-pointer group hover:border-earthly-400 transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Weekly Target
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900">
                {weeklyTarget.targetKg} <span className="text-sm font-bold text-slate-500">kg</span>
              </span>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                pacing.status === 'over_target'
                  ? 'bg-red-100 text-red-800'
                  : pacing.status === 'near_target'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {pacing.percentageUsed}% used
              </span>
            </div>

            {/* Target Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  pacing.status === 'over_target'
                    ? 'bg-red-500'
                    : pacing.status === 'near_target'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, pacing.percentageUsed)}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1.5 block group-hover:text-earthly-700">
              Click to customize weekly budget →
            </span>
          </div>
        </div>

        {/* Card 3: DP3 Mid-Week Pacing Indicator */}
        <div className="glass-card p-6 rounded-3xl bg-white border border-slate-200/90 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              DP3 Pacing Benchmark
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              pacing.isAheadOfPacing ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {pacing.isAheadOfPacing ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900">
                {pacing.expectedPacingKg.toFixed(1)} <span className="text-xs font-bold text-slate-500">kg exp.</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              {pacing.pacingDeviationKg > 0 ? (
                <span className="text-amber-700 font-bold">
                  +{pacing.pacingDeviationKg.toFixed(1)} kg above expected day {pacing.dayIndex} rate
                </span>
              ) : (
                <span className="text-emerald-700 font-bold">
                  {Math.abs(pacing.pacingDeviationKg).toFixed(1)} kg under expected day {pacing.dayIndex} pacing
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Card 4: Highest Emission Driver */}
        <div className="glass-card p-6 rounded-3xl bg-white border border-slate-200/90 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Primary Driver
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-lg font-black text-slate-900 block truncate">
              {highestCategory ? highestCategory.name : 'No data yet'}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              {highestCategory ? `${highestCategory.totalEmissionsKg} kg CO₂ (${highestCategory.percentage}%)` : 'Log your first activity'}
            </p>
          </div>
        </div>

      </div>

      {/* DP3 Day-by-Day Tracking Chart */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-earthly-600" />
              <span>DP3 · Daily Emissions Distribution (Monday – Sunday)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualizes daily footprint progression throughout the 7-day habit cycle.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-earthly-700" />
            <span>Daily CO₂ (kg)</span>
          </div>
        </div>

        {/* Daily Bar Chart */}
        <div className="grid grid-cols-7 gap-2 pt-4 items-end min-h-[160px]">
          {dailyBreakdown.map((day) => {
            const maxVal = Math.max(10, ...dailyBreakdown.map(d => d.totalEmissionsKg));
            const barHeightPercent = maxVal > 0 ? (day.totalEmissionsKg / maxVal) * 100 : 0;

            return (
              <div key={day.date} className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-bold text-slate-700">
                  {day.totalEmissionsKg > 0 ? `${day.totalEmissionsKg}k` : '0'}
                </span>
                <div className="w-full bg-slate-100 rounded-2xl h-28 flex items-end p-1 relative overflow-hidden">
                  <div
                    className={`w-full rounded-xl transition-all duration-500 ${
                      day.isToday
                        ? 'bg-gradient-to-t from-earthly-800 to-emerald-500 ring-2 ring-emerald-300'
                        : day.totalEmissionsKg > 0
                        ? 'bg-earthly-600'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${Math.max(day.totalEmissionsKg > 0 ? 12 : 0, barHeightPercent)}%` }}
                  />
                </div>
                <div className="text-center">
                  <span className={`text-xs font-bold block ${day.isToday ? 'text-earthly-800 font-extrabold' : 'text-slate-600'}`}>
                    {day.dayName}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {day.date.slice(5)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature 2: Category Breakdown (Visual Bars + Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Category Visual Bars */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Leaf className="w-4 h-4 text-earthly-600" />
              <span>Category Breakdown & Fixed Factors</span>
            </h2>
            <span className="text-xs font-bold text-slate-400">
              {currentWeekActivities.length} logs
            </span>
          </div>

          <div className="space-y-4">
            {categoryBreakdown.map((cat) => {
              const config = CATEGORY_CONFIGS[cat.category];
              return (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                        {getCategoryIcon(cat.category)}
                      </div>
                      <span className="font-bold text-slate-800">{cat.name}</span>
                      <span className="text-[11px] text-slate-400">({config.description})</span>
                    </div>
                    <div className="flex items-center gap-3 font-bold">
                      <span className="text-slate-500">
                        {cat.totalQuantity} {cat.unit}
                      </span>
                      <span className="text-slate-900 text-sm font-black w-16 text-right">
                        {cat.totalEmissionsKg} kg
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>{cat.entryCount} entries logged</span>
                    <span>{cat.percentage}% of week total</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Fixed Emission Factors Reference & Eco Tips */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Fixed Emission Factors Table
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700">🚗 Car travel</span>
                <span className="font-mono font-bold text-slate-900">0.20 kg/km</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700">🚌 Bus travel</span>
                <span className="font-mono font-bold text-slate-900">0.08 kg/km</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700">✈️ Flight</span>
                <span className="font-mono font-bold text-slate-900">0.25 kg/km</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700">⚡ Electricity</span>
                <span className="font-mono font-bold text-slate-900">0.80 kg/kWh</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700">🥗 Veg meal</span>
                <span className="font-mono font-bold text-emerald-700">0.50 kg/meal</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-medium text-slate-700">🥩 Non-veg meal</span>
                <span className="font-mono font-bold text-red-700">2.00 kg/meal</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-earthly-50 border border-earthly-200/80 text-xs text-earthly-950 space-y-1">
            <span className="font-bold flex items-center gap-1">
              🌱 Natural Offset Equivalence:
            </span>
            <p className="text-[11px] text-earthly-900 leading-normal">
              Your weekly footprint of <strong>{totalWeeklyEmissionsKg} kg CO₂</strong> requires approximately <strong>{treesRequiredToOffset} mature trees</strong> working for a full year to naturally sequester.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
