import React, { useState } from 'react';
import { Employee, Boat, TripRecord, AttendanceRecord, LeaveRequest } from '../../types/marine.js';
import { MarineWeatherWidget } from '../operations/MarineWeatherWidget.js';
import { Harbor3DScene } from '../marine-3d/Harbor3DScene.js';
import { FleetLiveMap } from '../operations/FleetLiveMap.js';
import { 
  Anchor, Ship, Users, Clock, CheckCircle2, 
  MapPin, LogIn, LogOut, ArrowRight, ShieldCheck, Compass,
  Calendar, Briefcase, Phone
} from 'lucide-react';

interface ManagerDashboardProps {
  employees: Employee[];
  boats: Boat[];
  trips: TripRecord[];
  attendance: AttendanceRecord[];
  leaves?: LeaveRequest[];
  onNavigate: (view: string) => void;
  onRefresh: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  employees,
  boats,
  trips,
  attendance,
  leaves = [],
  onNavigate,
  onRefresh
}) => {
  const [activeVisualizer, setActiveVisualizer] = useState<'3d' | 'map'>('3d');

  const todayStr = new Date().toISOString().split('T')[0];
  const activeTrips = trips.filter(t => t.status === 'in_progress');
  const scheduledToday = trips.filter(t => t.status === 'scheduled');
  const onDutyCount = employees.filter(e => e.status === 'on_duty' || e.status === 'on_sea').length;
  const dockedCount = boats.filter(b => b.status === 'docked').length;

  // Helper to compute employee metrics
  const getEmpMetrics = (emp: Employee) => {
    let serviceDays = 0;
    if (emp.joinedDate) {
      const join = new Date(emp.joinedDate);
      const now = new Date();
      serviceDays = Math.max(1, Math.floor((now.getTime() - join.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const empLeaves = leaves.filter(l => (l.employeeId === emp.id || l.employeeCode === emp.employeeCode) && l.status === 'approved');
    const totalLeaveDays = empLeaves.reduce((sum, l) => sum + (l.totalDays || 0), 0);
    const daysWorked = Math.max(1, serviceDays - totalLeaveDays);

    const currentLeave = empLeaves.find(l => todayStr >= l.startDate && todayStr <= l.endDate);
    const isCurrentlyOnLeave = !!currentLeave || emp.status === 'on_leave';

    return {
      serviceDays,
      daysWorked,
      totalLeaveDays,
      currentLeave,
      isCurrentlyOnLeave
    };
  };

  const currentlyOnLeaveEmployees = employees.filter(e => getEmpMetrics(e).isCurrentlyOnLeave);

  return (
    <div className="space-y-6">
      {/* Live Oceanic Weather Bar */}
      <MarineWeatherWidget />

      {/* KPI Stats Strip (Universal Responsive Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div 
          onClick={() => onNavigate('dispatch')}
          className="marine-card p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer marine-card-hover text-white flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 sm:mb-2">
            <span className="truncate">Vessels Underway</span>
            <Ship className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-cyan-300 tabular-nums">
            {activeTrips.length} <span className="text-xs font-normal text-slate-400">/ {boats.length}</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-300 mt-1 truncate">
            {dockedCount} vessels docked at slips
          </div>
        </div>

        <div 
          onClick={() => onNavigate('attendance')}
          className="marine-card p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer marine-card-hover text-white flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 sm:mb-2">
            <span className="truncate">Crew on Duty (வந்தவர்கள்)</span>
            <Users className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-300 tabular-nums">
            {onDutyCount} <span className="text-xs font-normal text-slate-400">/ {employees.length}</span>
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-400/80 mt-1 truncate">
            {currentlyOnLeaveEmployees.length} on approved leave
          </div>
        </div>

        <div 
          onClick={() => onNavigate('dispatch')}
          className="marine-card p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer marine-card-hover text-white flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 sm:mb-2">
            <span className="truncate">Scheduled Trips</span>
            <Anchor className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
            {scheduledToday.length}
          </div>
          <div className="text-[10px] sm:text-[11px] text-amber-300 mt-1 truncate">
            Pending departure checklist
          </div>
        </div>

        <div 
          onClick={() => onNavigate('attendance')}
          className="marine-card p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer marine-card-hover text-white flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 sm:mb-2">
            <span className="truncate">Roster Check-Ins</span>
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
            {attendance.filter(a => a.date === todayStr && a.clockIn).length}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-300 mt-1 truncate">
            Navlakhi Station logged
          </div>
        </div>
      </div>

      {/* Visualizer Mode Switcher & 3D / Map Viewport */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white font-display">
              Harbor Basin & Operational Vessel Tracking
            </h2>
            <span className="text-xs text-slate-400">· Real-time telemetry</span>
          </div>

          <div className="flex items-center gap-1 bg-[#082F49] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveVisualizer('3d')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeVisualizer === '3d'
                  ? 'bg-[#27C5C1] text-[#063B5C] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Ship className="w-4 h-4" />
              <span>3D Digital Twin Harbor</span>
            </button>
            <button
              onClick={() => setActiveVisualizer('map')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                activeVisualizer === 'map'
                  ? 'bg-[#27C5C1] text-[#063B5C] shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Anchor className="w-4 h-4" />
              <span>AIS Coastal Radar Map</span>
            </button>
          </div>
        </div>

        {activeVisualizer === '3d' ? (
          <Harbor3DScene boats={boats} />
        ) : (
          <FleetLiveMap boats={boats} trips={trips} />
        )}
      </div>

      {/* ========================================================================= */}
      {/* CREW ATTENDANCE & LEAVE LEDGER SUMMARY CARD (வந்த நாட்கள் & எடுத்த விடுப்பு) */}
      {/* ========================================================================= */}
      <div className="marine-card p-4 sm:p-5 rounded-2xl text-white space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#27C5C1] to-[#063B5C] text-white flex items-center justify-center font-bold border border-cyan-400/30">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Navlakhi Crew Attendance & Leave Roster (வந்த நாட்கள் & எடுத்த விடுப்புகள்)
              </h3>
              <span className="text-xs text-slate-300 block">
                14 Navlakhi Personnel · Days Worked, Leaves Taken & Reporting Dates
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('attendance')}
            className="w-full sm:w-auto bg-[#27C5C1] hover:bg-[#36B99B] text-[#063B5C] font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 touch-target-min whitespace-nowrap"
          >
            <span>முழு Roster Ledger பார்க்க</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Desktop Table View (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#063B5C] text-slate-400 uppercase font-mono text-[11px] border-b border-white/10">
              <tr>
                <th className="px-3.5 py-2.5">Crew Member</th>
                <th className="px-3.5 py-2.5">Role</th>
                <th className="px-3.5 py-2.5">Joined Date</th>
                <th className="px-3.5 py-2.5 text-center">வந்த நாட்கள் (Days Worked)</th>
                <th className="px-3.5 py-2.5 text-center">எடுத்த லீவ் (Leaves)</th>
                <th className="px-3.5 py-2.5">விடுப்பு நிலை & திரும்பும் தேதி</th>
                <th className="px-3.5 py-2.5 text-right">இன்றைய நிலை</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {employees.map(emp => {
                const m = getEmpMetrics(emp);
                const attRec = attendance.find(a => a.employeeId === emp.id && a.date === todayStr);

                return (
                  <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-3.5 py-2.5 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <span>{emp.name}</span>
                        <span className="text-[10px] text-cyan-300 font-mono">({emp.employeeCode})</span>
                      </div>
                    </td>

                    <td className="px-3.5 py-2.5 capitalize text-slate-300">
                      {emp.role.replace('_', ' ')}
                    </td>

                    <td className="px-3.5 py-2.5 text-slate-400 font-mono text-[11px]">
                      {emp.joinedDate}
                    </td>

                    <td className="px-3.5 py-2.5 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold font-mono text-xs">
                        {m.daysWorked} நாட்கள்
                      </span>
                    </td>

                    <td className="px-3.5 py-2.5 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-lg font-bold font-mono text-xs border ${
                        m.totalLeaveDays > 0
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-white/5 text-slate-400 border-white/5'
                      }`}>
                        {m.totalLeaveDays} நாட்கள்
                      </span>
                    </td>

                    <td className="px-3.5 py-2.5 text-[11px]">
                      {m.currentLeave ? (
                        <div className="text-amber-300">
                          <span className="font-bold block">தற்சமயம் விடுப்பில் உள்ளார் ({m.currentLeave.totalDays}d)</span>
                          <span className="text-[10px] text-cyan-300 font-mono">
                            திரும்பும் தேதி: {m.currentLeave.endDate}
                          </span>
                        </div>
                      ) : m.totalLeaveDays > 0 ? (
                        <span className="text-emerald-400 font-medium">
                          விடுப்பு முடிந்து பணியில் உள்ளார்
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">விடுப்பு எடுக்கவில்லை</span>
                      )}
                    </td>

                    <td className="px-3.5 py-2.5 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block ${
                        m.isCurrentlyOnLeave
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : attRec?.status === 'on_sea' || emp.status === 'on_sea'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {m.isCurrentlyOnLeave ? 'On Leave' : attRec?.status === 'on_sea' ? 'On Sea' : 'Present'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View (< 768px) */}
        <div className="block md:hidden space-y-2.5">
          {employees.slice(0, 7).map(emp => {
            const m = getEmpMetrics(emp);
            return (
              <div key={emp.id} className="p-3 rounded-xl bg-[#063B5C]/70 border border-white/5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-xs block">{emp.name}</span>
                    <span className="text-[10px] text-slate-400 capitalize">{emp.role.replace('_', ' ')} · {emp.employeeCode}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    m.isCurrentlyOnLeave ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {m.isCurrentlyOnLeave ? 'On Leave' : 'Present'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center font-mono text-[11px] pt-1 border-t border-white/5">
                  <div className="bg-emerald-500/10 p-1.5 rounded-lg text-emerald-300 font-bold">
                    வந்த நாட்கள்: {m.daysWorked}d
                  </div>
                  <div className="bg-amber-500/10 p-1.5 rounded-lg text-amber-300 font-bold">
                    எடுத்த லீவ்: {m.totalLeaveDays}d
                  </div>
                </div>

                {m.currentLeave && (
                  <div className="text-[10px] text-amber-300 font-mono">
                    திரும்பும் தேதி: {m.currentLeave.endDate}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Operations Split: Active Voyages */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Voyages Card */}
        <div className="marine-card p-5 rounded-2xl text-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Active Sea Voyages</h3>
            </div>
            <button
              onClick={() => onNavigate('dispatch')}
              className="text-xs text-cyan-300 hover:text-white flex items-center gap-1"
            >
              <span>Dispatch Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {activeTrips.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No vessels currently underway.</p>
            ) : (
              activeTrips.map(trip => (
                <div key={trip.id} className="bg-[#063B5C] p-3.5 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-300 uppercase">{trip.tripNumber}</span>
                      <h4 className="text-sm font-bold text-white">{trip.boatName}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Underway
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1">
                    <div>Skipper: <strong className="text-white">{trip.skipperName}</strong></div>
                    <div>Destination: {trip.destination}</div>
                    <div className="text-slate-400 text-[11px]">
                      Departed: {trip.actualDeparture ? new Date(trip.actualDeparture).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '06:12 AM'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Vessel Status Card */}
        <div className="marine-card p-5 rounded-2xl text-white space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ship className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Navlakhi Port Vessel Readiness</h3>
            </div>
            <button
              onClick={() => onNavigate('dispatch')}
              className="text-xs text-cyan-300 hover:text-white flex items-center gap-1"
            >
              <span>Fleet Status</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {boats.map(boat => (
              <div key={boat.id} className="flex items-center justify-between p-3 rounded-xl bg-[#063B5C]/60 text-xs border border-white/5">
                <div>
                  <span className="font-bold text-white block">{boat.name}</span>
                  <span className="text-slate-400 text-[11px] block">{boat.currentMarinaSlip}</span>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    boat.status === 'at_sea' ? 'bg-sky-500/20 text-sky-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {boat.status.replace('_', ' ')}
                  </span>
                  <span className="text-slate-400 text-[10px] font-mono block mt-0.5">
                    Fuel: {boat.fuelLevelPct}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
