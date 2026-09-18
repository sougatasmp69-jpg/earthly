import React, { useState } from 'react';
import { WeeklyTarget } from '../types';
import { X, Target, Check } from 'lucide-react';

interface WeeklyTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTarget: WeeklyTarget;
  onSaveTarget: (targetKg: number) => Promise<void>;
}

const BENCHMARKS = [
  { label: 'Aggressive Eco Target', value: 25, desc: 'Deep decarbonization pacing' },
  { label: 'Paris Accord Goal', value: 40, desc: '2 tonnes CO₂/year per capita' },
  { label: 'Moderate Budget', value: 70, desc: 'Sustainable living with public transit' },
  { label: 'EU Baseline Average', value: 120, desc: '~6.2 tonnes CO₂/year per person' }
];

export const WeeklyTargetModal: React.FC<WeeklyTargetModalProps> = ({
  isOpen,
  onClose,
  currentTarget,
  onSaveTarget
}) => {
  const [targetVal, setTargetVal] = useState<number>(currentTarget.targetKg || 50);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetVal <= 0) return;
    setIsSaving(true);
    try {
      await onSaveTarget(targetVal);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg glass-card-dark rounded-3xl shadow-2xl border border-white/10 p-6 sm:p-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[1.5px] shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              Set Weekly CO₂ Target
            </h2>
            <p className="text-xs text-slate-400">
              Feature 3 · Customize your weekly carbon budget
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          
          {/* Target Value Display & Input */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-white/10 text-center space-y-3 shadow-inner">
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
              Weekly Carbon Budget
            </span>
            <div className="flex items-center justify-center gap-2">
              <input
                type="number"
                min={5}
                max={1000}
                step={1}
                value={targetVal}
                onChange={(e) => setTargetVal(Number(e.target.value))}
                className="w-28 px-3 py-2 text-3xl font-black text-center text-white glass-input-dark rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-teal-400"
                required
              />
              <span className="text-sm font-bold text-slate-300">
                kg CO₂ / week
              </span>
            </div>

            {/* Slider */}
            <div className="pt-2">
              <input
                type="range"
                min={10}
                max={200}
                step={5}
                value={targetVal}
                onChange={(e) => setTargetVal(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>10 kg (Strict)</span>
                <span>50 kg (Standard)</span>
                <span>200 kg (High)</span>
              </div>
            </div>
          </div>

          {/* Preset Benchmarks */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Recommended Benchmarks:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BENCHMARKS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setTargetVal(b.value)}
                  className={`p-3 text-left rounded-xl border transition-all text-xs cursor-pointer ${
                    targetVal === b.value
                      ? 'border-teal-400 bg-teal-500/20 text-white shadow-sm'
                      : 'border-white/5 bg-slate-950/50 text-slate-300 hover:border-white/20 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{b.label}</span>
                    <span className="text-teal-400 font-mono">{b.value} kg</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{b.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || targetVal <= 0}
              className="gradient-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Target'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
