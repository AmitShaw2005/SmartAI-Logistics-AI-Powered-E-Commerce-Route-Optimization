import React, { useEffect, useState, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps';
import { MapMarkerItem } from './LeafletMap';
import {
  interpolatePolyline,
  getPolylineTotalDistanceKm,
} from '../../utils/geoAnimation';
import {
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Navigation,
  Crosshair,
  Layers,
} from 'lucide-react';

interface GoogleDeliveryMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarkerItem[];
  polyline?: [number, number][];
  alternativePolyline?: [number, number][];
  height?: string;
  className?: string;
  vehicleType?: 'electric_bike' | 'motorcycle' | 'car' | 'electric_van';
  showControls?: boolean;
}

// Subcomponent: Render Google Maps Polylines using useMap
function GooglePolylines({
  polyline,
  traveledPath,
  alternativePolyline,
}: {
  polyline: [number, number][];
  traveledPath: [number, number][];
  alternativePolyline: [number, number][];
}) {
  const map = useMap();
  const mainLineRef = useRef<google.maps.Polyline | null>(null);
  const traveledLineRef = useRef<google.maps.Polyline | null>(null);
  const altLineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || typeof google === 'undefined') return;

    // 1. Alternative Route (Dashed gray)
    if (alternativePolyline && alternativePolyline.length > 1) {
      if (!altLineRef.current) {
        altLineRef.current = new google.maps.Polyline({
          strokeColor: '#94a3b8',
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map,
        });
      }
      altLineRef.current.setPath(
        alternativePolyline.map(([lat, lng]) => ({ lat, lng }))
      );
    } else if (altLineRef.current) {
      altLineRef.current.setMap(null);
      altLineRef.current = null;
    }

    // 2. Full Planned Route (Vibrant Blue)
    if (polyline && polyline.length > 1) {
      if (!mainLineRef.current) {
        mainLineRef.current = new google.maps.Polyline({
          strokeColor: '#2563eb',
          strokeOpacity: 0.85,
          strokeWeight: 6,
          map,
        });
      }
      mainLineRef.current.setPath(polyline.map(([lat, lng]) => ({ lat, lng })));
    } else if (mainLineRef.current) {
      mainLineRef.current.setMap(null);
      mainLineRef.current = null;
    }

    // 3. Traveled Path (Emerald green trailing line)
    if (traveledPath && traveledPath.length > 1) {
      if (!traveledLineRef.current) {
        traveledLineRef.current = new google.maps.Polyline({
          strokeColor: '#059669',
          strokeOpacity: 0.95,
          strokeWeight: 6,
          map,
        });
      }
      traveledLineRef.current.setPath(
        traveledPath.map(([lat, lng]) => ({ lat, lng }))
      );
    } else if (traveledLineRef.current) {
      traveledLineRef.current.setMap(null);
      traveledLineRef.current = null;
    }

    return () => {
      if (mainLineRef.current) {
        mainLineRef.current.setMap(null);
        mainLineRef.current = null;
      }
      if (traveledLineRef.current) {
        traveledLineRef.current.setMap(null);
        traveledLineRef.current = null;
      }
      if (altLineRef.current) {
        altLineRef.current.setMap(null);
        altLineRef.current = null;
      }
    };
  }, [map, polyline, traveledPath, alternativePolyline]);

  return null;
}

// Subcomponent: Auto-fit viewport bounds
function BoundsController({
  points,
  followVehicle,
  vehiclePos,
}: {
  points: [number, number][];
  followVehicle: boolean;
  vehiclePos: [number, number];
}) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    if (!map || typeof google === 'undefined' || points.length === 0) return;

    if (!hasFittedRef.current) {
      const bounds = new google.maps.LatLngBounds();
      points.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 60, right: 60 });
      hasFittedRef.current = true;
    }
  }, [map, points]);

  useEffect(() => {
    if (followVehicle && map && vehiclePos[0] !== 0) {
      map.panTo({ lat: vehiclePos[0], lng: vehiclePos[1] });
    }
  }, [followVehicle, map, vehiclePos]);

  return null;
}

