import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  HeartHandshake, 
  ShieldAlert, 
  Calendar, 
  CheckCircle2, 
  TrendingUp 
} from 'lucide-react';

interface DecisionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DecisionsModal: React.FC<DecisionsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'DP1' | 'DP2' | 'DP3'>('DP1');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto glass-card-dark rounded-3xl shadow-2xl border border-white/10 p-6 sm:p-8 animate-slide-up text-slate-200"
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
        <div className="flex items-center gap-3 pb-5 border-b border-white/10 pr-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-teal-400 p-[1.5px] shadow-lg flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md">
                Architecture Decisions
              </span>
              <span className="text-xs text-slate-400">DECISIONS.md</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
              Design Decisions (DP1 · DP2 · DP3)
            </h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 pt-5 border-b border-white/10 pb-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('DP1')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'DP1'
                ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <HeartHandshake className="w-4 h-4 text-purple-400" />
            <span>DP1 · Over-Target Nudging</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DP2')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'DP2'
                ? 'bg-teal-500/25 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-teal-400" />
            <span>DP2 · Absurd Input Handling</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DP3')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'DP3'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>DP3 · Week Definition & Pacing</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="py-6 space-y-6">
          
          {/* TAB 1: DP1 */}
          {activeTab === 'DP1' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/25">
                <h3 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4" />
                  Product Policy: Constructive, Multi-Tiered Behavioral Psychology
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Rather than inducing eco-guilt or punitive friction, Earthly implements a 3-tiered constructive guidance system designed to build long-term sustainable habits.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>🟢 &lt;80% Target</span>
                  </div>
                  <p className="text-xs font-semibold text-white">On Track / Eco Champion</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Provides positive reinforcement and highlights micro-habit tips (e.g. plant-based meals).
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>🟡 80–99% Target</span>
                  </div>
                  <p className="text-xs font-semibold text-white">Early Caution Warning</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Calculates remaining budget buffer and suggests lower-carbon transit or meal options.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-rose-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <TrendingUp className="w-4 h-4" />
                    <span>🔴 100%+ Target</span>
                  </div>
                  <p className="text-xs font-semibold text-white">Target Exceeded</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Replaces guilt with tangible offset suggestions (e.g., *"Swap next 2 meals to plant-based"*).
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 text-xs text-slate-300 space-y-2">
                <h4 className="font-bold text-white">Tone Choice Justification</h4>
                <p className="leading-relaxed">
                  Behavioral economics studies show that guilt-inducing climate apps trigger avoidance and abandonment. Earthly adopts an encouraging, objective tone similar to a personal fitness tracker: overages are neutral data points with actionable recovery paths.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: DP2 */}
          {activeTab === 'DP2' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/25">
                <h3 className="text-sm font-bold text-teal-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Product Policy: Two-Tiered Hybrid Validation (Hard Blocks + Soft Warnings)
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Enforces strict data integrity without locking out legitimate edge-case travel (e.g. cross-country road trips).
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-xs bg-slate-950/60">
                  <thead className="bg-slate-900 text-slate-400 font-bold border-b border-white/10">
                    <tr>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Soft Warning</th>
                      <th className="py-2.5 px-3">Hard Block</th>
                      <th className="py-2.5 px-3">Rationale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">Car travel</td>
                      <td className="py-2.5 px-3 text-amber-400">&gt; 350 km</td>
                      <td className="py-2.5 px-3 text-rose-400">&gt; 2,500 km</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">2,500 km is 24h driving speed cap.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">Bus travel</td>
                      <td className="py-2.5 px-3 text-amber-400">&gt; 200 km</td>
                      <td className="py-2.5 px-3 text-rose-400">&gt; 1,500 km</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">Intercity coach travel maximums.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">Flight</td>
                      <td className="py-2.5 px-3 text-amber-400">&gt; 4,000 km</td>
                      <td className="py-2.5 px-3 text-rose-400">&gt; 25,000 km</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">25k km exceeds half Earth's circumference.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">Electricity</td>
                      <td className="py-2.5 px-3 text-amber-400">&gt; 60 kWh</td>
                      <td className="py-2.5 px-3 text-rose-400">&gt; 2,000 kWh</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">60 kWh is 4x standard household daily use.</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-white">Meals</td>
                      <td className="py-2.5 px-3 text-amber-400">&gt; 5 meals</td>
                      <td className="py-2.5 px-3 text-rose-400">&gt; 15 meals</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">Prevents logging bulk event catering as 1 entry.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DP3 */}
          {activeTab === 'DP3' && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Product Policy: Fixed ISO Monday–Sunday Week with Daily Pacing Benchmark
                </h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Defines tracking by calendar weeks (Monday 00:00 to Sunday 23:59) rather than rolling 7-day windows.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                  <h4 className="font-bold text-white text-xs">Why Fixed Monday–Sunday?</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    People naturally plan weekly routines (workdays vs. weekends) on Monday–Sunday schedules. A fixed week provides a clear clean-slate reset every Monday morning, fostering long-term motivation.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
                  <h4 className="font-bold text-white text-xs">Daily Linear Pacing Metric</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    Expected = Target × (DayIndex / 7)
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Compares current cumulative emissions against the expected linear baseline for that specific day of the week to show ahead/behind pace.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="gradient-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer"
          >
            Close Decision Log
          </button>
        </div>

      </div>
    </div>
  );
};
