import React from 'react';
import { motion } from 'motion/react';
import { Users, Ship, Waves, Anchor } from 'lucide-react';
import { DEFAULT_MARINE_KPIS, MarineKpiSnapshot } from '../model/loginModel.js';

interface OceanicKpiPillProps {
  kpis?: MarineKpiSnapshot;
}

/**
 * VIEW: Oceanic Marine Floating Bottom-Left Glassmorphism KPI Pill
 * Exact reference match:
 * [👥 20+ Employees | ⛵ 5 Boats | 🌊 3 At Sea | ⚓ 2 At Harbour]
 */
export const OceanicKpiPill: React.FC<OceanicKpiPillProps> = ({
  kpis = DEFAULT_MARINE_KPIS
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
      className="inline-flex items-center gap-3 sm:gap-6 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-white/20 backdrop-blur-md border border-white/40 shadow-2xl text-white max-w-full overflow-x-auto scrollbar-none"
    >
      {/* 1. Employees */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#0284c7]/40 flex items-center justify-center text-cyan-200 border border-white/20">
          <Users className="w-4 h-4 text-white" />
        </div>
        <div className="leading-tight">
          <span className="text-sm sm:text-base font-black font-mono text-white block">
            {kpis.employeesCount}
          </span>
          <span className="text-[10px] text-slate-200 font-sans block">
            Employees
          </span>
        </div>
      </div>

      <div className="w-[1px] h-6 bg-white/30 shrink-0" />

      {/* 2. Boats */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#0284c7]/40 flex items-center justify-center text-cyan-200 border border-white/20">
          <Ship className="w-4 h-4 text-white" />
        </div>
        <div className="leading-tight">
          <span className="text-sm sm:text-base font-black font-mono text-white block">
            {kpis.boatsCount}
          </span>
          <span className="text-[10px] text-slate-200 font-sans block">
            Boats
          </span>
        </div>
      </div>

      <div className="w-[1px] h-6 bg-white/30 shrink-0" />

      {/* 3. At Sea */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#0284c7]/40 flex items-center justify-center text-cyan-200 border border-white/20">
          <Waves className="w-4 h-4 text-white" />
        </div>
        <div className="leading-tight">
          <span className="text-sm sm:text-base font-black font-mono text-white block">
            {kpis.atSeaCount}
          </span>
          <span className="text-[10px] text-slate-200 font-sans block">
            At Sea
          </span>
        </div>
      </div>

      <div className="w-[1px] h-6 bg-white/30 shrink-0" />

      {/* 4. At Harbour */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#0284c7]/40 flex items-center justify-center text-cyan-200 border border-white/20">
          <Anchor className="w-4 h-4 text-white" />
        </div>
        <div className="leading-tight">
          <span className="text-sm sm:text-base font-black font-mono text-white block">
            {kpis.atHarbourCount}
          </span>
          <span className="text-[10px] text-slate-200 font-sans block">
            At Harbour
          </span>
        </div>
      </div>
    </motion.div>
  );
};
