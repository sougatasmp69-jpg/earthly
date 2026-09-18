import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Ruler, 
  Weight as WeightIcon, 
  User as UserIcon, 
  AlertCircle, 
  ShieldAlert,
  Save
} from 'lucide-react';
import { User, DietPlan, ActivityPlan } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSaveProfile: (payload: {
    name: string;
    heightCm: number;
    weightKg: number;
    heightUnit: 'cm' | 'ft_in';
    weightUnit: 'kg' | 'lb';
    dietPreference: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'low_carb';
    fitnessGoal: 'maintain' | 'weight_loss' | 'muscle_gain' | 'eco_wellness';
  }) => Promise<{ success: boolean; user?: User; dietPlan?: DietPlan; activityPlan?: ActivityPlan; error?: string }>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveProfile
}) => {
  const [name, setName] = useState(currentUser.name || '');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft_in'>(currentUser.heightUnit || 'cm');
  const [heightCm, setHeightCm] = useState<string>(String(currentUser.heightCm || 175));
  const [heightFt, setHeightFt] = useState<string>('5');
  const [heightIn, setHeightIn] = useState<string>('9');

  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>(currentUser.weightUnit || 'kg');
  const [weightKg, setWeightKg] = useState<string>(String(currentUser.weightKg || 68));
  const [weightLb, setWeightLb] = useState<string>(String(Math.round((currentUser.weightKg || 68) * 2.20462)));

  const [dietPreference, setDietPreference] = useState<'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'low_carb'>(
    currentUser.dietPreference || 'vegetarian'
  );
  const [fitnessGoal, setFitnessGoal] = useState<'maintain' | 'weight_loss' | 'muscle_gain' | 'eco_wellness'>(
    currentUser.fitnessGoal || 'eco_wellness'
  );

  const [isSaving, setIsSaving] = useState(false);
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

  // Height Unit Toggle
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

  // Weight Unit Toggle
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
      errors.height = `Height must be between 50 cm and 250 cm (5'0" – 8'2"). Current: ${computedHeightCm} cm.`;
    }

    if (computedWeightKg < 20 || computedWeightKg > 300) {
      errors.weight = `Weight must be between 20 kg and 300 kg (44 lb – 660 lb). Current: ${computedWeightKg} kg.`;
    }

    return errors;
  }, [name, computedHeightCm, computedWeightKg]);

  const isValid = Object.keys(validationErrors).length === 0;

  // Live BMI Preview
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
    return { bmi, bmiCat, catColor };
  }, [computedHeightCm, computedWeightKg]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSaving) return;

    setErrorMessage(null);
    setIsSaving(true);

    try {
      const res = await onSaveProfile({
        name: name.trim(),
        heightCm: computedHeightCm,
        weightKg: computedWeightKg,
        heightUnit,
        weightUnit,
        dietPreference,
        fitnessGoal
      });

      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Connection error.');
    } finally {
      setIsSaving(false);
    }
  };

  const dietOptions = [
    { id: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
    { id: 'omnivore', label: 'Balanced', icon: '🍲' },
    { id: 'vegan', label: '100% Vegan', icon: '🌱' },
    { id: 'pescatarian', label: 'Pescatarian', icon: '🐟' },
    { id: 'low_carb', label: 'Low Carb', icon: '🥑' },
  ];

  const goalOptions = [
    { id: 'eco_wellness', label: 'Eco-Wellness', icon: '🌍' },
    { id: 'maintain', label: 'Maintain', icon: '⚖️' },
    { id: 'weight_loss', label: 'Weight Loss', icon: '⚡' },
    { id: 'muscle_gain', label: 'Muscle Gain', icon: '💪' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="glass-card-dark rounded-3xl max-w-xl w-full p-6 sm:p-7 border border-white/10 shadow-2xl relative overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-tight">Edit Profile & Body Metrics</h3>
              <p className="text-xs text-slate-400">Updating weight or height will automatically recalculate your AI diet chart & fitness activity plan.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Name <span className="text-teal-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-400"
            />
            {validationErrors.name && (
              <p className="text-[11px] text-rose-400 mt-1">{validationErrors.name}</p>
            )}
          </div>

          {/* Height & Weight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Height */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Ruler className="w-3.5 h-3.5 text-teal-400" /> Height
                </label>
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-white/10 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleHeightUnitToggle('cm')}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      heightUnit === 'cm' ? 'bg-teal-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    onClick={() => handleHeightUnitToggle('ft_in')}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      heightUnit === 'ft_in' ? 'bg-teal-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    ft / in
                  </button>
                </div>
              </div>

              {heightUnit === 'cm' ? (
                <div className="relative">
                  <input
                    type="number"
                    min="50"
                    max="250"
                    step="0.5"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-teal-400"
                  />
                  <span className="absolute right-3.5 top-2 text-xs text-slate-400 font-mono">cm</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={heightFt}
                    onChange={(e) => setHeightFt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-sm font-mono"
                    placeholder="ft"
                  />
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={heightIn}
                    onChange={(e) => setHeightIn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-sm font-mono"
                    placeholder="in"
                  />
                </div>
              )}
              {validationErrors.height && (
                <p className="text-[11px] text-rose-400">{validationErrors.height}</p>
              )}
            </div>

            {/* Weight */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <WeightIcon className="w-3.5 h-3.5 text-teal-400" /> Weight
                </label>
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-white/10 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleWeightUnitToggle('kg')}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      weightUnit === 'kg' ? 'bg-teal-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWeightUnitToggle('lb')}
                    className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer ${
                      weightUnit === 'lb' ? 'bg-teal-500 text-slate-950' : 'text-slate-400'
                    }`}
                  >
                    lb
                  </button>
                </div>
              </div>

              {weightUnit === 'kg' ? (
                <div className="relative">
                  <input
                    type="number"
                    min="20"
                    max="300"
                    step="0.5"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-teal-400"
                  />
                  <span className="absolute right-3.5 top-2 text-xs text-slate-400 font-mono">kg</span>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="number"
                    min="44"
                    max="660"
                    step="1"
                    value={weightLb}
                    onChange={(e) => setWeightLb(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white text-sm font-mono focus:outline-none focus:border-teal-400"
                  />
                  <span className="absolute right-3.5 top-2 text-xs text-slate-400 font-mono">lb</span>
                </div>
              )}
              {validationErrors.weight && (
                <p className="text-[11px] text-rose-400">{validationErrors.weight}</p>
              )}
            </div>

          </div>

          {/* BMI Live Preview */}
          {previewMetrics && (
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between text-xs">
              <span className="text-slate-400">BMI Metric:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white">{previewMetrics.bmi}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${previewMetrics.catColor}`}>
                  {previewMetrics.bmiCat}
                </span>
              </div>
            </div>
          )}

          {/* Dietary Preference */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Dietary Preference</label>
            <div className="grid grid-cols-3 gap-2">
              {dietOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDietPreference(opt.id as any)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 justify-center ${
                    dietPreference === opt.id
                      ? 'bg-teal-500/20 border-teal-400 text-teal-300 shadow-sm'
                      : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Goal</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {goalOptions.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFitnessGoal(opt.id as any)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 justify-center ${
                    fitnessGoal === opt.id
                      ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-sm'
                      : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || isSaving}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-teal-500 to-emerald-500 hover:from-purple-500 hover:via-teal-400 hover:to-emerald-400 text-white font-extrabold text-xs tracking-wide shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating & Regenerating Plans...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save & Regenerate Plans</span>
                </>
              )}
            </button>
          </div>

        </form>

        {/* Disclaimer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-start gap-2 text-[10px] text-amber-300/90 leading-tight">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>This is an AI-generated suggestion, not medical advice. Consult a professional before starting any new fitness routine, especially if you have existing health conditions.</span>
        </div>

      </div>
    </div>
  );
};
