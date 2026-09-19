import React, { useState, useEffect } from 'react';
import {
  Search,
  UserCheck,
  Clock,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Truck,
  Layers,
  Fuel,
  Leaf,
  Sparkles,
  MapPin,
  CheckSquare,
  Square,
  ArrowRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import { Order, DeliveryPartner, BatchDispatchSummary } from '../../types';
import { api } from '../../services/api';

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [batchAssignPartnerId, setBatchAssignPartnerId] = useState<string>('');
  const [batchingLoading, setBatchingLoading] = useState(false);
  const [batchSummary, setBatchSummary] = useState<BatchDispatchSummary | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [ordRes, fleetRes] = await Promise.all([api.getOrders(), api.getFleet()]);
      setOrders(ordRes.orders);
      setPartners(fleetRes.partners);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleAssignPartner = async (orderId: string, partnerId: string) => {
    try {
      await api.assignPartner(orderId, partnerId);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    try {
      await api.updateOrderStatus(orderId, status);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Automatic Same-Path Corridor Batching
  const handleAutoBatch = async () => {
    setBatchingLoading(true);
    try {
      const res = await api.autoBatchOrders();
      setBatchSummary(res);
      setNotification(res.summary);
      await loadData();
    } catch (err: any) {
      setNotification(err.message || 'Auto-batching failed');
    } finally {
      setBatchingLoading(false);
    }
  };

  // Manual Multi-Select Assignment
  const handleBatchAssign = async () => {
    if (selectedOrderIds.length === 0 || !batchAssignPartnerId) return;
    setBatchingLoading(true);
    try {
      const res = await api.batchAssignOrders(selectedOrderIds, batchAssignPartnerId);
      setNotification(res.message);
      setSelectedOrderIds([]);
      setBatchAssignPartnerId('');
      await loadData();
    } catch (err: any) {
      setNotification(err.message || 'Failed to assign batch');
    } finally {
      setBatchingLoading(false);
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const selectAllVisible = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.id));
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.deliveryAddress.address.toLowerCase().includes(search.toLowerCase()) ||
      (o.coDeliveryCorridor && o.coDeliveryCorridor.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  // Count how many orders are currently co-delivered in corridors
  const batchedOrdersCount = orders.filter(o => o.isBatched).length;
  const totalFuelSaved = orders
    .reduce((acc, o) => acc + (o.batchFuelSavingsLiters || 0), 0)
    .toFixed(2);
  const totalCostSaved = Math.round(
    orders.reduce((acc, o) => acc + (o.batchCostSavings || 0), 0)
  );

  return (
    <div className="space-y-5">
      {/* Smart Co-Delivery & Multi-Order Optimization Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-emerald-800/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Leaf className="w-4 h-4" />
              </span>
              <h2 className="text-base font-extrabold text-white">
                Multi-Order Same-Path Co-Delivery Engine
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Fuel Saver Active
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              When multiple customers order different items located along the same delivery path or neighborhood corridor, 
              the system bundles them onto one courier to prevent duplicate round trips and cut fuel consumption.
            </p>
          </div>

          <button
            id="auto-batch-btn"
            onClick={handleAutoBatch}
            disabled={batchingLoading}
            className="shrink-0 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {batchingLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-slate-950" />
            )}
            <span>Auto-Batch Orders by Corridor</span>
          </button>
        </div>

        {/* Live Cluster Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
          <div className="p-2.5 rounded-xl bg-white/5 backdrop-blur-xs">
            <div className="text-[10px] text-slate-400 font-medium">Batched Deliveries</div>
            <div className="text-sm font-bold text-emerald-300 mt-0.5">
              {batchedOrdersCount} orders active
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 backdrop-blur-xs">
            <div className="text-[10px] text-slate-400 font-medium">Corridor Fuel Saved</div>
            <div className="text-sm font-bold text-emerald-300 mt-0.5">
              ~{totalFuelSaved} Units / L
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 backdrop-blur-xs">
            <div className="text-[10px] text-slate-400 font-medium">Fleet Cost Saved</div>
            <div className="text-sm font-bold text-emerald-300 mt-0.5">
              ₹{totalCostSaved} prevented
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 backdrop-blur-xs">
            <div className="text-[10px] text-slate-400 font-medium">Vehicle Payload</div>
            <div className="text-sm font-bold text-emerald-300 mt-0.5">
              Multi-stop bundling
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Batch Result Summary Modal / Callout */}
      {batchSummary && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-bold text-emerald-950">
                Corridor Dispatch Clustered {batchSummary.ordersBatched} Orders
              </h3>
            </div>
            <button
              onClick={() => setBatchSummary(null)}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-bold"
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-emerald-900">{batchSummary.summary}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {batchSummary.batches.map(b => (
              <div
                key={b.batchId}
                className="bg-white p-3 rounded-xl border border-emerald-200 text-xs space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-emerald-600" />
                    {b.partnerName} ({b.vehicleType.replace('_', ' ')})
                  </span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                    -{b.fuelSavedLiters} L Fuel
                  </span>
                </div>
                <div className="text-slate-600 text-[11px]">
                  <strong>Corridor:</strong> {b.corridorName}
                </div>
                <div className="text-slate-500 text-[11px]">
                  <strong>Customers Bundled:</strong> {b.customerNames.join(' & ')}
                </div>
                <div className="text-slate-400 text-[10px] flex items-center gap-2 pt-1">
                  <span>Saved: {b.distanceSavedKm} km separate trips</span>
                  <span>&bull;</span>
                  <span>Cost saved: ₹{b.costSaved}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {notification && !batchSummary && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex justify-between items-center">
          <span>{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Manual Multi-Select Action Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-bold">
              {selectedOrderIds.length} Selected
            </span>
            <span>Assign these orders together as a shared corridor batch:</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={batchAssignPartnerId}
              onChange={e => setBatchAssignPartnerId(e.target.value)}
              className="text-xs py-1.5 px-3 rounded-xl bg-slate-800 text-white border border-slate-700 font-medium"
            >
              <option value="">Select Delivery Partner...</option>
              {partners
                .filter(p => p.isOnline)
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.vehicleType.replace('_', ' ')}) &bull; Active: {p.activeOrderIds?.length || 0}
                  </option>
                ))}
            </select>

            <button
              onClick={handleBatchAssign}
              disabled={!batchAssignPartnerId || batchingLoading}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-colors shrink-0"
            >
              Bundle & Dispatch
            </button>

            <button
              onClick={() => setSelectedOrderIds([])}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Controls: Filters, Search, Select All */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={selectAllVisible}
            className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 shrink-0"
            title="Toggle select all visible orders"
          >
            {selectedOrderIds.length > 0 && selectedOrderIds.length === filteredOrders.length ? (
              <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>Select All</span>
          </button>

          {['ALL', 'PLACED', 'CONFIRMED', 'PACKED', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].map(
            st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st.replace(/_/g, ' ')}
              </button>
            )
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search order, customer, corridor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No orders match the selected criteria.
          </div>
        ) : (
          filteredOrders.map(order => {
            const isSelected = selectedOrderIds.includes(order.id);

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl p-4 border transition-colors space-y-3 ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-100'
                    : order.isBatched
                    ? 'border-emerald-200 hover:border-emerald-300'
                    : 'border-slate-200 hover:border-purple-200'
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      onClick={() => toggleSelectOrder(order.id)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <span className="font-extrabold text-sm text-slate-900">Order #{order.id}</span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        order.status === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.priority === 'EXPRESS'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>

                    {order.priority === 'EXPRESS' && (
                      <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-bold">
                        ⚡ EXPRESS
                      </span>
                    )}

                    {/* Batch Badge */}
                    {order.isBatched && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Leaf className="w-3 h-3 text-emerald-600" />
                        <span>Same-Path Co-Delivery</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-500">
                    Total: <strong className="text-slate-900">₹{order.total}</strong> ({order.items.length} items) &bull;{' '}
                    {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {/* Co-Delivery Corridor Highlight if Batched */}
                {order.isBatched && (
                  <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2 text-emerald-950 font-medium">
                      <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Corridor:</strong> {order.coDeliveryCorridor || 'Bundled Neighborhood Corridor'}
                      </span>
                      {order.batchedWithOrderIds && order.batchedWithOrderIds.length > 0 && (
                        <span className="text-[11px] text-emerald-700">
                          (Bundled with #{order.batchedWithOrderIds.join(', #')})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-emerald-800 font-semibold flex items-center gap-2">
                      <span>Saves ~{order.batchFuelSavingsLiters || 0.38}L fuel</span>
                      <span>&bull;</span>
                      <span>₹{order.batchCostSavings || 39} saved</span>
                    </div>
                  </div>
                )}

                {/* Customer, Destination, Assigned Rider Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs p-3 bg-slate-50 rounded-xl">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Customer</span>
                    <div className="font-semibold text-slate-800">{order.customerName}</div>
                    <div className="text-slate-500 text-[11px]">{order.customerPhone}</div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Destination</span>
                    <div className="text-slate-700 truncate" title={order.deliveryAddress.address}>
                      {order.deliveryAddress.address}
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      OTP Verification: <span className="font-bold text-slate-600">{order.otpCode}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned Courier</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <select
                        value={order.assignedPartnerId || ''}
                        onChange={e => handleAssignPartner(order.id, e.target.value)}
                        className="text-xs py-1 px-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
                      >
                        <option value="">Unassigned</option>
                        {partners.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.vehicleType.replace('_', ' ')}) {p.isOnline ? '🟢' : '⚪'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Status Transition Fast Buttons & Items Summary */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2 pt-1">
                  <span className="text-[11px] text-slate-500">
                    Items: {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                  </span>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    {order.status === 'PLACED' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'CONFIRMED')}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold text-[11px]"
                      >
                        Mark Confirmed
                      </button>
                    )}
                    {order.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'PACKED')}
                        className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-semibold text-[11px]"
                      >
                        Mark Packed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
