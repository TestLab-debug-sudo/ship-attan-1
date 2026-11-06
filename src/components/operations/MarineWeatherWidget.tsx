import React, { useEffect, useState } from 'react';
import { MarineWeather } from '../../types/marine.js';
import { api } from '../../services/api.js';
import { Wind, Waves, Thermometer, Compass, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const MarineWeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<MarineWeather | null>(null);

  useEffect(() => {
    api.getWeather()
      .then(res => setWeather(res.weather))
      .catch(err => console.warn('Could not load weather:', err));
  }, []);

  if (!weather) return null;

  return (
    <div className="marine-glass rounded-2xl p-3 sm:p-4 border border-cyan-500/20 text-white shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 pb-3 border-b border-white/10">
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-cyan-500/20 text-[#27C5C1] border border-cyan-400/30 shrink-0 mt-0.5 sm:mt-0">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white uppercase font-display">
                Navlakhi & Gulf of Kutch Marine Conditions
              </h3>
              <span className={`px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${
                weather.advisoryFlag === 'green'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : weather.advisoryFlag === 'yellow'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                Flag: {weather.advisoryFlag.toUpperCase()}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 line-clamp-2 mt-0.5">{weather.advisoryMessage}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-cyan-200 font-mono bg-[#063B5C] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/10 shrink-0 self-start sm:self-auto">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Next Tide: {weather.tideNextChangeTime}</span>
        </div>
      </div>

      {/* Grid of 4 Key Oceanic Telemetry Cards (Universal Responsive Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 pt-3">
        <div className="bg-[#082F49]/70 p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Wind className="w-4 h-4 text-cyan-400" />
            <span>Wind & Vector</span>
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {weather.windSpeedKnots} <span className="text-xs font-normal text-slate-400">kts</span>
          </div>
          <div className="text-[11px] text-cyan-300 font-mono">{weather.windDirection}</div>
        </div>

        <div className="bg-[#082F49]/70 p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Waves className="w-4 h-4 text-cyan-400" />
            <span>Wave Swell</span>
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {weather.waveHeightMeters} <span className="text-xs font-normal text-slate-400">m ({(weather.waveHeightMeters * 3.28).toFixed(1)} ft)</span>
          </div>
          <div className="text-[11px] text-slate-300">Period 6.2s · Clean Swell</div>
        </div>

        <div className="bg-[#082F49]/70 p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <Thermometer className="w-4 h-4 text-cyan-400" />
            <span>Water Temperature</span>
          </div>
          <div className="text-lg font-bold font-mono text-white">
            {weather.waterTempCelsius}° <span className="text-xs font-normal text-slate-400">C ({((weather.waterTempCelsius * 9/5) + 32).toFixed(1)}°F)</span>
          </div>
          <div className="text-[11px] text-slate-300">Barometer: {weather.barometerHpa} hPa</div>
        </div>

        <div className="bg-[#082F49]/70 p-3 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Sea Visibility</span>
          </div>
          <div className="text-lg font-bold font-mono text-emerald-300">
            {weather.visibilityNm} <span className="text-xs font-normal text-slate-400">NM</span>
          </div>
          <div className="text-[11px] text-emerald-400">Clear horizon line</div>
        </div>
      </div>
    </div>
  );
};
