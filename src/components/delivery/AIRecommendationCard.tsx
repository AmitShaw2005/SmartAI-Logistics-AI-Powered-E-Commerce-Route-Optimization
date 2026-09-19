import React from 'react';
import { Sparkles, Brain, CheckCircle2, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { RouteOptimizationResult, SimulationState } from '../../types';

interface AIRecommendationCardProps {
  route: RouteOptimizationResult | null;
  simulation: SimulationState | null;
  onReoptimize?: () => void;
  loading?: boolean;
}

export const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({
  route,
  simulation,
  onReoptimize,
  loading = false,
}) => {
  if (!route) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl space-y-4 border border-indigo-800/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-blue-200">
              AI Dispatch Reasoning Engine
            </h3>
            <span className="text-[10px] text-slate-400">Powered by Gemini 3.8 Flash</span>
          </div>
        </div>

        {onReoptimize && (
          <button
            onClick={onReoptimize}
            disabled={loading}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-blue-200 text-xs font-semibold rounded-lg border border-white/10 transition-colors disabled:opacity-50"
          >
            {loading ? 'Re-calculating...' : 'Re-optimize Route'}
          </button>
        )}
      </div>

      {/* Explanation text */}
      <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-xs text-blue-100/90 leading-relaxed">
        {route.aiExplanation}
      </div>

      {/* Traffic & Weather Impact Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 bg-black/20 rounded-xl border border-white/5">
          <div className="text-[10px] text-slate-400 font-semibold mb-0.5">Traffic Analysis</div>
          <div className="text-slate-200 text-[11px] font-medium">{route.trafficImpact}</div>
        </div>
        <div className="p-2.5 bg-black/20 rounded-xl border border-white/5">
          <div className="text-[10px] text-slate-400 font-semibold mb-0.5">Weather Advisory</div>
          <div className="text-slate-200 text-[11px] font-medium">{route.weatherImpact}</div>
        </div>
      </div>

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
