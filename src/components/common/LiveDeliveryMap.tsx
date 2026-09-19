import React, { useState } from 'react';
import { GoogleDeliveryMap } from './GoogleDeliveryMap';
import { LeafletMap, MapMarkerItem } from './LeafletMap';
import { MapPin, Globe, Sparkles, Activity } from 'lucide-react';
import { TrafficSegment, TrafficIncident, WeatherTelemetry, WeatherCondition, TrafficCondition } from '../../types';

export interface LiveDeliveryMapProps {
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

export const LiveDeliveryMap: React.FC<LiveDeliveryMapProps> = (props) => {
  const [mapEngine, setMapEngine] = useState<'google' | 'leaflet'>('google');

  return (
    <div className="space-y-2">
      {/* Map Engine Selector Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
            <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>Smart Route &amp; Live Traffic Telemetry</span>
          </div>
          {props.trafficCondition && (
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                props.trafficCondition === 'SEVERE'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : props.trafficCondition === 'HIGH'
                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : props.trafficCondition === 'MEDIUM'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              Traffic: {props.trafficCondition}
            </span>
          )}
          {props.weatherCondition && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 hidden sm:inline">
              Weather: {props.weatherCondition}
            </span>
          )}
        </div>

        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <button
            id="switch-google-maps-btn"
            onClick={() => setMapEngine('google')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mapEngine === 'google'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span>Google Maps</span>
          </button>

          <button
            id="switch-leaflet-maps-btn"
            onClick={() => setMapEngine('leaflet')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mapEngine === 'leaflet'
                ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>Leaflet / OSM</span>
          </button>
        </div>
      </div>

      {/* Render Selected Map Engine */}
      {mapEngine === 'google' ? (
        <GoogleDeliveryMap {...props} />
      ) : (
        <LeafletMap {...props} />
      )}
    </div>
  );
};
