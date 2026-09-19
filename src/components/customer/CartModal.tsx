import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, Tag, MapPin, Clock, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { Order } from '../../types';

interface CartModalProps {
  onOrderPlaced: (order: Order) => void;
}

export const CartModal: React.FC<CartModalProps> = ({ onOrderPlaced }) => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    deliveryFee,
    discount,
    total,
    couponCode,
    applyCoupon,
    removeCoupon,
    selectedAddress,
    setSelectedAddress,
    checkout,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const [inputCoupon, setInputCoupon] = useState('');
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Card' | 'Cash on Delivery'>('UPI');
  const [isPlacing, setIsPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    const res = applyCoupon(inputCoupon);
    setCouponMessage({ text: res.message, isError: !res.success });
    if (res.success) setInputCoupon('');
  };

  const handleCheckout = async () => {
    setIsPlacing(true);
    setError(null);
    try {
      const order = await checkout(paymentMethod);
      onOrderPlaced(order);
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="cart-drawer"
        className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col justify-between overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Basket</h2>
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold mt-0.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Instant Dispatch &bull; Delivery in 12-15 mins</span>
            </div>
          </div>
          <button
            id="close-cart-btn"
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                🛍️
              </div>
              <h3 className="text-sm font-bold text-slate-700">Your basket is empty</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Explore our catalog of fresh groceries, electronics, and essentials to add items.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {items.map(item => (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-100"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-14 h-14 object-cover rounded-lg shrink-0 border border-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{item.product.name}</h4>
                      <p className="text-[11px] text-slate-400">{item.product.unit}</p>
                      <div className="text-xs font-bold text-blue-600 mt-1">₹{item.product.price}</div>
                    </div>
                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-1 hover:bg-slate-100 text-slate-600 rounded transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-800 w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-1 hover:bg-slate-100 text-slate-600 rounded transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Address Section */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Delivery Address</span>
                </div>
                <input
                  type="text"
                  value={selectedAddress.address}
                  onChange={e =>
                    setSelectedAddress({
                      ...selectedAddress,
                      address: e.target.value,
                    })
                  }
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="text-[10px] text-slate-400 mt-1">
                  GPS: {selectedAddress.lat.toFixed(4)}, {selectedAddress.lng.toFixed(4)} (Indiranagar)
                </div>
              </div>

              {/* Coupon Code Section */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    Offers & Coupons
                  </span>
                  {couponCode && (
                    <button
                      onClick={removeCoupon}
                      className="text-[11px] text-rose-600 font-semibold hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {couponCode ? (
                  <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-semibold">
                    <span>Code &apos;{couponCode}&apos; applied (-₹{discount})</span>
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Try SMARTAI50 or WELCOME100"
                      value={inputCoupon}
                      onChange={e => setInputCoupon(e.target.value)}
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 uppercase font-mono"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {couponMessage && (
                  <p
                    className={`text-[11px] mt-1.5 ${
                      couponMessage.isError ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    {couponMessage.text}
                  </p>
                )}
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['UPI', 'Card', 'Cash on Delivery'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`p-2 rounded-xl border text-center text-xs transition-all ${
                        paymentMethod === method
                          ? 'border-blue-600 bg-blue-50/60 text-blue-700 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bill Details */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs border border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Item Total</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Partner Fee</span>
                  <span>
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-bold">FREE (orders &gt; ₹500)</span>
                    ) : (
                      `₹${deliveryFee}`
                    )}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>To Pay</span>
                  <span className="text-blue-700 font-extrabold">₹{total}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer & Checkout Button */}
        {items.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-white space-y-2">
            {error && (
              <div className="p-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {error}
              </div>
            )}
            <button
              id="place-order-btn"
              disabled={isPlacing}
              onClick={handleCheckout}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-between disabled:opacity-50"
            >
              <div className="text-left">
                <div className="text-xs font-normal opacity-90">{items.length} items &bull; ₹{total}</div>
                <div>Place Express Order</div>
              </div>
              <div className="flex items-center gap-1 font-bold">
                {isPlacing ? 'Processing...' : 'Pay & Dispatch'}
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
            <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safe & Secure 256-bit Encrypted Checkout</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
