import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { Navbar } from './components/common/Navbar';
import { CustomerHome } from './components/customer/CustomerHome';
import { CustomerOrdersView } from './components/customer/CustomerOrdersView';
import { OrderTrackingView } from './components/customer/OrderTrackingView';
import { CartModal } from './components/customer/CartModal';
import { DeliveryDashboard } from './components/delivery/DeliveryDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthModal } from './components/common/AuthModal';
import { SimulationModal } from './components/common/SimulationModal';
import { Order } from './types';

function MainLayout() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<string>('customer_home');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('ORD-8821');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync default view when user role changes
  useEffect(() => {
    if (user?.role === 'customer') {
      if (currentView === 'delivery_dashboard' || currentView === 'admin_dashboard') {
        setCurrentView('customer_home');
      }
    } else if (user?.role === 'delivery_partner') {
      setCurrentView('delivery_dashboard');
    } else if (user?.role === 'admin') {
      setCurrentView('admin_dashboard');
    }
  }, [user?.role]);

  const handleOrderPlaced = (order: Order) => {
    setSelectedOrderId(order.id);
    setCurrentView('order_tracking');
    showToast(`Order #${order.id} placed! Tracking live dispatch.`);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenSimulation={() => setIsSimModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Customer Views */}
        {currentView === 'customer_home' && (
          <CustomerHome
            onTrackOrder={id => {
              setSelectedOrderId(id);
              setCurrentView('order_tracking');
            }}
          />
        )}

        {currentView === 'customer_orders' && (
          <CustomerOrdersView
            onSelectOrder={id => {
              setSelectedOrderId(id);
              setCurrentView('order_tracking');
            }}
            onGoToShop={() => setCurrentView('customer_home')}
          />
        )}

        {currentView === 'order_tracking' && (
          <OrderTrackingView
            orderId={selectedOrderId}
            onBack={() => setCurrentView('customer_orders')}
          />
        )}

        {/* Delivery Partner View */}
        {currentView === 'delivery_dashboard' && <DeliveryDashboard />}

        {/* Operations Admin View */}
        {currentView === 'admin_dashboard' && (
          <AdminDashboard onOpenSimulation={() => setIsSimModalOpen(true)} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>SmartAI Logistics &bull; High-Performance Quick-Commerce Engine</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Powered by Leaflet, OSRM & Gemini AI</span>
            <span>&bull;</span>
            <button
              onClick={() => setIsSimModalOpen(true)}
              className="text-blue-600 hover:underline font-semibold"
            >
              Simulation Tuner
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CartModal onOrderPlaced={handleOrderPlaced} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <SimulationModal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        onUpdated={() => showToast('Simulation conditions recalculated.')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainLayout />
      </CartProvider>
    </AuthProvider>
  );
}
