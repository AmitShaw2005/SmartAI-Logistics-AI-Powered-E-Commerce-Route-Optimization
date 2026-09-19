import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  MapPin,
  Truck,
  ShieldCheck,
  User as UserIcon,
  CloudSun,
  Flame,
  Activity,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import { SimulationState, UserRole } from '../../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenSimulation: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenSimulation,
  onOpenAuthModal,
}) => {
  const { user, logout, switchRole } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const [simulation, setSimulation] = useState<SimulationState | null>(null);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  useEffect(() => {
    async function loadSim() {
      try {
        const data = await api.getSimulation();
        setSimulation(data.simulation);
      } catch {
        // ignore
      }
    }
    loadSim();
    const timer = setInterval(loadSim, 10000);
    return () => clearInterval(timer);
  }, []);

  const handleRoleSelect = async (role: UserRole) => {
    setIsRoleDropdownOpen(false);
    await switchRole(role);
    if (role === 'customer') onNavigate('customer_home');
    else if (role === 'delivery_partner') onNavigate('delivery_dashboard');
    else if (role === 'admin') onNavigate('admin_dashboard');
  };

  const getTrafficColor = (traffic?: string) => {
    switch (traffic) {
      case 'LOW':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'HIGH':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'SEVERE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getWeatherIcon = (weather?: string) => {
    switch (weather) {
      case 'RAIN':
        return '🌧️ Rain';
      case 'FOG':
        return '🌫️ Fog';
      case 'CLOUDY':
        return '☁️ Cloudy';
      default:
        return '☀️ Clear';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              id="brand-logo-btn"
              onClick={() => {
                if (user?.role === 'customer') onNavigate('customer_home');
                else if (user?.role === 'delivery_partner') onNavigate('delivery_dashboard');
                else onNavigate('admin_dashboard');
              }}
              className="flex items-center gap-2.5 text-left focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-1.5">
                  SmartAI <span className="text-blue-600 font-black">Logistics</span>
                </span>
                <span className="block text-[11px] font-medium text-slate-400 leading-none">
                  AI-Powered Fast Commerce & Fleet
                </span>
              </div>
            </button>

            {/* Role Badge Indicator */}
            {user && (
              <div className="relative ml-2">
                <button
                  id="role-switcher-btn"
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors"
                  title="Switch application user role"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      user.role === 'customer'
                        ? 'bg-blue-500'
                        : user.role === 'delivery_partner'
                        ? 'bg-emerald-500'
                        : 'bg-purple-600'
                    }`}
                  />
                  <span className="capitalize">
                    {user.role === 'customer'
                      ? 'Customer'
                      : user.role === 'delivery_partner'
                      ? 'Delivery Partner'
                      : 'Platform Admin'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isRoleDropdownOpen && (
                  <div
                    id="role-dropdown-menu"
                    className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  >
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Switch Active Role
                    </div>
                    <button
                      id="switch-role-customer"
                      onClick={() => handleRoleSelect('customer')}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                        user.role === 'customer' ? 'font-bold text-blue-600 bg-blue-50/50' : 'text-slate-700'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                      <div>
                        <div>Customer Experience</div>
                        <div className="text-[10px] text-slate-400 font-normal">Shop & track live orders</div>
                      </div>
                    </button>
                    <button
                      id="switch-role-delivery"
                      onClick={() => handleRoleSelect('delivery_partner')}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                        user.role === 'delivery_partner' ? 'font-bold text-emerald-600 bg-emerald-50/50' : 'text-slate-700'
                      }`}
                    >
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div>Delivery Partner</div>
                        <div className="text-[10px] text-slate-400 font-normal">AI route map & fuel stats</div>
                      </div>
                    </button>
                    <button
                      id="switch-role-admin"
                      onClick={() => handleRoleSelect('admin')}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                        user.role === 'admin' ? 'font-bold text-purple-600 bg-purple-50/50' : 'text-slate-700'
                      }`}
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <div>
                        <div>Operations Admin</div>
                        <div className="text-[10px] text-slate-400 font-normal">Fleet, products & simulation</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Links based on Active Role */}
          <nav className="hidden md:flex items-center gap-1">
            {user?.role === 'customer' && (
              <>
                <button
                  id="nav-customer-home"
                  onClick={() => onNavigate('customer_home')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    currentView === 'customer_home'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Shop Catalog
                </button>
                <button
                  id="nav-customer-orders"
                  onClick={() => onNavigate('customer_orders')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    currentView === 'customer_orders'
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  My Orders
                </button>
              </>
            )}

            {user?.role === 'delivery_partner' && (
              <>
                <button
                  id="nav-delivery-dash"
                  onClick={() => onNavigate('delivery_dashboard')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    currentView === 'delivery_dashboard'
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Assigned Route & Orders
                </button>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <button
                  id="nav-admin-dash"
                  onClick={() => onNavigate('admin_dashboard')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    currentView === 'admin_dashboard'
                      ? 'bg-purple-50 text-purple-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Control Dashboard
                </button>
              </>
            )}
          </nav>

          {/* Right Action Bar: Simulation pill, Cart, Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Simulation Indicator Pill */}
            {simulation && (
              <button
                id="open-simulation-modal-btn"
                onClick={onOpenSimulation}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all cursor-pointer shadow-2xs"
                title="Click to tune live Traffic & Weather Simulation"
              >
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Sim:</span>
                <span className={`px-1.5 py-0.2 rounded text-[11px] font-bold border ${getTrafficColor(simulation.traffic)}`}>
                  {simulation.traffic}
                </span>
                <span className="text-[11px]">{getWeatherIcon(simulation.weather)}</span>
              </button>
            )}

            {/* Cart Button (Customer role) */}
            {user?.role === 'customer' && (
              <button
                id="cart-trigger-btn"
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                aria-label="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span
                    id="cart-badge-count"
                    className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-xs animate-in zoom-in duration-150"
                  >
                    {itemCount}
                  </span>
                )}
              </button>
            )}

            {/* User Profile / Auth */}
            {user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
                <img
                  src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-slate-300 object-cover"
                />
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[110px]">
                    {user.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">{user.role.replace('_', ' ')}</div>
                </div>
                <button
                  id="logout-btn"
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="sign-in-btn"
                onClick={onOpenAuthModal}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs"
              >
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
