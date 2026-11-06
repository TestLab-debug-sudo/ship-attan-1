import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { LanguageProvider, useLanguage } from './context/LanguageContext.js';
import { LoginView } from './components/auth/LoginView.js';
import { TopBar } from './components/navigation/TopBar.js';
import { AdminDashboard } from './components/admin/AdminDashboard.js';
import { EmployeeManagement } from './components/admin/EmployeeManagement.js';
import { BoatManagement } from './components/admin/BoatManagement.js';
import { AttendanceApprovals } from './components/admin/AttendanceApprovals.js';
import { LeaveManagement } from './components/admin/LeaveManagement.js';
import { ManagerAccounts } from './components/admin/ManagerAccounts.js';
import { DatabaseSettings } from './components/admin/DatabaseSettings.js';
import { ManagerDashboard } from './components/manager/ManagerDashboard.js';
import { DailyAttendanceStation } from './components/manager/DailyAttendanceStation.js';
import { TripDispatchCenter } from './components/manager/TripDispatchCenter.js';
import { Harbor3DScene } from './components/marine-3d/Harbor3DScene.js';
import { FleetLiveMap } from './components/operations/FleetLiveMap.js';
import { Employee, Boat, TripRecord, AttendanceRecord, LeaveRequest } from './types/marine.js';
import { api } from './services/api.js';
import { Anchor, Compass, Ship, Loader2, RefreshCw } from 'lucide-react';

const ADMIN_VIEWS = [
  { id: 'dashboard', label: 'Operations Overview' },
  { id: 'employees', label: 'Crew Personnel' },
  { id: 'boats', label: 'Fleet Registry' },
  { id: 'attendance', label: 'Attendance Approvals' },
  { id: 'leaves', label: 'Leave Quotas' },
  { id: 'managers', label: 'Manager Accounts' },
  { id: 'database', label: 'MongoDB & Cloud' }
];

const MANAGER_VIEWS = [
  { id: 'dashboard', label: 'Operations Console' },
  { id: 'attendance', label: 'Crew Attendance & Leaves' },
  { id: 'dispatch', label: 'Voyage Dispatch' },
  { id: 'harbor_3d', label: '3D Harbor Basin' },
  { id: 'fleet_radar', label: 'AIS Fleet Radar' }
];

