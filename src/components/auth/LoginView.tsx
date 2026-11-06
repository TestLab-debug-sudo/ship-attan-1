import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { Anchor, Shield, UserCheck, ArrowRight, Lock, Mail, AlertCircle, Compass, Waves } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, quickLogin, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials.');
    }
  };

  const handleQuick = async (role: 'admin' | 'manager') => {
    setErrorMsg(null);
    try {
      await quickLogin(role);
    } catch (err: any) {
      setErrorMsg(err.message || 'Quick login failed.');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-hidden bg-[#052840]">
      {/* Background Hero with Measured Contrast Scrim */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none scale-105 transition-transform duration-1000"
        style={{ backgroundImage: `url('/src/assets/images/hero_marina_harbor_1793952351092.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#052840] via-[#052840]/90 to-transparent pointer-events-none" />

      {/* Decorative Ocean Wave Animation at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-32 overflow-hidden pointer-events-none opacity-25">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full text-cyan-400 fill-current animate-wave-slow">
          <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,120 L0,120 Z"></path>
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-6 sm:gap-8 items-center py-4">
        {/* Left Hero Column */}
        <div className="text-white space-y-4 sm:space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-[#27C5C1]" />
            <span>Navlakhi Marine Operations System</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight font-display text-white leading-tight">
            Commercial Fleet & Port Dispatch Portal
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed max-w-lg">
            Integrated fleet dispatch, real-time crew attendance, maritime AIS tracking, and arrival logbook for Navlakhi port operations.
          </p>

          <div className="pt-2 flex flex-col gap-2.5">
            <div className="text-[11px] sm:text-xs uppercase font-mono tracking-wider text-cyan-400 font-semibold">
              Select Role For Instant Access:
            </div>

            {/* Quick Login Role Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuick('admin')}
                disabled={isLoading}
                className="marine-card p-3.5 sm:p-4 rounded-xl text-left border border-rose-500/30 hover:border-rose-400 hover:bg-rose-950/40 transition-all group shadow-lg touch-target-min flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-rose-500/20 rounded-lg text-rose-300">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white">ADMIN PANEL</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-300 mt-1">
                    Station Manager (Capt. M. Madhukar Rao): Full fleet control, approvals & registry.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuick('manager')}
                disabled={isLoading}
                className="marine-card p-3.5 sm:p-4 rounded-xl text-left border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/40 transition-all group shadow-lg touch-target-min flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-300">
                      <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white">MANAGER PANEL</div>
                  <div className="text-[10px] sm:text-[11px] text-slate-300 mt-1">
                    Supervisor (Debashish Banerjee): Daily check-ins, trip dispatch & logs.
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Credential Form Card */}
        <div className="marine-glass p-5 sm:p-7 md:p-8 rounded-2xl sm:rounded-3xl border border-cyan-500/30 text-white shadow-2xl relative w-full">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-[#27C5C1] flex items-center justify-center text-[#063B5C] font-bold shadow-md shrink-0">
              <Anchor className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Secure Maritime Portal</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">Sign in with authorized staff credentials</p>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Staff Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nautica.marine or manager@nautica.marine"
                  required
                  className="w-full bg-[#063B5C]/80 border border-cyan-500/30 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#27C5C1] transition-colors touch-target-min"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#063B5C]/80 border border-cyan-500/30 rounded-xl py-2.5 pl-10 pr-4 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#27C5C1] transition-colors touch-target-min"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#27C5C1] hover:bg-[#36B99B] text-[#063B5C] font-bold text-xs sm:text-sm py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group mt-2 touch-target-min"
            >
              <span>{isLoading ? 'Verifying Maritime ID...' : 'Enter Navlakhi Operations System'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-white/10 text-center text-[10px] sm:text-xs text-slate-400 flex flex-wrap justify-between gap-2">
            <span>Navlakhi Port Operations Desk</span>
            <span className="font-mono text-cyan-300">VHF Ch 16 / 68</span>
          </div>
        </div>
      </div>
    </div>
  );
};