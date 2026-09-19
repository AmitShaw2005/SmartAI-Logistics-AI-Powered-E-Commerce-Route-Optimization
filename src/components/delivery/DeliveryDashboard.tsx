import React, { useState, useEffect } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  KeyRound,
  AlertTriangle,
  RefreshCw,
  Power,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { DeliveryPartner, Order, RouteOptimizationResult, SimulationState } from '../../types';
import { api } from '../../services/api';
import { LiveDeliveryMap } from '../common/LiveDeliveryMap';
import { MapMarkerItem } from '../common/LeafletMap';
import { FuelTrackerCard } from './FuelTrackerCard';
import { AIRecommendationCard } from './AIRecommendationCard';
import { DeliveryConfirmationModal } from './DeliveryConfirmationModal';

export const DeliveryDashboard: React.FC = () => {
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [route, setRoute] = useState<RouteOptimizationResult | null>(null);
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [activeOrderForConfirmation, setActiveOrderForConfirmation] = useState<Order | null>(null);

  const loadPartnerData = async () => {
    try {
      // Fetch current partner profile
      const fleetRes = await api.getFleet();
      const currentPartner = fleetRes.partners[0]; // Active partner profile (Rohan)
      setPartner(currentPartner);

      // Fetch assigned orders
      const ordersRes = await api.getOrders();
      const assigned = ordersRes.orders.filter(
        o => o.assignedPartnerId === currentPartner.id && o.status !== 'DELIVERED'
      );
      setOrders(assigned);

      // Fetch simulation
      const simRes = await api.getSimulation();
      setSimulation(simRes.simulation);

      // Fetch optimized route
      const routeRes = await api.getOptimizedRoute(currentPartner.id);
      setRoute(routeRes.route);
    } catch (err) {
      console.error('Failed to load delivery data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartnerData();
    const timer = setInterval(loadPartnerData, 8000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleOnline = async () => {
    if (!partner) return;
    try {
      const res = await api.toggleAvailability(!partner.isOnline);
      setPartner(res.partner);
    } catch {
      // Ignore
    }
  };

  const handleStatusUpdate = async (orderId: string, status: Order['status'], note?: string) => {
    try {
      await api.updateOrderStatus(orderId, status, note);
      await loadPartnerData();
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleReoptimize = async () => {
    if (!partner) return;
    setOptimizing(true);
    try {
      const routeRes = await api.getOptimizedRoute(partner.id);
      setRoute(routeRes.route);
    } finally {
      setOptimizing(false);
    }
  };

  if (loading && !partner) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-xs text-slate-500">Loading delivery logistics dispatch...</p>
      </div>
    );
  }

  if (!partner) return null;

  // Build Leaflet Map markers for all assigned stops in sequence
  const mapMarkers: MapMarkerItem[] = [
    {
      id: 'partner_pos',
      lat: partner.currentLocation.lat,
      lng: partner.currentLocation.lng,
      title: 'Your Current Location',
      type: 'partner',
      description: `${partner.vehicleType.replace('_', ' ')} &bull; ${partner.vehiclePlate}`,
    },
  ];

  if (route && route.stops) {
    route.stops.forEach(stop => {
      mapMarkers.push({
        id: `stop_${stop.orderId}`,
        lat: stop.destination.lat,
        lng: stop.destination.lng,
        title: `Stop #${stop.sequenceNumber}: ${stop.customerName}`,
        type: 'stop',
        sequenceNumber: stop.sequenceNumber,
        priority: stop.priority,
        description: stop.destination.address,
        itemsSummary: stop.itemsSummary,
        eta: stop.estimatedArrival,
      });
    });
  }

  return (
    <div className="space-y-6">
      {/* Rider Header & Availability Switch */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-emerald-500/20">
            {partner.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">{partner.name}</h1>
              <span className="text-xs text-amber-500 font-bold flex items-center gap-0.5">
                ★ {partner.rating}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {partner.vehicleType.replace('_', ' ')} ({partner.vehiclePlate}) &bull;{' '}
              <span className="text-emerald-600 font-semibold">{partner.fuelType} Mode</span>
            </p>
          </div>
        </div>

        {/* Availability toggle & Earnings */}
        <div className="flex items-center gap-4 self-end sm:self-auto">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Today&apos;s Earnings</div>
            <div className="text-sm font-extrabold text-slate-900">₹{partner.todayEarnings}</div>
          </div>

          <button
            id="toggle-online-btn"
            onClick={handleToggleOnline}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              partner.isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{partner.isOnline ? 'Online & Available' : 'Offline (Paused)'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Map + Assigned Orders on Left, AI Reasoning + Fuel on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Map and Active Stops */}
        <div className="lg:col-span-2 space-y-5">
          {/* Interactive Multi-Stop Map */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">
                  AI-Optimized Multi-Stop Delivery Corridor
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>
                  Total Dist: <strong className="text-slate-800">{route?.totalDistanceKm || 0} km</strong>
                </span>
                <span>&bull;</span>
                <span>
                  ETA: <strong className="text-blue-600">{route?.totalDurationMinutes || 0} mins</strong>
                </span>
              </div>
            </div>

            <LiveDeliveryMap
              center={[partner.currentLocation.lat, partner.currentLocation.lng]}
              zoom={14}
              markers={mapMarkers}
              polyline={route?.routePolyline || []}
              alternativePolyline={route?.alternativePolyline || []}
              vehicleType={partner.vehicleType === 'electric_van' ? 'electric_van' : partner.vehicleType === 'motorcycle' ? 'motorcycle' : 'electric_bike'}
              height="380px"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-1 text-[11px] text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Current Position
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-rose-600 inline-block" /> Stop #1 (Express)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" /> Next Stops
                </span>
              </div>
              <span className="text-slate-400">Blue solid = AI Sequence &bull; Gray dashed = FIFO Baseline</span>
            </div>
          </div>

          {/* Assigned Orders Sequence */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Assigned Deliveries ({orders.length})
                </h2>
                <p className="text-xs text-slate-400">Ordered by prioritized optimal travel time</p>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                Dynamic Dispatch Active
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">All assigned deliveries completed!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Stay online to receive immediate dark-store dispatch allocations.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((ord, idx) => {
                  const isFirst = idx === 0;
                  const matchingStop = route?.stops.find(s => s.orderId === ord.id);

                  return (
                    <div
                      key={ord.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isFirst
                          ? 'border-blue-300 bg-blue-50/20 shadow-xs'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                              {matchingStop ? matchingStop.sequenceNumber : idx + 1}
                            </span>
                            <span className="font-extrabold text-sm text-slate-900">
                              Order #{ord.id}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                ord.priority === 'EXPRESS'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {ord.priority}
                            </span>
                            <span className="text-xs font-semibold text-blue-600 ml-auto sm:ml-0">
                              Status: {ord.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="text-xs text-slate-700 font-medium">
                            Customer: <strong className="text-slate-900">{ord.customerName}</strong> &bull; {ord.customerPhone}
                          </div>

                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{ord.deliveryAddress.address}</span>
                          </div>

                          <div className="text-[11px] text-slate-600">
                            📦 Items: {ord.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                          </div>
                        </div>

                        {/* Order Handover State Actions */}
                        <div className="flex sm:flex-col justify-end items-end gap-2 shrink-0">
                          {matchingStop?.estimatedArrival && (
                            <div className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                              ETA: {matchingStop.estimatedArrival}
                            </div>
                          )}

                          {ord.status === 'ASSIGNED' && (
                            <button
                              id={`pickup-order-${ord.id}`}
                              onClick={() => handleStatusUpdate(ord.id, 'PICKED_UP', 'Picked up from warehouse hub')}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                            >
                              Confirm Pickup
                            </button>
                          )}

                          {ord.status === 'PICKED_UP' && (
                            <button
                              id={`out-for-delivery-${ord.id}`}
                              onClick={() => handleStatusUpdate(ord.id, 'OUT_FOR_DELIVERY', 'Rider departed towards destination')}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                            >
                              Start Transit
                            </button>
                          )}

                          {ord.status === 'OUT_FOR_DELIVERY' && (
                            <button
                              id={`complete-delivery-${ord.id}`}
                              onClick={() => setActiveOrderForConfirmation(ord)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1"
                            >
                              <KeyRound className="w-3 h-3" />
                              <span>Verify & Handover</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Insights & Fuel Telemetry */}
        <div className="space-y-5">
          <AIRecommendationCard
            route={route}
            simulation={simulation}
            onReoptimize={handleReoptimize}
            loading={optimizing}
          />

          <FuelTrackerCard
            partner={partner}
            route={route}
            fuelPrice={simulation?.fuelPricePerUnit || 102.5}
          />

          {/* Partner Performance Summary */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Cumulative Shift Metrics
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 text-[10px]">Total Completed</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">
                  {partner.totalDeliveries} Orders
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 text-[10px]">Distance Covered</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">
                  {partner.totalDistanceKm} km
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      <DeliveryConfirmationModal
        order={activeOrderForConfirmation}
        isOpen={Boolean(activeOrderForConfirmation)}
        onClose={() => setActiveOrderForConfirmation(null)}
        onSuccess={() => {
          loadPartnerData();
        }}
      />
    </div>
  );
};
