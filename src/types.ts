export type UserRole = 'customer' | 'delivery_partner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  address?: string;
  createdAt: string;
}

export type ProductCategory = string;

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  stock: number;
  rating: number;
  reviewsCount: number;
  image: string;
  unit: string;
  warehouse: string;
  estimatedMinutes: number;
  isPopular?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PACKED'
  | 'ASSIGNED'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED_DELIVERY';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  address: string;
  city?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string;
  total: number;
  paymentMethod: 'UPI' | 'Card' | 'Cash on Delivery';
  paymentStatus: 'PAID' | 'PENDING';
  status: OrderStatus;
  deliveryAddress: GeoLocation;
  warehouseLocation: GeoLocation;
  assignedPartnerId?: string;
  assignedPartnerName?: string;
  assignedPartnerVehicle?: string;
  assignedPartnerRating?: number;
  priority: 'NORMAL' | 'HIGH' | 'EXPRESS';
  createdAt: string;
  estimatedDeliveryTime: string;
  actualDeliveryTime?: string;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
  deliveryProof?: {
    otpVerified: boolean;
    note?: string;
    photoUrl?: string;
    timestamp: string;
  };
  otpCode?: string;
}

export type VehicleType = 'electric_bike' | 'motorcycle' | 'electric_van';

export interface DeliveryPartner {
  id: string;
  userId: string;
  name: string;
  gender: 'male' | 'female';
  phone: string;
  isOnline: boolean;
  currentLocation: GeoLocation;
  vehicleType: VehicleType;
  vehiclePlate: string;
  vehicleEfficiency: number; // L/100km or kWh/100km
  fuelType: 'Petrol' | 'Electric';
  totalDeliveries: number;
  rating: number;
  totalDistanceKm: number;
  totalFuelUsed: number;
  todayEarnings: number;
  activeOrderIds: string[];
}

export type TrafficCondition = 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE';
export type WeatherCondition = 'CLEAR' | 'CLOUDY' | 'RAIN' | 'FOG';

export interface SimulationState {
  traffic: TrafficCondition;
  trafficMultiplier: number;
  weather: WeatherCondition;
  weatherDelayMinutes: number;
  fuelPricePerUnit: number; // e.g. ₹96/L or $/gal
  electricityPricePerKwh: number;
  simulationTime: string;
  activeDispatches: number;
}

export interface RouteOptimizationResult {
  partnerId: string;
  origin: GeoLocation;
  stops: {
    orderId: string;
    sequenceNumber: number;
    destination: GeoLocation;
    customerName: string;
    estimatedArrival: string;
    distanceFromPrevKm: number;
    durationFromPrevMinutes: number;
    priority: 'NORMAL' | 'HIGH' | 'EXPRESS';
    itemsSummary: string;
  }[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  baselineDistanceKm: number;
  baselineDurationMinutes: number;
  fuelSavedLiters: number;
  costSaved: number;
  estimatedFuelConsumption: number;
  estimatedFuelCost: number;
  aiExplanation: string;
  trafficImpact: string;
  weatherImpact: string;
  recommendations: string[];
  routePolyline: [number, number][]; // coordinates for Leaflet line
  alternativePolyline?: [number, number][];
}

export interface AnalyticsSummary {
  totalOrders: number;
  totalRevenue: number;
  deliveredOrders: number;
  pendingOrders: number;
  activeDeliveryPartners: number;
  averageDeliveryMinutes: number;
  totalDistanceCoveredKm: number;
  totalFuelSavedLiters: number;
  categorySales: { category: string; count: number; revenue: number }[];
  dailyDeliveries: { date: string; orders: number; revenue: number }[];
}
