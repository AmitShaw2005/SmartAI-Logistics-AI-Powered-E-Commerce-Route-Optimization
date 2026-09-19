import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Zap,
  RefreshCw,
  Compass,
  CloudRain,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';
import { RouteOptimizationResult, SimulationState } from '../../types';

interface AIRecommendationCardProps {
  route: RouteOptimizationResult | null;
  simulation: SimulationState | null;
  onReoptimize?: () => void;
  loading?: boolean;
  onToggleDetour?: (apply: boolean) => void;
  detourActive?: boolean;
  onAutoDetectEnv?: () => void;
  autoDetecting?: boolean;
}

export const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({
  route,
  simulation,
  onReoptimize,
  loading = false,
  onToggleDetour,
  detourActive = false,
  onAutoDetectEnv,
  autoDetecting = false,
}) => {
  if (!route) return null;

  const weather = route.weatherTelemetry;
  const hasSmartDetour = Boolean(route.smartDetourPolyline && route.smartDetourPolyline.length > 0);
  const criticalIncidents = (route.incidents || []).filter(
    i => i.severity === 'CRITICAL' || i.severity === 'HIGH'
  );

  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 border border-indigo-800/40">
      {/* Header with AI branding and quick actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-200">
              AI Dispatch Reasoning Engine
            </h3>
            <span className="text-[10px] text-slate-400">Gemini Live Routing Logic</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onAutoDetectEnv && (
            <button
              onClick={onAutoDetectEnv}
              disabled={autoDetecting}
              className="p-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 text-xs font-semibold rounded-lg border border-sky-400/30 transition-colors disabled:opacity-50 flex items-center gap-1"
              title="Auto-detect current traffic & weather conditions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoDetecting ? 'animate-spin text-sky-400' : ''}`} />
              <span className="hidden sm:inline text-[11px]">{autoDetecting ? 'Scanning...' : 'Auto-Detect'}</span>
            </button>
          )}

          {onReoptimize && (
            <button
              onClick={onReoptimize}
              disabled={loading}
              className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-blue-200 text-xs font-semibold rounded-lg border border-white/10 transition-colors disabled:opacity-50"
            >
              {loading ? 'Optimizing...' : 'Re-optimize'}
            </button>
          )}
        </div>
      </div>

      {/* Explanation text */}
      <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-xs text-blue-100/90 leading-relaxed">
        {route.aiExplanation}
      </div>

      {/* Real-Time Smart Detour Recommendation Banner */}
      {hasSmartDetour && onToggleDetour && (
        <div className={`p-3 rounded-2xl border transition-all ${
          detourActive
            ? 'bg-emerald-950/60 border-emerald-500/50'
            : 'bg-amber-950/50 border-amber-500/50'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Zap className={`w-4 h-4 shrink-0 mt-0.5 ${detourActive ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{detourActive ? 'Smart Detour Route Active' : 'Detour Recommendation Available'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded font-black text-amber-200">
                    Saves ~10-15 mins
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {detourActive
                    ? 'Route actively navigates elevated bypass road, bypassing severe bottleneck segments.'
                    : 'AI detected heavy corridor congestion/waterlogging ahead. A smart bypass detour is pre-computed.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onToggleDetour(!detourActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 shadow-sm transition-all border ${
                detourActive
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-white/20'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black border-emerald-400'
              }`}
            >
              {detourActive ? 'Revert to Primary' : 'Apply AI Detour'}
            </button>
          </div>
        </div>
      )}

      {/* Environmental & Traffic Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="p-3 bg-black/30 rounded-2xl border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
              Traffic Status
            </span>
            <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded">
              {route.trafficSegments?.filter(s => s.status === 'SEVERE' || s.status === 'HIGH').length || 0} Hotspots
            </span>
          </div>
          <div className="text-slate-200 text-[11px] font-medium leading-tight">
            {route.trafficImpact}
          </div>
        </div>

        <div className="p-3 bg-black/30 rounded-2xl border border-white/5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
              Weather & Surface
            </span>
            {weather && (
              <span className="text-[10px] font-black text-sky-300 bg-sky-500/20 px-1.5 py-0.5 rounded">
                {weather.temperatureC}°C &bull; {weather.condition}
              </span>
            )}
          </div>
          <div className="text-slate-200 text-[11px] font-medium leading-tight">
            {route.weatherImpact}
          </div>
        </div>
      </div>

      {/* Detailed Physics/Weather Impact Metrics */}
      {weather && (
        <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Dynamic Safety & Traction Diagnostics</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-black/20 rounded-xl">
              <div className="text-[10px] text-slate-400">Road Friction</div>
              <div className="font-extrabold text-emerald-400 mt-0.5">
                {weather.roadFrictionIndex} <span className="text-[9px] text-slate-400">/ 1.0</span>
              </div>
            </div>
            <div className="p-2 bg-black/20 rounded-xl">
              <div className="text-[10px] text-slate-400">Braking Distance</div>
              <div className={`font-extrabold mt-0.5 ${weather.brakingDistancePenaltyPercent > 20 ? 'text-rose-400' : 'text-slate-200'}`}>
                +{weather.brakingDistancePenaltyPercent}%
              </div>
            </div>
            <div className="p-2 bg-black/20 rounded-xl">
              <div className="text-[10px] text-slate-400">Visibility</div>
              <div className="font-extrabold text-sky-300 mt-0.5">
                {weather.visibilityKm} km
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Incident Alerts List */}
      {criticalIncidents.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Active Corridor Incidents ({criticalIncidents.length})</span>
          </div>
          <div className="space-y-1">
            {criticalIncidents.map(inc => (
              <div
                key={inc.id}
                className="p-2 bg-rose-950/40 border border-rose-800/40 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-rose-200">{inc.title}</span>
                  <span className="text-[10px] text-rose-300/80 ml-1.5">{inc.description}</span>
                </div>
                <span className="text-[10px] font-black text-rose-300 bg-rose-900/60 px-2 py-0.5 rounded-md shrink-0">
                  +{inc.delayImpactMinutes}m
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Checklist */}
      {route.recommendations && route.recommendations.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Operational Recommendations
          </div>
          <div className="space-y-1">
            {route.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
