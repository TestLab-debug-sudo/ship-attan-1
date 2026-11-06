import React, { useState } from 'react';
import { TripRecord, Boat, Employee, TripType } from '../../types/marine.js';
import { api } from '../../services/api.js';
import {
  Anchor, PlusCircle, CheckCircle, Clock, Navigation,
  Fuel, ShieldCheck, Fish, AlertCircle, X, MapPin, Users
} from 'lucide-react';

interface TripDispatchCenterProps {
  trips: TripRecord[];
  boats: Boat[];
  employees: Employee[];
  onRefresh: () => void;
}

export const TripDispatchCenter: React.FC<TripDispatchCenterProps> = ({
  trips,
  boats,
  employees,
  onRefresh
}) => {
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'scheduled' | 'completed'>('all');
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
  const [activeChecklistTrip, setActiveChecklistTrip] = useState<TripRecord | null>(null);
  const [activeArrivalTrip, setActiveArrivalTrip] = useState<TripRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Trip Form State
  const [newTripData, setNewTripData] = useState({
    boatId: '',
    tripType: 'deep_sea_fishing' as TripType,
    skipperId: '',
    firstMateId: '',
    deckhandId: '',
    destination: '',
    passengerCount: 6,
    scheduledDeparture: new Date().toISOString().slice(0, 16),
    scheduledReturn: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 16),
    weatherSummary: 'Favorable coastal sea state, 8-12 kt ENE breeze.'
  });

  // Departure Checklist State
  const [checklist, setChecklist] = useState({
    safetyGearVerified: true,
    marineRadioTested: true,
    fuelVerified: true,
    weatherClearance: true,
    manifestSigned: true,
    firstAidKitInspected: true,
    bilgePumpTested: true
  });

  // Arrival Log State
  const [arrivalData, setArrivalData] = useState({
    actualReturnTime: new Date().toISOString(),
    nauticalMiles: 38.5,
    fuelConsumedLiters: 165,
    catchWeightKg: 85,
    catchSpecies: 'Mahi-Mahi x 4, Blackfin Tuna x 2',
    seaConditionsRating: 4,
    logNotes: 'Safe return to slip. Engine and hull running smoothly.'
  });

  // Eligible boats (docked, standby)
  const eligibleBoats = boats.filter(b => b.status !== 'maintenance');
  // Eligible skippers / supervisors / managers
  const eligibleSkippers = employees.filter(e => (e.role === 'skipper' || e.role === 'manager' || e.role === 'supervisor') && e.status !== 'on_leave');
  // First Mates / Supervisors / Operators
  const eligibleMates = employees.filter(e => (e.role === 'first_mate' || e.role === 'supervisor' || e.role === 'operator') && e.status !== 'on_leave');
  // Deckhands / Operators
  const eligibleDeckhands = employees.filter(e => (e.role === 'deckhand' || e.role === 'operator') && e.status !== 'on_leave');

  const handleOpenNewTrip = () => {
    setNewTripData({
      boatId: eligibleBoats[0]?.id || '',
      tripType: 'coastal_charter',
      skipperId: eligibleSkippers[0]?.id || '',
      firstMateId: eligibleMates[0]?.id || '',
      deckhandId: eligibleDeckhands[0]?.id || '',
      destination: 'Navlakhi Fairway & Gulf of Kutch Roadstead',
      passengerCount: 4,
      scheduledDeparture: new Date().toISOString().slice(0, 16),
      scheduledReturn: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 16),
      weatherSummary: 'Navlakhi tidal stream 2.8 kt, 12 kt NW breeze.'
    });
    setIsNewTripModalOpen(true);
    setErrorMsg(null);
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const selectedBoat = boats.find(b => b.id === newTripData.boatId);
      const selectedSkipper = employees.find(e => e.id === newTripData.skipperId);

      const crew: { employeeId: string; employeeName: string; role: any }[] = [];
      if (newTripData.firstMateId) {
        const mate = employees.find(e => e.id === newTripData.firstMateId);
        if (mate) crew.push({ employeeId: mate.id, employeeName: mate.name, role: mate.role });
      }
      if (newTripData.deckhandId) {
        const dh = employees.find(e => e.id === newTripData.deckhandId);
        if (dh) crew.push({ employeeId: dh.id, employeeName: dh.name, role: dh.role });
      }

      await api.createTrip({
        boatId: newTripData.boatId,
        boatName: selectedBoat?.name || 'Vessel',
        tripType: newTripData.tripType,
        skipperId: newTripData.skipperId,
        skipperName: selectedSkipper?.name || 'Skipper',
        crew,
        destination: newTripData.destination,
        passengerCount: Number(newTripData.passengerCount),
        scheduledDeparture: newTripData.scheduledDeparture,
        scheduledReturn: newTripData.scheduledReturn,
        weatherSummary: newTripData.weatherSummary
      });

      setIsNewTripModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating sea trip');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeparture = async () => {
    if (!activeChecklistTrip) return;
    setIsSubmitting(true);
    try {
      await api.logDeparture(activeChecklistTrip.id, checklist);
      setActiveChecklistTrip(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Departure sign-off failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmArrival = async () => {
    if (!activeArrivalTrip) return;
    setIsSubmitting(true);
    try {
      const speciesList = arrivalData.catchSpecies.split(',').map(s => s.trim()).filter(Boolean);
      await api.logArrival(activeArrivalTrip.id, {
        actualReturnTime: arrivalData.actualReturnTime,
        nauticalMiles: Number(arrivalData.nauticalMiles),
        fuelConsumedLiters: Number(arrivalData.fuelConsumedLiters),
        catchWeightKg: Number(arrivalData.catchWeightKg),
        catchSpecies: speciesList,
        seaConditionsRating: Number(arrivalData.seaConditionsRating),
        logNotes: arrivalData.logNotes
      });
      setActiveArrivalTrip(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Arrival log recording failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTrips = trips.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white font-display">
            Navlakhi Voyages, Pilotage & Tug Logbook
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-300">
            Dispatch fairway voyages, verify pre-departure seaworthiness checklists, and log port arrivals.
          </p>
        </div>

        <button
          onClick={handleOpenNewTrip}
          className="w-full sm:w-auto bg-[#27C5C1] hover:bg-[#36B99B] text-[#063B5C] font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 whitespace-nowrap touch-target-min"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Dispatch New Voyage</span>
        </button>
      </div>

      {/* Filter Tabs (Responsive) */}
      <div className="flex items-center gap-1 bg-[#082F49] p-1 rounded-xl border border-white/10 w-full sm:w-fit overflow-x-auto">
        {(['all', 'in_progress', 'scheduled', 'completed'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold rounded-lg capitalize whitespace-nowrap transition-colors touch-target-min flex items-center justify-center ${filter === tab
                ? 'bg-[#27C5C1] text-[#063B5C] shadow-sm font-bold'
                : 'text-slate-300 hover:text-white'
              }`}
          >
            {tab.replace('_', ' ')} ({trips.filter(t => tab === 'all' || t.status === tab).length})
          </button>
        ))}
      </div>

      {/* Voyages Cards Grid */}
      <div className="space-y-4">
        {filteredTrips.map(trip => {
          const isAtSea = trip.status === 'in_progress';
          const isScheduled = trip.status === 'scheduled';
          const isCompleted = trip.status === 'completed';

          return (
            <div
              key={trip.id}
              className={`marine-card p-5 rounded-2xl border text-white space-y-4 shadow-xl transition-all ${isAtSea ? 'border-sky-500/40 bg-[#082F49]' : 'border-white/10'
                }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold border ${isAtSea
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : isScheduled
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                    <Anchor className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-cyan-300">{trip.tripNumber}</span>
                      <span className="text-xs text-slate-400 capitalize">· {trip.tripType.replace(/_/g, ' ')}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white font-display">
                      {trip.boatName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Destination: <strong className="text-white">{trip.destination}</strong></span>
                      <span className="text-slate-500">·</span>
                      <span>{trip.passengerCount} Passengers</span>
                    </div>
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${isAtSea
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : isScheduled
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}>
                    {trip.status.replace('_', ' ')}
                  </span>

                  {isScheduled && (
                    <button
                      onClick={() => setActiveChecklistTrip(trip)}
                      className="bg-[#27C5C1] hover:bg-[#36B99B] text-[#063B5C] font-bold text-xs px-4 py-1.5 rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Pre-Departure Sign-Off</span>
                    </button>
                  )}

                  {isAtSea && (
                    <button
                      onClick={() => {
                        setActiveArrivalTrip(trip);
                        setArrivalData(prev => ({ ...prev, actualReturnTime: new Date().toISOString() }));
                      }}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-xs px-4 py-1.5 rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Log Vessel Arrival</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Crew Manifest & Times Grid */}
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 bg-[#063B5C] p-3.5 rounded-xl border border-white/5 text-xs font-mono">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block font-sans">Commanding Skipper</span>
                  <span className="font-bold text-cyan-200">{trip.skipperName}</span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase block font-sans">Assigned Crew</span>
                  <span className="text-slate-200 font-sans">
                    {trip.crew.map(c => `${c.employeeName} (${c.role.replace('_', ' ')})`).join(', ') || 'Solo Operation'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase block font-sans">Scheduled Departure</span>
                  <span className="text-slate-200">
                    {new Date(trip.scheduledDeparture).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Arrival Log (if completed) */}
              {trip.arrivalLog && (
                <div className="bg-[#082F49] p-3 rounded-xl border border-emerald-500/20 text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      <span>Arrival Recorded at {new Date(trip.arrivalLog.actualReturnTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 font-mono text-[11px]">
                      <span>Dist: {trip.arrivalLog.nauticalMiles} NM</span>
                      <span>Fuel: {trip.arrivalLog.fuelConsumedLiters} L</span>
                      <span>Sea Rating: {trip.arrivalLog.seaConditionsRating}/5</span>
                    </div>
                  </div>

                  {trip.arrivalLog.catchWeightKg ? (
                    <div className="text-[11px] text-cyan-200 flex items-center gap-2">
                      <Fish className="w-3.5 h-3.5 text-amber-400" />
                      <span>Catch Haul: <strong>{trip.arrivalLog.catchWeightKg} kg</strong> ({trip.arrivalLog.catchSpecies?.join(', ')})</span>
                    </div>
                  ) : null}

                  <p className="text-slate-300 italic text-[11px]">
                    "{trip.arrivalLog.logNotes}"
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Dispatch New Voyage Modal */}
      {isNewTripModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="marine-card w-full max-w-lg p-6 rounded-3xl border border-cyan-500/30 text-white shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-lg font-bold text-white font-display">
                Dispatch New Sea Voyage
              </h3>
              <button
                onClick={() => setIsNewTripModalOpen(false)}
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

            <form onSubmit={handleCreateTrip} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Select Fleet Vessel *</label>
                  <select
                    value={newTripData.boatId}
                    onChange={(e) => setNewTripData({ ...newTripData, boatId: e.target.value })}
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#27C5C1] touch-target-min"
                  >
                    {eligibleBoats.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.capacityPax} Pax, {b.fuelLevelPct}% Fuel)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Voyage Mission Type *</label>
                  <select
                    value={newTripData.tripType}
                    onChange={(e) => setNewTripData({ ...newTripData, tripType: e.target.value as TripType })}
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#27C5C1] touch-target-min"
                  >
                    <option value="coastal_charter">Lighterage Escort & Towage</option>
                    <option value="harbor_tour">Pilot Boarding & Channel Transit</option>
                    <option value="sea_trial">Fairway Buoy & Safety Inspection</option>
                    <option value="island_transfer">Port Supply Transfer</option>
                    <option value="deep_sea_fishing">Offshore Coastal Mission</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Commanding Officer / Skipper *</label>
                <select
                  value={newTripData.skipperId}
                  onChange={(e) => setNewTripData({ ...newTripData, skipperId: e.target.value })}
                  className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#27C5C1] touch-target-min"
                >
                  {eligibleSkippers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role} - {s.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Supervisor / First Mate</label>
                  <select
                    value={newTripData.firstMateId}
                    onChange={(e) => setNewTripData({ ...newTripData, firstMateId: e.target.value })}
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#27C5C1] touch-target-min"
                  >
                    <option value="">None / Solo Watch</option>
                    {eligibleMates.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Operator / Deckhand</label>
                  <select
                    value={newTripData.deckhandId}
                    onChange={(e) => setNewTripData({ ...newTripData, deckhandId: e.target.value })}
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#27C5C1] touch-target-min"
                  >
                    <option value="">None</option>
                    {eligibleDeckhands.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Destination & Waypoint *</label>
                  <input
                    type="text"
                    required
                    value={newTripData.destination}
                    onChange={(e) => setNewTripData({ ...newTripData, destination: e.target.value })}
                    placeholder="e.g. Navlakhi Fairway & Inner Roadstead"
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#27C5C1] touch-target-min"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Passenger / Port Staff Count</label>
                  <input
                    type="number"
                    value={newTripData.passengerCount}
                    onChange={(e) => setNewTripData({ ...newTripData, passengerCount: Number(e.target.value) })}
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#27C5C1] touch-target-min"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewTripModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#27C5C1] hover:bg-[#36B99B] text-[#063B5C] font-bold px-5 py-2 rounded-xl transition-colors shadow-lg"
                >
                  Create Scheduled Voyage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pre-Departure Checklist Modal */}
      {activeChecklistTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="marine-card w-full max-w-md p-6 rounded-3xl border border-cyan-500/30 text-white shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Pre-Departure Safety Checklist & Sign-Off
                </h3>
                <span className="text-xs text-slate-400">
                  {activeChecklistTrip.boatName} · {activeChecklistTrip.tripNumber}
                </span>
              </div>
              <button
                onClick={() => setActiveChecklistTrip(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs mb-4">
              {[
                { key: 'safetyGearVerified', label: 'Life Jackets, Flares & EPIRB Beacon verified aboard' },
                { key: 'marineRadioTested', label: 'VHF Marine Radio Channel 16 check completed' },
                { key: 'fuelVerified', label: 'Fuel tanks verified sufficient for planned route + reserve' },
                { key: 'weatherClearance', label: 'Local NOAA / Coast Guard weather advisory cleared' },
                { key: 'manifestSigned', label: 'Passenger & Crew manifest verified and logged' },
                { key: 'firstAidKitInspected', label: 'First Aid Kit & trauma pack onboard and sealed' },
                { key: 'bilgePumpTested', label: 'Electric & manual bilge pumps operational' }
              ].map(item => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-[#063B5C] border border-white/5 cursor-pointer hover:bg-[#07476e] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={(checklist as any)[item.key]}
                    onChange={(e) => setChecklist({ ...checklist, [item.key]: e.target.checked })}
                    className="w-4 h-4 text-[#27C5C1] rounded focus:ring-0"
                  />
                  <span className="text-slate-200">{item.label}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveChecklistTrip(null)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeparture}
                disabled={isSubmitting}
                className="bg-[#27C5C1] hover:bg-[#36B99B] text-[#063B5C] font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-lg flex items-center gap-2"
              >
                <Anchor className="w-4 h-4" />
                <span>Confirm Departure & Underway</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Arrival Log Modal */}
      {activeArrivalTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="marine-card w-full max-w-md p-6 rounded-3xl border border-cyan-500/30 text-white shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Record Vessel Arrival & Mission Log
                </h3>
                <span className="text-xs text-slate-400">
                  {activeArrivalTrip.boatName} · {activeArrivalTrip.tripNumber}
                </span>
              </div>
              <button
                onClick={() => setActiveArrivalTrip(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nautical Miles Logged</label>
                  <input
                    type="number"
                    value={arrivalData.nauticalMiles}
                    onChange={(e) => setArrivalData({ ...arrivalData, nauticalMiles: Number(e.target.value) })}
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#27C5C1]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fuel Consumed (Liters)</label>
                  <input
                    type="number"
                    value={arrivalData.fuelConsumedLiters}
                    onChange={(e) => setArrivalData({ ...arrivalData, fuelConsumedLiters: Number(e.target.value) })}
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#27C5C1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Commercial Catch (kg)</label>
                  <input
                    type="number"
                    value={arrivalData.catchWeightKg}
                    onChange={(e) => setArrivalData({ ...arrivalData, catchWeightKg: Number(e.target.value) })}
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#27C5C1]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Sea Conditions (1-5)</label>
                  <select
                    value={arrivalData.seaConditionsRating}
                    onChange={(e) => setArrivalData({ ...arrivalData, seaConditionsRating: Number(e.target.value) })}
                    className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#27C5C1]"
                  >
                    <option value="5">5 - Glassy / Calm</option>
                    <option value="4">4 - Slight Chop</option>
                    <option value="3">3 - Moderate Swell</option>
                    <option value="2">2 - Heavy Swell / Wind</option>
                    <option value="1">1 - Severe Rough Waters</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Species Logged (comma separated)</label>
                <input
                  type="text"
                  value={arrivalData.catchSpecies}
                  onChange={(e) => setArrivalData({ ...arrivalData, catchSpecies: e.target.value })}
                  placeholder="Mahi-Mahi x 6, Yellowfin Tuna x 1"
                  className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#27C5C1]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Captain's Remarks & Maintenance Log</label>
                <textarea
                  rows={2}
                  value={arrivalData.logNotes}
                  onChange={(e) => setArrivalData({ ...arrivalData, logNotes: e.target.value })}
                  className="w-full bg-[#063B5C] border border-cyan-500/20 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#27C5C1]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveArrivalTrip(null)}
                className="px-4 py-2 rounded-xl text-slate-300 hover:text-white text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmArrival}
                disabled={isSubmitting}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-xs px-5 py-2.5 rounded-xl transition-colors shadow-lg flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Log Vessel Docked & Complete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
