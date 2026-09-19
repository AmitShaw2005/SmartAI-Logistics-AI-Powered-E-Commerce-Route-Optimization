import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  interpolatePolyline,
  getPolylineTotalDistanceKm,
} from '../../utils/geoAnimation';
import {
  Play,
  Pause,
  RotateCcw,
  Crosshair,
  Gauge,
  Navigation,
} from 'lucide-react';

export interface MapMarkerItem {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type: 'partner' | 'warehouse' | 'stop' | 'completed';
  sequenceNumber?: number;
  priority?: 'NORMAL' | 'HIGH' | 'EXPRESS';
  description?: string;
  eta?: string;
  itemsSummary?: string;
}

interface LeafletMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarkerItem[];
  polyline?: [number, number][];
  alternativePolyline?: [number, number][];
  height?: string;
  className?: string;
  interactive?: boolean;
  vehicleType?: 'electric_bike' | 'motorcycle' | 'car' | 'electric_van';
  showControls?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center = [12.9716, 77.6412],
  zoom = 14,
  markers = [],
  polyline = [],
  alternativePolyline = [],
  height = '420px',
  className = '',
  interactive = true,
  vehicleType = 'electric_bike',
  showControls = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const traveledPolylineRef = useRef<L.Polyline | null>(null);

  // Animation State
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(2);
  const [traveledDistKm, setTraveledDistKm] = useState<number>(0);
  const [followVehicle, setFollowVehicle] = useState<boolean>(false);
  const [selectedVehicle, setSelectedVehicle] = useState<'electric_bike' | 'motorcycle' | 'car' | 'electric_van'>(vehicleType);

  const totalDistanceKm = getPolylineTotalDistanceKm(polyline);
  const anim = interpolatePolyline(polyline, traveledDistKm);
  const vehiclePos: [number, number] = anim.pos[0] !== 0 ? anim.pos : center;
  const heading = anim.heading;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: interactive,
        dragging: interactive,
        touchZoom: interactive,
        doubleClickZoom: interactive,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      const layers = L.layerGroup().addTo(map);
      layerGroupRef.current = layers;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Static Elements (Alternative Route, Planned Route, Static Markers)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();
    vehicleMarkerRef.current = null;
    traveledPolylineRef.current = null;

    const bounds = L.latLngBounds([]);

    // 1. Alternative Route (Dashed gray)
    if (alternativePolyline && alternativePolyline.length > 1) {
      const altLine = L.polyline(alternativePolyline, {
        color: '#94a3b8',
        weight: 3,
        dashArray: '6, 8',
        opacity: 0.7,
      });
      layers.addLayer(altLine);
      alternativePolyline.forEach(pt => bounds.extend(pt));
    }

    // 2. Optimized Planned Route (Vibrant Blue)
    if (polyline && polyline.length > 1) {
      const routeLine = L.polyline(polyline, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      });
      layers.addLayer(routeLine);
      polyline.forEach(pt => bounds.extend(pt));
    }

    // 3. Traveled Polyline (Emerald Green)
    const traveledLine = L.polyline([], {
      color: '#059669',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
    });
    layers.addLayer(traveledLine);
    traveledPolylineRef.current = traveledLine;

    // 4. Static Markers (Warehouse, Stops)
    markers.forEach(marker => {
      if (marker.type === 'partner') return; // moving vehicle rendered separately
      bounds.extend([marker.lat, marker.lng]);

      let iconHtml = '';
      let iconSize: [number, number] = [36, 36];
      let iconAnchor: [number, number] = [18, 18];

      if (marker.type === 'warehouse') {
        iconSize = [38, 38];
        iconAnchor = [19, 19];
        iconHtml = `
          <div class="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white text-base">
            🏢
          </div>
        `;
      } else {
        const isExpress = marker.priority === 'EXPRESS';
        const bgClass = isExpress ? 'bg-rose-600 ring-4 ring-rose-300 animate-bounce' : 'bg-emerald-600';
        iconHtml = `
          <div class="relative flex flex-col items-center">
            <div class="w-8 h-8 ${bgClass} text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white text-xs font-black">
              ${marker.sequenceNumber || '•'}
            </div>
            ${
              isExpress
                ? '<span class="absolute -top-3 bg-rose-700 text-white text-[9px] font-bold px-1.5 rounded-full uppercase tracking-wider">EXP</span>'
                : ''
            }
          </div>
        `;
      }

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: iconHtml,
        iconSize,
        iconAnchor,
        popupAnchor: [0, -iconAnchor[1]],
      });

      const leafletMarker = L.marker([marker.lat, marker.lng], { icon: customIcon });
      leafletMarker.bindPopup(`
        <div class="p-2 min-w-[180px] text-slate-800">
          <div class="font-bold text-xs">${marker.title}</div>
          <div class="text-[11px] text-slate-500">${marker.description || ''}</div>
          ${marker.eta ? `<div class="text-[11px] font-bold text-blue-600 mt-1">ETA: ${marker.eta}</div>` : ''}
        </div>
      `);
      layers.addLayer(leafletMarker);
    });

    // Auto-fit initial bounds
    if (bounds.isValid() && (markers.length > 0 || polyline.length > 0)) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [markers, polyline, alternativePolyline]);

  // Animation Loop for Vehicle Movement
  useEffect(() => {
    if (!isPlaying || polyline.length < 2 || totalDistanceKm <= 0) return;

    const baseSpeedKmS = 35 / 3600;
    const intervalMs = 60;
    const stepKm = baseSpeedKmS * (intervalMs / 1000) * speedMultiplier;

    const timer = setInterval(() => {
      setTraveledDistKm(prev => {
        const next = prev + stepKm;
        if (next >= totalDistanceKm) {
          return 0; // restart seamless loop
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speedMultiplier, polyline, totalDistanceKm]);

  // Update Moving Vehicle Position & Heading in Leaflet
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layerGroupRef.current;
    if (!map || !layers || polyline.length === 0) return;

    const vehicleEmoji =
      selectedVehicle === 'car'
        ? '🚗'
        : selectedVehicle === 'motorcycle'
        ? '🏍️'
        : selectedVehicle === 'electric_van'
        ? '🚐'
        : '🛵';

    const vehicleHtml = `
      <div class="relative flex items-center justify-center w-11 h-11">
        <span class="absolute w-12 h-12 rounded-full bg-blue-500 opacity-40 animate-ping"></span>
        <div class="relative w-10 h-10 bg-white text-slate-900 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-blue-600 text-lg transition-transform duration-75"
             style="transform: rotate(${Math.round(heading)}deg);">
          ${vehicleEmoji}
        </div>
      </div>
    `;

    const vehicleIcon = L.divIcon({
      className: 'moving-vehicle-marker',
      html: vehicleHtml,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (!vehicleMarkerRef.current) {
      const marker = L.marker([vehiclePos[0], vehiclePos[1]], { icon: vehicleIcon });
      marker.bindPopup(`
        <div class="p-1.5 text-xs text-slate-800">
          <strong>Live Courier Transit</strong><br />
          Vehicle: ${selectedVehicle.replace('_', ' ')}<br />
          Heading: ${Math.round(heading)}°
        </div>
      `);
      layers.addLayer(marker);
      vehicleMarkerRef.current = marker;
    } else {
      vehicleMarkerRef.current.setLatLng([vehiclePos[0], vehiclePos[1]]);
      vehicleMarkerRef.current.setIcon(vehicleIcon);
    }

    // Update traveled path coordinates
    if (traveledPolylineRef.current && anim.segmentIndex >= 0) {
      const pts: [number, number][] = [];
      for (let i = 0; i <= anim.segmentIndex; i++) {
        pts.push(polyline[i]);
      }
      pts.push(vehiclePos);
      traveledPolylineRef.current.setLatLngs(pts);
    }

    // Follow vehicle camera pan
    if (followVehicle && vehiclePos[0] !== 0) {
      map.panTo([vehiclePos[0], vehiclePos[1]], { animate: true, duration: 0.2 });
    }
  }, [vehiclePos, heading, selectedVehicle, followVehicle, anim.segmentIndex, polyline]);

  const renderVehicleIcon = () => {
    switch (selectedVehicle) {
      case 'car':
        return '🚗';
      case 'motorcycle':
        return '🏍️';
      case 'electric_van':
        return '🚐';
      case 'electric_bike':
      default:
        return '🛵';
    }
  };

  return (
    <div
      id="leaflet-map-container"
      className={`relative w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200 bg-slate-100 ${className}`}
      style={{ height }}
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Real-time telemetry overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-white/10 flex items-center gap-3 text-xs pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold text-sm">
            {renderVehicleIcon()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-extrabold text-[11px] tracking-wide text-white uppercase">
                Live GPS Movement
              </span>
            </div>
            <div className="text-[10px] text-slate-300 font-medium">
              Speed: <strong className="text-emerald-400">{Math.round(32 * speedMultiplier)} km/h</strong> &bull;{' '}
              Heading: <strong className="text-blue-300">{Math.round(heading)}°</strong>
            </div>
          </div>
        </div>

        <div className="h-7 w-[1px] bg-white/20" />

        <div>
          <div className="text-[10px] text-slate-400 font-medium">Progress</div>
          <div className="text-[11px] font-extrabold text-blue-200">
            {traveledDistKm.toFixed(1)} / {totalDistanceKm.toFixed(1)} km
          </div>
        </div>
      </div>

      {/* Floating Controls */}
      {showControls && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs pointer-events-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="text-[11px] pr-1">{isPlaying ? 'Pause' : 'Resume'}</span>
            </button>

            <button
              onClick={() => setTraveledDistKm(0)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              title="Reset Route Position"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
              {[1, 2, 5, 10].map(multiplier => (
                <button
                  key={multiplier}
                  onClick={() => setSpeedMultiplier(multiplier)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                    speedMultiplier === multiplier
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {multiplier}x
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Switcher */}
          <div className="flex items-center gap-1">
            {[
              { id: 'electric_bike', icon: '🛵', label: 'Scooter' },
              { id: 'motorcycle', icon: '🏍️', label: 'Bike' },
              { id: 'car', icon: '🚗', label: 'Car' },
              { id: 'electric_van', icon: '🚐', label: 'Van' },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicle(v.id as any)}
                className={`px-2 py-1 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all border ${
                  selectedVehicle === v.id
                    ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{v.icon}</span>
                <span className="hidden sm:inline text-[11px]">{v.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setFollowVehicle(!followVehicle)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 border transition-colors ${
              followVehicle
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{followVehicle ? 'Following' : 'Follow'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
