import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Package,
  Truck,
  DollarSign,
  Clock,
  Leaf,
  Activity,
  Sliders,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AnalyticsSummary, SimulationState } from '../../types';
import { api } from '../../services/api';
import { ProductManagement } from './ProductManagement';
import { OrderManagement } from './OrderManagement';
import { FleetManagement } from './FleetManagement';

interface AdminDashboardProps {
  onOpenSimulation: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenSimulation }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'fleet'>('overview');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [anRes, simRes] = await Promise.all([api.getAnalytics(), api.getSimulation()]);
      setAnalytics(anRes.analytics);
      setSimulation(simRes.simulation);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            Operations & Fleet Control Center
          </h1>
          <p className="text-xs text-slate-400">
            Real-time dark-store dispatch, courier routing, inventory, and simulation monitoring
          </p>
        </div>

        <button
          id="admin-open-sim-btn"
          onClick={onOpenSimulation}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-500/20 flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          <span>Tune Traffic & Weather Simulation</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900">
            ₹{analytics?.totalRevenue.toLocaleString() || '0'}
          </div>
          <div className="text-[10px] text-emerald-600 font-bold">+18.4% today</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Total Orders</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {analytics?.totalOrders || 0}
          </div>
          <div className="text-[10px] text-blue-600 font-bold">100% fulfill rate</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Avg Delivery Time</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {analytics?.averageDeliveryMinutes || 14.5}m
          </div>
          <div className="text-[10px] text-emerald-600 font-bold">Within 15m promise</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Active Couriers</span>
            <Truck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {analytics?.activeDeliveryPartners || 0} Online
          </div>
          <div className="text-[10px] text-slate-400">Zero idle dispatch</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1 col-span-2 lg:col-span-1">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>CO₂ Offset & Fuel</span>
            <Leaf className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700">
            {analytics?.totalFuelSavedLiters || 0} L Saved
          </div>
          <div className="text-[10px] text-emerald-600 font-bold">Clean EV fleet primary</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Dispatch Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'orders'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Orders Management</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'products'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Product Catalog & Stock</span>
        </button>

        <button
          onClick={() => setActiveTab('fleet')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'fleet'
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Fleet & Couriers</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Simulation Status Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Current Environmental Simulation</h2>
              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                Simulated Data
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Traffic Density</span>
                <span className="text-sm font-extrabold text-slate-900 mt-1 block">
                  {simulation?.traffic} ({simulation?.trafficMultiplier}x delay)
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Weather Condition</span>
                <span className="text-sm font-extrabold text-slate-900 mt-1 block">
                  {simulation?.weather} (+{simulation?.weatherDelayMinutes}m delay)
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Fuel Rate</span>
                <span className="text-sm font-extrabold text-slate-900 mt-1 block">
                  ₹{simulation?.fuelPricePerUnit}/L
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              When traffic rises to <strong>HIGH</strong> or <strong>SEVERE</strong>, the routing engine
              recalculates polyline waypoints via bypass corridors and re-sequences stops based on priority deadlines.
            </p>
          </div>

          {/* Quick Order Dispatch Action */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Dark-Store Hub Status</h2>
              <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                Operational
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span>Indiranagar Micro-Hub #4 (Primary)</span>
                <span className="font-bold text-slate-800">12 Riders On Standby</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span>Koramangala Fulfillment Center #2</span>
                <span className="font-bold text-slate-800">8 Riders On Standby</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <span>Whitefield Express Depot #1</span>
                <span className="font-bold text-slate-800">15 Riders On Standby</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && <OrderManagement />}
      {activeTab === 'products' && <ProductManagement />}
      {activeTab === 'fleet' && <FleetManagement />}
    </div>
  );
};
