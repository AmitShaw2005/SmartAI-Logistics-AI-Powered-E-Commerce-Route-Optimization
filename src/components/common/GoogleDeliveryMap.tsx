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
  calculateDynamicSpeed,
} from '../../utils/geoAnimation';
import {
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Navigation,
  Crosshair,
  Layers,
  AlertTriangle,
  CloudRain,
  CloudLightning,
  Sun,
  Cloud,
  Eye,
  Thermometer,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { TrafficSegment, TrafficIncident, WeatherTelemetry, WeatherCondition, TrafficCondition } from '../../types';

interface GoogleDeliveryMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarkerItem[];
  polyline?: [number, number][];
  alternativePolyline?: [number, number][];
  trafficSegments?: TrafficSegment[];
  incidents?: TrafficIncident[];
  weatherTelemetry?: WeatherTelemetry;
  weatherCondition?: WeatherCondition;
  trafficCondition?: TrafficCondition;
  height?: string;
  className?: string;
  vehicleType?: 'electric_bike' | 'motorcycle' | 'car' | 'electric_van';
  showControls?: boolean;
}

// Subcomponent: Native Google Maps Traffic Layer
function GoogleTrafficLayer({ enabled }: { enabled: boolean }) {
  const map = useMap();
  const layerRef = useRef<google.maps.TrafficLayer | null>(null);

  useEffect(() => {
    if (!map || typeof google === 'undefined') return;

    if (enabled) {
      if (!layerRef.current) {
        layerRef.current = new google.maps.TrafficLayer();
      }
      layerRef.current.setMap(map);
    } else if (layerRef.current) {
      layerRef.current.setMap(null);
    }

    return () => {
      if (layerRef.current) {
        layerRef.current.setMap(null);
      }
    };
  }, [map, enabled]);

  return null;
}

