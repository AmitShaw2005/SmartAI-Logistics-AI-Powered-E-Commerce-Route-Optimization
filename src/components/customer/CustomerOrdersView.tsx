import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowRight, Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Order } from '../../types';
import { api } from '../../services/api';
import { DigitalReceiptModal } from '../receipt/DigitalReceiptModal';

interface CustomerOrdersViewProps {
  onSelectOrder: (orderId: string) => void;
  onGoToShop: () => void;
}

export const CustomerOrdersView: React.FC<CustomerOrdersViewProps> = ({ onSelectOrder, onGoToShop }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        const res = await api.getOrders();
        setOrders(res.orders);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Your Orders</h1>
          <p className="text-xs text-slate-500">Track shipments, view receipts, and monitor delivery status</p>
        </div>
        <button
          onClick={onGoToShop}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
        >
          Explore Catalog
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
            📦
          </div>
          <h3 className="text-base font-bold text-slate-800">No orders placed yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Order fresh groceries, breakfast essentials, or electronics and experience rapid 15-minute fulfillment.
          </p>
          <button
            onClick={onGoToShop}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col md:flex-row justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-extrabold text-sm text-slate-900">Order #{order.id}</span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
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
                    <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 font-bold px-1.5 py-0.5 rounded">
                      ⚡ EXPRESS
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500">
                  Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div className="text-xs text-slate-700 font-medium line-clamp-1">
                  {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>
                    Total: <strong className="text-slate-900">₹{order.total}</strong>
                  </span>
                  <span>&bull;</span>
                  <span>Payment: {order.paymentMethod}</span>
                  <span>&bull;</span>
                  <span>Courier: {order.assignedPartnerName || 'Pending Hub Allocation'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex sm:flex-col justify-end gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => onSelectOrder(order.id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <span>Track Live</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSelectedReceiptOrder(order)}
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Invoice</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        order={selectedReceiptOrder}
        isOpen={Boolean(selectedReceiptOrder)}
        onClose={() => setSelectedReceiptOrder(null)}
      />
    </div>
  );
};