export const GoogleDeliveryMap: React.FC<GoogleDeliveryMapProps> = ({
  center = [12.9716, 77.6412],
  zoom = 14,
  markers = [],
  polyline = [],
  alternativePolyline = [],
  height = '420px',
  className = '',
  vehicleType = 'electric_bike',
  showControls = true,
}) => {
  const apiKey =
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
    'AIzaSyBYmVhscdQFS0cPe7cJCjvSJ6Wv64s37kU';

  // Animation State
  const [isPlaying, setIsPlaying] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(2); // 2x by default for smooth visual demo
  const [traveledDistKm, setTraveledDistKm] = useState<number>(0);
  const [followVehicle, setFollowVehicle] = useState<boolean>(false);
  const [selectedVehicle, setSelectedVehicle] = useState<'electric_bike' | 'motorcycle' | 'car' | 'electric_van'>(vehicleType);
  const [mapTypeId, setMapTypeId] = useState<string>('roadmap');

  const totalDistanceKm = getPolylineTotalDistanceKm(polyline);

  // Derive vehicle position, heading, and traveled polyline
  const anim = interpolatePolyline(polyline, traveledDistKm);
  const vehiclePos: [number, number] = anim.pos[0] !== 0 ? anim.pos : center;
  const heading = anim.heading;

  // Traveled coordinates slice for trailing polyline
  const traveledPath: [number, number][] = [];
  if (polyline.length > 0 && anim.segmentIndex >= 0) {
    for (let i = 0; i <= anim.segmentIndex; i++) {
      traveledPath.push(polyline[i]);
    }
    traveledPath.push(vehiclePos);
  }

  // Animation loop
  useEffect(() => {
    if (!isPlaying || polyline.length < 2 || totalDistanceKm <= 0) return;

    // Approx 35 km/h base speed
    const baseSpeedKmS = 35 / 3600;
    const intervalMs = 60; // ~16 fps updates
    const stepKm = baseSpeedKmS * (intervalMs / 1000) * speedMultiplier;

    const timer = setInterval(() => {
      setTraveledDistKm(prev => {
        const next = prev + stepKm;
        if (next >= totalDistanceKm) {
          // Loop or pause at end
          return 0; // restart seamless loop
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speedMultiplier, polyline, totalDistanceKm]);

  // Points for bounds fitting
  const allPoints: [number, number][] = [
    ...polyline,
    ...markers.map(m => [m.lat, m.lng] as [number, number]),
  ];

  // Vehicle Icon selector
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
    <div className={`relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs ${className}`}>
      {/* Google Maps API Provider */}
      <APIProvider apiKey={apiKey}>
        <div style={{ width: '100%', height }}>
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={{ lat: center[0], lng: center[1] }}
            defaultZoom={zoom}
            mapTypeId={mapTypeId}
            gestureHandling="greedy"
            disableDefaultUI={false}
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Auto fit bounds & follow controller */}
            <BoundsController
              points={allPoints}
              followVehicle={followVehicle}
              vehiclePos={vehiclePos}
            />

            {/* Polylines for Route */}
            <GooglePolylines
              polyline={polyline}
              traveledPath={traveledPath}
              alternativePolyline={alternativePolyline}
            />

            {/* Stop and Warehouse Markers */}
            {markers.map(marker => {
              if (marker.type === 'partner') return null; // moving vehicle rendered separately

              return (
                <AdvancedMarker
                  key={marker.id}
                  position={{ lat: marker.lat, lng: marker.lng }}
                  title={marker.title}
                >
                  {marker.type === 'warehouse' ? (
                    <div className="flex flex-col items-center group cursor-pointer">
                      <div className="w-9 h-9 rounded-2xl bg-slate-900 border-2 border-white shadow-xl flex items-center justify-center text-white text-base">
                        🏢
                      </div>
                      <span className="text-[10px] font-bold bg-slate-900/90 text-white px-2 py-0.5 rounded-md mt-1 shadow-xs whitespace-nowrap">
                        {marker.title}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center group cursor-pointer">
                      <div
                        className={`w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center font-black text-white text-xs ${
                          marker.priority === 'EXPRESS'
                            ? 'bg-rose-600 ring-4 ring-rose-300 animate-bounce'
                            : 'bg-emerald-600'
                        }`}
                      >
                        {marker.sequenceNumber || '📍'}
                      </div>
                      <span className="text-[10px] font-bold bg-white text-slate-800 border border-slate-200 px-2 py-0.5 rounded-md mt-1 shadow-xs whitespace-nowrap">
                        {marker.title}
                      </span>
                    </div>
                  )}
                </AdvancedMarker>
              );
            })}

            {/* REAL-TIME MOVING VEHICLE MARKER */}
            {polyline.length > 0 && (
              <AdvancedMarker
                position={{ lat: vehiclePos[0], lng: vehiclePos[1] }}
                title={`Live Delivery Partner: ${selectedVehicle}`}
              >
                <div className="relative flex items-center justify-center">
                  {/* Radar Pulse Beacon */}
                  <span className="absolute w-12 h-12 rounded-full bg-blue-500/30 animate-ping" />
                  <span className="absolute w-8 h-8 rounded-full bg-blue-600/20" />

                  {/* Vehicle Body with Directional Heading Rotation */}
                  <div
                    className="relative w-10 h-10 rounded-2xl bg-white border-2 border-blue-600 shadow-2xl flex items-center justify-center text-xl transition-transform duration-75 ease-linear cursor-pointer"
                    style={{
                      transform: `rotate(${Math.round(heading)}deg)`,
                    }}
                  >
                    <span>{renderVehicleIcon()}</span>
                  </div>

                  {/* Directional Pointer arrow */}
                  <div
                    className="absolute -top-1.5 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-blue-600"
                    style={{
                      transform: `rotate(${Math.round(heading)}deg)`,
                      transformOrigin: 'center 20px',
                    }}
                  />
                </div>
              </AdvancedMarker>
            )}
          </Map>
        </div>
      </APIProvider>

      {/* Floating Real-Time Vehicle Telemetry Overlay */}
      <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-white/10 flex items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 font-bold text-sm">
            {renderVehicleIcon()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-extrabold text-[11px] tracking-wide text-white uppercase">
                Live GPS Transit
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
          <div className="text-[10px] text-slate-400 font-medium">Route Progress</div>
          <div className="text-[11px] font-extrabold text-blue-200">
            {traveledDistKm.toFixed(1)} / {totalDistanceKm.toFixed(1)} km ({Math.min(100, Math.round((traveledDistKm / Math.max(0.1, totalDistanceKm)) * 100))}%)
          </div>
        </div>
      </div>

      {/* Floating Interactive Controls Panel */}
      {showControls && (
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-white/95 backdrop-blur-md p-2.5 rounded-2xl shadow-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Playback Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1"
              title={isPlaying ? 'Pause Movement' : 'Play Movement'}
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

            {/* Speed Multiplier */}
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

          {/* Vehicle Type Switcher */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase mr-1">Vehicle:</span>
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
                title={v.label}
              >
                <span>{v.icon}</span>
                <span className="hidden sm:inline text-[11px]">{v.label}</span>
              </button>
            ))}
          </div>

          {/* Map Layer Switcher & Auto-Follow */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFollowVehicle(!followVehicle)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 border transition-colors ${
                followVehicle
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title="Camera follows vehicle automatically"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>{followVehicle ? 'Following' : 'Follow'}</span>
            </button>

            <select
              value={mapTypeId}
              onChange={e => setMapTypeId(e.target.value)}
              className="px-2 py-1 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 focus:outline-hidden"
            >
              <option value="roadmap">Roadmap</option>
              <option value="satellite">Satellite</option>
              <option value="hybrid">Hybrid</option>
              <option value="terrain">Terrain</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
