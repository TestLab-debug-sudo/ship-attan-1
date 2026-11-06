import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, ShiftType, LeaveRequest, AttendanceStatus } from '../../types/marine.js';
import { api } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { exportEmployeeAttendanceToCSV, exportStationRosterMonthlyToCSV } from '../../utils/excelExport.js';
import { 
  Clock, CheckCircle, AlertCircle, Search, Filter, 
  LogIn, LogOut, FileEdit, X, ShieldAlert, MapPin, Users, Phone,
  Calendar, CalendarDays, CheckCircle2, ChevronRight, Briefcase,
  AlertTriangle, ArrowUpRight, Plane, Shield, Download, FileSpreadsheet,
  Check, UserCheck, Ship, ArrowRight, Eye, RefreshCw
} from 'lucide-react';

interface DailyAttendanceStationProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves?: LeaveRequest[];
  onRefresh: () => void;
}

const MARINA_ZONES = [
  'Navlakhi Main Tidal Jetty',
  'Lighterage Wharf Berth 1',
  'Lighterage Wharf Berth 2',
  'Navlakhi Pilot Station',
  'Port Dispatch & Signal Tower',
  'Marine Tug Berth A',
  'Navlakhi Anchorage Zone',
  'Morbi Coastal Channel'
];

export const DailyAttendanceStation: React.FC<DailyAttendanceStationProps> = ({
  employees,
  attendance,
  leaves = [],
  onRefresh
}) => {
  const { language, t } = useLanguage();
  const isTa = language === 'ta';

  // Station Navigation Tabs
  const [stationTab, setStationTab] = useState<'individual_ledger' | 'daily_desk' | 'all_roster'>('individual_ledger');
  
  // Date selection for daily marking
  const todayStr = new Date().toISOString().split('T')[0];
  const [markingDate, setMarkingDate] = useState<string>(todayStr);
  const [selectedZone, setSelectedZone] = useState<string>(MARINA_ZONES[0]);

  // Selected employee for deep historical timeline & Excel export
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || 'emp-008'); // defaults to Kalyan Shukla or first emp
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState('');

  // Marking Modal / Drawer
  const [markModalTarget, setMarkModalTarget] = useState<Employee | null>(null);
  const [markFormData, setMarkFormData] = useState<{
    status: AttendanceStatus;
    clockIn: string;
    clockOut: string;
    marinaZone: string;
    notes: string;
  }>({
    status: 'present',
    clockIn: '06:00 AM',
    clockOut: '04:30 PM',
    marinaZone: MARINA_ZONES[0],
    notes: ''
  });

  // Correction Modal State
  const [correctionTarget, setCorrectionTarget] = useState<AttendanceRecord | null>(null);
  const [correctionData, setCorrectionData] = useState({
    requestedClockIn: '06:00 AM',
    requestedClockOut: '04:30 PM',
    reason: ''
  });
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Quick lookup helper for attendance records by employee + date
  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId) || employees[0];
  }, [employees, selectedEmpId]);

  // Months list since joining date for dropdown
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    monthsSet.add('2026-11');
    monthsSet.add('2026-10');
    monthsSet.add('2026-09');
    monthsSet.add('2026-08');
    monthsSet.add('2026-07');
    monthsSet.add('2026-06');
    monthsSet.add('2026-05');
    monthsSet.add('2026-04');
    return Array.from(monthsSet);
  }, []);

  // Compute metrics for any employee
  const getEmployeeStats = (emp: Employee) => {
    let serviceDays = 0;
    if (emp.joinedDate) {
      const join = new Date(emp.joinedDate);
      const now = new Date();
      serviceDays = Math.max(1, Math.floor((now.getTime() - join.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const empLeaves = leaves.filter(
      l => (l.employeeId === emp.id || l.employeeCode === emp.employeeCode) && l.status === 'approved'
    );
    const totalLeaveDays = empLeaves.reduce((sum, l) => sum + (l.totalDays || 0), 0);
    const daysWorked = Math.max(1, serviceDays - totalLeaveDays);

    const currentLeave = empLeaves.find(l => todayStr >= l.startDate && todayStr <= l.endDate);
    const isCurrentlyOnLeave = !!currentLeave || emp.status === 'on_leave';

    // Historical records from attendance
    const empAttendance = attendance.filter(a => a.employeeId === emp.id);
    const presentRecordsCount = empAttendance.filter(a => a.status === 'present').length;
    const seaRecordsCount = empAttendance.filter(a => a.status === 'on_sea').length;
    const leaveRecordsCount = empAttendance.filter(a => a.status === 'leave').length;

    return {
      serviceDays,
      daysWorked,
      totalLeaveDays,
      currentLeave,
      isCurrentlyOnLeave,
      empLeaves,
      empAttendance,
      presentRecordsCount,
      seaRecordsCount,
      leaveRecordsCount
    };
  };

  // Selected employee's filtered records
  const filteredPersonalRecords = useMemo(() => {
    if (!selectedEmployee) return [];
    let records = attendance.filter(a => a.employeeId === selectedEmployee.id);
    
    if (selectedMonth && selectedMonth !== 'all') {
      records = records.filter(a => a.date.startsWith(selectedMonth));
    }
    
    // Sort descending by date
    return records.sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, selectedEmployee, selectedMonth]);

  // Handle Mark Attendance Action
  const handleOpenMarkModal = (emp: Employee) => {
    const existing = attendance.find(a => a.employeeId === emp.id && a.date === markingDate);
    setMarkModalTarget(emp);
    setMarkFormData({
      status: existing?.status || (emp.status === 'on_leave' ? 'leave' : 'present'),
      clockIn: existing?.clockIn || '06:00 AM',
      clockOut: existing?.clockOut || '04:30 PM',
      marinaZone: existing?.marinaZone || selectedZone,
      notes: ''
    });
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!markModalTarget) return;

    setIsProcessing(markModalTarget.id);
    try {
      await api.markAttendance({
        employeeId: markModalTarget.id,
        date: markingDate,
        status: markFormData.status,
        clockIn: markFormData.status === 'leave' || markFormData.status === 'absent' ? undefined : markFormData.clockIn,
        clockOut: markFormData.status === 'leave' || markFormData.status === 'absent' ? undefined : markFormData.clockOut,
        marinaZone: markFormData.status === 'leave' ? 'Approved Leave' : markFormData.marinaZone,
        notes: markFormData.notes
      });

      setActionNotice(`${markModalTarget.name} - ${markingDate} ${isTa ? 'அட்டனன்ஸ் வெற்றிகரமாக பதிவு செய்யப்பட்டது!' : 'Attendance saved!'}`);
      setTimeout(() => setActionNotice(null), 4000);
      setMarkModalTarget(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error saving attendance');
    } finally {
      setIsProcessing(null);
    }
  };

  // Handle Timecard Correction Submission to Admin
  const handleOpenCorrection = (emp: Employee, existingRecord?: AttendanceRecord) => {
    const rec = existingRecord || {
      id: `att-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      employeeCode: emp.employeeCode,
      role: emp.role,
      date: markingDate,
      status: 'late',
      marinaZone: selectedZone
    };
    setCorrectionTarget(rec);
    setCorrectionData({
      requestedClockIn: rec.clockIn || '06:00 AM',
      requestedClockOut: rec.clockOut || '04:30 PM',
      reason: ''
    });
    setCorrectionError(null);
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionTarget || !correctionData.reason.trim()) {
      setCorrectionError(isTa ? 'அட்மினுக்கு திருத்த காரணத்தை விளக்கமாக குறிப்பிடவும்.' : 'Please provide justification for Admin.');
      return;
    }
    try {
      await api.requestAttendanceCorrection(
        correctionTarget.id,
        correctionData.requestedClockIn,
        correctionData.requestedClockOut,
        correctionData.reason.trim()
      );
      setActionNotice(isTa ? 'திருத்த கோரிக்கை அட்மின் ஒப்புதலுக்கு அனுப்பப்பட்டது!' : 'Correction sent to Admin for approval!');
      setTimeout(() => setActionNotice(null), 4000);
      setCorrectionTarget(null);
      onRefresh();
    } catch (err: any) {
      setCorrectionError(err.message || 'Error submitting correction request');
    }
  };

  // Quick Clock In/Out for Today
  const handleQuickClock = async (employeeId: string, action: 'clock_in' | 'clock_out') => {
    setIsProcessing(employeeId);
    try {
      await api.clockEmployee(employeeId, action, selectedZone);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Clock action failed');
    } finally {
      setIsProcessing(null);
    }
  };

  // Excel Downloads
  const handleDownloadPersonalExcel = () => {
    if (!selectedEmployee) return;
    const stats = getEmployeeStats(selectedEmployee);
    exportEmployeeAttendanceToCSV({
      employee: selectedEmployee,
      records: filteredPersonalRecords,
      daysWorked: stats.daysWorked,
      totalLeaveDays: stats.totalLeaveDays,
      selectedMonth
    });
  };

  const handleDownloadAllRosterExcel = () => {
    exportStationRosterMonthlyToCSV(
      employees,
      attendance,
      leaves,
      selectedMonth === 'all' ? '2026-11' : selectedMonth
    );
  };

  const selectedStats = selectedEmployee ? getEmployeeStats(selectedEmployee) : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Toast Alert Notice */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Main Mode Navigation */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-bold text-white font-display">
              {isTa ? 'நாவலாகி துறைமுக வருகை & விடுப்பு கட்டுப்பாட்டகம்' : 'Navlakhi Port Attendance & Leave Operations'}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
              STCW 95 Compliant
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
            {isTa 
              ? 'மேனேஜர் டெய்லி அட்டனன்ஸ் பதிவு, தனிநபர் சேர்ந்த நாளில் இருந்து வந்த & விடுப்பு நாட்கள் லெட்ஜர், மற்றும் எக்ஸெல் டவுன்லோட்.'
              : 'Daily attendance dispatch, historical personnel service & leave ledger, and Excel sheet exports.'}
          </p>
        </div>

        {/* 3 Main Action Modes */}
        <div className="flex items-center gap-1 bg-[#082F49] p-1 rounded-xl border border-white/10 w-full lg:w-auto overflow-x-auto scrollbar-none">
          <button
            onClick={() => setStationTab('individual_ledger')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center justify-center gap-2 touch-target-min ${
              stationTab === 'individual_ledger'
                ? 'bg-[#27C5C1] text-[#063B5C] font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-4 h-4 shrink-0" />
            <span>{isTa ? 'தனிநபர் வரலாறு & லெட்ஜர்' : 'Individual Crew Ledger'}</span>
          </button>

          <button
            onClick={() => setStationTab('daily_desk')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center justify-center gap-2 touch-target-min ${
              stationTab === 'daily_desk'
                ? 'bg-[#27C5C1] text-[#063B5C] font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{isTa ? 'டெய்லி அட்டனன்ஸ் போடு' : 'Mark Daily Attendance'}</span>
          </button>

          <button
            onClick={() => setStationTab('all_roster')}
            className={`flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center justify-center gap-2 touch-target-min ${
              stationTab === 'all_roster'
                ? 'bg-[#27C5C1] text-[#063B5C] font-bold shadow-md shadow-cyan-500/20'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>{isTa ? 'அனைத்து 14 பணியாளர்கள்' : '14 Crew Master Roster'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: INDIVIDUAL CREW LEDGER (தனிநபர் சேர்ந்த நாளில் இருந்து வந்த/லீவ் நாட்கள்) */}
      {/* ========================================================================= */}
      {stationTab === 'individual_ledger' && selectedEmployee && selectedStats && (
        <div className="space-y-4">
          {/* Controls: Employee Selector + Month Filter + Excel Export Button */}
          <div className="marine-card p-4 rounded-2xl border border-white/10 text-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Employee Selector Dropdown */}
            <div className="flex-1 min-w-[240px]">
              <label className="block text-[11px] font-mono text-cyan-300 mb-1">
                {isTa ? 'பணியாளரைத் தேர்ந்தெடுக்கவும் (Select Crew Member):' : 'Select Crew Member:'}
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full bg-[#063B5C] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#27C5C1]"
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employeeCode}) - {emp.role.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter Dropdown */}
            <div className="w-full sm:w-auto min-w-[180px]">
              <label className="block text-[11px] font-mono text-cyan-300 mb-1">
                {isTa ? 'மாத வாரியாக பார் (Filter by Month):' : 'Filter by Month:'}
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-[#063B5C] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#27C5C1]"
              >
                <option value="all">{isTa ? 'சேர்ந்த நாளில் இருந்து (All Time)' : 'All Time (Since Joining)'}</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>
                    {m === '2026-11' ? (isTa ? 'நவம்பர் 2026 (Nov 2026)' : 'November 2026') :
                     m === '2026-10' ? (isTa ? 'அக்டோபர் 2026 (Oct 2026)' : 'October 2026') :
                     m === '2026-09' ? (isTa ? 'செப்டம்பர் 2026 (Sep 2026)' : 'September 2026') :
                     m === '2026-08' ? (isTa ? 'ஆகஸ்ட் 2026 (Aug 2026)' : 'August 2026') :
                     m === '2026-07' ? (isTa ? 'ஜூலை 2026 (Jul 2026)' : 'July 2026') :
                     m === '2026-06' ? (isTa ? 'ஜூன் 2026 (Jun 2026)' : 'June 2026') :
                     m === '2026-05' ? (isTa ? 'மே 2026 (May 2026)' : 'May 2026') :
                     (isTa ? 'ஏப்ரல் 2026 (Apr 2026)' : 'April 2026')}
                  </option>
                ))}
              </select>
            </div>

            {/* Green Excel Download Button */}
            <div className="flex items-end">
              <button
                onClick={handleDownloadPersonalExcel}
                className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 touch-target-min whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>{isTa ? 'எக்ஸெல் டவுன்லோட் (.xlsx / .csv)' : 'Download Excel (.xlsx / .csv)'}</span>
              </button>
            </div>
          </div>

          {/* Personal Summary Hero Card (சேர்ந்த நாளில் இருந்து கணக்கு) */}
          <div className="marine-card p-4 sm:p-6 rounded-2xl border border-cyan-500/20 text-white space-y-4 shadow-xl">
            {/* Top Identity Row */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#27C5C1] to-[#063B5C] flex items-center justify-center text-white text-base font-bold border border-cyan-300/30">
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white">{selectedEmployee.name}</h3>
                    <span className="text-xs text-cyan-300 font-mono px-2 py-0.5 rounded bg-[#063B5C] border border-cyan-500/30">
                      {selectedEmployee.employeeCode}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                    <span className="capitalize font-semibold text-slate-200">{selectedEmployee.role.replace('_', ' ')}</span>
                    <span>·</span>
                    <span className="text-cyan-300 font-mono">{selectedEmployee.station || 'Navlakhi Port'}</span>
                    <span>·</span>
                    <a href={`tel:${selectedEmployee.phone}`} className="text-cyan-400 font-mono flex items-center gap-1 hover:underline">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedEmployee.phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="text-right">
                <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider inline-block ${
                  selectedStats.isCurrentlyOnLeave
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {selectedStats.isCurrentlyOnLeave 
                    ? (isTa ? 'தற்சமயம் விடுப்பில் உள்ளார்' : 'On Approved Leave') 
                    : (isTa ? 'பணியில் உள்ளார் (On Duty)' : 'On Duty')}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block mt-1">
                  {selectedStats.currentLeave 
                    ? `${isTa ? 'திரும்பும் தேதி:' : 'Expected Return:'} ${selectedStats.currentLeave.endDate}` 
                    : `${isTa ? 'நாவலாகி தளம்' : 'Navlakhi Base'}`}
                </span>
              </div>
            </div>

            {/* 4 Separate Key Metric Boxes (வந்த நாட்கள், லீவு நாட்கள், பணிக்காலம்) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
              {/* Box 1: Joined Date */}
              <div className="p-3.5 rounded-xl bg-[#063B5C] border border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-sans block">
                  {isTa ? 'பணியில் சேர்ந்த தேதி' : 'Date of Joining'}
                </span>
                <div className="text-base sm:text-lg font-bold text-white">
                  {selectedEmployee.joinedDate}
                </div>
                <span className="text-[10px] text-cyan-300 font-sans block">
                  {selectedStats.serviceDays} {isTa ? 'நாட்கள் பணிக்காலம்' : 'Days Tenure'}
                </span>
              </div>

              {/* Box 2: Total Days Worked (வந்த நாட்கள்) */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                <span className="text-[10px] text-emerald-400 uppercase font-sans block font-semibold">
                  {isTa ? 'வந்த நாட்கள் (Duty Days)' : 'Days Worked (Present)'}
                </span>
                <div className="text-xl sm:text-2xl font-bold text-emerald-300">
                  {selectedStats.daysWorked} {isTa ? 'நாட்கள்' : 'Days'}
                </div>
                <span className="text-[10px] text-slate-300 font-sans block">
                  {selectedEmployee.totalTripsLogged || selectedStats.presentRecordsCount} {isTa ? 'ஷிப்ட்கள் / பயணங்கள்' : 'Shifts Logged'}
                </span>
              </div>

              {/* Box 3: Total Leaves Taken (எடுத்த லீவ்) */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                <span className="text-[10px] text-amber-300 uppercase font-sans block font-semibold">
                  {isTa ? 'எடுத்த லீவ் (Leaves Taken)' : 'Leaves Taken'}
                </span>
                <div className="text-xl sm:text-2xl font-bold text-amber-300">
                  {selectedStats.totalLeaveDays} {isTa ? 'நாட்கள்' : 'Days'}
                </div>
                <span className="text-[10px] text-slate-300 font-sans block">
                  {selectedStats.empLeaves.length} {isTa ? 'முறை விடுப்பு பதிவு' : 'Approved Leave Windows'}
                </span>
              </div>

              {/* Box 4: Current Reporting Date */}
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-1">
                <span className="text-[10px] text-cyan-300 uppercase font-sans block font-semibold">
                  {isTa ? 'பணிக்கு திரும்பும் தேதி' : 'Expected Return Date'}
                </span>
                <div className="text-base sm:text-lg font-bold text-cyan-200 truncate">
                  {selectedStats.currentLeave ? selectedStats.currentLeave.endDate : (isTa ? 'பணியில் உள்ளார்' : 'Resumed Duty')}
                </div>
                <span className="text-[10px] text-slate-300 font-sans block truncate">
                  {selectedStats.currentLeave ? `${selectedStats.currentLeave.totalDays}d leave` : 'Active on Watch'}
                </span>
              </div>
            </div>

            {/* Approved Leave Windows for this Employee */}
            {selectedStats.empLeaves.length > 0 && (
              <div className="p-3 rounded-xl bg-[#063B5C]/70 border border-white/5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <Calendar className="w-4 h-4" />
                  <span>{isTa ? 'அங்கீகரிக்கப்பட்ட விடுப்பு விவரங்கள் (Approved Leave History):' : 'Approved Leave Windows:'}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 font-mono">
                  {selectedStats.empLeaves.map(l => (
                    <div key={l.id} className="p-2.5 rounded-lg bg-[#082F49] border border-cyan-500/20 text-[11px] flex items-center justify-between">
                      <div>
                        <span className="text-white font-bold block">{l.startDate} முதல் {l.endDate} வரை</span>
                        <span className="text-slate-400 text-[10px] font-sans">{l.reason}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                        {l.totalDays} {isTa ? 'நாட்கள்' : 'Days'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date-by-Date Attendance Table for Selected Person */}
          <div className="marine-card rounded-2xl overflow-hidden border border-white/10 text-white">
            <div className="p-4 bg-[#063B5C] border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-cyan-400" />
                <h4 className="font-bold text-xs sm:text-sm text-white">
                  {selectedEmployee.name} - {isTa ? 'தினசரி வருகை பதிவு பட்டியல்' : 'Daily Attendance History'}
                </h4>
                <span className="text-xs text-slate-400 font-mono">
                  ({filteredPersonalRecords.length} {isTa ? 'நாட்கள்' : 'Days'})
                </span>
              </div>

              <button
                onClick={handleDownloadPersonalExcel}
                className="text-xs text-emerald-300 hover:text-emerald-200 flex items-center gap-1.5 font-bold"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isTa ? 'இந்த பட்டியலை எக்ஸெல் ஆக டவுன்லோட் செய்' : 'Export Table to Excel'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#052840] text-slate-400 uppercase font-mono text-[11px] border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">{isTa ? 'தேதி (Date)' : 'Date'}</th>
                    <th className="px-4 py-3">{isTa ? 'கிழமை' : 'Day'}</th>
                    <th className="px-4 py-3">{isTa ? 'வருகை நிலை (Status)' : 'Status'}</th>
                    <th className="px-4 py-3">{isTa ? 'உள் வருகை (In)' : 'Clock In'}</th>
                    <th className="px-4 py-3">{isTa ? 'வெளிச் செல்லல் (Out)' : 'Clock Out'}</th>
                    <th className="px-4 py-3">{isTa ? 'பணி தளம் / இடம்' : 'Marina Zone / Vessel'}</th>
                    <th className="px-4 py-3">{isTa ? 'நேரம் (Hours)' : 'Hours'}</th>
                    <th className="px-4 py-3 text-right">{isTa ? 'திருத்தம் (Action)' : 'Correction'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {filteredPersonalRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400 font-sans italic">
                        {isTa ? 'தேர்ந்தெடுக்கப்பட்ட மாதத்தில் பதிவுகள் இல்லை.' : 'No records found for the selected month.'}
                      </td>
                    </tr>
                  ) : (
                    filteredPersonalRecords.map(rec => {
                      const d = new Date(rec.date);
                      const dayName = isNaN(d.getTime()) ? '' : d.toLocaleDateString(isTa ? 'ta-IN' : 'en-US', { weekday: 'short' });
                      const hasPending = rec.correctionRequest?.status === 'pending';

                      return (
                        <tr key={rec.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 font-bold text-white">{rec.date}</td>
                          <td className="px-4 py-3 text-slate-400">{dayName}</td>
                          <td className="px-4 py-3 font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block ${
                              rec.status === 'present'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : rec.status === 'on_sea'
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                                : rec.status === 'leave'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}>
                              {rec.status === 'present' ? (isTa ? 'வந்தார்' : 'Present') :
                               rec.status === 'leave' ? (isTa ? 'விடுப்பு' : 'Leave') :
                               rec.status === 'on_sea' ? (isTa ? 'கடல் பணி' : 'On Sea') : rec.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-emerald-300">{rec.clockIn || '--:--'}</td>
                          <td className="px-4 py-3 text-cyan-300">{rec.clockOut || '--:--'}</td>
                          <td className="px-4 py-3 text-slate-300 font-sans text-[11px] truncate max-w-[200px]">
                            {rec.marinaZone || 'Navlakhi Base'}
                          </td>
                          <td className="px-4 py-3 text-slate-300">{rec.hoursWorked ? `${rec.hoursWorked}h` : '8.0h'}</td>
                          <td className="px-4 py-3 text-right font-sans">
                            <button
                              onClick={() => handleOpenCorrection(selectedEmployee, rec)}
                              className={`p-1.5 rounded-lg border transition-colors inline-flex items-center gap-1 text-[11px] ${
                                hasPending 
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                                  : 'text-slate-400 hover:text-white hover:bg-white/10 border-transparent'
                              }`}
                              title={isTa ? 'அட்மினுக்கு திருத்தம் கோரு' : 'Submit Correction to Admin'}
                            >
                              <FileEdit className="w-3.5 h-3.5" />
                              <span>{hasPending ? (isTa ? 'காத்திருக்கிறது' : 'Pending') : (isTa ? 'திருத்து' : 'Edit')}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: DAILY ATTENDANCE MARKING DESK (மேனேஜர் டெய்லி அட்டனன்ஸ் போடுமிடம்) */}
      {/* ========================================================================= */}
      {stationTab === 'daily_desk' && (
        <div className="space-y-4">
          {/* Date Picker Bar & Marina Zone */}
          <div className="marine-card p-4 rounded-2xl border border-white/10 text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[11px] font-mono text-cyan-300 uppercase block">
                  {isTa ? 'அட்டனன்ஸ் தேதி (Select Date to Mark):' : 'Marking Date:'}
                </span>
                <input
                  type="date"
                  value={markingDate}
                  onChange={(e) => setMarkingDate(e.target.value)}
                  className="bg-[#063B5C] border border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#27C5C1]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#27C5C1] shrink-0" />
              <div>
                <span className="text-[11px] font-mono text-cyan-300 uppercase block">
                  {isTa ? 'பணி தளம் (Marina Pier Zone):' : 'Current Zone:'}
                </span>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="bg-[#063B5C] font-semibold text-cyan-200 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                >
                  {MARINA_ZONES.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Crew Members Marking Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {employees.map(emp => {
              const rec = attendance.find(a => a.employeeId === emp.id && a.date === markingDate);
              const stats = getEmployeeStats(emp);
              const isLeave = rec?.status === 'leave' || (!rec && stats.isCurrentlyOnLeave);

              return (
                <div 
                  key={emp.id}
                  className="marine-card p-4 rounded-2xl border border-white/10 text-white space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{emp.name}</span>
                          <span className="text-[10px] text-cyan-300 font-mono">({emp.employeeCode})</span>
                        </div>
                        <span className="text-xs text-slate-400 capitalize block mt-0.5">
                          {emp.role.replace('_', ' ')} · {emp.phone}
                        </span>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        rec?.status === 'present'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : rec?.status === 'on_sea'
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : isLeave
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-500/20 text-slate-400 border border-white/10'
                      }`}>
                        {rec?.status || (isLeave ? 'leave' : 'unmarked')}
                      </span>
                    </div>

                    {/* Status & Times */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#063B5C]/70 rounded-xl text-xs font-mono my-2.5">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">{isTa ? 'உள் வருகை' : 'In'}</span>
                        <span className="text-emerald-300 font-bold">{rec?.clockIn || '--:--'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">{isTa ? 'வெளிச் செல்லல்' : 'Out'}</span>
                        <span className="text-cyan-300 font-bold">{rec?.clockOut || '--:--'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Mark Status or Correction */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleOpenMarkModal(emp)}
                      disabled={isProcessing === emp.id}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#27C5C1] hover:bg-[#36B99B] text-[#063B5C] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 touch-target-min"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isTa ? 'அட்டனன்ஸ் போடு' : 'Mark Attendance'}</span>
                    </button>

                    <button
                      onClick={() => handleOpenCorrection(emp, rec)}
                      title={isTa ? 'அட்மினுக்கு திருத்தம் கோரு' : 'Submit Timecard Correction to Admin'}
                      className="p-2 rounded-xl bg-[#063B5C] hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
                    >
                      <FileEdit className="w-4 h-4 text-amber-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: ALL 14 CREW MASTER ROSTER (அனைத்து பணியாளர்கள் மாதாந்திர லெட்ஜர்) */}
      {/* ========================================================================= */}
      {stationTab === 'all_roster' && (
        <div className="space-y-4">
          <div className="marine-card p-4 rounded-2xl border border-white/10 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                {isTa ? 'நாவலாகி நிலைய 14 பணியாளர்கள் மாதாந்திர அறிக்கை' : '14 Navlakhi Personnel Fleet Master Roster'}
              </h3>
              <p className="text-xs text-slate-300">
                {isTa ? 'வந்த நாட்கள், எடுத்த விடுப்பு நாட்கள் மற்றும் பணிக்கு திரும்பும் தேதி.' : 'Duty days, leaves taken, and reporting dates summary.'}
              </p>
            </div>

            <button
              onClick={handleDownloadAllRosterExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 touch-target-min whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>{isTa ? 'முழு Roster எக்ஸெல் டவுன்லோட்' : 'Download Complete Fleet Excel Sheet'}</span>
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="marine-card rounded-2xl overflow-hidden border border-white/10 text-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#063B5C] text-slate-400 uppercase font-mono text-[11px] border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">{isTa ? 'பணியாளர் (Crew)' : 'Crew Member'}</th>
                    <th className="px-4 py-3">{isTa ? 'பதவி' : 'Role'}</th>
                    <th className="px-4 py-3">{isTa ? 'சேர்ந்த தேதி' : 'Joined'}</th>
                    <th className="px-4 py-3 text-center">{isTa ? 'வந்த நாட்கள்' : 'Days Worked'}</th>
                    <th className="px-4 py-3 text-center">{isTa ? 'எடுத்த லீவ்' : 'Leaves Taken'}</th>
                    <th className="px-4 py-3">{isTa ? 'விடுப்பு நிலை & திரும்பும் தேதி' : 'Leave Remarks'}</th>
                    <th className="px-4 py-3 text-right">{isTa ? 'நடவடிக்கை' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {employees.map(emp => {
                    const stats = getEmployeeStats(emp);
                    return (
                      <tr key={emp.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-white">
                          <div className="flex items-center gap-2">
                            <span>{emp.name}</span>
                            <span className="text-[10px] text-cyan-300 font-mono">({emp.employeeCode})</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 capitalize text-slate-300">{emp.role.replace('_', ' ')}</td>
                        <td className="px-4 py-3.5 text-slate-400 font-mono">{emp.joinedDate}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold font-mono">
                            {stats.daysWorked} {isTa ? 'நாட்கள்' : 'Days'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-lg font-bold font-mono border ${
                            stats.totalLeaveDays > 0 ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-white/5 text-slate-400 border-white/5'
                          }`}>
                            {stats.totalLeaveDays} {isTa ? 'நாட்கள்' : 'Days'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[11px]">
                          {stats.currentLeave ? (
                            <div className="text-amber-300 font-bold">
                              <span>{isTa ? 'தற்சமயம் விடுப்பில் உள்ளார்' : 'On Leave'} ({stats.currentLeave.totalDays}d)</span>
                              <span className="text-[10px] text-cyan-300 font-mono block">
                                {isTa ? 'திரும்பும் தேதி:' : 'Return:'} {stats.currentLeave.endDate}
                              </span>
                            </div>
                          ) : stats.totalLeaveDays > 0 ? (
                            <span className="text-emerald-400 font-medium">
                              {isTa ? 'விடுப்பு முடிந்து பணியில் உள்ளார்' : 'Resumed Duty'}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">{isTa ? 'விடுப்பு எடுக்கவில்லை' : 'No Leaves'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedEmpId(emp.id);
                              setStationTab('individual_ledger');
                            }}
                            className="text-xs bg-[#063B5C] hover:bg-[#082F49] text-cyan-300 px-3 py-1.5 rounded-lg border border-cyan-500/30 font-semibold inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isTa ? 'முழு லெட்ஜர்' : 'View Ledger'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: MARK ATTENDANCE MODAL (PRESENT / LEAVE / ON SEA) */}
      {/* ========================================================================= */}
      {markModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="marine-card max-w-md w-full p-6 rounded-2xl border border-cyan-500/30 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#27C5C1]" />
                  <span>{isTa ? 'அட்டனன்ஸ் பதிவு செய்க' : 'Record Attendance'}</span>
                </h3>
                <span className="text-xs text-slate-300">
                  {markModalTarget.name} ({markModalTarget.employeeCode}) · {markingDate}
                </span>
              </div>
              <button
                onClick={() => setMarkModalTarget(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="space-y-4 text-xs">
              {/* Status Radio / Select: Present / Leave / On Sea / Absent */}
              <div>
                <label className="block text-slate-300 mb-1 font-bold">
                  {isTa ? 'வருகை நிலை (Attendance Status):' : 'Status:'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMarkFormData({ ...markFormData, status: 'present' })}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border ${
                      markFormData.status === 'present'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                        : 'bg-[#063B5C] text-slate-300 border-white/10'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>{isTa ? 'வந்தார் (Present)' : 'Present'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMarkFormData({ ...markFormData, status: 'leave' })}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border ${
                      markFormData.status === 'leave'
                        ? 'bg-rose-500 text-white border-rose-400'
                        : 'bg-[#063B5C] text-slate-300 border-white/10'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{isTa ? 'விடுப்பு (Leave)' : 'Leave'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMarkFormData({ ...markFormData, status: 'on_sea' })}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border ${
                      markFormData.status === 'on_sea'
                        ? 'bg-sky-500 text-slate-950 border-sky-400'
                        : 'bg-[#063B5C] text-slate-300 border-white/10'
                    }`}
                  >
                    <Ship className="w-4 h-4" />
                    <span>{isTa ? 'கடல் பணி (On Sea)' : 'On Sea'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMarkFormData({ ...markFormData, status: 'late' })}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border ${
                      markFormData.status === 'late'
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-[#063B5C] text-slate-300 border-white/10'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>{isTa ? 'தாமதம் (Late)' : 'Late'}</span>
                  </button>
                </div>
              </div>

              {/* Show Clock In/Out only if Present or On Sea */}
              {markFormData.status !== 'leave' && markFormData.status !== 'absent' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1">{isTa ? 'உள் வருகை நேரம்' : 'Clock In'}</label>
                    <input
                      type="text"
                      value={markFormData.clockIn}
                      onChange={(e) => setMarkFormData({ ...markFormData, clockIn: e.target.value })}
                      placeholder="06:00 AM"
                      className="w-full bg-[#063B5C] border border-cyan-500/30 rounded-xl p-2.5 text-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1">{isTa ? 'வெளிச் செல்லல் நேரம்' : 'Clock Out'}</label>
                    <input
                      type="text"
                      value={markFormData.clockOut}
                      onChange={(e) => setMarkFormData({ ...markFormData, clockOut: e.target.value })}
                      placeholder="04:30 PM"
                      className="w-full bg-[#063B5C] border border-cyan-500/30 rounded-xl p-2.5 text-white font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Marina Zone */}
              <div>
                <label className="block text-slate-300 mb-1">{isTa ? 'பணி தளம் / இடம்' : 'Marina Pier / Location'}</label>
                <select
                  value={markFormData.marinaZone}
                  onChange={(e) => setMarkFormData({ ...markFormData, marinaZone: e.target.value })}
                  className="w-full bg-[#063B5C] border border-cyan-500/30 rounded-xl p-2.5 text-white font-semibold"
                >
                  {MARINA_ZONES.map(z => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>

              {/* Reason / Notes */}
              <div>
                <label className="block text-slate-300 mb-1">
                  {markFormData.status === 'leave' 
                    ? (isTa ? 'விடுப்பு காரணம் (Leave Reason):' : 'Leave Reason:') 
                    : (isTa ? 'குறிப்பு (Optional Notes):' : 'Optional Notes:')}
                </label>
                <input
                  type="text"
                  value={markFormData.notes}
                  onChange={(e) => setMarkFormData({ ...markFormData, notes: e.target.value })}
                  placeholder={markFormData.status === 'leave' ? (isTa ? 'சுழற்சி விடுப்பு / அவசர விடுப்பு' : 'Rotational leave') : (isTa ? 'வழக்கமான பணி' : 'Regular watch duty')}
                  className="w-full bg-[#063B5C] border border-cyan-500/30 rounded-xl p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setMarkModalTarget(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-semibold"
                >
                  {isTa ? 'ரத்து' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isProcessing === markModalTarget.id}
                  className="px-4 py-2 rounded-xl bg-[#27C5C1] hover:bg-[#36B99B] text-[#063B5C] font-bold shadow-lg flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isTa ? 'அட்டனன்ஸ் சேமி' : 'Save Attendance'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CORRECTION MODAL WITH MARITIME SAFETY WARNING FOR ADMIN */}
      {/* ========================================================================= */}
      {correctionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="marine-card max-w-md w-full p-6 rounded-2xl border border-amber-500/40 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <span>{isTa ? 'அட்மினுக்கு திருத்தம் கோருதல்' : 'Request Timecard Correction'}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {correctionTarget.employeeName} ({correctionTarget.employeeCode}) · {correctionTarget.date}
                </span>
              </div>
              <button
                onClick={() => setCorrectionTarget(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Crucial Maritime Safety Warning requested by user */}
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                {isTa ? 'முக்கிய கடல்சார் விதிமுறை எச்சரிக்கை:' : 'Maritime Safety Roster Notice:'}
              </span>
              <p className="leading-relaxed text-[11px]">
                {isTa 
                  ? 'இந்த திருத்தம் உடனடியாக அட்மின் ஒப்புதலுக்கு செல்லும். அட்மின் அனுமதி வழங்காமல் இந்த பணியாளரை கப்பல் பணிக்கோ அல்லது தளம் மாற்றத்திற்கோ அனுப்பக்கூடாது.'
                  : 'This correction will be forwarded to Station Admin. Official vessel allocation and watch assignments must not proceed without Admin approval.'}
              </p>
            </div>

            <form onSubmit={handleSubmitCorrection} className="space-y-4 text-xs">
              {correctionError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{correctionError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">{isTa ? 'திருத்தப்பட்ட In நேரம்' : 'Requested In'}</label>
                  <input
                    type="text"
                    value={correctionData.requestedClockIn}
                    onChange={(e) => setCorrectionData({ ...correctionData, requestedClockIn: e.target.value })}
                    placeholder="06:00 AM"
                    className="w-full bg-[#063B5C] border border-cyan-500/30 rounded-xl p-2.5 text-white font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">{isTa ? 'திருத்தப்பட்ட Out நேரம்' : 'Requested Out'}</label>
                  <input
                    type="text"
                    value={correctionData.requestedClockOut}
                    onChange={(e) => setCorrectionData({ ...correctionData, requestedClockOut: e.target.value })}
                    placeholder="04:30 PM"
                    className="w-full bg-[#063B5C] border border-cyan-500/30 rounded-xl p-2.5 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  {isTa ? 'அட்மினுக்கு விளக்கக் காரணம் (Justification for Admin):' : 'Justification for Admin:'}
                </label>
                <textarea
                  value={correctionData.reason}
                  onChange={(e) => setCorrectionData({ ...correctionData, reason: e.target.value })}
                  placeholder={isTa ? 'எ.கா: பைலட் படகு அவசரமாக புறப்பட்டதால் கியோஸ்க் வருகை பதிவு செய்ய தாமதம்.' : 'e.g. Employee departed on offshore pilot boat before kiosk was accessible.'}
                  className="w-full bg-[#063B5C] border border-cyan-500/30 rounded-xl p-2.5 text-white h-20 focus:outline-none focus:border-[#27C5C1]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setCorrectionTarget(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-semibold"
                >
                  {isTa ? 'ரத்து' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold shadow-lg"
                >
                  {isTa ? 'அட்மினுக்கு சமர்ப்பி' : 'Submit to Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
