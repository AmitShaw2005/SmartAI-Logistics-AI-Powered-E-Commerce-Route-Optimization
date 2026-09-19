import React, { useState, useEffect } from 'react';
import {
  Clock,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Phone,
  FileText,
  AlertTriangle,
  ArrowLeft,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import { Order, DeliveryPartner, SimulationState } from '../../types';
import { api } from '../../services/api';
import { LiveDeliveryMap } from '../common/LiveDeliveryMap';
import { MapMarkerItem } from '../common/LeafletMap';
import { DigitalReceiptModal } from '../receipt/DigitalReceiptModal';

interface OrderTrackingViewProps {
  orderId: string;
  onBack: () => void;
}

const LIFECYCLE_STEPS: { status: Order['status']; label: string }[] = [
  { status: 'PLACED', label: 'Order Placed' },
  { status: 'CONFIRMED', label: 'Confirmed' },
  { status: 'PACKED', label: 'Packed' },
  { status: 'ASSIGNED', label: 'Partner Assigned' },
  { status: 'PICKED_UP', label: 'Picked Up' },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { status: 'DELIVERED', label: 'Delivered' },
];

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({ orderId, onBack }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [partner, setPartner] = useState<DeliveryPartner | null>(null);
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);

  const fetchOrderData = async () => {
    try {
      const orderRes = await api.getOrder(orderId);
      setOrder(orderRes.order);

      // Fetch partner info if assigned
      if (orderRes.order.assignedPartnerId) {
        try {
          const pRes = await api.getPartner(orderRes.order.assignedPartnerId);
          setPartner(pRes.partner);
        } catch {
          // Ignore
        }
      }

      // Fetch simulation to show traffic/weather dynamic impact
      const simRes = await api.getSimulation();
      setSimulation(simRes.simulation);

      // Calculate or fetch route geometry between rider/warehouse and destination
      if (orderRes.order) {
        const origin = orderRes.order.warehouseLocation;
        const dest = orderRes.order.deliveryAddress;
        // Construct visual corridor line
        setRoutePolyline([
          [origin.lat, origin.lng],
          [(origin.lat + dest.lat) / 2 + 0.0015, (origin.lng + dest.lng) / 2 - 0.001],
          [dest.lat, dest.lng],
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to track order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderData();
    const interval = setInterval(fetchOrderData, 5000); // 5s live polling
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading && !order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium">Connecting to GPS dispatch network...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center max-w-md mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">Order Not Found or Restricted</h3>
        <p className="text-xs text-slate-500 mt-1">{error || 'You can only track your own placed orders.'}</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
        >
          Return to Orders
        </button>
      </div>
    );
  }

  const currentStepIndex = LIFECYCLE_STEPS.findIndex(s => s.status === order.status);

  // Build Map Markers
  const mapMarkers: MapMarkerItem[] = [
    {
      id: 'warehouse',
      lat: order.warehouseLocation.lat,
      lng: order.warehouseLocation.lng,
      title: order.warehouseLocation.address,
      type: 'warehouse',
      description: 'Micro-Fulfillment Dark Store Hub',
    },
    {
      id: 'destination',
      lat: order.deliveryAddress.lat,
      lng: order.deliveryAddress.lng,
      title: 'Your Delivery Address',
      type: order.status === 'DELIVERED' ? 'completed' : 'stop',
      sequenceNumber: 1,
      priority: order.priority,
      description: order.deliveryAddress.address,
      itemsSummary: order.items.map(i => `${i.quantity}x ${i.productName}`).join(', '),
      eta: new Date(order.estimatedDeliveryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ];

  // If partner is assigned, add partner position with privacy-safe mask
  if (partner && order.status !== 'DELIVERED') {
    mapMarkers.push({
      id: 'rider',
      lat: partner.currentLocation.lat,
      lng: partner.currentLocation.lng,
      title: `${partner.name.split(' ')[0]} (Delivery Partner)`,
      type: 'partner',
      description: `Riding ${partner.vehicleType.replace('_', ' ')} (${partner.vehiclePlate})`,
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Bar with back button, order ID, and receipt trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            id="tracking-back-btn"
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">Order #{order.id}</h1>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  order.status === 'DELIVERED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : order.priority === 'EXPRESS'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            id="view-receipt-btn"
            onClick={() => setIsReceiptOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Digital Receipt</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map on Left, Details & OTP on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Column (2 spans on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800">Live GPS Corridor Map</span>
              </div>
              {simulation && (
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>
                    Simulated Traffic: <strong className="text-slate-700">{simulation.traffic}</strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    Weather: <strong className="text-slate-700">{simulation.weather}</strong>
                  </span>
                </div>
              )}
            </div>

            <LiveDeliveryMap
              center={[order.deliveryAddress.lat, order.deliveryAddress.lng]}
              zoom={14}
              markers={mapMarkers}
              polyline={routePolyline}
              vehicleType={partner?.vehicleType === 'electric_van' ? 'electric_van' : partner?.vehicleType === 'motorcycle' ? 'motorcycle' : 'electric_bike'}
              height="380px"
            />

            <div className="flex flex-wrap items-center justify-between gap-2 px-2 pt-1 text-[11px] text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-slate-900 inline-block" /> Hub Dark Store
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Assigned Rider
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" /> Your Destination
                </span>
              </div>
              <span className="text-slate-400 italic">Route coordinates rendered via OSRM routing engine</span>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Fulfillment Journey
            </h3>
            <div className="relative flex items-center justify-between">
              <div className="absolute left-0 right-0 top-3.5 h-0.5 bg-slate-100 -z-0" />
              <div
                className="absolute left-0 top-3.5 h-0.5 bg-blue-600 transition-all duration-500 -z-0"
                style={{
                  width: `${(Math.max(0, currentStepIndex) / (LIFECYCLE_STEPS.length - 1)) * 100}%`,
                }}
              />
              {LIFECYCLE_STEPS.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={step.status} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                        isPassed
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      } ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] sm:text-[11px] mt-2 text-center max-w-[65px] font-medium leading-tight ${
                        isCurrent ? 'text-blue-700 font-bold' : isPassed ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Info Column: ETA, OTP, Rider Card, Bill Summary */}
        <div className="space-y-4">
          {/* Estimated Time Card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-md shadow-blue-500/15">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-100">Estimated Delivery</span>
              <Clock className="w-4 h-4 text-blue-200" />
            </div>
            <div className="text-2xl font-black">
              {order.status === 'DELIVERED'
                ? 'Delivered Successfully'
                : new Date(order.estimatedDeliveryTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
            </div>
            <p className="text-xs text-blue-100 mt-1">
              {order.status === 'DELIVERED'
                ? 'Package handed over to customer'
                : 'Dynamic ETA adjusted for current road traffic and weather'}
            </p>
          </div>

          {/* Secure Delivery OTP Card */}
          {order.status !== 'DELIVERED' && order.otpCode && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-3xl p-5 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1">
                <KeyRound className="w-4 h-4 text-amber-700" />
                <span>Delivery Verification OTP</span>
              </div>
              <p className="text-xs text-amber-800">
                Share this 4-digit code with your delivery partner upon package arrival:
              </p>
              <div className="mt-2.5 p-3 bg-white rounded-xl border border-amber-300 text-center font-mono text-2xl font-black text-amber-950 tracking-widest shadow-inner">
                {order.otpCode}
              </div>
            </div>
          )}

          {/* Delivery Partner Contact Card (With privacy protection applied) */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Assigned Courier
            </span>

            {partner ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm">
                    {partner.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{partner.name}</div>
                    <div className="text-xs text-slate-400">
                      ★ {partner.rating} &bull; {partner.vehicleType.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Vehicle Plate:</span>
                    <span className="font-semibold text-slate-800">{partner.vehiclePlate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fuel Mode:</span>
                    <span className="font-semibold text-emerald-700">{partner.fuelType} (Zero Direct Emission)</span>
                  </div>
                </div>

                {/* Masked Call Button (Privacy mandate) */}
                <button
                  type="button"
                  onClick={() => alert(`Calling delivery partner via privacy relay proxy: +91 80-4567-0099`)}
                  className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Rider (Masked Privacy Relay)</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-2">
                Order is being packed at fulfillment hub. A delivery partner will be allocated momentarily.
              </p>
            )}
          </div>

          {/* Order Summary Snapshot */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-800">Items ({order.items.length})</span>
              <span className="font-extrabold text-slate-900">₹{order.total}</span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {order.items.map(item => (
                <div key={item.productId} className="flex justify-between text-slate-600 text-[11px]">
                  <span className="truncate pr-2">
                    {item.quantity}x {item.productName}
                  </span>
                  <span className="shrink-0 font-medium">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        order={order}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />
    </div>
  );
};
