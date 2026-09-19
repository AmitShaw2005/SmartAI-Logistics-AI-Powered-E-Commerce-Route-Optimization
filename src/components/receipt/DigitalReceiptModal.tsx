import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle2, QrCode, ShieldCheck } from 'lucide-react';
import { Order } from '../../types';

interface DigitalReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({ order, isOpen, onClose }) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-slate-50">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Digital Tax Invoice</span>
          <div className="flex items-center gap-2">
            <button
              id="print-receipt-btn"
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Document */}
        <div ref={receiptRef} className="p-6 overflow-y-auto font-sans text-slate-800 text-xs">
          {/* Brand & Store Header */}
          <div className="flex justify-between items-start border-b border-dashed border-slate-300 pb-4 mb-4">
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                SmartAI Logistics
              </h1>
              <p className="text-[11px] text-slate-500">Quick-Commerce Fulfillment India Pvt. Ltd.</p>
              <p className="text-[11px] text-slate-400">GSTIN: 29AAECS9821F1Z5</p>
              <p className="text-[11px] text-slate-400">Indiranagar Micro-Hub #4, Bengaluru, Karnataka</p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                {order.paymentStatus}
              </span>
              <p className="text-[11px] font-bold text-slate-700 mt-1">Invoice #{order.id}</p>
              <p className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Customer & Delivery Details */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl mb-4 text-[11px]">
            <div>
              <span className="font-semibold text-slate-600 block text-[10px] uppercase">Billed To</span>
              <div className="font-bold text-slate-800">{order.customerName}</div>
              <div className="text-slate-500 text-[10px] truncate max-w-[180px]">{order.deliveryAddress.address}</div>
              <div className="text-slate-400 text-[10px]">{order.customerPhone}</div>
            </div>
            <div>
              <span className="font-semibold text-slate-600 block text-[10px] uppercase">Delivery Partner</span>
              <div className="font-bold text-slate-800">{order.assignedPartnerName || 'Assigned Express Dispatch'}</div>
              <div className="text-slate-500 text-[10px]">
                Status: <span className="font-semibold text-blue-600">{order.status}</span>
              </div>
              <div className="text-slate-400 text-[10px]">Payment: {order.paymentMethod}</div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
            <table className="w-full text-left">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-[10px] uppercase text-slate-500 font-semibold">
                <tr>
                  <th className="p-2.5">Item</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Price</th>
                  <th className="p-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map(item => (
                  <tr key={item.productId} className="text-[11px]">
                    <td className="p-2.5 font-medium text-slate-800">{item.productName}</td>
                    <td className="p-2.5 text-center text-slate-600">{item.quantity}</td>
                    <td className="p-2.5 text-right text-slate-600">₹{item.price}</td>
                    <td className="p-2.5 text-right font-semibold text-slate-900">
                      ₹{item.price * item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cost Summary */}
          <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-3 mb-3 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Charges</span>
              <span>{order.deliveryFee === 0 ? <span className="text-emerald-600 font-medium">FREE</span> : `₹${order.deliveryFee}`}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Promotional Discount ({order.couponCode || 'APPLIED'})</span>
                <span>-₹{order.discount}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-bold text-slate-900 pt-1.5 border-t border-slate-200">
              <span>Total Paid</span>
              <span className="text-sm text-blue-700">₹{order.total}</span>
            </div>
          </div>

          {/* Proof & QR Code Footer */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Electronically generated tax receipt verified by SmartAI Ledger.</span>
            </div>
            <div className="text-[9px] font-mono text-slate-400">
              AUTH-CODE: {order.id}-{order.otpCode || '9901'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
