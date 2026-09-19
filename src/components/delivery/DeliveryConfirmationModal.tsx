import React, { useState } from 'react';
import { X, CheckCircle2, KeyRound, Camera, AlertCircle, ShieldCheck } from 'lucide-react';
import { Order } from '../../types';
import { api } from '../../services/api';

interface DeliveryConfirmationModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: Order) => void;
}

export const DeliveryConfirmationModal: React.FC<DeliveryConfirmationModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [otp, setOtp] = useState('');
  const [note, setNote] = useState('Package received in good condition');
  const [usePhoto, setUsePhoto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.confirmDelivery(order.id, {
        otp: otp.trim() || undefined,
        note,
        photoUrl: usePhoto
          ? 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=600&q=80'
          : undefined,
      });
      onSuccess(res.order);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Delivery confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Complete Delivery #{order.id}</h2>
              <p className="text-[11px] text-slate-400">Customer: {order.customerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Address Snapshot */}
          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
            <div className="font-semibold text-slate-800 mb-0.5">Delivery Destination:</div>
            <div className="text-[11px] text-slate-500">{order.deliveryAddress.address}</div>
          </div>

          {/* OTP Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Customer Verification OTP <span className="text-blue-600">(Recommended)</span>
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                maxLength={4}
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="4-digit code provided by customer"
                className="w-full pl-9 pr-3 py-2 text-sm font-mono tracking-widest rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              (Demo helper: Customer OTP for this order is <span className="font-bold text-slate-600">{order.otpCode}</span>)
            </div>
          </div>

          {/* Proof of Delivery Photo Simulation */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-medium text-slate-700">Attach Delivery Proof Photo</span>
            </div>
            <input
              type="checkbox"
              checked={usePhoto}
              onChange={e => setUsePhoto(e.target.checked)}
              className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500"
            />
          </div>

          {/* Delivery Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Handover Note</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="pt-2">
            <button
              id="confirm-delivery-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {loading ? 'Verifying...' : 'Confirm Handover & Mark Delivered'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
