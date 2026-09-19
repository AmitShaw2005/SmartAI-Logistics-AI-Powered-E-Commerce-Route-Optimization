import React, { useState } from 'react';
import { X, Star, Clock, ShieldCheck, ShoppingBag, MapPin, Truck } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, isOpen, onClose }) => {
  const { addToCart, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  if (!isOpen || !product) return null;

  const currentCartItem = items.find(i => i.product.id === product.id);
  const currentQuantityInCart = currentCartItem ? currentCartItem.quantity : 0;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-md rounded-full text-slate-500 hover:text-slate-800 shadow-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image */}
        <div className="md:w-1/2 bg-slate-50 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-100">
          <img
            src={product.image}
            alt={product.name}
            className="max-h-72 object-contain rounded-2xl drop-shadow-md"
          />
        </div>

        {/* Details */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {product.category}
              </span>
              <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{product.rating}</span>
                <span className="text-slate-400 font-normal">({product.reviewsCount} reviews)</span>
              </div>
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 leading-snug">{product.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{product.unit}</p>

            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl font-black text-slate-900">₹{product.price}</span>
              {product.originalPrice && (
                <>
                  <span className="text-sm text-slate-400 line-through">₹{product.originalPrice}</span>
                  <span className="text-xs font-bold text-emerald-600">
                    {product.discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            <p className="text-xs text-slate-600 mt-3 leading-relaxed">{product.description}</p>

            {/* Quick delivery promise badges */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>
                  Delivery in <strong className="text-slate-900">{product.estimatedMinutes} mins</strong> to your location
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="truncate">Fulfilled from {product.warehouse}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>100% Quality & Freshness Guarantee</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-200 rounded-xl p-1 bg-slate-50">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white text-sm font-bold"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm font-bold text-slate-800">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:bg-white text-sm font-bold"
                >
                  +
                </button>
              </div>

              <button
                id="add-to-cart-modal-btn"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                {addedNotice ? 'Added to Basket! ✓' : product.stock === 0 ? 'Out of Stock' : 'Add to Basket'}
              </button>
            </div>
            {currentQuantityInCart > 0 && (
              <p className="text-[11px] text-emerald-600 text-center font-medium mt-2">
                Already {currentQuantityInCart} in your basket
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
