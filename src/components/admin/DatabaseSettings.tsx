import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { 
  Database, Server, CheckCircle2, AlertTriangle, RefreshCw, 
  HardDrive, Link2, Download, ShieldCheck, Cpu 
} from 'lucide-react';

export const DatabaseSettings: React.FC = () => {
  const { dbStatus, refreshDbStatus } = useAuth();
  const [mongoUri, setMongoUri] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleConnectMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mongoUri.trim()) return;
    setIsConnecting(true);
    setFeedback(null);
    try {
      const res = await api.connectMongoAtlas(mongoUri.trim());
      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        await refreshDbStatus();
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to connect to MongoDB URI' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm('Re-seed the maritime database with Navlakhi Port personnel roster, vessels, and attendance logs?')) return;
    try {
      const res = await api.resetDatabase();
      setFeedback({ type: 'success', message: res.message });
      await refreshDbStatus();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white font-display">
          Database & Persistence Architecture
        </h2>
        <p className="text-xs text-slate-300">
          Monitor persistent MongoDB Atlas connectivity, collection telemetry, and operational data backups.
        </p>
      </div>

      {/* Status Banner */}
      <div className={`p-5 rounded-2xl border text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl ${
        dbStatus?.engine === 'mongodb'
          ? 'bg-emerald-950/40 border-emerald-500/40'
          : 'marine-card border-cyan-500/30'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold border ${
            dbStatus?.engine === 'mongodb'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
          }`}>
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                {dbStatus?.engine === 'mongodb' ? 'MongoDB Atlas Cluster Connected' : 'Embedded Marine Persistence Engine Active'}
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                dbStatus?.engine === 'mongodb'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              }`}>
                {dbStatus?.engine === 'mongodb' ? 'Production Mongo Atlas' : 'Operational Demo Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {dbStatus?.engine === 'mongodb'
                ? `Active Mongoose schemas syncing with Atlas cluster. URI: ${dbStatus.maskedUri}`
                : 'All personnel, attendance, boat telemetry, and sea voyages persist across restarts in server storage.'}
            </p>
          </div>
        </div>

        <button
          onClick={refreshDbStatus}
          className="px-3 py-1.5 rounded-xl bg-[#063B5C] hover:bg-[#082F49] text-cyan-300 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Status</span>
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border ${
          feedback.type === 'success'
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
            : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Collection Record Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div className="marine-card p-3.5 rounded-xl text-white">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Employees</span>
          <span className="text-xl font-bold font-mono text-cyan-300">{dbStatus?.stats.employees || 0}</span>
          <span className="text-[10px] text-slate-400 block">Marine Staff</span>
        </div>
        <div className="marine-card p-3.5 rounded-xl text-white">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Fleet Boats</span>
          <span className="text-xl font-bold font-mono text-cyan-300">{dbStatus?.stats.boats || 0}</span>
          <span className="text-[10px] text-slate-400 block">Registered Vessels</span>
        </div>
        <div className="marine-card p-3.5 rounded-xl text-white">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Attendance</span>
          <span className="text-xl font-bold font-mono text-cyan-300">{dbStatus?.stats.attendanceRecords || 0}</span>
          <span className="text-[10px] text-slate-400 block">Duty Logs</span>
        </div>
        <div className="marine-card p-3.5 rounded-xl text-white">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Sea Trips</span>
          <span className="text-xl font-bold font-mono text-cyan-300">{dbStatus?.stats.trips || 0}</span>
          <span className="text-[10px] text-slate-400 block">Voyages</span>
        </div>
        <div className="marine-card p-3.5 rounded-xl text-white">
          <span className="text-slate-400 text-[10px] uppercase font-mono block">Leaves</span>
          <span className="text-xl font-bold font-mono text-cyan-300">{dbStatus?.stats.leaveRequests || 0}</span>
          <span className="text-[10px] text-slate-400 block">Rest Quotas</span>
        </div>
      </div>

      {/* Connect Live MongoDB Atlas Form */}
      <div className="marine-card p-6 rounded-2xl border border-white/10 text-white space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-[#27C5C1] border border-cyan-400/30">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Connect Live MongoDB Atlas Cluster
            </h3>
            <p className="text-xs text-slate-300">
              Provide your standard MongoDB connection string to transition directly to external cloud persistence.
            </p>
          </div>
        </div>

        <form onSubmit={handleConnectMongo} className="space-y-3">
          <div>
            <label className="block text-slate-300 text-xs font-semibold mb-1">
              MongoDB Connection URI
            </label>
            <input
              type="text"
              value={mongoUri}
              onChange={(e) => setMongoUri(e.target.value)}
              placeholder="mongodb+srv://<username>:<password>@cluster0.mongodb.net/nautica_marine?retryWrites=true&w=majority"
              className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#27C5C1]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-[11px] text-slate-400">
              💡 Example: Free MongoDB Atlas M0 cluster or self-hosted MongoDB instance.
            </div>

            <button
              type="submit"
              disabled={isConnecting}
              className="w-full sm:w-auto bg-[#27C5C1] hover:bg-[#36B99B] text-[#063B5C] font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 touch-target-min"
            >
              {isConnecting ? 'Testing Connection...' : 'Connect & Sync with MongoDB'}
            </button>
          </div>
        </form>
      </div>

      {/* Database Maintenance Tools */}
      <div className="marine-card p-4 sm:p-6 rounded-2xl border border-white/10 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-base font-bold text-white">
            Reset to Navlakhi Station Maritime Dataset
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Re-populates the Navlakhi Port personnel (Station Manager, Supervisors, Operators), pilot boats, harbor tugs, anchorage voyages, and verified attendance logs.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors whitespace-nowrap touch-target-min flex items-center justify-center"
        >
          Re-Seed Navlakhi Fleet Data
        </button>
      </div>
    </div>
  );
};
