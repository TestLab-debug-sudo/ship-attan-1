import React, { useEffect, useState } from 'react';
import { User } from '../../types/marine.js';
import { api } from '../../services/api.js';
import { UserCheck, UserPlus, Shield, Trash2, Edit3, X, AlertCircle } from 'lucide-react';

export const ManagerAccounts: React.FC = () => {
  const [managers, setManagers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    title: 'Marina Operations & Dispatch Manager'
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchManagers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getManagers();
      setManagers(res.managers);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await api.createManager(formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        title: 'Marina Operations & Dispatch Manager'
      });
      fetchManagers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating manager');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Revoke management privileges for ${name}?`)) return;
    try {
      await api.deleteManager(id);
      fetchManagers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white font-display">
            Navlakhi Manager Access & Operations Authorization
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300">
            Control manager login credentials, operational dispatch roles, and station access.
          </p>
        </div>

        <button
          onClick={() => { setIsModalOpen(true); setErrorMsg(null); }}
          className="w-full sm:w-auto bg-[#27C5C1] hover:bg-[#36B99B] text-[#063B5C] font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 whitespace-nowrap touch-target-min"
        >
          <UserPlus className="w-4 h-4" />
          <span>Authorize New Manager</span>
        </button>
      </div>

      {/* Grid of Manager Accounts (Universal Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {managers.map(mgr => (
          <div key={mgr.id} className="marine-card p-5 rounded-2xl border border-cyan-500/20 text-white flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold text-base flex items-center justify-center border border-cyan-500/30">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-cyan-300 uppercase tracking-wider block">
                      Operations Role
                    </span>
                    <h4 className="text-base font-bold text-white leading-tight">
                      {mgr.name}
                    </h4>
                    <span className="text-xs text-slate-300">{mgr.title}</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Manager
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 pt-3 border-t border-white/5">
                <div>
                  <span className="text-slate-400">Email: </span>
                  <span className="text-white font-mono">{mgr.email}</span>
                </div>
                <div>
                  <span className="text-slate-400">Last Session: </span>
                  <span className="text-slate-300">{mgr.lastLogin ? new Date(mgr.lastLogin).toLocaleDateString() : 'Active'}</span>
                </div>
              </div>

              {/* Permissions list */}
              <div className="mt-3">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                  Granted Marine Capabilities
                </span>
                <div className="flex flex-wrap gap-1">
                  {mgr.permissions?.map((p, i) => (
                    <span key={i} className="text-[10px] bg-[#063B5C] text-cyan-200 px-2 py-0.5 rounded border border-white/5 capitalize">
                      {p.replace('_', ' ')}
                    </span>
                  )) || (
                    <span className="text-[10px] text-slate-400">Standard Marine Operations</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 mt-3 border-t border-white/10">
              <button
                onClick={() => handleDelete(mgr.id, mgr.name)}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-1.5 text-xs"
              >
                <Trash2 className="w-4 h-4" />
                <span>Revoke Access</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Manager Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="marine-card w-full max-w-md p-6 rounded-3xl border border-cyan-500/30 text-white shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-lg font-bold text-white font-display">
                Authorize New Marine Manager
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Elena Rostova"
                  className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#27C5C1]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Manager Login Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="manager@nautica.marine"
                  className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#27C5C1]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#27C5C1]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Title / Designation</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Marina Operations & Dispatch Manager"
                  className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#27C5C1]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#27C5C1] hover:bg-[#36B99B] text-[#063B5C] font-bold px-5 py-2 rounded-xl transition-colors shadow-lg"
                >
                  Create Manager
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
