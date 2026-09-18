import React, { useState, useMemo } from 'react';
import { 
  Car, 
  Bus, 
  Plane, 
  Zap, 
  Utensils, 
  Salad, 
  Calendar, 
  FileText, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';
import { ActivityCategory, CATEGORY_CONFIGS, EMISSION_FACTORS } from '../types';
import { calculateEmissions, validateQuantity, formatDateString } from '../services/calculator';

interface LogActivityCardProps {
  onLogActivity: (payload: {
    category: ActivityCategory;
    quantity: number;
    date: string;
    notes?: string;
    warningFlag?: string;
  }) => Promise<void>;
}

export const LogActivityCard: React.FC<LogActivityCardProps> = ({ onLogActivity }) => {
  // Main selected tab among 5 items: 'car', 'bus', 'flight', 'electricity', 'meals'
  const [selectedMainTab, setSelectedMainTab] = useState<'car' | 'bus' | 'flight' | 'electricity' | 'meals'>('car');
  const [mealType, setMealType] = useState<'veg_meal' | 'non_veg_meal'>('veg_meal');
  
  const [quantityInput, setQuantityInput] = useState<string>('2');
  const [dateInput, setDateInput] = useState<string>(formatDateString(new Date()));
  const [notesInput, setNotesInput] = useState<string>('');
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [justLogged, setJustLogged] = useState<boolean>(false);

  // Resolved actual ActivityCategory
  const activeCategory: ActivityCategory = selectedMainTab === 'meals' ? mealType : selectedMainTab;
  const config = CATEGORY_CONFIGS[activeCategory];
  const factor = EMISSION_FACTORS[activeCategory];

  // Dynamic placeholders
  const placeholderMap = {
    car: 'Enter distance in km (e.g. 24)',
    bus: 'Enter distance in km (e.g. 15)',
    flight: 'Enter flight distance in km (e.g. 450)',
    electricity: 'Enter electricity usage in kWh (e.g. 12.5)',
    veg_meal: 'Enter number of plant-based meals (e.g. 2)',
    non_veg_meal: 'Enter number of meat/dairy meals (e.g. 1)'
  };

  // Quick preset values
  const presetsMap: Record<ActivityCategory, { label: string; val: number }[]> = {
    car: [
      { label: '5 km', val: 5 },
      { label: '15 km', val: 15 },
      { label: '30 km', val: 30 },
      { label: '60 km', val: 60 }
    ],
    bus: [
      { label: '5 km', val: 5 },
      { label: '12 km', val: 12 },
      { label: '25 km', val: 25 }
    ],
    flight: [
      { label: '250 km', val: 250 },
      { label: '800 km', val: 800 },
      { label: '2,500 km', val: 2500 }
    ],
    electricity: [
      { label: '5 kWh', val: 5 },
      { label: '12 kWh', val: 12 },
      { label: '25 kWh', val: 25 }
    ],
    veg_meal: [
      { label: '1 meal', val: 1 },
      { label: '2 meals', val: 2 },
      { label: '3 meals', val: 3 }
    ],
    non_veg_meal: [
      { label: '1 meal', val: 1 },
      { label: '2 meals', val: 2 },
      { label: '3 meals', val: 3 }
    ]
  };

  const parsedQty = parseFloat(quantityInput);
  const isValidNumber = !isNaN(parsedQty) && parsedQty > 0;

  // Real-time DP2 validation
  const validation = useMemo(() => {
    if (!quantityInput || isNaN(parsedQty)) {
      return { isValid: false, isSoftWarning: false };
    }
    return validateQuantity(activeCategory, parsedQty);
  }, [activeCategory, parsedQty, quantityInput]);

  // Live calculated emissions
  const calculatedEmissions = useMemo(() => {
    if (!isValidNumber) return 0;
    return calculateEmissions(activeCategory, parsedQty);
  }, [activeCategory, parsedQty, isValidNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidNumber || !validation.isValid) return;

    setIsSubmitting(true);
    try {
      await onLogActivity({
        category: activeCategory,
        quantity: parsedQty,
        date: dateInput,
        notes: notesInput.trim() ? notesInput.trim() : undefined,
        warningFlag: validation.isSoftWarning ? validation.warningMessage : undefined
      });

      // Clear/reset state with brief success pulse
      setNotesInput('');
      setJustLogged(true);
      setTimeout(() => setJustLogged(false), 2200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card-dark rounded-2xl p-5 border border-white/10 relative overflow-hidden shadow-2xl">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Log an Activity</span>
            {justLogged && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-fade-in flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Logged!
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400">Click on category.</p>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-400">
          Fixed Factors
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Row of 5 Selectable Category Icon Buttons */}
        <div className="grid grid-cols-5 gap-2">
          
          {/* 1. Car */}
          <button
            type="button"
            onClick={() => setSelectedMainTab('car')}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
              selectedMainTab === 'car'
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/50'
                : 'border-white/10 bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:border-white/20 hover:bg-slate-900'
            }`}
          >
            <Car className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-semibold">Car</span>
          </button>

          {/* 2. Bus */}
          <button
            type="button"
            onClick={() => setSelectedMainTab('bus')}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
              selectedMainTab === 'bus'
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/50'
                : 'border-white/10 bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:border-white/20 hover:bg-slate-900'
            }`}
          >
            <Bus className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-semibold">Bus</span>
          </button>

          {/* 3. Flight */}
          <button
            type="button"
            onClick={() => setSelectedMainTab('flight')}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
              selectedMainTab === 'flight'
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/50'
                : 'border-white/10 bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:border-white/20 hover:bg-slate-900'
            }`}
          >
            <Plane className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-semibold">Flight</span>
          </button>

          {/* 4. Electricity */}
          <button
            type="button"
            onClick={() => setSelectedMainTab('electricity')}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
              selectedMainTab === 'electricity'
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/50'
                : 'border-white/10 bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:border-white/20 hover:bg-slate-900'
            }`}
          >
            <Zap className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-semibold">Electricity</span>
          </button>

          {/* 5. Meals */}
          <button
            type="button"
            onClick={() => setSelectedMainTab('meals')}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-200 cursor-pointer ${
              selectedMainTab === 'meals'
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.3)] ring-1 ring-emerald-400/50'
                : 'border-white/10 bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:border-white/20 hover:bg-slate-900'
            }`}
          >
            <Utensils className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-semibold">Meals</span>
          </button>
        </div>

        {/* Meal Type Sub-Selector (when Meals tab is chosen) */}
        {selectedMainTab === 'meals' && (
          <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between gap-2 animate-fade-in">
            <span className="text-xs text-slate-400 font-medium pl-1">Dietary Type:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMealType('veg_meal')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mealType === 'veg_meal'
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border border-transparent hover:text-slate-200'
                }`}
              >
                <Salad className="w-3.5 h-3.5" /> Veg (0.5 kg)
              </button>
              <button
                type="button"
                onClick={() => setMealType('non_veg_meal')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  mealType === 'non_veg_meal'
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50 shadow-sm'
                    : 'bg-slate-900 text-slate-400 border border-transparent hover:text-slate-200'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" /> Non-veg (2.0 kg)
              </button>
            </div>
          </div>
        )}

        {/* Activity Quantity Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="activity-quantity" className="text-xs font-medium text-slate-300">
              Activity Quantity ({config.unit})
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              Factor: {factor.toFixed(2)} kg CO₂/{config.unit}
            </span>
          </div>

          <div className="relative">
            <input
              id="activity-quantity"
              type="number"
              step="any"
              min="0"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
              placeholder={placeholderMap[activeCategory]}
              className="w-full glass-input-dark rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-400/30 placeholder-slate-500 pr-16"
              required
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-900/80 px-2 py-0.5 rounded border border-white/10">
              {config.unit}
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {presetsMap[activeCategory]?.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setQuantityInput(p.val.toString())}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950/70 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* DP2 Validation Messages */}
          {quantityInput && !validation.isValid && validation.errorMessage && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-fade-in">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{validation.errorMessage}</span>
            </div>
          )}

          {quantityInput && validation.isValid && validation.isSoftWarning && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{validation.warningMessage}</span>
            </div>
          )}
        </div>

        {/* Live CO2 Calculation Preview Box */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-950/90 to-slate-900/90 border border-teal-500/30 relative overflow-hidden shadow-lg shadow-teal-500/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Live CO₂ Calculation Preview
            </span>
            <span className="text-[10px] text-teal-400/90 font-medium">Updates in real-time</span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <div className="text-xl font-extrabold text-white tracking-tight">
              {isValidNumber ? (
                <span className="gradient-text-brand">
                  Est. +{calculatedEmissions.toFixed(2)} <span className="text-sm font-normal text-slate-300">kg CO₂</span>
                </span>
              ) : (
                <span className="text-slate-500 text-sm font-normal">Enter valid quantity...</span>
              )}
            </div>
            {isValidNumber && (
              <span className="text-[11px] font-mono text-slate-400">
                {parsedQty} {config.unit} × {factor.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Optional Date & Notes toggles */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input 
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="bg-transparent text-slate-200 border-b border-white/20 pb-0.5 focus:outline-none focus:border-emerald-400 text-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showNotes ? 'Hide note' : '+ Add note'}</span>
            </button>
          </div>

          {showNotes && (
            <input
              type="text"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="e.g. Highway commute or lunch with friends"
              className="w-full glass-input-dark rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-emerald-400 animate-fade-in"
            />
          )}
        </div>

        {/* Full-width Gradient "Log Activity" Button */}
        <button
          type="submit"
          disabled={!isValidNumber || !validation.isValid || isSubmitting}
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            isValidNumber && validation.isValid && !isSubmitting
              ? 'gradient-btn-primary hover:opacity-95 transform active:scale-[0.99]'
              : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span>Logging Activity...</span>
          ) : (
            <>
              <span>Log Activity</span>
              {isValidNumber && <span className="opacity-80">(+{calculatedEmissions.toFixed(2)} kg)</span>}
            </>
          )}
        </button>

      </form>

      {/* Small Footer Text listing Fixed Emission Factors */}
      <div className="mt-4 pt-3 border-t border-white/10 text-[10px] text-slate-400 leading-relaxed text-center">
        Car: <strong className="text-slate-300">0.20 kg/km</strong> · Bus: <strong className="text-slate-300">0.08 kg/km</strong> · Flight: <strong className="text-slate-300">0.25 kg/km</strong> · Elec: <strong className="text-slate-300">0.80 kg/kWh</strong> · Veg: <strong className="text-slate-300">0.5 kg</strong> · Non-veg: <strong className="text-slate-300">2.0 kg</strong>
      </div>

    </div>
  );
};