const MainAppContent: React.FC = () => {
  const { user, role, isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');

  // Shared Central Datasets
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [boats, setBoats] = useState<Boat[]>([]);
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  const loadAllData = async () => {
    setIsDataLoading(true);
    try {
      const [empRes, boatRes, tripRes, attRes, levRes] = await Promise.all([
        api.getEmployees(),
        api.getBoats(),
        api.getTrips(),
        api.getAttendance(),
        api.getLeaves()
      ]);
      setEmployees(empRes.employees);
      setBoats(boatRes.boats);
      setTrips(tripRes.trips);
      setAttendance(attRes.attendance);
      setLeaves(levRes.leaves);
    } catch (e) {
      console.error('Failed to load maritime data:', e);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
      setCurrentView('dashboard');
    }
  }, [isAuthenticated, role]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#052840] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#27C5C1] animate-spin" />
          <span className="text-xs font-mono tracking-widest text-cyan-300 uppercase">
            Initializing Nautica Marine System...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const availableViews = role === 'admin' ? ADMIN_VIEWS : MANAGER_VIEWS;

  return (
    <div className="min-h-screen bg-[#052840] text-slate-100 flex flex-col relative overflow-x-hidden">
      {/* Subtle Animated Header Seagulls and Clouds */}
      <div className="absolute top-0 left-0 right-0 h-40 overflow-hidden pointer-events-none opacity-20 z-0">
        <div className="absolute top-6 left-10 text-cyan-200 animate-cloud-slow">
          <svg width="64" height="24" viewBox="0 0 64 24" fill="currentColor">
            <path d="M12 18 C6 18 2 14 2 10 C2 5 6 2 12 2 C15 2 18 4 20 6 C23 2 28 0 34 0 C42 0 48 6 48 13 C52 13 56 16 56 20 C56 22 54 24 51 24 L12 24 Z" />
          </svg>
        </div>
      </div>

      {/* Top Bar Navigation */}
      <TopBar
        currentView={currentView}
        onNavigate={setCurrentView}
        availableViews={availableViews}
      />

      {/* Main Workspace Viewport (Universal Adaptive Container) */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] w-full mx-auto p-3 sm:p-5 md:p-6 relative z-10">
        {role === 'admin' ? (
          <>
            {currentView === 'dashboard' && (
              <AdminDashboard
                employees={employees}
                boats={boats}
                trips={trips}
                attendance={attendance}
                leaves={leaves}
                onNavigate={setCurrentView}
              />
            )}
            {currentView === 'employees' && (
              <EmployeeManagement
                employees={employees}
                onRefresh={loadAllData}
              />
            )}
            {currentView === 'boats' && (
              <BoatManagement
                boats={boats}
                onRefresh={loadAllData}
              />
            )}
            {currentView === 'attendance' && (
              <AttendanceApprovals
                attendance={attendance}
                onRefresh={loadAllData}
              />
            )}
            {currentView === 'leaves' && (
              <LeaveManagement
                leaves={leaves}
                onRefresh={loadAllData}
              />
            )}
            {currentView === 'managers' && (
              <ManagerAccounts />
            )}
            {currentView === 'database' && (
              <DatabaseSettings />
            )}
          </>
        ) : (
          <>
            {currentView === 'dashboard' && (
              <ManagerDashboard
                employees={employees}
                boats={boats}
                trips={trips}
                attendance={attendance}
                leaves={leaves}
                onNavigate={setCurrentView}
                onRefresh={loadAllData}
              />
            )}
            {currentView === 'attendance' && (
              <DailyAttendanceStation
                employees={employees}
                attendance={attendance}
                leaves={leaves}
                onRefresh={loadAllData}
              />
            )}
            {currentView === 'dispatch' && (
              <TripDispatchCenter
                trips={trips}
                boats={boats}
                employees={employees}
                onRefresh={loadAllData}
              />
            )}
            {currentView === 'harbor_3d' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white font-display">
                    Interactive 3D Fleet Basin & Vessel Inspector
                  </h2>
                  <span className="text-xs text-cyan-300 font-mono">Real-time Three.js Rendering</span>
                </div>
                <Harbor3DScene boats={boats} />
              </div>
            )}
            {currentView === 'fleet_radar' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white font-display">
                    AIS Maritime Radar & Slip Geolocation
                  </h2>
                  <span className="text-xs text-cyan-300 font-mono">Biscayne Bay Coastal Grid</span>
                </div>
                <FleetLiveMap boats={boats} trips={trips} />
              </div>
            )}
          </>
        )}
      </main>

      {/* Atmospheric Marine Footer with Wave Graphic */}
      <footer className="mt-8 sm:mt-12 border-t border-cyan-500/10 bg-[#041F33] text-slate-400 text-xs py-5 sm:py-6 relative z-10 pb-safe">
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4 text-center md:text-left">
          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
            <Anchor className="w-4 h-4 text-[#27C5C1] shrink-0" />
            <span className="text-slate-300 font-medium">Nautica Marine Operations System</span>
            <span className="text-slate-500 hidden sm:inline">·</span>
            <span className="text-[11px] sm:text-xs">Navlakhi Station Commercial Operations</span>
          </div>

          <div className="flex items-center gap-3 text-[10px] sm:text-[11px] font-mono text-slate-400 flex-wrap justify-center">
            <span>Navlakhi Tidal Jetty</span>
            <span>·</span>
            <span>VHF Ch 16 / 68</span>
            <span>·</span>
            <span className="text-cyan-400">STCW 95 Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainAppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
