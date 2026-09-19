import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Star, Plus, Minus, Clock, Zap, ShieldCheck } from 'lucide-react';
import { Product } from '../../types';
import { api } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { ProductDetailModal } from './ProductDetailModal';

const CATEGORIES = [
  'All',
  'Groceries',
  'Fresh Produce',
  'Dairy & Bakery',
  'Beverages',
  'Snacks & Munchies',
  'Electronics & Essentials',
];

interface CustomerHomeProps {
  onTrackOrder: (orderId: string) => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('popular');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { items, addToCart, updateQuantity } = useCart();

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const data = await api.getProducts({
          q: searchQuery,
          category: selectedCategory,
          sort: sortBy,
        });
        setProducts(data.products);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [searchQuery, selectedCategory, sortBy]);

  const getQuantityInCart = (productId: string) => {
    const item = items.find(i => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="space-y-6">
      {/* Hero Quick Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200 border border-white/10">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>AI-Driven Dispatch: Average Delivery 14 Mins</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Fresh Groceries & Tech Essentials, Delivered in Minutes.
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl font-normal leading-relaxed">
            Powered by predictive logistics, automated warehouse dark-stores, and smart dynamic route sequencing.
          </p>
        </div>

        {/* Decorative ambient elements */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-400/20 to-transparent pointer-events-none" />
      </div>

      {/* Controls: Search, Category Chips & Sort */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full sm:w-80 md:w-96">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              id="product-search-input"
              type="text"
              placeholder="Search bananas, milk, coffee, cables..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs transition-all"
            />
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Sort:</span>
            <select
              id="product-sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="popular">Recommended</option>
              <option value="rating">Top Rated</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
            🔍
          </div>
          <h3 className="text-base font-bold text-slate-800">No products match your criteria</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or switching to another product category.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {products.map(prod => {
            const inCart = getQuantityInCart(prod.id);
            return (
              <div
                key={prod.id}
                className="group relative bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
              >
                {/* Image Container with Badges */}
                <div
                  onClick={() => setSelectedProduct(prod)}
                  className="relative cursor-pointer bg-slate-50/70 p-4 flex items-center justify-center h-44 overflow-hidden"
                >
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="max-h-36 object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-xs"
                    loading="lazy"
                  />
                  {/* Delivery time pill */}
                  <span className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-700 px-2 py-0.5 rounded-md shadow-2xs border border-slate-200/50">
                    <Clock className="w-3 h-3 text-emerald-600" />
                    {prod.estimatedMinutes}m
                  </span>

                  {prod.discountPercent ? (
                    <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-2xs">
                      {prod.discountPercent}% OFF
                    </span>
                  ) : null}
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="truncate">{prod.unit}</span>
                      <div className="flex items-center gap-0.5 text-amber-500 font-semibold">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{prod.rating}</span>
                      </div>
                    </div>

                    <h3
                      onClick={() => setSelectedProduct(prod)}
                      className="text-xs sm:text-sm font-bold text-slate-800 hover:text-blue-600 cursor-pointer line-clamp-2 leading-snug"
                    >
                      {prod.name}
                    </h3>
                  </div>

                  {/* Pricing and Add to Cart */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-sm sm:text-base font-extrabold text-slate-900">
                        ₹{prod.price}
                      </div>
                      {prod.originalPrice && (
                        <div className="text-[10px] text-slate-400 line-through">
                          ₹{prod.originalPrice}
                        </div>
                      )}
                    </div>

                    {inCart > 0 ? (
                      <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-xl p-1">
                        <button
                          onClick={() => updateQuantity(prod.id, inCart - 1)}
                          className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-blue-700 font-bold hover:bg-blue-100 transition-colors shadow-2xs text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-blue-900">
                          {inCart}
                        </span>
                        <button
                          onClick={() => updateQuantity(prod.id, inCart + 1)}
                          className="w-6 h-6 rounded-lg bg-white flex items-center justify-center text-blue-700 font-bold hover:bg-blue-100 transition-colors shadow-2xs text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(prod, 1)}
                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-all flex items-center gap-1 shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
