import React, { useState, useEffect } from 'react';
import { Truck, Zap, Fuel, Star, MapPin, CheckCircle2, ShieldCheck, Power } from 'lucide-react';
import { DeliveryPartner } from '../../types';
import { api } from '../../services/api';

export const FleetManagement: React.FC = () => {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFleet = async () => {
    try {
      const res = await api.getFleet();
      setPartners(res.partners);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFleet();
    const timer = setInterval(loadFleet, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Active Delivery Fleet ({partners.length})</h2>
          <p className="text-xs text-slate-400">Real-time status, vehicle modes, and energy metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {partners.map(p => {
          const isElectric = p.fuelType === 'Electric';
          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{p.name}</h3>
                      <div className="text-[10px] text-slate-400">{p.phone}</div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                      p.isOnline
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        p.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    {p.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Vehicle specifications */}
                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vehicle:</span>
                    <span className="font-semibold text-slate-800">
                      {p.vehicleType.replace('_', ' ')} ({p.vehiclePlate})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Energy Engine:</span>
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        isElectric ? 'text-emerald-700' : 'text-blue-700'
                      }`}
                    >
                      {isElectric ? <Zap className="w-3.5 h-3.5" /> : <Fuel className="w-3.5 h-3.5" />}
                      {p.fuelType} ({p.vehicleEfficiency} {isElectric ? 'kWh/100km' : 'L/100km'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current GPS:</span>
                    <span className="text-[11px] font-mono text-slate-600">
                      {p.currentLocation.lat.toFixed(4)}, {p.currentLocation.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-[10px] text-slate-400">Deliveries</div>
                  <div className="font-black text-slate-900 mt-0.5">{p.totalDeliveries}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Rating</div>
                  <div className="font-black text-amber-600 mt-0.5 flex items-center justify-center gap-0.5">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{p.rating}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Total Dist</div>
                  <div className="font-black text-slate-900 mt-0.5">{p.totalDistanceKm} km</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
