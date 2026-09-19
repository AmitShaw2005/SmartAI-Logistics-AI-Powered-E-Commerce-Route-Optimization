import {
  Product,
  Order,
  DeliveryPartner,
  SimulationState,
  RouteOptimizationResult,
  AnalyticsSummary,
  User,
  UserRole,
} from '../types';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('smartai_auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('smartai_auth_token', token);
    } else {
      localStorage.removeItem('smartai_auth_token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(errorData.error || `HTTP error ${res.status}`);
    }

    return res.json();
  }

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const data = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async register(payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    address?: string;
  }): Promise<{ token: string; user: User }> {
    const data = await this.request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setToken(data.token);
    return data;
  }

  async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/me');
  }

  async switchDemoUser(role: UserRole): Promise<{ token: string; user: User }> {
    const data = await this.request<{ token: string; user: User }>('/api/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    this.setToken(data.token);
    return data;
  }

  // Products
  async getProducts(params?: { q?: string; category?: string; sort?: string }): Promise<{ products: Product[] }> {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.category) query.set('category', params.category);
    if (params?.sort) query.set('sort', params.sort);
    return this.request<{ products: Product[] }>(`/api/products?${query.toString()}`);
  }

  async getProduct(id: string): Promise<{ product: Product }> {
    return this.request<{ product: Product }>(`/api/products/${id}`);
  }

  async createProduct(product: Partial<Product>): Promise<{ product: Product }> {
    return this.request<{ product: Product }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  async updateProduct(id: string, product: Partial<Product>): Promise<{ product: Product }> {
    return this.request<{ product: Product }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Orders
  async getOrders(): Promise<{ orders: Order[] }> {
    return this.request<{ orders: Order[] }>('/api/orders');
  }

  async getOrder(id: string): Promise<{ order: Order }> {
    return this.request<{ order: Order }>(`/api/orders/${id}`);
  }

  async createOrder(payload: {
    items: { productId: string; quantity: number }[];
    deliveryAddress: { lat: number; lng: number; address: string; city?: string };
    couponCode?: string;
    paymentMethod?: string;
  }): Promise<{ order: Order }> {
    return this.request<{ order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateOrderStatus(id: string, status: Order['status'], note?: string): Promise<{ order: Order }> {
    return this.request<{ order: Order }>(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  }

  async assignPartner(orderId: string, partnerId: string): Promise<{ order: Order }> {
    return this.request<{ order: Order }>(`/api/orders/${orderId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ partnerId }),
    });
  }

  async confirmDelivery(
    orderId: string,
    payload: { otp?: string; note?: string; photoUrl?: string }
  ): Promise<{ order: Order; message: string }> {
    return this.request<{ order: Order; message: string }>(`/api/orders/${orderId}/confirm-delivery`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getReceipt(orderId: string): Promise<{ receipt: any }> {
    return this.request<{ receipt: any }>(`/api/orders/${orderId}/receipt`);
  }

  // Delivery Partner & Route
  async getPartner(id: string): Promise<{ partner: DeliveryPartner }> {
    return this.request<{ partner: DeliveryPartner }>(`/api/delivery/partner/${id}`);
  }

  async toggleAvailability(isOnline?: boolean): Promise<{ partner: DeliveryPartner }> {
    return this.request<{ partner: DeliveryPartner }>('/api/delivery/toggle-availability', {
      method: 'POST',
      body: JSON.stringify({ isOnline }),
    });
  }

  async updateLocation(lat: number, lng: number): Promise<{ partner: DeliveryPartner }> {
    return this.request<{ partner: DeliveryPartner }>('/api/delivery/update-location', {
      method: 'POST',
      body: JSON.stringify({ lat, lng }),
    });
  }

  async getOptimizedRoute(partnerId: string): Promise<{ route: RouteOptimizationResult }> {
    return this.request<{ route: RouteOptimizationResult }>(`/api/delivery/optimize-route/${partnerId}`);
  }

  // Simulation & Fleet
  async getSimulation(): Promise<{ simulation: SimulationState }> {
    return this.request<{ simulation: SimulationState }>('/api/simulation');
  }

  async updateSimulation(payload: Partial<SimulationState>): Promise<{ simulation: SimulationState }> {
    return this.request<{ simulation: SimulationState }>('/api/simulation', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getFleet(): Promise<{ partners: DeliveryPartner[] }> {
    return this.request<{ partners: DeliveryPartner[] }>('/api/fleet');
  }

  async getAnalytics(): Promise<{ analytics: AnalyticsSummary }> {
    return this.request<{ analytics: AnalyticsSummary }>('/api/analytics');
  }
}

export const api = new ApiClient();
