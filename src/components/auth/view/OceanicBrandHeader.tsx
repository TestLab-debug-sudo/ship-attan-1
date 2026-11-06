import React from 'react';
import { motion } from 'motion/react';
import { Anchor, Compass, Ship } from 'lucide-react';

/**
 * VIEW: Oceanic Marine Top-Left Branding & Hero Typography
 * Matches exact layout from reference image:
 * - Ship helm wheel emblem with fishing vessel
 * - "Oceanic Marine - BOAT COMPANY MANAGEMENT SYSTEM"
 * - "Welcome Back!"
 * - "Monitor • Manage • Navigate"
 * - "Your complete boat operations & attendance management platform."
 */
export const OceanicBrandHeader: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="space-y-4 max-w-xl"
    >
      {/* Brand Identity / Helm Logo */}
      <div className="flex items-center gap-3">
        {/* Stylized Nautical Helm Wheel Icon */}
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#0284c7] to-[#075985] p-2.5 shadow-xl border border-white/40 flex items-center justify-center shrink-0">
          <Ship className="w-7 h-7 text-white drop-shadow-md" />
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-white animate-pulse" />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0f2d4a] font-display">
              Oceanic Marine
            </h1>
          </div>
          <span className="text-[10px] sm:text-[11px] font-mono tracking-widest uppercase text-[#0284c7] font-bold block">
            Boat Company Management System
          </span>
        </div>
      </div>

      {/* Main Hero Header */}
      <div className="space-y-1.5 pt-1">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#0f2d4a] font-display tracking-tight">
          Welcome Back!
        </h2>
        
        {/* Bullet Subtitle */}
        <div className="text-sm sm:text-base font-bold text-[#0284c7] flex items-center gap-2">
          <span>Monitor</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
          <span>Manage</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]" />
          <span>Navigate</span>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-md pt-0.5">
          Your complete boat operations & attendance management platform.
        </p>
      </div>
    </motion.div>
  );
};
