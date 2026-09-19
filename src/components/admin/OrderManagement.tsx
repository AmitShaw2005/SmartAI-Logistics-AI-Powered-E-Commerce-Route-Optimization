import React, { useState, useEffect } from 'react';
import { Search, UserCheck, Clock, CheckCircle2, ChevronRight, RefreshCw, Truck } from 'lucide-react';
import { Order, DeliveryPartner } from '../../types';
import { api } from '../../services/api';

export const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

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

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.deliveryAddress.address.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
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
            placeholder="Search order ID or customer..."
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
          filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3 hover:border-purple-200 transition-colors"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2.5">
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
                </div>

                <div className="text-xs text-slate-500">
                  Total: <strong className="text-slate-900">₹{order.total}</strong> ({order.items.length} items) &bull;{' '}
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Customer</span>
                  <div className="font-semibold text-slate-800">{order.customerName}</div>
                  <div className="text-slate-500 text-[11px]">{order.customerPhone}</div>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Destination</span>
                  <div className="text-slate-700 truncate">{order.deliveryAddress.address}</div>
                  <div className="text-slate-400 text-[10px]">
                    OTP Verification: <span className="font-bold text-slate-600">{order.otpCode}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned Rider</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <select
                      value={order.assignedPartnerId || ''}
                      onChange={e => handleAssignPartner(order.id, e.target.value)}
                      className="text-xs py-1 px-2 rounded-lg border border-slate-200 bg-white font-medium text-slate-700"
                    >
                      <option value="">Unassigned</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.isOnline ? 'Online' : 'Offline'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Status transition fast-buttons */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] text-slate-500">
                  Items: {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                </span>

                <div className="flex items-center gap-1.5">
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
          ))
        )}
      </div>
    </div>
  );
};
