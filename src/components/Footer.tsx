import React, { useState } from 'react';
import { 
  Mail, 
  HelpCircle, 
  BookOpen, 
  RotateCcw, 
  Check, 
  Leaf 
} from 'lucide-react';

interface FooterProps {
  onOpenDecisions: () => void;
  onResetSeed: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenDecisions,
  onResetSeed
}) => {
  const [troubleModalOpen, setTroubleModalOpen] = useState(false);
  const [troubleSent, setTroubleSent] = useState(false);
  const [troubleText, setTroubleText] = useState('');

  const handleTroubleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTroubleSent(true);
    setTimeout(() => {
      setTroubleSent(false);
      setTroubleModalOpen(false);
      setTroubleText('');
    }, 2000);
  };

  return (
    <>
      <footer className="w-full border-t border-white/10 mt-12 py-6 px-4 text-xs text-slate-400 glass-panel-dark">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Left: Brand / Copyright & Fixed Factor note */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
              <Leaf className="w-4 h-4 text-emerald-400" />
              <span>Earthly Carbon Footprint Tracker</span>
            </div>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500 text-[11px]">Fixed Science-Backed Emission Factors</span>
          </div>

          {/* Right: Support Email, Submit Trouble, Decisions & Reset links */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 text-slate-400">
            <button
              onClick={onOpenDecisions}
              className="hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>Design Decisions (DP1–3)</span>
            </button>

            <button
              onClick={onResetSeed}
              className="hover:text-teal-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
              <span>Reset Demo Data</span>
            </button>

            <a
              href="mailto:support@earthly.app"
              className="hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>support@earthly.app</span>
            </a>

            <button
              onClick={() => setTroubleModalOpen(true)}
              className="hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer text-slate-400 hover:underline"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Submit trouble?</span>
            </button>
          </div>

        </div>
      </footer>

      {/* Submit Trouble Modal */}
      {troubleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card-dark rounded-2xl p-6 max-w-md w-full border border-white/10 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-1">Submit Trouble Report</h3>
            <p className="text-xs text-slate-400 mb-4">
              Encountered a calculation or logging glitch? Send feedback directly to the engineering team.
            </p>

            {troubleSent ? (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Thank you! Your trouble report has been dispatched to engineering.</span>
              </div>
            ) : (
              <form onSubmit={handleTroubleSubmit} className="space-y-3">
                <textarea
                  value={troubleText}
                  onChange={(e) => setTroubleText(e.target.value)}
                  placeholder="Describe the issue or feedback..."
                  rows={3}
                  required
                  className="w-full glass-input-dark rounded-xl p-3 text-xs focus:ring-1 focus:ring-teal-400"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setTroubleModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="gradient-btn-primary px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow"
                  >
                    Send Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