// Subcomponent: Render Google Maps Polylines (Planned, Traffic Segments, Traveled, Alternative)
function GooglePolylines({
  polyline,
  traveledPath,
  alternativePolyline,
  trafficSegments,
}: {
  polyline: [number, number][];
  traveledPath: [number, number][];
  alternativePolyline: [number, number][];
  trafficSegments?: TrafficSegment[];
}) {
  const map = useMap();
  const segmentLinesRef = useRef<google.maps.Polyline[]>([]);
  const mainLineRef = useRef<google.maps.Polyline | null>(null);
  const traveledLineRef = useRef<google.maps.Polyline | null>(null);
  const altLineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || typeof google === 'undefined') return;

    // Clear previous segment lines
    segmentLinesRef.current.forEach(l => l.setMap(null));
    segmentLinesRef.current = [];

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

    // 2. Traffic-Aware Polylines
    if (trafficSegments && trafficSegments.length > 0 && polyline.length > 1) {
      // Hide base single blue line if rendering granular traffic segments
      if (mainLineRef.current) {
        mainLineRef.current.setMap(null);
        mainLineRef.current = null;
      }

      trafficSegments.forEach(seg => {
        const segPoints = polyline.slice(seg.startIdx, seg.endIdx + 1);
        if (segPoints.length > 1) {
          const poly = new google.maps.Polyline({
            path: segPoints.map(([lat, lng]) => ({ lat, lng })),
            strokeColor: seg.color,
            strokeOpacity: 0.9,
            strokeWeight: 7,
            map,
          });
          segmentLinesRef.current.push(poly);
        }
      });
    } else if (polyline && polyline.length > 1) {
      // Fallback to vibrant blue
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
      segmentLinesRef.current.forEach(l => l.setMap(null));
      segmentLinesRef.current = [];
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
  }, [map, polyline, traveledPath, alternativePolyline, trafficSegments]);

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
  trafficSegments = [],
  incidents = [],
  weatherTelemetry,
  weatherCondition = 'CLEAR',
  trafficCondition = 'MEDIUM',
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
  const [showTrafficLayer, setShowTrafficLayer] = useState<boolean>(true);
  const [selectedIncident, setSelectedIncident] = useState<TrafficIncident | null>(null);

  const totalDistanceKm = getPolylineTotalDistanceKm(polyline);

  // Derive vehicle position, heading, and traveled polyline
  const anim = interpolatePolyline(polyline, traveledDistKm);
  const vehiclePos: [number, number] = anim.pos[0] !== 0 ? anim.pos : center;
  const heading = anim.heading;

  // Determine current active traffic condition along vehicle's current segment
  const currentSegment = trafficSegments?.find(
    s => anim.segmentIndex >= s.startIdx && anim.segmentIndex <= s.endIdx
  );
  const currentSegmentTraffic = currentSegment?.status || trafficCondition;

  // Determine if vehicle is currently passing near any traffic incident
  const isNearBottleneck = incidents.some(inc => {
    const latDiff = Math.abs(vehiclePos[0] - inc.lat);
    const lngDiff = Math.abs(vehiclePos[1] - inc.lng);
    return latDiff < 0.0015 && lngDiff < 0.0015;
  });

  const dynamicTelemetry = calculateDynamicSpeed(
    35,
    currentSegmentTraffic,
    weatherCondition,
    isNearBottleneck
  );

  // Traveled coordinates slice for trailing polyline
  const traveledPath: [number, number][] = [];
  if (polyline.length > 0 && anim.segmentIndex >= 0) {
    for (let i = 0; i <= anim.segmentIndex; i++) {
      traveledPath.push(polyline[i]);
    }
    traveledPath.push(vehiclePos);
  }

  // Animation loop with dynamic speed adaptation
  useEffect(() => {
    if (!isPlaying || polyline.length < 2 || totalDistanceKm <= 0) return;

    // Base speed throttled by real-time traffic and weather conditions!
    const effectiveSpeedKmH = Math.max(6, dynamicTelemetry.speedKmH);
    const speedKmS = effectiveSpeedKmH / 3600;
    const intervalMs = 60; // ~16 fps updates
    const stepKm = speedKmS * (intervalMs / 1000) * speedMultiplier;

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
  }, [isPlaying, speedMultiplier, polyline, totalDistanceKm, dynamicTelemetry.speedKmH]);

  // Points for bounds fitting
  const allPoints: [number, number][] = [
    ...polyline,
    ...markers.map(m => [m.lat, m.lng] as [number, number]),
    ...incidents.map(i => [i.lat, i.lng] as [number, number]),
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

  const renderWeatherIcon = () => {
    switch (weatherCondition) {
      case 'THUNDERSTORM':
        return <CloudLightning className="w-4 h-4 text-amber-400" />;
      case 'RAIN':
        return <CloudRain className="w-4 h-4 text-sky-400" />;
      case 'HEATWAVE':
        return <Sun className="w-4 h-4 text-amber-500 animate-spin" />;
      case 'FOG':
        return <Eye className="w-4 h-4 text-slate-300" />;
      case 'CLOUDY':
        return <Cloud className="w-4 h-4 text-slate-300" />;
      case 'CLEAR':
      default:
        return <Sun className="w-4 h-4 text-amber-400" />;
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

            {/* Native Google Maps Live Traffic Overlay */}
            <GoogleTrafficLayer enabled={showTrafficLayer} />

            {/* Polylines for Route (Traffic Colored Segments) */}
            <GooglePolylines
              polyline={polyline}
              traveledPath={traveledPath}
              alternativePolyline={alternativePolyline}
              trafficSegments={trafficSegments}
            />

            {/* Active Traffic Bottleneck & Incident Markers */}
            {incidents.map(inc => (
              <AdvancedMarker
                key={inc.id}
                position={{ lat: inc.lat, lng: inc.lng }}
                title={`${inc.title}: ${inc.description}`}
              >
                <div
                  onClick={() => setSelectedIncident(inc)}
                  className={`flex flex-col items-center cursor-pointer group transform hover:scale-110 transition-transform ${
                    inc.severity === 'CRITICAL' ? 'animate-bounce' : ''
                  }`}
                >
                  <div
                    className={`px-2 py-1 rounded-xl text-white text-xs font-black shadow-lg flex items-center gap-1 border-2 border-white ${
                      inc.type === 'WATERLOGGING'
                        ? 'bg-blue-600 ring-2 ring-blue-300'
                        : inc.severity === 'CRITICAL'
                        ? 'bg-red-600 ring-2 ring-red-400'
                        : 'bg-amber-600 ring-2 ring-amber-300'
                    }`}
                  >
                    <span>{inc.type === 'WATERLOGGING' ? '🌧️' : inc.type === 'BOTTLENECK' ? '🛑' : '⚠️'}</span>
                    <span className="text-[10px] font-extrabold whitespace-nowrap">
                      +{inc.delayImpactMinutes}m
                    </span>
                  </div>
                  <span className="text-[9px] font-bold bg-slate-900/90 text-white px-1.5 py-0.5 rounded-md mt-0.5 shadow-xs whitespace-nowrap">
                    {inc.title}
                  </span>
                </div>
              </AdvancedMarker>
            ))}

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
                  {/* Radar Pulse Beacon with traffic-responsive glow */}
                  <span
                    className="absolute w-12 h-12 rounded-full animate-ping"
                    style={{ backgroundColor: `${dynamicTelemetry.color}40` }}
                  />
                  <span
                    className="absolute w-8 h-8 rounded-full"
                    style={{ backgroundColor: `${dynamicTelemetry.color}30` }}
                  />

                  {/* Vehicle Body with Directional Heading Rotation */}
                  <div
                    className="relative w-10 h-10 rounded-2xl bg-white shadow-2xl flex items-center justify-center text-xl transition-transform duration-75 ease-linear cursor-pointer"
                    style={{
                      transform: `rotate(${Math.round(heading)}deg)`,
                      border: `2px solid ${dynamicTelemetry.color}`,
                    }}
                  >
                    <span>{renderVehicleIcon()}</span>
                  </div>

                  {/* Directional Pointer arrow */}
                  <div
                    className="absolute -top-1.5 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px]"
                    style={{
                      transform: `rotate(${Math.round(heading)}deg)`,
                      transformOrigin: 'center 20px',
                      borderBottomColor: dynamicTelemetry.color,
                    }}
                  />
                </div>
              </AdvancedMarker>
            )}
          </Map>
        </div>
      </APIProvider>

      {/* Floating Real-Time Vehicle Telemetry Overlay (Top Left) */}
      <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md text-white p-2.5 sm:p-3 rounded-2xl shadow-xl border border-white/10 flex items-center gap-3 text-xs max-w-xs">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl border flex items-center justify-center font-bold text-sm shadow-inner"
            style={{
              borderColor: `${dynamicTelemetry.color}80`,
              backgroundColor: `${dynamicTelemetry.color}20`,
            }}
          >
            {renderVehicleIcon()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: dynamicTelemetry.color }}
              />
              <span className="font-extrabold text-[11px] tracking-wide text-white uppercase">
                {dynamicTelemetry.label}
              </span>
            </div>
            <div className="text-[10px] text-slate-300 font-medium">
              Speed:{' '}
              <strong style={{ color: dynamicTelemetry.color }}>
                {Math.round(dynamicTelemetry.speedKmH * speedMultiplier)} km/h
              </strong>{' '}
              &bull; Heading: <strong className="text-blue-300">{Math.round(heading)}°</strong>
            </div>
          </div>
        </div>

        <div className="h-7 w-[1px] bg-white/20 hidden sm:block" />

        <div className="hidden sm:block">
          <div className="text-[10px] text-slate-400 font-medium">Progress</div>
          <div className="text-[11px] font-extrabold text-blue-200">
            {traveledDistKm.toFixed(1)} / {totalDistanceKm.toFixed(1)} km (
            {Math.min(100, Math.round((traveledDistKm / Math.max(0.1, totalDistanceKm)) * 100))}%)
          </div>
        </div>
      </div>

      {/* Floating Weather & Environmental Telemetry HUD (Top Right) */}
      {weatherTelemetry && (
        <div className="absolute top-3 right-3 z-10 bg-slate-900/90 backdrop-blur-md text-white p-2.5 rounded-2xl shadow-xl border border-white/10 flex items-center gap-2.5 text-xs">
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center">
            {renderWeatherIcon()}
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-white">
              <span>{weatherCondition}</span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-amber-300">{weatherTelemetry.temperatureC}°C</span>
            </div>
            <div className="text-[10px] text-slate-300 flex items-center gap-2">
              <span>Friction: <strong className="text-emerald-400">{weatherTelemetry.roadFrictionIndex}</strong></span>
              <span>Braking: <strong className={weatherTelemetry.brakingDistancePenaltyPercent > 20 ? 'text-rose-400' : 'text-slate-300'}>+{weatherTelemetry.brakingDistancePenaltyPercent}%</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Incident Details Modal Popup if clicked */}
      {selectedIncident && (
        <div className="absolute top-16 left-3 right-3 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-rose-200 flex items-start justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="font-black text-slate-900 flex items-center gap-2">
                <span>{selectedIncident.title}</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-100 text-rose-800 font-extrabold uppercase">
                  {selectedIncident.severity}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">{selectedIncident.description}</p>
              <div className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-2">
                <span>Estimated Delay Impact: +{selectedIncident.delayImpactMinutes} minutes</span>
                {selectedIncident.detourRecommended && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    AI Smart Detour Recommended
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedIncident(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 text-sm font-black"
          >
            ✕
          </button>
        </div>
      )}

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

          {/* Traffic Legend Pill */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 text-[10px] font-semibold text-slate-600">
            <span className="text-slate-400 uppercase text-[9px]">Corridor:</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Flow</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Moderate</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Congested</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-800" />
              <span>Gridlock</span>
            </span>
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

          {/* Traffic Layer Toggle, Map Layer Switcher & Auto-Follow */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowTrafficLayer(!showTrafficLayer)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1 border transition-colors ${
                showTrafficLayer
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
              title="Toggle Live Google Maps Traffic Layer"
            >
              <span>🚦</span>
              <span>{showTrafficLayer ? 'Traffic ON' : 'Traffic OFF'}</span>
            </button>

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
