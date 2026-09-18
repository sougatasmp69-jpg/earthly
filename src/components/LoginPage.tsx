import React, { useState } from 'react';
import { 
  Leaf, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  KeyRound
} from 'lucide-react';
import { User, AuthResponse } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User, token: string) => void;
  onLogin: (phoneNumber: string, password: string, name?: string) => Promise<AuthResponse>;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onLogin
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate phone format (digits only, valid length)
  const validatePhone = (value: string): boolean => {
    const digitsOnly = value.replace(/\D/g, '');
    if (!digitsOnly) {
      setPhoneError('Please enter your phone number.');
      return false;
    }
    if (digitsOnly.length < 10) {
      setPhoneError('Please enter a valid phone number (at least 10 digits).');
      return false;
    }
    if (digitsOnly.length > 15) {
      setPhoneError('Phone number cannot exceed 15 digits.');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhoneNumber(val);
    setGeneralError(null);
    if (phoneError) validatePhone(val);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPassword(val);
    setPasswordError(null);
    setGeneralError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setPasswordError(null);

    const isPhoneValid = validatePhone(phoneNumber);
    if (!isPhoneValid) return;

    if (!password) {
      setPasswordError('Please enter your password.');
      return;
    }

    if (password.length < 4) {
      setPasswordError('Password must be at least 4 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await onLogin(phoneNumber.trim(), password);
      if (response.success && response.user && response.token) {
        onLoginSuccess(response.user, response.token);
      } else {
        // Show clear inline error without confirming/denying whether number is registered
        const err = response.error || 'Incorrect password.';
        if (err.toLowerCase().includes('password')) {
          setPasswordError('Incorrect password');
        } else {
          setGeneralError(err);
        }
      }
    } catch {
      setGeneralError('Unable to connect to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill preset demo accounts
  const handleQuickFill = (phone: string, pass: string) => {
    setPhoneNumber(phone);
    setPassword(pass);
    setPhoneError(null);
    setPasswordError(null);
    setGeneralError(null);
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 relative overflow-hidden selection:bg-teal-500/30 selection:text-teal-200">
      
      {/* Blurred Bokeh Glow Orbs Floating in Background */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-purple-600/25 rounded-full blur-[130px] pointer-events-none animate-float-slow" />
      <div className="fixed top-12 left-1/3 w-[30rem] h-[30rem] bg-teal-500/20 rounded-full blur-[140px] pointer-events-none animate-float-reverse" />
      <div className="fixed bottom-10 right-0 w-[28rem] h-[28rem] bg-pink-600/20 rounded-full blur-[150px] pointer-events-none animate-float-slow" />
      <div className="fixed bottom-24 left-12 w-80 h-80 bg-emerald-600/20 rounded-full blur-[130px] pointer-events-none animate-float-reverse" />

      {/* Main Centered Glassmorphic Login Card */}
      <div className="w-full max-w-md glass-card-dark rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative z-10 animate-slide-up">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-purple-600 p-[1.5px] shadow-xl shadow-emerald-500/25 mb-3">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Leaf className="w-7 h-7 text-emerald-400 animate-pulse" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Earthly</h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Personal OS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Carbon Footprint Tracker
          </p>
        </div>

        {/* General Error Banner */}
        {generalError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Phone Number Field */}
          <div>
            <label htmlFor="phone-input" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                id="phone-input"
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                onBlur={() => phoneNumber && validatePhone(phoneNumber)}
                placeholder="Enter your phone number"
                className={`w-full glass-input-dark rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:ring-2 placeholder-slate-500 ${
                  phoneError ? 'border-rose-500/60 focus:ring-rose-500/30' : 'focus:ring-teal-400/30'
                }`}
                required
              />
            </div>
            {phoneError && (
              <p className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1 animate-fade-in">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{phoneError}</span>
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password-input" className="block text-xs font-semibold text-slate-300">
                Password
              </label>
              <span className="text-[10px] text-slate-500">Min. 4 characters</span>
            </div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter your password"
                className={`w-full glass-input-dark rounded-xl pl-10 pr-11 py-3 text-sm font-medium focus:ring-2 placeholder-slate-500 ${
                  passwordError ? 'border-rose-500/60 focus:ring-rose-500/30' : 'focus:ring-teal-400/30'
                }`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1 animate-fade-in">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{passwordError}</span>
              </p>
            )}
          </div>

          {/* Full-Width Gradient Action Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white gradient-btn-primary shadow-xl hover:opacity-95 transform active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <span>Logging In...</span>
            ) : (
              <>
                <span>Log In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </form>

        {/* Helper Text: Auto-Signup Behavior */}
        <div className="mt-4 pt-3 border-t border-white/10 text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            New here? Just log in with your number and password to get started.
          </p>
        </div>

        {/* Demo Fast-Login Presets */}
        <div className="mt-5 p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <KeyRound className="w-3 h-3 text-teal-400" /> Demo Quick Access:
            </span>
            <span className="text-[10px] text-slate-500 font-mono">1-Click Fill</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('+1 (555) 019-2834', 'earthly123')}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-teal-500/20 text-left transition-all cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-teal-300 group-hover:text-teal-200">
                Alex Morgan (Demo)
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                14 logged activities
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('+1 (555) 444-9988', 'eco2026')}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-purple-500/20 text-left transition-all cursor-pointer group"
            >
              <div className="text-[11px] font-bold text-purple-300 group-hover:text-purple-200">
                Fresh New User
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Clean 0 kg dashboard
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="mt-6 text-center text-xs text-slate-500 relative z-10">
        <p>Protected by PBKDF2 Password Hashing & Per-User Carbon Isolation</p>
      </div>

    </div>
  );
};
