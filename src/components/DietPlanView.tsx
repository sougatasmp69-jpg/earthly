import React, { useState } from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  ArrowLeft, 
  Droplet, 
  ShieldAlert, 
  Flame, 
  Leaf, 
  Utensils, 
  Apple, 
  Sun, 
  Moon, 
  Coffee, 
  CheckCircle2, 
  Printer,
  Scale,
  TrendingDown,
  Activity,
  Columns,
  Bell
} from 'lucide-react';
import { DietPlan, ActivityPlan, User } from '../types';
import { ActivityPlanCard } from './ActivityPlanCard';

interface DietPlanViewProps {
  dietPlan: DietPlan;
  activityPlan?: ActivityPlan | null;
  currentUser: User;
  onRegenerate: () => Promise<void>;
  onRegenerateActivityPlan?: () => Promise<void>;
  onBackToDashboard: () => void;
  onEditMetrics?: () => void;
  onOpenReminders?: () => void;
  initialTab?: 'diet' | 'activity' | 'split';
}

export const DietPlanView: React.FC<DietPlanViewProps> = ({
  dietPlan,
  activityPlan,
  currentUser,
  onRegenerate,
  onRegenerateActivityPlan,
  onBackToDashboard,
  onEditMetrics,
  onOpenReminders,
  initialTab = 'diet'
}) => {
  const [mainViewTab, setMainViewTab] = useState<'diet' | 'activity' | 'split'>(initialTab);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');

  const handleRegenerateClick = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setIsRegenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getEcoScoreBadge = (score: string) => {
    switch (score) {
      case 'A+':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'A':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      case 'B':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600';
    }
  };

  const getBmiBadge = (cat: string) => {
    if (cat === 'Normal weight' || cat === 'Normal') {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
    if (cat === 'Underweight' || cat === 'Overweight') {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  };

  const mealIcons: Record<string, React.ReactNode> = {
    breakfast: <Sun className="w-4 h-4 text-amber-400" />,
    morning_snack: <Apple className="w-4 h-4 text-rose-400" />,
    lunch: <Utensils className="w-4 h-4 text-teal-400" />,
    afternoon_snack: <Coffee className="w-4 h-4 text-emerald-400" />,
    dinner: <Moon className="w-4 h-4 text-purple-400" />
  };

  const mealCategoryLabels: Record<string, string> = {
    breakfast: 'Breakfast • Morning Sustenance',
    morning_snack: 'Mid-Morning Snack • Focus Boost',
    lunch: 'Lunch • Core Metabolic Fuel',
    afternoon_snack: 'Afternoon Snack • Clean Energy',
    dinner: 'Dinner • Restorative Evening Feast'
  };

  const mealsList = [
    dietPlan.meals.breakfast,
    dietPlan.meals.morningSnack,
    dietPlan.meals.lunch,
    dietPlan.meals.afternoonSnack,
    dietPlan.meals.dinner
  ].filter(Boolean);

  const totalMealCalories = mealsList.reduce((acc, m) => acc + (m?.calories || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Top Banner: Navigation, Plan Tabs & Global Actions */}
      <div className="glass-card-dark rounded-3xl p-5 sm:p-6 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Left: Back button & Title */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={onBackToDashboard}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Carbon Dashboard</span>
              </button>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-spin-slow" /> AI Wellness Engine
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>Personalized Diet & Fitness Hub</span>
            </h2>

            {/* User Profile Pill Tags */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span className="font-bold text-slate-200">{currentUser.name}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-mono">{currentUser.heightCm || 175} cm</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-300 font-mono">{currentUser.weightKg || 68} kg</span>
              <span className="text-slate-500">•</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBmiBadge(dietPlan.bmiCategory)}`}>
                BMI {dietPlan.bmi} • {dietPlan.bmiCategory}
              </span>
              <span className="text-slate-500">•</span>
              <span className="capitalize text-teal-300 font-medium px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20">
                {currentUser.dietPreference || 'Vegetarian'}
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            {onOpenReminders && (
              <button
                id="btn-diet-view-reminders"
                onClick={onOpenReminders}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-400/60 text-xs font-semibold text-emerald-300 hover:text-emerald-200 transition-all cursor-pointer shadow-sm"
                title="Configure Meal & Activity Reminders"
              >
                <Bell className="w-3.5 h-3.5 text-emerald-400" />
                <span>Alarms</span>
              </button>
            )}

            {onEditMetrics && (
              <button
                onClick={onEditMetrics}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-300 hover:text-teal-300 transition-all cursor-pointer"
                title="Edit Height/Weight & Preferences"
              >
                <span>✏️ Edit Metrics</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Print Plan"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={handleRegenerateClick}
              disabled={isRegenerating}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-teal-500 to-emerald-500 hover:from-purple-500 hover:via-teal-400 hover:to-emerald-400 text-white font-extrabold text-xs tracking-wide shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{isRegenerating ? 'Regenerating Both...' : 'Regenerate Plans'}</span>
            </button>
          </div>

        </div>

        {/* Major Section Switcher Tabs: "Your Diet Plan" | "Your Activity Plan" | "Side-by-Side" */}
        <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-950/80 border border-white/10">
            <button
              onClick={() => setMainViewTab('diet')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                mainViewTab === 'diet'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🥗 Your Diet Plan</span>
            </button>

            <button
              onClick={() => setMainViewTab('activity')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                mainViewTab === 'activity'
                  ? 'bg-gradient-to-r from-teal-600 to-purple-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>🏃 Your Activity Plan</span>
              {activityPlan && (
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setMainViewTab('split')}
              className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mainViewTab === 'split'
                  ? 'bg-slate-800 text-teal-300 border border-teal-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Two-Column View</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Synchronized with user weight:</span>
            <strong className="text-white font-mono px-2 py-0.5 rounded bg-slate-900 border border-white/5">
              {currentUser.weightKg || dietPlan.bmi} kg
            </strong>
          </div>
        </div>

      </div>

      {/* VIEW 1: DIET PLAN ONLY */}
      {mainViewTab === 'diet' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Prominent Medical Disclaimer Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3 backdrop-blur-md">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold text-amber-300 block mb-0.5">Important Health & Nutrition Notice</strong>
              <span>
                {dietPlan.disclaimer || 'This is an AI-generated suggestion, not medical advice. Consult a professional for personalized dietary guidance.'}
              </span>
            </div>
          </div>

          {/* Core Nutritional Metric Cards Grid (4 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Daily Calorie Target */}
            <div className="glass-card-dark rounded-2xl p-4 border border-white/10 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Daily Target</span>
                <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white font-mono tracking-tight">{dietPlan.targetCalories}</span>
                <span className="text-xs text-slate-400 font-semibold">kcal / day</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                BMR: {dietPlan.bmrCalories} kcal • TDEE: {dietPlan.tdeeCalories} kcal
              </p>
            </div>

            {/* 2. Hydration Target */}
            <div className="glass-card-dark rounded-2xl p-4 border border-white/10 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Daily Hydration</span>
                <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Droplet className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white font-mono tracking-tight">{dietPlan.hydrationTargetLiters}</span>
                <span className="text-xs text-slate-400 font-semibold">Liters / day</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                ~{Math.round(dietPlan.hydrationTargetLiters * 4.2)} standard 250ml glasses
              </p>
            </div>

            {/* 3. Daily Food Carbon Footprint */}
            <div className="glass-card-dark rounded-2xl p-4 border border-white/10 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Food Carbon</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Leaf className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-emerald-300 font-mono tracking-tight">{dietPlan.ecoFootprintDailyKg}</span>
                <span className="text-xs text-slate-400 font-semibold">kg CO₂ / day</span>
              </div>
              <div className="flex items-center gap-1 mt-2 text-[11px] text-emerald-400 font-bold">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>-{dietPlan.ecoSavingsPct}% vs Standard Diet</span>
              </div>
            </div>

            {/* 4. Target Macronutrient Split */}
            <div className="glass-card-dark rounded-2xl p-4 border border-white/10 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Macros</span>
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Scale className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs font-mono pt-1">
                <div className="text-center">
                  <span className="block font-bold text-purple-300">{dietPlan.macroSplit.proteinG}g</span>
                  <span className="text-[10px] text-slate-400">Protein ({dietPlan.macroSplit.proteinPct}%)</span>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-teal-300">{dietPlan.macroSplit.carbsG}g</span>
                  <span className="text-[10px] text-slate-400">Carbs ({dietPlan.macroSplit.carbsPct}%)</span>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-amber-300">{dietPlan.macroSplit.fatsG}g</span>
                  <span className="text-[10px] text-slate-400">Fats ({dietPlan.macroSplit.fatsPct}%)</span>
                </div>
              </div>
              {/* Macro Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-800 flex overflow-hidden mt-2.5">
                <div style={{ width: `${dietPlan.macroSplit.proteinPct}%` }} className="bg-purple-400" />
                <div style={{ width: `${dietPlan.macroSplit.carbsPct}%` }} className="bg-teal-400" />
                <div style={{ width: `${dietPlan.macroSplit.fatsPct}%` }} className="bg-amber-400" />
              </div>
            </div>

          </div>

          {/* Sub-Tab Switcher: Daily Meal Schedule vs 7-Day Weekly Overview */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('daily')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'daily'
                    ? 'bg-teal-500 text-slate-950 font-extrabold shadow-md shadow-teal-500/20'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                🍽️ Today's 5-Meal Schedule
              </button>
              <button
                onClick={() => setActiveTab('weekly')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'weekly'
                    ? 'bg-teal-500 text-slate-950 font-extrabold shadow-md shadow-teal-500/20'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                📅 7-Day Nutritional Overview
              </button>
            </div>

            <span className="text-xs text-slate-400 hidden sm:inline">
              Total Meals: <strong className="text-white">{totalMealCalories} kcal</strong>
            </span>
          </div>

          {/* SUB-TAB 1: 5-Meal Detailed Daily Schedule */}
          {activeTab === 'daily' && (
            <div className="space-y-4">
              {mealsList.map((meal, index) => {
                if (!meal) return null;
                const icon = mealIcons[meal.category] || <Utensils className="w-4 h-4 text-teal-400" />;
                const label = mealCategoryLabels[meal.category] || meal.name;

                return (
                  <div 
                    key={meal.id || index}
                    className="glass-card-dark rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl hover:border-white/20 transition-all relative overflow-hidden"
                  >
                    
                    {/* Header Row */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/5">
                      
                      {/* Left: Meal Category & Name */}
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-2xl bg-slate-900/90 border border-white/10 shadow-inner flex-shrink-0 mt-0.5">
                          {icon}
                        </div>
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            {label}
                          </span>
                          <h4 className="text-base sm:text-lg font-bold text-white leading-tight">
                            {meal.name}
                          </h4>
                          <p className="text-xs text-teal-300 font-medium mt-0.5">
                            {meal.title}
                          </p>
                        </div>
                      </div>

                      {/* Right: Nutrition Badges */}
                      <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-white/10 text-white font-mono text-xs font-bold shadow-sm">
                          🔥 {meal.calories} kcal
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-purple-950/40 text-purple-300 border border-purple-500/30 text-[11px] font-mono">
                          P: {meal.proteinG}g
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-teal-950/40 text-teal-300 border border-teal-500/30 text-[11px] font-mono">
                          C: {meal.carbsG}g
                        </span>
                        <span className="px-2 py-1 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-500/30 text-[11px] font-mono">
                          F: {meal.fatsG}g
                        </span>
                        <span className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1 ${getEcoScoreBadge(meal.ecoScore)}`}>
                          <Leaf className="w-3 h-3" /> Eco {meal.ecoScore} ({meal.carbonKg} kg CO₂)
                        </span>
                      </div>

                    </div>

                    {/* Description & Ingredients */}
                    <div className="mt-3.5 space-y-2.5 text-xs">
                      <p className="text-slate-300 leading-relaxed">
                        {meal.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-slate-500 font-semibold mr-1 text-[11px]">Portion:</span>
                        <span className="text-slate-300 font-mono bg-slate-900/80 px-2 py-0.5 rounded border border-white/5 text-[11px]">
                          {meal.portion}
                        </span>
                        
                        <span className="text-slate-500 font-semibold ml-2 mr-1 text-[11px]">Ingredients:</span>
                        {meal.ingredients.map((ing, idx) => (
                          <span key={idx} className="text-slate-300 bg-slate-900/60 px-2 py-0.5 rounded-md border border-white/5 text-[11px]">
                            {ing}
                          </span>
                        ))}
                      </div>

                      {meal.tips && (
                        <div className="mt-2 p-2.5 rounded-xl bg-teal-500/5 border border-teal-500/20 text-teal-300/90 text-[11px] flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                          <span>{meal.tips}</span>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* SUB-TAB 2: 7-Day Weekly Overview */}
          {activeTab === 'weekly' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dietPlan.weeklyOverview.map((day, idx) => (
                <div 
                  key={idx}
                  className="glass-card-dark rounded-2xl p-4 border border-white/10 shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-extrabold text-white">{day.day}</span>
                      <span className="text-xs font-mono font-bold text-teal-300 px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                        {day.calorieTarget} kcal
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-purple-300 mb-1">{day.focus}</h5>
                    <p className="text-xs text-slate-300 mb-2">
                      <strong className="text-slate-400">Featured:</strong> {day.highlight}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 text-[11px] text-emerald-300/90 flex items-start gap-1.5">
                    <Leaf className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{day.ecoTip}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* VIEW 2: ACTIVITY PLAN ONLY */}
      {mainViewTab === 'activity' && (
        <ActivityPlanCard 
          activityPlan={activityPlan || currentUser.activityPlan || null}
          currentUser={currentUser}
          onRegenerate={onRegenerateActivityPlan || onRegenerate}
          onEditMetrics={onEditMetrics}
        />
      )}

      {/* VIEW 3: TWO-COLUMN SIDE-BY-SIDE VIEW */}
      {mainViewTab === 'split' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          
          {/* Left Column: Diet Plan summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-lg">🥗</span>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Diet & Nutrition Overview</h4>
                  <p className="text-[11px] text-slate-400">{dietPlan.targetCalories} kcal • {dietPlan.ecoFootprintDailyKg} kg CO₂/day</p>
                </div>
              </div>
              <button
                onClick={() => setMainViewTab('diet')}
                className="text-xs font-bold text-teal-300 hover:underline"
              >
                Expand Diet →
              </button>
            </div>

            <div className="space-y-3">
              {mealsList.slice(0, 3).map((meal, index) => {
                if (!meal) return null;
                return (
                  <div key={meal.id || index} className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{meal.name}</span>
                      <span className="text-xs font-mono text-teal-300">{meal.calories} kcal</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{meal.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Fitness Activity Plan */}
          <div>
            <ActivityPlanCard 
              activityPlan={activityPlan || currentUser.activityPlan || null}
              currentUser={currentUser}
              onRegenerate={onRegenerateActivityPlan || onRegenerate}
              onEditMetrics={onEditMetrics}
            />
          </div>

        </div>
      )}

    </div>
  );
};
