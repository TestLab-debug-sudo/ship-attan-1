import React, { useState } from 'react';
import { AttendanceRecord } from '../../types/marine.js';
import { api } from '../../services/api.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { 
  Clock, CheckCircle2, XCircle, AlertCircle, Calendar, 
  User, Check, X, MessageSquare, History, AlertTriangle, ShieldCheck, Ship 
} from 'lucide-react';

interface AttendanceApprovalsProps {
  attendance: AttendanceRecord[];
  onRefresh: () => void;
}

export const AttendanceApprovals: React.FC<AttendanceApprovalsProps> = ({
  attendance,
  onRefresh
}) => {
  const { language } = useLanguage();
  const isTa = language === 'ta';
  const [filterTab, setFilterTab] = useState<'pending' | 'reviewed' | 'all_records'>('pending');
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Separate records with correction requests
  const correctionRecords = attendance.filter(a => a.correctionRequest);
  const pendingCorrections = correctionRecords.filter(a => a.correctionRequest?.status === 'pending');
  const reviewedCorrections = correctionRecords.filter(a => a.correctionRequest?.status !== 'pending');

  const handleReview = async (attendanceId: string, decision: 'approved' | 'rejected') => {
    setIsProcessing(attendanceId);
    try {
      const note = adminNote[attendanceId] || '';
      await api.reviewAttendanceCorrection(attendanceId, decision, note);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error reviewing attendance correction');
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-display">
            {isTa ? 'அட்டனன்ஸ் திருத்த ஒப்புதல்கள் & கடல்சார் தணிக்கை' : 'Attendance Corrections & Audit Authorization'}
          </h2>
          <p className="text-xs text-slate-300">
            {isTa 
              ? 'மேனேஜர் அனுப்பிய பணிநேர/வருகை திருத்த கோரிக்கைகளை சரிபார்த்து கப்பல் புறப்பாட்டிற்கு ஒப்புதல் வழங்கவும்.' 
              : 'Review and authorize attendance adjustment requests submitted by Marina Operations Managers.'}
          </p>
        </div>

        {/* Tab switch (Universal Responsive) */}
        <div className="w-full sm:w-auto flex items-center gap-1 bg-[#082F49] p-1 rounded-xl border border-white/10 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilterTab('pending')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 touch-target-min ${
              filterTab === 'pending'
                ? 'bg-amber-400 text-[#063B5C] shadow-sm font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Pending ({pendingCorrections.length})</span>
          </button>
          <button
            onClick={() => setFilterTab('reviewed')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 touch-target-min ${
              filterTab === 'reviewed'
                ? 'bg-[#27C5C1] text-[#063B5C] shadow-sm font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span>Reviewed ({reviewedCorrections.length})</span>
          </button>
          <button
            onClick={() => setFilterTab('all_records')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 touch-target-min ${
              filterTab === 'all_records'
                ? 'bg-[#27C5C1] text-[#063B5C] shadow-sm font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>Master Log ({attendance.length})</span>
          </button>
        </div>
      </div>

      {/* Pending Authorization Queue */}
      {filterTab === 'pending' && (
        <div className="space-y-4">
          {/* Maritime Safety Rule Banner */}
          <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-3 shadow-md">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white text-xs block">
                {isTa ? '⚠️ துறைமுக பாதுகாப்பு விதிமுறை (Vessel Allocation Safety Protocol):' : '⚠️ Maritime Safety & Vessel Allocation Protocol:'}
              </span>
              <p className="text-[11px] leading-relaxed text-amber-100">
                {isTa
                  ? 'மேனேஜர் அனுப்பியுள்ள இந்த வருகை/பணிநேர திருத்தத்தை அட்மின் முறையாக சரிபார்த்து உறுதி செய்ய வேண்டும். அட்மின் அனுமதி வழங்காமல் இந்த பணியாளரை கப்பல் பணிக்கோ அல்லது தளம் மாற்றத்திற்கோ அனுப்பக்கூடாது.'
                  : 'Station Manager has submitted timecard adjustments. Do not dispatch vessels or deploy personnel until this correction is officially authorized by Port Administration.'}
              </p>
            </div>
          </div>

          {pendingCorrections.length === 0 ? (
            <div className="marine-card p-12 text-center text-slate-400 rounded-2xl">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white">All Attendance Records Verified</h4>
              <p className="text-xs text-slate-400 mt-1">There are no pending manager correction requests at this time.</p>
            </div>
          ) : (
            pendingCorrections.map(rec => {
              const cr = rec.correctionRequest!;
              return (
                <div 
                  key={rec.id}
                  className="marine-card p-5 rounded-2xl border border-amber-500/40 text-white space-y-4 shadow-xl"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold border border-amber-500/30">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-cyan-300">{rec.employeeCode}</span>
                          <span className="text-xs text-slate-400">· Date: {rec.date}</span>
                        </div>
                        <h4 className="text-base font-bold text-white">{rec.employeeName}</h4>
                        <span className="text-xs text-slate-300 capitalize">{rec.role.replace('_', ' ')} · {rec.marinaZone || 'Marina Gate'}</span>
                      </div>
                    </div>

                    <div className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold uppercase tracking-wider">
                      Pending Admin Action
                    </div>
                  </div>

                  {/* Timing Comparison Grid */}
                  <div className="grid sm:grid-cols-2 gap-3 bg-[#063B5C] p-3.5 rounded-xl border border-white/5 text-xs font-mono">
                    <div className="space-y-1">
                      <span className="text-slate-400 text-[11px] block">CURRENT SYSTEM LOG</span>
                      <div className="text-slate-300">
                        Clock In: <span className="text-white font-bold">{rec.clockIn || 'Not Clocked In (Marked Late/Absent)'}</span>
                      </div>
                      <div className="text-slate-300">
                        Clock Out: <span className="text-white font-bold">{rec.clockOut || 'None'}</span>
                      </div>
                    </div>

                    <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-3">
                      <span className="text-amber-300 text-[11px] block font-semibold">REQUESTED ADJUSTMENT</span>
                      <div className="text-emerald-300">
                        Adjust In: <span className="font-bold">{cr.requestedClockIn || 'No change'}</span>
                      </div>
                      <div className="text-emerald-300">
                        Adjust Out: <span className="font-bold">{cr.requestedClockOut || 'No change'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Manager Justification Note */}
                  <div className="bg-[#082F49] p-3 rounded-xl border border-white/5 text-xs">
                    <span className="text-cyan-300 font-semibold block text-[11px] mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Manager's Explanation & Operational Reason:
                    </span>
                    <p className="text-slate-200 italic leading-relaxed">
                      "{cr.reason}"
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Submitted at {new Date(cr.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by {cr.submittedByName || 'Station Manager'}
                    </span>
                  </div>

                  {/* Review Form & Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <input
                      type="text"
                      placeholder="Optional Admin Reviewer Note / Payroll Code..."
                      value={adminNote[rec.id] || ''}
                      onChange={(e) => setAdminNote({ ...adminNote, [rec.id]: e.target.value })}
                      className="w-full sm:flex-1 bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#27C5C1]"
                    />

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleReview(rec.id, 'rejected')}
                        disabled={isProcessing === rec.id}
                        className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/40 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() => handleReview(rec.id, 'approved')}
                        disabled={isProcessing === rec.id}
                        className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-[#27C5C1] hover:bg-[#36B99B] text-[#063B5C] font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve Correction</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Reviewed Corrections History */}
      {filterTab === 'reviewed' && (
        <div className="space-y-3">
          {reviewedCorrections.length === 0 ? (
            <div className="marine-card p-12 text-center text-slate-400 rounded-2xl">
              No historical reviewed corrections.
            </div>
          ) : (
            reviewedCorrections.map(rec => {
              const cr = rec.correctionRequest!;
              const isApproved = cr.status === 'approved';
              return (
                <div key={rec.id} className="marine-card p-4 rounded-xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-white">{rec.employeeName}</span>
                      <span className="text-slate-400">({rec.employeeCode})</span>
                      <span className="text-slate-400">· {rec.date}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      Reason: "{cr.reason}"
                    </p>
                    {cr.reviewNote && (
                      <p className="text-[11px] text-cyan-300 mt-0.5">Admin note: {cr.reviewNote}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded text-xs font-semibold capitalize ${
                      isApproved 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {cr.status}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {cr.requestedClockIn} - {cr.requestedClockOut}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Master Daily Log */}
      {filterTab === 'all_records' && (
        <div className="marine-card rounded-2xl overflow-hidden border border-white/10 text-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#063B5C] text-slate-400 uppercase font-mono text-[11px] border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Clock In</th>
                  <th className="px-4 py-3">Clock Out</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Marina Zone</th>
                  <th className="px-4 py-3">Verified By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {attendance.map(a => (
                  <tr key={a.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white font-sans">
                      {a.employeeName} <span className="text-slate-400 text-[10px]">({a.employeeCode})</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 capitalize font-sans">{a.role.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-slate-300">{a.date}</td>
                    <td className="px-4 py-3 text-emerald-300">{a.clockIn || '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{a.clockOut || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        a.status === 'present' ? 'bg-emerald-500/20 text-emerald-300' :
                        a.status === 'on_sea' ? 'bg-sky-500/20 text-sky-300' :
                        a.status === 'late' ? 'bg-amber-500/20 text-amber-300' :
                        a.status === 'leave' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-300'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-sans">{a.marinaZone || 'Marina Gate Pier 1'}</td>
                    <td className="px-4 py-3 text-slate-400 text-[11px] font-sans">{a.verifiedBy || 'Dispatch'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
