import React from 'react';
import { Fuel, Zap, TrendingDown, DollarSign, Award, Leaf } from 'lucide-react';
import { DeliveryPartner, RouteOptimizationResult } from '../../types';

interface FuelTrackerCardProps {
  partner: DeliveryPartner;
  route: RouteOptimizationResult | null;
  fuelPrice: number;
}

export const FuelTrackerCard: React.FC<FuelTrackerCardProps> = ({ partner, route, fuelPrice }) => {
  const isElectric = partner.fuelType === 'Electric';
  const unit = isElectric ? 'kWh' : 'L';

  const baselineDist = route ? route.baselineDistanceKm : 14.5;
  const optimizedDist = route ? route.totalDistanceKm : 10.8;
  const distSaved = Math.max(0, Number((baselineDist - optimizedDist).toFixed(1)));

  const fuelSaved = route ? route.fuelSavedLiters : 0.42;
  const costSaved = route ? route.costSaved : Math.round(fuelSaved * fuelPrice);
  const totalCost = route ? route.estimatedFuelCost : 48;

  // CO2 reduction approx: 2.31 kg CO2 per liter petrol, or clean grid factor for EV
  const co2SavedKg = Number((fuelSaved * (isElectric ? 0.72 : 2.31)).toFixed(2));

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            {isElectric ? <Zap className="w-4 h-4" /> : <Fuel className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Eco & Fuel Efficiency Monitor</h3>
            <p className="text-[10px] text-slate-400">
              Vehicle: {partner.vehicleType.replace('_', ' ')} ({partner.vehiclePlate})
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
          <Leaf className="w-3 h-3" />
          {isElectric ? 'Clean EV' : 'Optimized ICE'}
        </span>
      </div>

      {/* Grid Metrics */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-[10px] font-medium text-slate-400">Distance Saved</div>
          <div className="text-base font-black text-slate-900 mt-0.5">{distSaved} km</div>
          <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
            <TrendingDown className="w-3 h-3" />
            <span>vs Unoptimized</span>
          </div>
        </div>

        <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100">
          <div className="text-[10px] font-medium text-emerald-800">
            {isElectric ? 'Energy Saved' : 'Fuel Saved'}
          </div>
          <div className="text-base font-black text-emerald-900 mt-0.5">
            {fuelSaved} {unit}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
            ~{co2SavedKg} kg CO₂ offset
          </div>
        </div>

        <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
          <div className="text-[10px] font-medium text-blue-800">Cost Saved</div>
          <div className="text-base font-black text-blue-900 mt-0.5">₹{costSaved}</div>
          <div className="text-[10px] text-blue-700 font-semibold mt-0.5">
            @ ₹{fuelPrice.toFixed(1)}/{unit}
          </div>
        </div>
      </div>

      {/* Comparison Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-[11px] text-slate-500">
          <span>Route Distance Comparison</span>
          <span className="font-semibold text-slate-800">
            {optimizedDist} km / {baselineDist} km
          </span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-blue-600 rounded-full"
            style={{ width: `${Math.min(100, (optimizedDist / Math.max(0.1, baselineDist)) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400">
          <span>Optimized Route</span>
          <span>Baseline Route (FIFO)</span>
        </div>
      </div>
    </div>
  );
};
