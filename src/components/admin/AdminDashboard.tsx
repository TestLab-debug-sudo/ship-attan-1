import React from 'react';
import { Employee, Boat, TripRecord, AttendanceRecord, LeaveRequest } from '../../types/marine.js';
import { Harbor3DScene } from '../marine-3d/Harbor3DScene.js';
import { FleetLiveMap } from '../operations/FleetLiveMap.js';
import { MarineWeatherWidget } from '../operations/MarineWeatherWidget.js';
import { 
  Users, Ship, Anchor, Clock, Calendar, CheckSquare, 
  TrendingUp, AlertTriangle, ArrowUpRight, BarChart3, Database 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';

interface AdminDashboardProps {
  employees: Employee[];
  boats: Boat[];
  trips: TripRecord[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  onNavigate: (view: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  employees,
  boats,
  trips,
  attendance,
  leaves,
  onNavigate
}) => {
  const [activeVisualizer, setActiveVisualizer] = React.useState<'3d' | 'map'>('3d');

  // KPI Calculations
  const totalCrew = employees.length;
  const onSeaCrew = employees.filter(e => e.status === 'on_sea').length;
  const onDutyCrew = employees.filter(e => e.status === 'on_duty' || e.status === 'available').length;
  const vesselsAtSea = boats.filter(b => b.status === 'at_sea').length;
  const vesselsDocked = boats.filter(b => b.status === 'docked').length;
  const pendingCorrections = attendance.filter(a => a.correctionRequest?.status === 'pending');
  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const activeTripsCount = trips.filter(t => t.status === 'in_progress').length;

  // Analytics Chart Data
  const weeklyTripData = [
    { day: 'Mon', trips: 3, catchKg: 120, fuelLiters: 210 },
    { day: 'Tue', trips: 4, catchKg: 240, fuelLiters: 320 },
    { day: 'Wed', trips: 2, catchKg: 85, fuelLiters: 160 },
    { day: 'Thu', trips: 5, catchKg: 310, fuelLiters: 390 },
    { day: 'Fri', trips: 6, catchKg: 420, fuelLiters: 480 },
    { day: 'Sat', trips: 7, catchKg: 490, fuelLiters: 520 },
    { day: 'Sun', trips: 4, catchKg: 290, fuelLiters: 340 },
  ];

  const attendanceData = [
    { role: 'Skippers', present: 4, target: 5 },
    { role: 'First Mates', present: 3, target: 3 },
    { role: 'Engineers', present: 2, target: 2 },
    { role: 'Deckhands', present: 4, target: 5 },
    { role: 'Marina Staff', present: 3, target: 3 },
  ];

  return (
    <div className="space-y-6">
      {/* Marine Weather Live Bar */}
      <MarineWeatherWidget />

      {/* KPI Cards Strip (Universal Responsive Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* Total Crew */}
        <div 
          onClick={() => onNavigate('employees')}
          className="marine-card p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer marine-card-hover text-white flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 sm:mb-2">
            <span className="truncate">Navlakhi Crew</span>
            <Users className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
            {totalCrew}
          </div>
          <div className="text-[10px] sm:text-[11px] text-cyan-300 mt-1 flex items-center gap-1">
            <span>{onSeaCrew} sea · {onDutyCrew} duty</span>
          </div>
        </div>

        {/* Fleet Status */}
        <div 
          onClick={() => onNavigate('boats')}
          className="marine-card p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer marine-card-hover text-white flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 sm:mb-2">
            <span className="truncate">Port Fleet</span>
            <Ship className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
            {boats.length}
          </div>
          <div className="text-[10px] sm:text-[11px] text-emerald-300 mt-1 flex items-center gap-1">
            <span>{vesselsAtSea} underway · {vesselsDocked} docked</span>
          </div>
        </div>

        {/* Active Voyages */}
        <div className="marine-card p-3 sm:p-4 rounded-xl sm:rounded-2xl text-white flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 sm:mb-2">
            <span className="truncate">Active Trips</span>
            <Anchor className="w-4 h-4 text-cyan-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
            {activeTripsCount}
          </div>
          <div className="text-[10px] sm:text-[11px] text-cyan-300 mt-1 truncate">
            Tug Escort (Anchorage)
          </div>
        </div>

        {/* Pending Attendance Corrections */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="marine-card p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer marine-card-hover text-white border-amber-500/30 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 sm:mb-2">
            <span className="truncate">Corrections</span>
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300 tabular-nums">
            {pendingCorrections.length}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-300 mt-1">
            {pendingCorrections.length > 0 ? 'Action required' : 'All synced'}
          </div>
        </div>

        {/* Pending Leaves */}
        <div 
          onClick={() => onNavigate('leaves')}
          className="marine-card p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer marine-card-hover text-white col-span-2 sm:col-span-1 border-rose-500/30 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1 sm:mb-2">
            <span className="truncate">Leave Requests</span>
            <Calendar className="w-4 h-4 text-rose-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-300 tabular-nums">
            {pendingLeaves.length}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-300 mt-1">
            {pendingLeaves.length > 0 ? 'Pending sign-off' : 'Roster verified'}
          </div>
        </div>
      </div>

      {/* Visualizer Mode Toggle & Central Visualizer Viewport */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white font-display">
              Marina Basin & Fleet Live Operations
            </h2>
            <span className="text-xs text-slate-400">· Real-time interactive view</span>
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

      {/* Analytics & Attendance Split Grids */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Weekly Operations & Catch Haul Chart */}
        <div className="marine-card p-5 rounded-2xl text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Weekly Sea Voyages & Commercial Catch</h3>
              <p className="text-xs text-slate-400">Total catch weight (kg) across all fleet departures</p>
            </div>
            <div className="text-xs font-mono text-cyan-300 bg-[#063B5C] px-2.5 py-1 rounded-lg border border-white/10">
              Avg 4.8 Trips/Day
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTripData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCatch" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#27C5C1" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#27C5C1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#082F49', borderColor: '#27C5C1', borderRadius: '8px', color: '#fff' }} 
                />
                <Area type="monotone" dataKey="catchKg" stroke="#27C5C1" strokeWidth={2} fillOpacity={1} fill="url(#colorCatch)" name="Catch Weight (kg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crew Duty & Shift Distribution */}
        <div className="marine-card p-5 rounded-2xl text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">Departmental Staff Readiness</h3>
              <p className="text-xs text-slate-400">Personnel currently present vs roster requirement</p>
            </div>
            <div className="text-xs font-mono text-emerald-300 bg-[#063B5C] px-2.5 py-1 rounded-lg border border-white/10">
              92% Readiness
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="role" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#082F49', borderColor: '#36B99B', borderRadius: '8px', color: '#fff' }} 
                />
                <Bar dataKey="present" fill="#36B99B" radius={[4, 4, 0, 0]} name="Present on Shift" />
                <Bar dataKey="target" fill="#0A5C80" radius={[4, 4, 0, 0]} name="Required Roster" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
