import React, { useState } from 'react';
import { Boat, VesselType, VesselStatus } from '../../types/marine.js';
import { api } from '../../services/api.js';
import {
  Ship, PlusCircle, Search, Fuel, Gauge, Calendar,
  MapPin, Edit3, Trash2, AlertTriangle, AlertCircle, CheckCircle, X
} from 'lucide-react';

interface BoatManagementProps {
  boats: Boat[];
  onRefresh: () => void;
}

export const BoatManagement: React.FC<BoatManagementProps> = ({
  boats,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBoat, setEditingBoat] = useState<Boat | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    registrationNumber: '',
    name: '',
    vesselType: 'utility_tender' as VesselType,
    lengthFt: 38,
    capacityPax: 8,
    fuelLevelPct: 90,
    currentMarinaSlip: 'Navlakhi Berth 1',
    notes: ''
  });

  const handleOpenAdd = () => {
    setEditingBoat(null);
    setFormData({
      registrationNumber: '',
      name: '',
      vesselType: 'utility_tender',
      lengthFt: 38,
      capacityPax: 8,
      fuelLevelPct: 90,
      currentMarinaSlip: 'Navlakhi Berth 1',
      notes: ''
    });
    setIsModalOpen(true);
    setErrorMsg(null);
  };

  const handleOpenEdit = (boat: Boat) => {
    setEditingBoat(boat);
    setFormData({
      registrationNumber: boat.registrationNumber,
      name: boat.name,
      vesselType: boat.vesselType,
      lengthFt: boat.lengthFt,
      capacityPax: boat.capacityPax,
      fuelLevelPct: boat.fuelLevelPct,
      currentMarinaSlip: boat.currentMarinaSlip,
      notes: boat.notes || ''
    });
    setIsModalOpen(true);
    setErrorMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      if (editingBoat) {
        await api.updateBoat(editingBoat.id, formData);
      } else {
        await api.createBoat(formData);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving vessel');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to decommission and remove "${name}" from the active fleet registry?`)) return;
    try {
      await api.deleteBoat(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (id: string, newStatus: VesselStatus) => {
    try {
      await api.updateBoatStatus(id, { status: newStatus });
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = boats.filter(b => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.currentMarinaSlip.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white font-display">
            Navlakhi Fleet & Marine Asset Registry
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300">
            Monitor pilot boats, harbor tugs, inspection vessels, slip allocations, and fuel reserves.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto bg-[#27C5C1] hover:bg-[#36B99B] text-[#063B5C] font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 whitespace-nowrap touch-target-min"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Vessel</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="marine-card p-3 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vessels by name, registration, or berth..."
            className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#27C5C1]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#063B5C] text-xs text-white border border-cyan-500/20 rounded-xl px-3 py-2 focus:outline-none focus:border-[#27C5C1]"
        >
          <option value="all">All Fleet Statuses</option>
          <option value="docked">Docked at Berth</option>
          <option value="at_sea">Underway / At Sea</option>
          <option value="moored">Moored at Anchorage</option>
          <option value="maintenance">Maintenance / Slipway</option>
          <option value="standby">Standby Ready</option>
        </select>
      </div>

      {/* Vessel Grid (Universal Adaptive) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        {filtered.map(boat => (
          <div
            key={boat.id}
            className="marine-card rounded-2xl overflow-hidden border border-white/10 text-white flex flex-col justify-between"
          >
            <div>
              {/* Boat Preview Thumbnail */}
              {boat.imageUrl && (
                <div className="relative h-36 sm:h-40 w-full overflow-hidden">
                  <img
                    src={boat.imageUrl}
                    alt={boat.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#082F49] via-transparent to-black/30" />
                  <div className="absolute top-3 left-3">
                    <span className="bg-[#082F49]/80 backdrop-blur-md text-[10px] font-mono px-2 py-1 rounded text-cyan-300 border border-white/10">
                      {boat.registrationNumber}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white font-display truncate">
                      {boat.name}
                    </h3>
                    <div className="text-xs text-cyan-300 capitalize font-mono truncate">
                      {boat.lengthFt} ft · {boat.vesselType.replace('_', ' ')} · {boat.capacityPax} Pax
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={boat.status}
                    onChange={(e) => handleStatusChange(boat.id, e.target.value as VesselStatus)}
                    className={`text-[9px] sm:text-[10px] font-bold uppercase rounded-lg px-2 py-1 border focus:outline-none shrink-0 ${boat.status === 'at_sea'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                        : boat.status === 'docked'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : boat.status === 'maintenance'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                  >
                    <option value="docked">Docked</option>
                    <option value="at_sea">At Sea</option>
                    <option value="moored">Moored</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="standby">Standby</option>
                  </select>
                </div>

                {/* Slip location */}
                <div className="flex items-center gap-1.5 text-xs text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{boat.currentMarinaSlip}</span>
                </div>

                {/* Fuel & Engine Telemetry */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
                  <div className="bg-[#063B5C]/70 p-2 rounded-xl">
                    <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-1">
                      <Fuel className="w-3 h-3 text-cyan-400" />
                      <span>Bunker Fuel</span>
                    </div>
                    <div className="font-mono font-bold text-white flex items-center justify-between">
                      <span>{boat.fuelLevelPct}%</span>
                      <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${boat.fuelLevelPct > 40 ? 'bg-[#27C5C1]' : 'bg-rose-400'
                            }`}
                          style={{ width: `${boat.fuelLevelPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#063B5C]/70 p-2 rounded-xl">
                    <div className="flex items-center gap-1 text-slate-400 text-[10px] mb-1">
                      <Gauge className="w-3 h-3 text-cyan-400" />
                      <span>Engine Hours</span>
                    </div>
                    <div className="font-mono font-bold text-white">
                      {boat.engineHours} <span className="text-[10px] font-normal text-slate-400">hrs</span>
                    </div>
                  </div>
                </div>

                {boat.notes && (
                  <p className="text-[11px] text-slate-400 line-clamp-2 italic pt-1">
                    {boat.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Vessel Card Actions Footer */}
            <div className="p-3 bg-[#063B5C]/50 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                Inspection: {boat.safetyInspectionExpiry}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(boat)}
                  className="p-1.5 text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 rounded-lg transition-colors touch-target-min flex items-center justify-center"
                  title="Edit Vessel"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(boat.id, boat.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors touch-target-min flex items-center justify-center"
                  title="Decommission Vessel"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Vessel Modal (Universal Responsive Sheet) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="marine-card w-full max-w-xl p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-cyan-500/30 text-white shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Ship className="w-5 h-5 text-[#27C5C1]" />
                <h3 className="text-base font-bold text-white">
                  {editingBoat ? 'Edit Marine Vessel' : 'Register New Fleet Asset'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
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
                <label className="block text-slate-300 font-semibold mb-1">Vessel Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Navlakhi Pilot I"
                  className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#27C5C1] touch-target-min"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Registration No. *</label>
                  <input
                    type="text"
                    required
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    placeholder="GJ-10-NLK-001"
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#27C5C1] touch-target-min"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Vessel Type *</label>
                  <select
                    value={formData.vesselType}
                    onChange={(e) => setFormData({ ...formData, vesselType: e.target.value as VesselType })}
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#27C5C1] touch-target-min"
                  >
                    <option value="utility_tender">Pilot Boat / Utility Tender</option>
                    <option value="fishing_trawler">Harbor Tug / Towage</option>
                    <option value="sport_fisherman">Coastal Patrol Boat</option>
                    <option value="catamaran">Mooring Launch</option>
                    <option value="charter_yacht">Crew Transfer Vessel</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Length (Feet)</label>
                  <input
                    type="number"
                    value={formData.lengthFt}
                    onChange={(e) => setFormData({ ...formData, lengthFt: Number(e.target.value) })}
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#27C5C1] touch-target-min"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Pax Capacity</label>
                  <input
                    type="number"
                    value={formData.capacityPax}
                    onChange={(e) => setFormData({ ...formData, capacityPax: Number(e.target.value) })}
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#27C5C1] touch-target-min"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Initial Fuel (%)</label>
                  <input
                    type="number"
                    max={100}
                    min={0}
                    value={formData.fuelLevelPct}
                    onChange={(e) => setFormData({ ...formData, fuelLevelPct: Number(e.target.value) })}
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#27C5C1] touch-target-min"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assigned Berth / Slipway</label>
                <input
                  type="text"
                  value={formData.currentMarinaSlip}
                  onChange={(e) => setFormData({ ...formData, currentMarinaSlip: e.target.value })}
                  placeholder="Navlakhi Pilot Pier Berth 1"
                  className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#27C5C1] touch-target-min"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Operational Outfitting Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Twin marine diesel engines, radar reflector, mooring gear."
                  className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#27C5C1]"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs touch-target-min"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-[#27C5C1] hover:bg-[#36B99B] text-[#063B5C] font-bold px-5 py-2.5 rounded-xl transition-colors shadow-lg touch-target-min"
                >
                  {isSubmitting ? 'Saving...' : editingBoat ? 'Update Vessel' : 'Register Vessel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};