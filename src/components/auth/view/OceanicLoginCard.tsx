import React from 'react';
import { motion } from 'motion/react';
import { 
  Shield, Users, User, Lock, Eye, EyeOff, 
  Anchor, Compass, AlertCircle, Loader2 
} from 'lucide-react';
import { LoginRole } from '../model/loginModel.js';

interface OceanicLoginCardProps {
  activeRole: LoginRole;
  identifier: string;
  password: string;
  showPassword: boolean;
  rememberMe: boolean;
  isLoading: boolean;
  errorMsg: string | null;
  onRoleChange: (role: LoginRole) => void;
  onIdentifierChange: (val: string) => void;
  onPasswordChange: (val: string) => void;
  onTogglePasswordVisibility: () => void;
  onRememberMeChange: (checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDirectPresetLogin?: (role: LoginRole) => void;
}

/**
 * VIEW: Oceanic Marine Glassmorphism Login Card
 * Exact match to provided design image:
 * - Nautical compass emblem crest at top
 * - Script quote: "Sail Smart... Manage Better..."
 * - Admin Login vs Manager Login glowing tabs
 * - Inputs with Lucide icons (User, Lock, Eye toggle)
 * - Remember me & Forgot Password
 * - Glowing blue anchor Login button
 * - "Together Towards a Greater Horizon" bottom script
 */
export const OceanicLoginCard: React.FC<OceanicLoginCardProps> = ({
  activeRole,
  identifier,
  password,
  showPassword,
  rememberMe,
  isLoading,
  errorMsg,
  onRoleChange,
  onIdentifierChange,
  onPasswordChange,
  onTogglePasswordVisibility,
  onRememberMeChange,
  onSubmit,
  onDirectPresetLogin
}) => {
  return (
    <div className="w-full max-w-md mx-auto relative flex flex-col items-center">
      {/* Top Floating Script Quote */}
      <motion.div 
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-right w-full pr-4 mb-2"
      >
        <span className="font-serif italic text-white/95 text-sm sm:text-base tracking-wide drop-shadow-md">
          "Sail Smart... Manage Better..."
        </span>
        <div className="h-0.5 w-16 ml-auto bg-gradient-to-r from-transparent via-cyan-400 to-transparent mt-0.5 rounded-full" />
      </motion.div>

      {/* Glassmorphic Container with Compass Crest */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="w-full relative rounded-3xl p-6 sm:p-8 bg-white/20 backdrop-blur-xl border border-white/50 shadow-[0_20px_50px_rgba(0,40,90,0.35)] overflow-hidden"
        style={{
          boxShadow: '0 25px 60px -15px rgba(2, 132, 199, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.6)'
        }}
      >
        {/* Top Nautical Compass Emblem Crest */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0284c7] to-[#075985] border-2 border-white/80 shadow-lg flex items-center justify-center text-white">
            <Compass className="w-6 h-6 animate-spin-slow text-cyan-200" />
          </div>
        </div>

        {/* Card Header Content */}
        <div className="pt-5 text-center space-y-1 mb-5">
          {/* Admin vs Manager Login Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/15 backdrop-blur-md border border-white/20 mb-4">
            <button
              type="button"
              onClick={() => onRoleChange('admin')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 touch-target-min ${
                activeRole === 'admin'
                  ? 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] text-white shadow-lg border border-cyan-300/40 shadow-cyan-500/30'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Login</span>
            </button>

            <button
              type="button"
              onClick={() => onRoleChange('manager')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 touch-target-min ${
                activeRole === 'manager'
                  ? 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] text-white shadow-lg border border-cyan-300/40 shadow-cyan-500/30'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Manager Login</span>
            </button>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-sm font-display">
            Login to Your Account
          </h3>
          <p className="text-xs text-white/80">
            Access your marine operations dashboard
          </p>
        </div>

        {/* Error Notification Alert */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-rose-500/25 border border-rose-400/50 text-white text-xs flex items-center gap-2 shadow-md backdrop-blur-md"
          >
            <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />
            <span className="font-medium leading-tight">{errorMsg}</span>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Username / Email Field */}
          <div className="space-y-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/80">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => onIdentifierChange(e.target.value)}
                placeholder="Username or Email"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/15 hover:bg-white/20 focus:bg-white/25 border border-white/40 focus:border-cyan-300 text-white placeholder-white/70 text-xs sm:text-sm font-medium transition-all backdrop-blur-md outline-none shadow-inner"
              />
            </div>
          </div>

          {/* Password Field with Show/Hide toggle */}
          <div className="space-y-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/80">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-white/15 hover:bg-white/20 focus:bg-white/25 border border-white/40 focus:border-cyan-300 text-white placeholder-white/70 text-xs sm:text-sm font-medium transition-all backdrop-blur-md outline-none shadow-inner"
              />
              <button
                type="button"
                onClick={onTogglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/80 hover:text-white transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between text-xs text-white/90 pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => onRememberMeChange(e.target.checked)}
                className="w-4 h-4 rounded border-white/50 bg-white/20 text-[#0284c7] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#0284c7]"
              />
              <span>Remember Me</span>
            </label>

            <button
              type="button"
              onClick={() => alert('For password reset, contact Navlakhi Station Port Administrator.')}
              className="hover:underline hover:text-cyan-200 text-white/80 transition-colors"
            >
              Forgot Password?
            </button>
          </div>

          {/* Glowing Anchor Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 sm:py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#0284c7] hover:from-[#0369a1] hover:to-[#0284c7] active:scale-[0.98] transition-all shadow-[0_10px_25px_rgba(2,132,199,0.5)] border border-cyan-300/40 flex items-center justify-center gap-2 touch-target-min cursor-pointer mt-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Anchor className="w-5 h-5 text-white" />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        {/* "or" Separator */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="w-full border-t border-white/20" />
          <span className="px-3 text-[11px] text-white/70 bg-transparent uppercase font-mono tracking-wider absolute">
            or
          </span>
        </div>

        {/* 1-Click Default Login Options */}
        {onDirectPresetLogin && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onDirectPresetLogin('admin')}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm touch-target-min cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-300" />
              <span>Default Admin</span>
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onDirectPresetLogin('manager')}
              className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/30 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm touch-target-min cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-teal-300" />
              <span>Default Manager</span>
            </button>
          </div>
        )}

        {/* Footer Cursive Quote & Illuminated Wave Graphic */}
        <div className="text-center pt-1 space-y-1">
          <p className="font-serif italic text-white/95 text-xs sm:text-sm tracking-wide">
            "Together Towards a Greater Horizon"
          </p>
          <div className="h-0.5 w-24 mx-auto bg-gradient-to-r from-transparent via-amber-400 to-transparent rounded-full" />
        </div>

        {/* Glowing Wave Swirl Effect at Bottom Edge */}
        <div className="absolute -bottom-1 left-0 right-0 h-10 pointer-events-none opacity-40 bg-gradient-to-t from-cyan-400/40 to-transparent rounded-b-3xl" />
      </motion.div>
    </div>
  );
};
