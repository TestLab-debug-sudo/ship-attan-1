import React, { useState } from 'react';
import { LeaveRequest, LeaveType } from '../../types/marine.js';
import { api } from '../../services/api.js';
import { Calendar, Check, X, AlertCircle, Clock, ShieldCheck, HeartPulse, Anchor } from 'lucide-react';

interface LeaveManagementProps {
  leaves: LeaveRequest[];
  onRefresh: () => void;
}

export const LeaveManagement: React.FC<LeaveManagementProps> = ({
  leaves,
  onRefresh
}) => {
  const [filter, setFilter] = useState<'pending' | 'all'>('all');
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleReview = async (id: string, decision: 'approved' | 'rejected') => {
    setIsProcessing(id);
    try {
      const comment = commentInput[id] || '';
      await api.reviewLeave(id, decision, comment);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error reviewing leave request');
    } finally {
      setIsProcessing(null);
    }
  };

  const pendingLeaves = leaves.filter(l => l.status === 'pending');
  const displayed = filter === 'pending' ? pendingLeaves : leaves;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white font-display">
            Navlakhi Station Leave Administration
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300">
            Authorize rotational coastal leaves, relief assignments, and station roster availability.
          </p>
        </div>

        {/* Filter buttons (Universal Responsive) */}
        <div className="w-full sm:w-auto flex items-center gap-1 bg-[#082F49] p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-target-min ${
              filter === 'all'
                ? 'bg-[#27C5C1] text-[#063B5C] shadow-sm font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>All Requests ({leaves.length})</span>
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 touch-target-min ${
              filter === 'pending'
                ? 'bg-[#FF875E] text-white shadow-sm font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingLeaves.length})</span>
          </button>
        </div>
      </div>

      {/* Grid of Leave Requests */}
      <div className="space-y-3 sm:space-y-4">
        {displayed.length === 0 ? (
          <div className="marine-card p-8 sm:p-12 text-center text-slate-400 rounded-2xl">
            <Calendar className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white">No Leave Requests in this Queue</h4>
            <p className="text-xs text-slate-400 mt-1">Crew members have full active roster availability.</p>
          </div>
        ) : (
          displayed.map(leave => {
            const isPending = leave.status === 'pending';
            const isApproved = leave.status === 'approved';

            return (
              <div
                key={leave.id}
                className={`marine-card p-4 sm:p-5 rounded-2xl border text-white space-y-3 sm:space-y-4 shadow-xl ${
                  isPending ? 'border-amber-500/40' : 'border-white/10'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2.5 sm:gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold border shrink-0 ${
                      leave.leaveType === 'marine_rest' 
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                        : leave.leaveType === 'sick'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {leave.leaveType === 'marine_rest' ? <Anchor className="w-4 h-4 sm:w-5 sm:h-5" /> : 
                       leave.leaveType === 'sick' ? <HeartPulse className="w-4 h-4 sm:w-5 sm:h-5" /> : 
                       <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono text-cyan-300">{leave.employeeCode}</span>
                        <span className="text-[10px] sm:text-xs text-slate-400">· Requested: {new Date(leave.requestedAt).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-white truncate">{leave.employeeName}</h4>
                      <span className="text-[11px] sm:text-xs text-slate-300 capitalize">
                        Type: {leave.leaveType.replace('_', ' ')} · Duration: {leave.totalDays} Days
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span className={`px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${
                    isPending 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : isApproved
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {leave.status}
                  </span>
                </div>

                {/* Dates & Reason */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 bg-[#063B5C] p-3 rounded-xl border border-white/5 text-xs font-mono">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-sans">Leave Window</span>
                    <span className="text-white font-bold">{leave.startDate} → {leave.endDate}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-sans">Justification / Reason</span>
                    <span className="text-slate-200 font-sans italic">"{leave.reason}"</span>
                  </div>
                </div>

                {leave.reviewerComment && (
                  <div className="text-[11px] sm:text-xs text-cyan-200 bg-[#082F49] p-2.5 rounded-lg border border-white/5">
                    <span className="font-semibold text-white">Reviewer Note ({leave.reviewedBy}): </span>
                    {leave.reviewerComment}
                  </div>
                )}

                {/* Admin Actions if Pending */}
                {isPending && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-2">
                    <input
                      type="text"
                      placeholder="Reviewer condition / relief assignment..."
                      value={commentInput[leave.id] || ''}
                      onChange={(e) => setCommentInput({ ...commentInput, [leave.id]: e.target.value })}
                      className="w-full sm:flex-1 bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#27C5C1] touch-target-min"
                    />

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleReview(leave.id, 'rejected')}
                        disabled={isProcessing === leave.id}
                        className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/40 transition-colors flex items-center justify-center gap-1.5 touch-target-min"
                      >
                        <X className="w-4 h-4" />
                        <span>Decline</span>
                      </button>

                      <button
                        onClick={() => handleReview(leave.id, 'approved')}
                        disabled={isProcessing === leave.id}
                        className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#27C5C1] hover:bg-[#36B99B] text-[#063B5C] font-bold text-xs shadow-lg transition-colors flex items-center justify-center gap-1.5 touch-target-min"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve Leave</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};