import React, { useState, useEffect } from 'react';
import { X, Activity, CloudSun, AlertTriangle, Gauge, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { SimulationState, TrafficCondition, WeatherCondition } from '../../types';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({ isOpen, onClose, onUpdated }) => {
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [traffic, setTraffic] = useState<TrafficCondition>('MEDIUM');
  const [weather, setWeather] = useState<WeatherCondition>('CLEAR');
  const [fuelPrice, setFuelPrice] = useState<number>(102.5);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.getSimulation().then(data => {
        setSimulation(data.simulation);
        setTraffic(data.simulation.traffic);
        setWeather(data.simulation.weather);
        setFuelPrice(data.simulation.fuelPricePerUnit);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await api.updateSimulation({
        traffic,
        weather,
        fuelPricePerUnit: fuelPrice,
      });
      setSimulation(res.simulation);
      setSuccessMsg('Simulation conditions updated live across all views!');
      if (onUpdated) onUpdated();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        id="simulation-control-card"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Live Traffic & Weather Simulator</h2>
              <p className="text-xs text-slate-500">Test AI route adaptation and dynamic ETAs in real time</p>
            </div>
          </div>
          <button
            id="close-simulation-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Note regarding simulated data */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Simulated Environment:</span> Modifying these parameters dynamically
              updates the OSRM transit calculation multipliers, weather risk penalties, and AI route sequences.
            </p>
          </div>

          {/* Traffic Condition Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Traffic Density Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH', 'SEVERE'] as TrafficCondition[]).map(t => {
                const isSelected = traffic === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTraffic(t)}
                    className={`py-2 px-1 rounded-xl border text-center transition-all ${
                      isSelected
                        ? t === 'LOW'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                          : t === 'MEDIUM'
                          ? 'border-amber-600 bg-amber-50 text-amber-800 font-bold shadow-xs'
                          : t === 'HIGH'
                          ? 'border-orange-600 bg-orange-50 text-orange-800 font-bold shadow-xs'
                          : 'border-rose-600 bg-rose-50 text-rose-800 font-bold shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">{t}</div>
                    <div className="text-[10px] opacity-75">
                      {t === 'LOW'
                        ? '1.0x (Free)'
                        : t === 'MEDIUM'
                        ? '1.25x (+25%)'
                        : t === 'HIGH'
                        ? '1.65x (+65%)'
                        : '2.2x (+120%)'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weather Condition Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Simulated Weather Condition
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { id: 'CLEAR', label: '☀️ Clear', delay: '0 min' },
                  { id: 'CLOUDY', label: '☁️ Overcast', delay: '+1 min' },
                  { id: 'RAIN', label: '🌧️ Heavy Rain', delay: '+4 min/stop' },
                  { id: 'FOG', label: '🌫️ Low Fog', delay: '+3 min/stop' },
                ] as const
              ).map(w => {
                const isSelected = weather === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWeather(w.id)}
                    className={`py-2 px-1 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs font-bold">{w.label}</div>
                    <div className="text-[10px] opacity-75">{w.delay}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fuel Price Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Fuel Price (INR / Liter)
              </label>
              <span className="text-xs font-bold text-blue-600">₹{fuelPrice.toFixed(2)}/L</span>
            </div>
            <input
              type="range"
              min="85"
              max="125"
              step="0.5"
              value={fuelPrice}
              onChange={e => setFuelPrice(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>₹85/L</span>
              <span>Baseline: ₹102.5/L</span>
              <span>₹125/L</span>
            </div>
          </div>

          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl text-center font-medium">
              ✓ {successMsg}
            </div>
          )}

          <div className="flex gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              id="apply-simulation-settings-btn"
              type="button"
              disabled={saving}
              onClick={handleApply}
              className="w-1/2 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Apply Simulation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
