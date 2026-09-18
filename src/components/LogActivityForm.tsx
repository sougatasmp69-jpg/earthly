import React, { useState, useMemo } from 'react';
import { ActivityCategory, CATEGORY_CONFIGS, EMISSION_FACTORS } from '../types';
import { calculateEmissions, validateQuantity, formatDateString } from '../services/calculator';
import { 
  PlusCircle, 
  Car, 
  Bus, 
  Plane, 
  Zap, 
  Salad, 
  Utensils, 
  Calendar, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert
} from 'lucide-react';

interface LogActivityFormProps {
  onLogActivity: (payload: {
    category: ActivityCategory;
    quantity: number;
    date: string;
    notes?: string;
    warningFlag?: string;
  }) => Promise<void>;
  onCancel: () => void;
  onOpenDecisions: () => void;
}

const CATEGORY_KEYS: ActivityCategory[] = [
  'car',
  'bus',
  'flight',
  'electricity',
  'veg_meal',
  'non_veg_meal'
];

export const LogActivityForm: React.FC<LogActivityFormProps> = ({
  onLogActivity,
  onCancel,
  onOpenDecisions
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>('car');
  const [quantity, setQuantity] = useState<number | ''>(25);
  const [date, setDate] = useState<string>(formatDateString(new Date()));
  const [notes, setNotes] = useState<string>('');
  const [acknowledgedSoftWarning, setAcknowledgedSoftWarning] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currentConfig = CATEGORY_CONFIGS[selectedCategory];
  const factor = EMISSION_FACTORS[selectedCategory];

  // Real-time calculated emissions
  const calculatedEmissions = useMemo(() => {
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) return 0;
    return calculateEmissions(selectedCategory, Number(quantity));
  }, [selectedCategory, quantity]);

  // DP2 Real-time validation
  const validation = useMemo(() => {
    if (quantity === '') return { isValid: true, isSoftWarning: false };
    return validateQuantity(selectedCategory, Number(quantity));
  }, [selectedCategory, quantity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (quantity === '' || Number(quantity) <= 0) {
      setErrorMsg('Please enter a valid positive quantity greater than 0.');
      return;
    }

    const valResult = validateQuantity(selectedCategory, Number(quantity));
    if (!valResult.isValid) {
      setErrorMsg(valResult.errorMessage || 'Invalid quantity entered.');
      return;
    }

    if (valResult.isSoftWarning && !acknowledgedSoftWarning) {
      setErrorMsg('Please review and confirm the soft warning for this unusually large entry.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onLogActivity({
        category: selectedCategory,
        quantity: Number(quantity),
        date,
        notes: notes.trim() || undefined,
        warningFlag: valResult.isSoftWarning ? 'High single-day entry' : undefined
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save activity. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (cat: ActivityCategory) => {
    switch (cat) {
      case 'car': return <Car className="w-5 h-5" />;
      case 'bus': return <Bus className="w-5 h-5" />;
      case 'flight': return <Plane className="w-5 h-5" />;
      case 'electricity': return <Zap className="w-5 h-5" />;
      case 'veg_meal': return <Salad className="w-5 h-5" />;
      case 'non_veg_meal': return <Utensils className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-earthly-100 text-earthly-800 text-xs font-bold mb-2">
            <PlusCircle className="w-3.5 h-3.5 text-earthly-600" />
            <span>Feature 1 · Daily Carbon Entry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Log Daily Activity
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Choose a category and enter your usage. CO₂ is calculated automatically using fixed standards.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenDecisions}
          className="text-xs font-semibold text-earthly-700 hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>DP2 Input Guardrails Rationale →</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs font-bold text-red-700 flex items-center gap-2.5 animate-slide-up">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        
        {/* Step 1: Category Selector Cards */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            1. Select Activity Category <span className="text-red-500">*</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORY_KEYS.map((cat) => {
              const cfg = CATEGORY_CONFIGS[cat];
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setAcknowledgedSoftWarning(false);
                    setErrorMsg('');
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'border-earthly-600 bg-earthly-50/90 shadow-md ring-2 ring-earthly-200'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: cfg.bgColor, color: cfg.color }}
                    >
                      {getCategoryIcon(cat)}
                    </div>
                    <span className="text-[10px] font-black font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                      {cfg.factor} kg/{cfg.unit}
                    </span>
                  </div>

                  <div>
                    <span className={`text-xs font-bold block ${isSelected ? 'text-earthly-950 font-black' : 'text-slate-800'}`}>
                      {cfg.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {cfg.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Quantity Input & Real-Time Calculation Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          
          {/* Quantity Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Quantity in {currentConfig.unitLabel} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.01"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value === '' ? '' : Number(e.target.value));
                  setAcknowledgedSoftWarning(false);
                  setErrorMsg('');
                }}
                placeholder={`e.g. 25`}
                className={`w-full px-4 py-3 rounded-2xl bg-slate-50 border text-base font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 ${
                  !validation.isValid
                    ? 'border-red-400 focus:ring-red-400'
                    : validation.isSoftWarning
                    ? 'border-amber-400 focus:ring-amber-400'
                    : 'border-slate-200 focus:ring-earthly-500'
                }`}
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">
                {currentConfig.unit}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block">
              Daily plausible max limit: {currentConfig.maxPlausibleDaily.toLocaleString()} {currentConfig.unit}
            </span>
          </div>

          {/* Real-time Calculation Result Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-earthly-900 to-slate-900 text-white flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-earthly-200 font-medium">
              <span>Automatic CO₂ Calculation</span>
              <span className="font-mono text-[10px] bg-white/10 px-2 py-0.5 rounded-full">
                {quantity || 0} {currentConfig.unit} × {factor} kg
              </span>
            </div>

            <div className="my-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-emerald-300">
                  {calculatedEmissions.toFixed(2)}
                </span>
                <span className="text-sm font-bold text-white">kg CO₂</span>
              </div>
            </div>

            <span className="text-[10px] text-earthly-300">
              Factor: {factor} kg CO₂ per {currentConfig.unit} (Fixed constant)
            </span>
          </div>

        </div>

        {/* DP2 Soft Warning Callout (If unusually high) */}
        {validation.isSoftWarning && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2 animate-slide-up">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-extrabold block">DP2 Soft Warning Flag:</span>
                <p className="text-[11px] text-amber-900 mt-0.5">
                  {validation.warningMessage}
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 cursor-pointer font-bold text-amber-900">
              <input
                type="checkbox"
                checked={acknowledgedSoftWarning}
                onChange={(e) => setAcknowledgedSoftWarning(e.target.checked)}
                className="rounded text-earthly-600 focus:ring-earthly-500 cursor-pointer"
              />
              <span>I confirm this is an intentional single-day entry</span>
            </label>
          </div>
        )}

        {/* Step 3: Date & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-earthly-600" />
              Activity Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-earthly-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-earthly-600" />
              Optional Description / Context
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Commute to downtown office"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-earthly-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !validation.isValid || (validation.isSoftWarning && !acknowledgedSoftWarning)}
            className="px-6 py-2.5 text-xs font-black text-white bg-earthly-700 hover:bg-earthly-800 rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Saving Entry...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Save Activity Entry (+{calculatedEmissions.toFixed(2)} kg CO₂)</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
