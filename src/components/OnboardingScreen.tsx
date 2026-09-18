import React, { useState, useMemo } from 'react';
import { 
  Leaf, 
  Sparkles, 
  Ruler, 
  Weight as WeightIcon, 
  User as UserIcon, 
  AlertCircle, 
  Check, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { User, DietPlan, ActivityPlan } from '../types';

interface OnboardingScreenProps {
  currentUser: User;
  onComplete: (updatedUser: User, dietPlan: DietPlan, activityPlan?: ActivityPlan | null) => void;
  onGenerateDietChart: (payload: {
    name: string;
    heightCm: number;
    weightKg: number;
    heightUnit: 'cm' | 'ft_in';
    weightUnit: 'kg' | 'lb';
    dietPreference: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'low_carb';
    fitnessGoal: 'maintain' | 'weight_loss' | 'muscle_gain' | 'eco_wellness';
  }) => Promise<{ success: boolean; dietPlan?: DietPlan; activityPlan?: ActivityPlan; user?: User; error?: string }>;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  currentUser,
  onComplete,
  onGenerateDietChart
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft_in'>('cm');
  const [heightCm, setHeightCm] = useState<string>('175');
  const [heightFt, setHeightFt] = useState<string>('5');
  const [heightIn, setHeightIn] = useState<string>('9');

  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [weightKg, setWeightKg] = useState<string>('68');
  const [weightLb, setWeightLb] = useState<string>('150');

  const [dietPreference, setDietPreference] = useState<'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'low_carb'>('vegetarian');
  const [fitnessGoal, setFitnessGoal] = useState<'maintain' | 'weight_loss' | 'muscle_gain' | 'eco_wellness'>('eco_wellness');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute effective Height in cm
  const computedHeightCm = useMemo(() => {
    if (heightUnit === 'cm') {
      const parsed = parseFloat(heightCm);
      return isNaN(parsed) ? 0 : parsed;
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inch = parseFloat(heightIn) || 0;
      const totalInches = ft * 12 + inch;
      return Math.round(totalInches * 2.54 * 10) / 10;
    }
  }, [heightUnit, heightCm, heightFt, heightIn]);

  // Compute effective Weight in kg
  const computedWeightKg = useMemo(() => {
    if (weightUnit === 'kg') {
      const parsed = parseFloat(weightKg);
      return isNaN(parsed) ? 0 : parsed;
    } else {
      const lb = parseFloat(weightLb) || 0;
      return Math.round((lb * 0.45359237) * 10) / 10;
    }
  }, [weightUnit, weightKg, weightLb]);

  // Height Unit Switcher
  const handleHeightUnitToggle = (newUnit: 'cm' | 'ft_in') => {
    if (newUnit === heightUnit) return;
    if (newUnit === 'ft_in') {
      const totalInches = computedHeightCm / 2.54;
      const ft = Math.floor(totalInches / 12);
      const inch = Math.round(totalInches % 12);
      setHeightFt(String(Math.max(2, Math.min(8, ft))));
      setHeightIn(String(Math.max(0, Math.min(11, inch))));
    } else {
      setHeightCm(String(Math.round(computedHeightCm)));
    }
    setHeightUnit(newUnit);
  };

  // Weight Unit Switcher
  const handleWeightUnitToggle = (newUnit: 'kg' | 'lb') => {
    if (newUnit === weightUnit) return;
    if (newUnit === 'lb') {
      setWeightLb(String(Math.round(computedWeightKg * 2.20462)));
    } else {
      setWeightKg(String(Math.round(computedWeightKg)));
    }
    setWeightUnit(newUnit);
  };

  // Validation
  const validationErrors = useMemo(() => {
    const errors: { name?: string; height?: string; weight?: string } = {};

    if (!name.trim()) {
      errors.name = 'Please enter your full name or nickname.';
    }

    if (computedHeightCm < 50 || computedHeightCm > 250) {
      errors.height = `Height must be between 50 cm and 250 cm (approx 1'8" to 8'2"). Current: ${computedHeightCm} cm.`;
    }

    if (computedWeightKg < 20 || computedWeightKg > 300) {
      errors.weight = `Weight must be between 20 kg and 300 kg (approx 44 lb to 660 lb). Current: ${computedWeightKg} kg.`;
    }

    return errors;
  }, [name, computedHeightCm, computedWeightKg]);

  const isValid = Object.keys(validationErrors).length === 0;

  // Live physiological preview
  const previewMetrics = useMemo(() => {
    if (computedHeightCm < 50 || computedWeightKg < 20) return null;
    const heightM = computedHeightCm / 100;
    const bmi = Math.round((computedWeightKg / (heightM * heightM)) * 10) / 10;
    let bmiCat = 'Normal';
    let catColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (bmi < 18.5) {
      bmiCat = 'Underweight';
      catColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    } else if (bmi >= 25 && bmi < 30) {
      bmiCat = 'Overweight';
      catColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    } else if (bmi >= 30) {
      bmiCat = 'Obese';
      catColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }

    const estimatedBmr = Math.round(10 * computedWeightKg + 6.25 * computedHeightCm - 5 * 28 + 5);
    const estimatedTdee = Math.round(estimatedBmr * 1.375);

    return { bmi, bmiCat, catColor, estimatedBmr, estimatedTdee };
  }, [computedHeightCm, computedWeightKg]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setErrorMessage(null);
    setIsSubmitting(true);
    setGenerationStep(1);

    // Visual step sequence for AI generation UX
    const timer1 = setTimeout(() => setGenerationStep(2), 600);
    const timer2 = setTimeout(() => setGenerationStep(3), 1200);
    const timer3 = setTimeout(() => setGenerationStep(4), 1800);

    try {
      const res = await onGenerateDietChart({
        name: name.trim(),
        heightCm: computedHeightCm,
        weightKg: computedWeightKg,
        heightUnit,
        weightUnit,
        dietPreference,
        fitnessGoal
      });

      if (res.success && res.dietPlan && res.user) {
        setTimeout(() => {
          onComplete(res.user!, res.dietPlan!, res.activityPlan || null);
        }, 2200);
      } else {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        setIsSubmitting(false);
        setErrorMessage(res.error || 'Failed to generate personalized plans. Please check your inputs and retry.');
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Server connection error. Please try again.');
    }
  };

  const dietOptions = [
    { id: 'vegetarian', label: 'Vegetarian', icon: '🥗', desc: 'Plant-based with dairy' },
    { id: 'omnivore', label: 'Balanced', icon: '🍲', desc: 'Lean meats & plants' },
    { id: 'vegan', label: '100% Vegan', icon: '🌱', desc: 'Pure plant power' },
    { id: 'pescatarian', label: 'Pescatarian', icon: '🐟', desc: 'Sustainable seafood' },
    { id: 'low_carb', label: 'Low Carb', icon: '🥑', desc: 'Healthy fats & protein' },
  ];

  const goalOptions = [
    { id: 'eco_wellness', label: 'Eco-Wellness', icon: '🌍', desc: 'Lowest carbon footprint' },
    { id: 'maintain', label: 'Maintain Weight', icon: '⚖️', desc: 'Balanced metabolic energy' },
    { id: 'weight_loss', label: 'Weight Loss', icon: '⚡', desc: 'Caloric deficit & lean fuel' },
    { id: 'muscle_gain', label: 'Muscle Gain', icon: '💪', desc: 'High protein synthesis' },
  ];

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-hidden font-sans selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Blurred Bokeh Orbs */}
      <div className="fixed -top-20 -left-20 w-96 h-96 bg-purple-600/25 rounded-full blur-[130px] pointer-events-none animate-float-slow" />
      <div className="fixed top-1/3 right-[-10%] w-[32rem] h-[32rem] bg-teal-500/20 rounded-full blur-[140px] pointer-events-none animate-float-reverse" />
      <div className="fixed -bottom-20 left-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-[130px] pointer-events-none animate-float-slow" />

      {/* Main Glassmorphic Onboarding Card */}
      <div className="w-full max-w-2xl z-10 animate-fade-in">
        
        {/* Top Header & Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-teal-500 to-emerald-400 p-[2px] shadow-xl shadow-teal-500/20 mb-3 animate-pulse-glow">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Leaf className="w-7 h-7 text-teal-400" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-400 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
              Step 2 of 2 • Welcome Onboarding
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Personalize Your Earthly Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1.5 leading-relaxed">
            Tell us your body metrics to automatically generate your personalized AI diet chart and weight-tailored fitness activity plan.
          </p>
        </div>

        {/* Form Container */}
        <div className="glass-card-dark rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative backdrop-blur-xl">
          
          {/* AI Generating Overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-3xl z-30 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full border-4 border-teal-500/20 border-t-teal-400 border-r-purple-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-teal-300 animate-pulse" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">
                Building Your Diet Chart & Activity Plan...
              </h3>

              <div className="space-y-2.5 max-w-xs text-left w-full mt-2">
                <div className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${generationStep >= 1 ? 'text-teal-300' : 'text-slate-500'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${generationStep >= 1 ? 'bg-teal-500/20 border border-teal-500 text-teal-300' : 'bg-slate-800 text-slate-500'}`}>
                    {generationStep > 1 ? <Check className="w-2.5 h-2.5" /> : '1'}
                  </div>
                  <span>Computing BMI & Metabolic Baseline...</span>
                </div>

                <div className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${generationStep >= 2 ? 'text-teal-300' : 'text-slate-500'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${generationStep >= 2 ? 'bg-teal-500/20 border border-teal-500 text-teal-300' : 'bg-slate-800 text-slate-500'}`}>
                    {generationStep > 2 ? <Check className="w-2.5 h-2.5" /> : '2'}
                  </div>
                  <span>Curating low-carbon nutrient-dense recipes...</span>
                </div>

                <div className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${generationStep >= 3 ? 'text-purple-300 font-semibold' : 'text-slate-500'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${generationStep >= 3 ? 'bg-purple-500/20 border border-purple-500 text-purple-300' : 'bg-slate-800 text-slate-500'}`}>
                    {generationStep > 3 ? <Check className="w-2.5 h-2.5" /> : '3'}
                  </div>
                  <span>Building weight-adaptive fitness activity plan...</span>
                </div>

                <div className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${generationStep >= 4 ? 'text-emerald-300 font-semibold' : 'text-slate-500'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${generationStep >= 4 ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                    4
                  </div>
                  <span>Finalizing daily routines & eco-milestones...</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-6 animate-pulse">
                🏃 Tailoring fitness routine & meals to {computedHeightCm} cm & {computedWeightKg} kg...
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Error Message with Try Again & Fallback */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-shake space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                  <div>
                    <strong className="block font-bold text-rose-200">AI Generation Notice</strong>
                    <span>{errorMessage}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 pl-6">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-white font-bold text-[11px] transition-all cursor-pointer"
                  >
                    🔄 Try Again
                  </button>
                </div>
              </div>
            )}

            {/* 1. Name Field */}
            <div>
              <label htmlFor="onboarding-name" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Your Full Name or Nickname <span className="text-teal-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  id="onboarding-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all"
                />
              </div>
              {validationErrors.name && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {validationErrors.name}
                </p>
              )}
            </div>

            {/* 2. Height & Weight Side by Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Height Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Ruler className="w-3.5 h-3.5 text-teal-400" /> Height <span className="text-teal-400">*</span>
                  </label>
                  
                  {/* Unit Toggle: cm vs ft/in */}
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-white/10 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleHeightUnitToggle('cm')}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                        heightUnit === 'cm'
                          ? 'bg-teal-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      onClick={() => handleHeightUnitToggle('ft_in')}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                        heightUnit === 'ft_in'
                          ? 'bg-teal-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ft / in
                    </button>
                  </div>
                </div>

                {heightUnit === 'cm' ? (
                  <div className="relative">
                    <input
                      id="onboarding-height-cm"
                      type="number"
                      min="50"
                      max="250"
                      step="0.5"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      placeholder="175"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all font-mono"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-mono">cm</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <input
                        id="onboarding-height-ft"
                        type="number"
                        min="2"
                        max="8"
                        value={heightFt}
                        onChange={(e) => setHeightFt(e.target.value)}
                        placeholder="5"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-400 font-mono"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">ft</span>
                    </div>
                    <div className="relative">
                      <input
                        id="onboarding-height-in"
                        type="number"
                        min="0"
                        max="11"
                        value={heightIn}
                        onChange={(e) => setHeightIn(e.target.value)}
                        placeholder="9"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-400 font-mono"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400">in</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>Range: 50–250 cm</span>
                  <span className="text-teal-300 font-mono">≈ {computedHeightCm} cm</span>
                </div>
                {validationErrors.height && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" /> {validationErrors.height}
                  </p>
                )}
              </div>

              {/* Weight Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <WeightIcon className="w-3.5 h-3.5 text-teal-400" /> Weight <span className="text-teal-400">*</span>
                  </label>
                  
                  {/* Unit Toggle: kg vs lb */}
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-white/10 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleWeightUnitToggle('kg')}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                        weightUnit === 'kg'
                          ? 'bg-teal-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWeightUnitToggle('lb')}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                        weightUnit === 'lb'
                          ? 'bg-teal-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      lb
                    </button>
                  </div>
                </div>

                {weightUnit === 'kg' ? (
                  <div className="relative">
                    <input
                      id="onboarding-weight-kg"
                      type="number"
                      min="20"
                      max="300"
                      step="0.5"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="68"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all font-mono"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-mono">kg</span>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      id="onboarding-weight-lb"
                      type="number"
                      min="44"
                      max="660"
                      step="1"
                      value={weightLb}
                      onChange={(e) => setWeightLb(e.target.value)}
                      placeholder="150"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all font-mono"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-mono">lb</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>Range: 20–300 kg</span>
                  <span className="text-teal-300 font-mono">≈ {computedWeightKg} kg ({Math.round(computedWeightKg * 2.20462)} lb)</span>
                </div>
                {validationErrors.weight && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" /> {validationErrors.weight}
                  </p>
                )}
              </div>

            </div>

            {/* Live Metrics Pill */}
            {previewMetrics && (
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Estimated BMI:</span>
                  <span className="font-extrabold text-white font-mono">{previewMetrics.bmi}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${previewMetrics.catColor}`}>
                    {previewMetrics.bmiCat}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                  <span>BMR: <strong className="text-slate-200">{previewMetrics.estimatedBmr} kcal</strong></span>
                  <span>Maintenance TDEE: <strong className="text-teal-300">{previewMetrics.estimatedTdee} kcal</strong></span>
                </div>
              </div>
            )}

            {/* 3. Dietary Preference Chips */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Dietary Preference
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {dietOptions.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setDietPreference(option.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      dietPreference === option.id
                        ? 'bg-gradient-to-br from-teal-900/40 to-slate-900 border-teal-400/80 shadow-md shadow-teal-500/10'
                        : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-base">{option.icon}</span>
                      {dietPreference === option.id && (
                        <span className="w-4 h-4 rounded-full bg-teal-400 text-slate-950 flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-white block">{option.label}</span>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{option.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Wellness Goal Chips */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Primary Goal
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {goalOptions.map(goal => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setFitnessGoal(goal.id as any)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      fitnessGoal === goal.id
                        ? 'bg-purple-950/40 border-purple-400/80 shadow-md shadow-purple-500/10'
                        : 'bg-slate-900/60 border-white/10 hover:border-white/20 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span>{goal.icon}</span>
                      <span className="text-xs font-bold text-white leading-tight">{goal.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">{goal.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Submit Button */}
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-teal-500 to-emerald-500 hover:from-purple-500 hover:via-teal-400 hover:to-emerald-400 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-teal-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-teal-500/40 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-200 animate-spin-slow" />
              <span>Generate My Diet Plan</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </form>

          {/* Health & Medical Disclaimer */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-start gap-2.5 text-slate-400 text-[11px] leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-amber-400/80 flex-shrink-0 mt-0.5" />
            <p>
              <strong className="text-slate-300 font-semibold">Important Disclaimer:</strong> This is an AI-generated suggestion, not medical advice. Consult a professional for personalized dietary guidance.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
