import React, { useState } from 'react';
import { Employee, EmployeeRole, AvailabilityStatus, ShiftType } from '../../types/marine.js';
import { api } from '../../services/api.js';
import { 
  Users, UserPlus, Search, Filter, Phone, Mail, Award, 
  Trash2, Edit3, CheckCircle, AlertCircle, X, Shield, MapPin 
} from 'lucide-react';

interface EmployeeManagementProps {
  employees: Employee[];
  onRefresh: () => void;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  employees,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: 'operator' as EmployeeRole,
    phone: '',
    email: '',
    emergencyContact: '',
    certifications: 'STCW 95, First Aid at Sea',
    assignedShift: 'morning' as ShiftType,
    notes: ''
  });

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      role: 'operator',
      phone: '',
      email: '',
      emergencyContact: '',
      certifications: 'STCW 95, First Aid at Sea',
      assignedShift: 'morning',
      notes: ''
    });
    setEditingEmp(null);
    setIsAddModalOpen(true);
    setErrorMsg(null);
  };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setFormData({
      name: emp.name,
      role: emp.role,
      phone: emp.phone,
      email: emp.email,
      emergencyContact: emp.emergencyContact,
      certifications: emp.certifications.join(', '),
      assignedShift: emp.assignedShift,
      notes: emp.notes || ''
    });
    setIsAddModalOpen(true);
    setErrorMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const certs = formData.certifications.split(',').map(s => s.trim()).filter(Boolean);
      if (editingEmp) {
        await api.updateEmployee(editingEmp.id, {
          name: formData.name,
          role: formData.role,
          phone: formData.phone,
          email: formData.email,
          emergencyContact: formData.emergencyContact,
          certifications: certs,
          assignedShift: formData.assignedShift,
          notes: formData.notes
        });
      } else {
        await api.createEmployee({
          name: formData.name,
          role: formData.role,
          phone: formData.phone,
          email: formData.email,
          emergencyContact: formData.emergencyContact,
          certifications: certs,
          assignedShift: formData.assignedShift,
          notes: formData.notes
        });
      }
      setIsAddModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save crew member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the active marine registry?`)) return;
    try {
      await api.deleteEmployee(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (id: string, newStatus: AvailabilityStatus) => {
    try {
      await api.updateEmployee(id, { status: newStatus });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.includes(searchTerm) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white font-display">
            Navlakhi Marine Personnel & Crew Registry
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300">
            Maintain duty rosters, licenses, certifications, emergency contacts, and availability for Navlakhi port staff.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto bg-[#27C5C1] hover:bg-[#36B99B] text-[#063B5C] font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 whitespace-nowrap touch-target-min"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Filter and Search Bar (Universal Responsive) */}
      <div className="marine-card p-3 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, code (EMP-001), phone, email..."
            className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#27C5C1]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:items-center gap-2">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#063B5C] text-xs text-white border border-cyan-500/20 rounded-xl px-3 py-2 focus:outline-none focus:border-[#27C5C1] w-full md:w-auto"
          >
            <option value="all">All Marine Roles</option>
            <option value="manager">Manager / Station Head</option>
            <option value="supervisor">Supervisor</option>
            <option value="operator">Operator</option>
            <option value="skipper">Skipper / Captain</option>
            <option value="first_mate">First Mate</option>
            <option value="marine_engineer">Marine Engineer</option>
            <option value="deckhand">Deckhand</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#063B5C] text-xs text-white border border-cyan-500/20 rounded-xl px-3 py-2 focus:outline-none focus:border-[#27C5C1] w-full md:w-auto"
          >
            <option value="all">All Availability Statuses</option>
            <option value="available">Available (Station)</option>
            <option value="on_sea">On Sea (Active Voyage)</option>
            <option value="on_duty">On Duty (Jetty/Port)</option>
            <option value="on_leave">On Leave</option>
            <option value="standby">Standby</option>
            <option value="sick">Medical Leave</option>
          </select>
        </div>
      </div>

      {/* Employee Cards Grid (1 col on mobile, 2 on tablet, 3 on laptop, 4 on wide screens) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
        {filtered.map(emp => (
          <div 
            key={emp.id}
            className="marine-card p-4 rounded-2xl border border-white/5 text-white flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  {emp.avatarUrl ? (
                    <img 
                      src={emp.avatarUrl} 
                      alt={emp.name} 
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-cyan-400/30 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-cyan-700/30 text-cyan-200 font-bold text-base flex items-center justify-center border border-cyan-400/20 shrink-0">
                      {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-cyan-300 block">
                      {emp.employeeCode}
                    </span>
                    <h4 className="text-sm font-bold text-white leading-tight truncate">
                      {emp.name}
                    </h4>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <span className="text-xs text-slate-300 capitalize">
                        {emp.role.replace('_', ' ')}
                      </span>
                      {emp.station && (
                        <span className="text-[9px] bg-cyan-900/60 text-cyan-300 px-1.5 py-0.2 rounded font-mono font-medium border border-cyan-500/20">
                          {emp.station}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Switcher Dropdown */}
                <select
                  value={emp.status}
                  onChange={(e) => handleStatusChange(emp.id, e.target.value as AvailabilityStatus)}
                  className={`text-[9px] sm:text-[10px] font-bold uppercase rounded-lg px-2 py-1 border focus:outline-none shrink-0 ${
                    emp.status === 'on_sea' 
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' 
                      : emp.status === 'available'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : emp.status === 'on_duty'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : emp.status === 'on_leave'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  <option value="available">Available</option>
                  <option value="on_sea">On Sea</option>
                  <option value="on_duty">On Duty</option>
                  <option value="standby">Standby</option>
                  <option value="on_leave">On Leave</option>
                  <option value="sick">Sick</option>
                </select>
              </div>

              {/* Details List */}
              <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-[11px] text-cyan-200">{emp.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate text-[11px]">{emp.email}</span>
                </div>
                <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
                  <div>
                    <span className="text-cyan-300 font-semibold">Shift: </span>
                    <span className="capitalize text-slate-300">{emp.assignedShift.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-cyan-300 font-semibold">Trips: </span>
                    <span className="font-mono text-white">{emp.totalTripsLogged}</span>
                  </div>
                </div>
              </div>

              {/* Certifications Badges */}
              <div className="mt-2.5">
                <div className="text-[10px] uppercase font-mono text-slate-400 mb-1 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>Certifications & Licenses</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {emp.certifications.map((c, i) => (
                    <span 
                      key={i} 
                      className="text-[9px] bg-[#063B5C] text-slate-200 px-1.5 py-0.5 rounded border border-white/5"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notes / Remarks */}
              {emp.notes && (
                <div className="mt-2.5 text-[11px] bg-slate-800/40 border border-white/5 rounded-lg p-2 text-cyan-200/90 italic">
                  <span className="font-semibold text-slate-400 not-italic">Remarks: </span>
                  {emp.notes}
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/10 text-xs">
              <span className="text-[10px] text-slate-400">
                Joined: {emp.joinedDate}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(emp)}
                  className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors touch-target-min flex items-center justify-center"
                  title="Edit Staff Member"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(emp.id, emp.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors touch-target-min flex items-center justify-center"
                  title="Remove from Registry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Crew Member Modal (Universal Responsive Sheet) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="marine-card w-full max-w-xl p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-cyan-500/30 text-white shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#27C5C1]" />
                <h3 className="text-base font-bold text-white">
                  {editingEmp ? 'Edit Navlakhi Staff Member' : 'Register New Crew Member'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg touch-target-min flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="my-3 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 pt-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Debashish Banerjee"
                  className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#27C5C1] touch-target-min"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Rank / Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as EmployeeRole })}
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#27C5C1] touch-target-min"
                  >
                    <option value="manager">Station Manager / Head</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="operator">Operator</option>
                    <option value="skipper">Skipper / Captain</option>
                    <option value="first_mate">First Mate</option>
                    <option value="marine_engineer">Marine Engineer</option>
                    <option value="deckhand">Deckhand</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duty Shift *</label>
                  <select
                    value={formData.assignedShift}
                    onChange={(e) => setFormData({ ...formData, assignedShift: e.target.value as ShiftType })}
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#27C5C1] touch-target-min"
                  >
                    <option value="morning">Morning Shift (05:00 - 14:00)</option>
                    <option value="evening">Evening Shift (14:00 - 23:00)</option>
                    <option value="full_day">Full Day (Offshore 12h)</option>
                    <option value="off">RDO / Rest</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Mobile Phone *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9702201293"
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#27C5C1] touch-target-min"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="staff@nautica.marine"
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#27C5C1] touch-target-min"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Emergency Contact</label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="e.g. Navlakhi Port Operations Desk"
                  className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#27C5C1] touch-target-min"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Certifications (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.certifications}
                  onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                  placeholder="STCW 95, GMDSS, Winch Operation"
                  className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#27C5C1] touch-target-min"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Operational Remarks / Leave Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Expected joining on 01st of December."
                  className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#27C5C1]"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs touch-target-min"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-[#27C5C1] hover:bg-[#36B99B] text-[#063B5C] font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg touch-target-min"
                >
                  {isSubmitting ? 'Saving...' : editingEmp ? 'Update Staff Member' : 'Save Crew Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};