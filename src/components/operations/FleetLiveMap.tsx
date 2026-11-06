import React, { useEffect, useRef, useState } from 'react';
import { Boat, TripRecord } from '../../types/marine.js';
import { Navigation, Compass, Radio, MapPin, Fuel, Anchor, Ship, Layers } from 'lucide-react';
import L from 'leaflet';

interface FleetLiveMapProps {
  boats: Boat[];
  trips: TripRecord[];
  onSelectBoat?: (boat: Boat) => void;
  selectedBoatId?: string;
}

export const FleetLiveMap: React.FC<FleetLiveMapProps> = ({
  boats,
  trips,
  onSelectBoat,
  selectedBoatId
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeGroupRef = useRef<L.LayerGroup | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'docked' | 'at_sea' | 'moored' | 'maintenance'>('all');
  const [selectedVessel, setSelectedVessel] = useState<Boat | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Navlakhi Port / Gulf of Kutch Marine Basin
    const map = L.map(mapContainerRef.current, {
      center: [22.9600, 70.4350],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    // Esri World Ocean Bathymetric Map (Free, designed specifically for maritime operations)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 13,
      attribution: 'Esri, Garmin, GEBCO, NOAA NGDC'
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    const routeGroup = L.layerGroup().addTo(map);

    markersGroupRef.current = markersGroup;
    routeGroupRef.current = routeGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Routes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current || !routeGroupRef.current) return;

    const markers = markersGroupRef.current;
    const routes = routeGroupRef.current;
    markers.clearLayers();
    routes.clearLayers();

    // Filtered boats
    const filtered = activeFilter === 'all' 
      ? boats 
      : boats.filter(b => b.status === activeFilter);

    // Draw active trip routes (e.g., Ocean Hunter IV)
    trips.filter(t => t.status === 'in_progress' && t.routeCoordinates).forEach(trip => {
      if (trip.routeCoordinates && trip.routeCoordinates.length > 1) {
        const polyline = L.polyline(trip.routeCoordinates, {
          color: '#27C5C1',
          weight: 3,
          dashArray: '6, 8',
          opacity: 0.85
        }).addTo(routes);

        // Add destination waypoint marker
        const destCoord = trip.routeCoordinates[trip.routeCoordinates.length - 1];
        const destIcon = L.divIcon({
          className: 'custom-dest-pin',
          html: `
            <div style="background: #FF875E; color: white; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; border: 1px solid white; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.4);">
              📍 ${trip.destination}
            </div>
          `,
          iconSize: [120, 24],
          iconAnchor: [60, 24]
        });
        L.marker(destCoord, { icon: destIcon }).addTo(routes);
      }
    });

    // Render Boat Markers
    filtered.forEach(boat => {
      const isSelected = boat.id === selectedBoatId || boat.id === selectedVessel?.id;
      const statusColor = 
        boat.status === 'at_sea' ? '#0ea5e9' :
        boat.status === 'docked' ? '#10b981' :
        boat.status === 'moored' ? '#f59e0b' : '#ef4444';

      const customIcon = L.divIcon({
        className: 'custom-boat-pin',
        html: `
          <div style="
            background: ${isSelected ? '#FF875E' : '#082F49'}; 
            border: 2px solid ${statusColor}; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.4); 
            width: 38px; 
            height: 38px; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            color: white;
            font-size: 16px;
            cursor: pointer;
            transform: rotate(${boat.location.heading}deg);
            transition: all 0.2s ease;
          ">
            ⛵
          </div>
          <div style="
            background: rgba(8, 47, 73, 0.9);
            color: white;
            font-size: 10px;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid rgba(255,255,255,0.2);
            position: absolute;
            top: 40px;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            pointer-events: none;
          ">
            ${boat.name}
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      const marker = L.marker([boat.location.lat, boat.location.lng], { icon: customIcon });
      
      marker.on('click', () => {
        setSelectedVessel(boat);
        if (onSelectBoat) onSelectBoat(boat);
      });

      marker.addTo(markers);
    });

  }, [boats, trips, activeFilter, selectedBoatId, selectedVessel]);

  return (
    <div className="relative w-full h-[360px] sm:h-[460px] md:h-[540px] lg:h-[600px] rounded-2xl overflow-hidden border border-cyan-500/20 bg-[#063B5C] shadow-xl">
      {/* Map Surface */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Floating Filter & Maritime Header */}
      <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-10 flex flex-col gap-1.5 sm:gap-2 max-w-[calc(100%-20px)] sm:max-w-md">
        <div className="marine-glass px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-white flex items-center gap-2 border border-white/10 shadow-lg">
          <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 shrink-0" />
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-cyan-200 truncate">
            Navlakhi AIS Radar & Fleet Tracking
          </span>
          <span className="text-slate-400 font-mono text-[10px] hidden sm:inline">· {boats.length} Vessels</span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-[#082F49]/95 p-1 rounded-xl border border-white/10 shadow-lg overflow-x-auto scrollbar-none max-w-full">
          {(['all', 'at_sea', 'docked', 'moored', 'maintenance'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-lg capitalize whitespace-nowrap transition-colors touch-target-min flex items-center justify-center ${
                activeFilter === filter
                  ? 'bg-[#27C5C1] text-[#063B5C] font-semibold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {filter.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Vessel Telemetry Floating Card (Responsive Bottom Sheet on Mobile) */}
      {selectedVessel && (
        <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-auto z-10 sm:w-84 bg-[#082F49]/95 text-white p-3.5 sm:p-4 rounded-xl border border-cyan-500/30 shadow-2xl backdrop-blur-md">
          <div className="flex items-start justify-between pb-2 border-b border-white/10 mb-2">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                {selectedVessel.registrationNumber}
              </span>
              <h4 className="text-base font-bold text-white leading-tight">
                {selectedVessel.name}
              </h4>
            </div>
            <button 
              onClick={() => setSelectedVessel(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs py-1 mb-2 font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Status</span>
              <span className="font-semibold text-emerald-400 capitalize">{selectedVessel.status.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Speed / Heading</span>
              <span className="text-cyan-300">{selectedVessel.location.speedKnots} kts · {selectedVessel.location.heading}°</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Current Berth</span>
              <span className="truncate block">{selectedVessel.currentMarinaSlip}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Fuel Level</span>
              <span className="text-amber-300">{selectedVessel.fuelLevelPct}%</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 bg-[#063B5C] p-2 rounded-lg border border-white/5">
            <span className="font-semibold text-cyan-200">Coordinates: </span>
            <span className="font-mono">{selectedVessel.location.lat.toFixed(4)}° N, {Math.abs(selectedVessel.location.lng).toFixed(4)}° W</span>
          </div>
        </div>
      )}
    </div>
  );
};
