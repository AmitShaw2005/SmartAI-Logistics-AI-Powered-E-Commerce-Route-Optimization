import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, CartItem, Order, GeoLocation } from '../types';
import { api } from '../services/api';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  couponCode: string;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  selectedAddress: GeoLocation;
  setSelectedAddress: (addr: GeoLocation) => void;
  checkout: (paymentMethod?: string) => Promise<Order>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const defaultAddress: GeoLocation = {
  lat: 12.9784,
  lng: 77.6408,
  address: '402, Green Valley Apartments, 12th Main, Indiranagar',
  city: 'Bengaluru',
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('smartai_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [couponCode, setCouponCode] = useState<string>('SMARTAI50');
  const [selectedAddress, setSelectedAddress] = useState<GeoLocation>(defaultAddress);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('smartai_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) }
            : item
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          return { ...item, quantity: Math.min(item.product.stock, quantity) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Free delivery over ₹500
  const deliveryFee = subtotal > 500 || subtotal === 0 ? 0 : 25;

  let discount = 0;
  if (couponCode === 'SMARTAI50' && subtotal >= 300) {
    discount = 50;
  } else if (couponCode === 'WELCOME100' && subtotal >= 500) {
    discount = 100;
  }

  const total = Math.max(0, subtotal + deliveryFee - discount);

  const applyCoupon = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'SMARTAI50') {
      if (subtotal < 300) {
        return { success: false, message: 'SMARTAI50 requires a minimum cart value of ₹300' };
      }
      setCouponCode('SMARTAI50');
      return { success: true, message: '₹50 discount applied!' };
    }
    if (clean === 'WELCOME100') {
      if (subtotal < 500) {
        return { success: false, message: 'WELCOME100 requires a minimum cart value of ₹500' };
      }
      setCouponCode('WELCOME100');
      return { success: true, message: '₹100 discount applied!' };
    }
    return { success: false, message: 'Invalid coupon code. Try SMARTAI50 or WELCOME100' };
  };

  const removeCoupon = () => {
    setCouponCode('');
  };

  const checkout = async (paymentMethod: string = 'UPI'): Promise<Order> => {
    if (items.length === 0) {
      throw new Error('Your cart is empty');
    }

    const payload = {
      items: items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
      deliveryAddress: selectedAddress,
      couponCode: couponCode || undefined,
      paymentMethod,
    };

    const res = await api.createOrder(payload);
    clearCart();
    setIsCartOpen(false);
    return res.order;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        itemCount,
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
