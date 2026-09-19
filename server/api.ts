import express, { Request, Response } from 'express';
import { db } from './db.js';
import { optimizeDeliveryRoute, generateWeatherTelemetry } from './routing.js';
import { generateAILogisticsInsight } from './gemini.js';
import {
  findBestPartnerForOrder,
  evaluateCorridorAffinity,
  calculateBatchSavings,
  detectCorridorName,
  getVehicleCapacity,
} from './batching.js';
import { Order, Product, User, UserRole, BatchGroup, BatchDispatchSummary } from '../src/types.js';

export const apiRouter = express.Router();

// Simple in-memory session/token store for local development & demonstration
interface Session {
  userId: string;
  role: UserRole;
  email: string;
}

const sessions = new Map<string, Session>();

// Helper to extract session
function getSessionUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    const roleHeader = (req.headers['x-user-role'] as string)?.toLowerCase();
    if (roleHeader === 'admin') {
      return db.findUserByEmail('admin@smartai.com') || null;
    }
    // In standalone or demo preview mode, allow admin actions if not strictly authenticated
    return db.findUserByEmail('admin@smartai.com') || null;
  }
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const session = sessions.get(token);
  if (!session) {
    return db.findUserByEmail('admin@smartai.com') || null;
  }
  return db.findUserById(session.userId) || null;
}

// Server-Sent Events (SSE) for Real-Time synchronization
const sseClients = new Set<Response>();

export function broadcastEvent(event: string, data: unknown) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(res => {
    try {
      res.write(payload);
    } catch {
      sseClients.delete(res);
    }
  });
}

// SSE endpoint
apiRouter.get('/events', (req: Request, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  res.write(': connected\n\n');
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.findUserByEmail(email);
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: 'Invalid email or password credentials' });
  }

  const token = `token_${user.id}_${Date.now()}`;
  sessions.set(token, { userId: user.id, role: user.role, email: user.email });

  const { passwordHash: _, ...safeUser } = user;
  return res.json({ token, user: safeUser });
});

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password, role, phone, address } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing required registration fields' });
  }

  if (db.findUserByEmail(email)) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const validRoles: UserRole[] = ['customer', 'delivery_partner', 'admin'];
  const userRole: UserRole = validRoles.includes(role) ? role : 'customer';

  const newUser = {
    id: `user_${Date.now()}`,
    name,
    email,
    role: userRole,
    phone: phone || '',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    address: address || 'Indiranagar, Bengaluru',
    createdAt: new Date().toISOString(),
    passwordHash: password,
  };

  db.createUser(newUser);

  // If registering as delivery partner, auto-create a delivery partner profile
  if (userRole === 'delivery_partner') {
    db.deliveryPartners.push({
      id: `dp_${Date.now()}`,
      userId: newUser.id,
      name: newUser.name,
      gender: 'male',
      phone: newUser.phone,
      isOnline: true,
      currentLocation: {
        lat: 12.9716,
        lng: 77.6412,
        address: 'Indiranagar, Bengaluru',
        city: 'Bengaluru',
      },
      vehicleType: 'electric_bike',
      vehiclePlate: `KA 03 EV ${Math.floor(1000 + Math.random() * 9000)}`,
      vehicleEfficiency: 4.2,
      fuelType: 'Electric',
      totalDeliveries: 0,
      rating: 5.0,
      totalDistanceKm: 0,
      totalFuelUsed: 0,
      todayEarnings: 0,
      activeOrderIds: [],
    });
  }

  const token = `token_${newUser.id}_${Date.now()}`;
  sessions.set(token, { userId: newUser.id, role: newUser.role, email: newUser.email });

  const { passwordHash: _, ...safeUser } = newUser;
  return res.status(201).json({ token, user: safeUser });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.json({ user });
});

// Fast user switcher for testing/demo purposes
apiRouter.post('/auth/demo-switch', (req: Request, res: Response) => {
  const { role } = req.body;
  const user = db.users.find(u => u.role === role);
  if (!user) {
    return res.status(404).json({ error: 'Demo user not found' });
  }
  const token = `token_${user.id}_${Date.now()}`;
  sessions.set(token, { userId: user.id, role: user.role, email: user.email });
  const { passwordHash: _, ...safeUser } = user;
  return res.json({ token, user: safeUser });
});

// ==========================================
// PRODUCT CATALOG ROUTES
// ==========================================
apiRouter.get('/products', (req: Request, res: Response) => {
  let list = db.getProducts();
  const { q, category, sort } = req.query;

  if (typeof category === 'string' && category !== 'All') {
    list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (typeof q === 'string' && q.trim()) {
    const query = q.toLowerCase();
    list = list.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }

  if (sort === 'price_low') {
    list = [...list].sort((a, b) => a.price - b.price);
  } else if (sort === 'price_high') {
    list = [...list].sort((a, b) => b.price - a.price);
  } else if (sort === 'rating') {
    list = [...list].sort((a, b) => b.rating - a.rating);
  }

  res.json({ products: list });
});

apiRouter.get('/products/:id', (req: Request, res: Response) => {
  const product = db.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json({ product });
});

apiRouter.post('/products', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { name, category, description, price, originalPrice, stock, image, unit, warehouse, estimatedMinutes } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Name, price, and category are required' });
  }

  const newProduct: Product = {
    id: `prod_${Date.now()}`,
    name,
    category,
    description: description || '',
    price: Number(price),
    originalPrice: originalPrice ? Number(originalPrice) : undefined,
    discountPercent: originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
    stock: Number(stock) || 50,
    rating: 4.8,
    reviewsCount: 1,
    image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    unit: unit || '1 unit',
    warehouse: warehouse || 'Bengaluru Central Fulfillment Hub',
    estimatedMinutes: Number(estimatedMinutes) || 15,
  };

  db.saveProduct(newProduct);
  broadcastEvent('product_updated', newProduct);
  res.status(201).json({ product: newProduct });
});

apiRouter.put('/products/:id', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const existing = db.getProductById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const updated = { ...existing, ...req.body };
  db.saveProduct(updated);
  broadcastEvent('product_updated', updated);
  res.json({ product: updated });
});

apiRouter.delete('/products/:id', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const deleted = db.deleteProduct(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Product not found' });
  }
  broadcastEvent('product_deleted', { id: req.params.id });
  res.json({ success: true });
});

// ==========================================
// ORDERS & CHECKOUT ROUTES
// ==========================================
apiRouter.get('/orders', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let orders = db.getOrders();
  if (user.role === 'customer') {
    orders = orders.filter(o => o.customerId === user.id);
  } else if (user.role === 'delivery_partner') {
    const partner = db.getPartnerByUserId(user.id);
    if (partner) {
      orders = orders.filter(o => o.assignedPartnerId === partner.id);
    } else {
      orders = [];
    }
  }

  res.json({ orders });
});

apiRouter.get('/orders/:id', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Privacy Rule: Customer can ONLY access their own order
  if (user.role === 'customer' && order.customerId !== user.id) {
    return res.status(403).json({ error: 'Access denied to this order' });
  }

  // For customer view, sanitize delivery partner private telemetry if needed
  res.json({ order });
});

apiRouter.post('/orders', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { items, deliveryAddress, couponCode, paymentMethod } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Cart items cannot be empty' });
  }

  // Stock check and calculation
  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const prod = db.getProductById(item.productId);
    if (!prod) {
      return res.status(400).json({ error: `Product ID ${item.productId} not found` });
    }
    if (prod.stock < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${prod.name}. Only ${prod.stock} available.` });
    }
    // Deduct stock
    prod.stock -= item.quantity;
    const itemTotal = prod.price * item.quantity;
    subtotal += itemTotal;
    orderItems.push({
      productId: prod.id,
      productName: prod.name,
      quantity: item.quantity,
      price: prod.price,
      image: prod.image,
    });
  }

  let discount = 0;
  if (couponCode === 'SMARTAI50') discount = 50;
  else if (couponCode === 'WELCOME100') discount = 100;

  const deliveryFee = subtotal > 500 ? 0 : 25;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  // Generate 4-digit OTP for delivery confirmation
  const otpCode = Math.floor(1000 + Math.random() * 9000).toString();

  // Default coordinate if none provided
  const targetLocation = deliveryAddress || {
    lat: 12.9750 + (Math.random() - 0.5) * 0.04,
    lng: 77.6400 + (Math.random() - 0.5) * 0.04,
    address: 'Indiranagar Main Road, Bengaluru',
    city: 'Bengaluru',
  };

  const newOrder: Order = {
    id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    customerId: user.id,
    customerName: user.name,
    customerPhone: user.phone || '+91 98765 43210',
    items: orderItems,
    subtotal,
    deliveryFee,
    discount,
    couponCode: couponCode || undefined,
    total,
    paymentMethod: paymentMethod || 'UPI',
    paymentStatus: 'PAID',
    status: 'PLACED',
    deliveryAddress: targetLocation,
    warehouseLocation: {
      lat: 12.9698,
      lng: 77.6501,
      address: 'Indiranagar Micro-Fulfillment Hub #4',
      city: 'Bengaluru',
    },
    priority: subtotal > 1000 ? 'EXPRESS' : 'NORMAL',
    createdAt: new Date().toISOString(),
    estimatedDeliveryTime: new Date(Date.now() + 18 * 60000).toISOString(),
    statusHistory: [
      {
        status: 'PLACED',
        timestamp: new Date().toISOString(),
        note: `Order placed via ${paymentMethod || 'UPI'}`,
      },
    ],
    otpCode,
  };

  // Auto-confirm and check for available delivery partner to auto-assign
  setTimeout(() => {
    db.updateOrderStatus(newOrder.id, 'CONFIRMED', 'Inventory reserved and confirmed by warehouse system');
    broadcastEvent('order_updated', { orderId: newOrder.id, status: 'CONFIRMED' });

    setTimeout(() => {
      db.updateOrderStatus(newOrder.id, 'PACKED', 'Order packed and placed in dispatch bay');
      broadcastEvent('order_updated', { orderId: newOrder.id, status: 'PACKED' });

      // Find best online partner prioritizing same-corridor/path pooling
      const match = findBestPartnerForOrder(newOrder, db.deliveryPartners, db.orders);
      if (match.partner) {
        db.assignOrderToPartner(newOrder.id, match.partner.id);

        if (match.isBatched && match.batchedWithOrderIds.length > 0) {
          const sharedBatchId = `BATCH-${match.partner.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
          newOrder.isBatched = true;
          newOrder.batchId = sharedBatchId;
          newOrder.coDeliveryCorridor = match.corridorName;
          newOrder.batchedWithOrderIds = match.batchedWithOrderIds;
          newOrder.batchFuelSavingsLiters = match.fuelSavedLiters;
          newOrder.batchCostSavings = match.costSaved;

          for (const otherId of match.batchedWithOrderIds) {
            const otherOrd = db.getOrderById(otherId);
            if (otherOrd) {
              otherOrd.isBatched = true;
              otherOrd.batchId = sharedBatchId;
              otherOrd.coDeliveryCorridor = match.corridorName;
              if (!otherOrd.batchedWithOrderIds) otherOrd.batchedWithOrderIds = [];
              if (!otherOrd.batchedWithOrderIds.includes(newOrder.id)) {
                otherOrd.batchedWithOrderIds.push(newOrder.id);
              }
            }
          }
        }

        broadcastEvent('order_updated', {
          orderId: newOrder.id,
          status: 'ASSIGNED',
          partnerId: match.partner.id,
          isBatched: match.isBatched,
        });
      }
    }, 5000);
  }, 2500);

  db.createOrder(newOrder);
  broadcastEvent('order_created', newOrder);

  res.status(201).json({ order: newOrder });
});

// Update order status (Pick up, out for delivery, cancel)
apiRouter.patch('/orders/:id/status', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { status, note } = req.body;
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const updated = db.updateOrderStatus(order.id, status, note);
  broadcastEvent('order_updated', { orderId: order.id, status, note });
  res.json({ order: updated });
});

// Assign delivery partner with automatic same-path co-delivery batching
apiRouter.post('/orders/:id/assign', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { partnerId } = req.body;
  const updated = db.assignOrderToPartner(req.params.id, partnerId);
  if (!updated) {
    return res.status(400).json({ error: 'Unable to assign partner to order' });
  }

  const partner = db.getPartnerById(partnerId);
  if (partner) {
    const activeOrders = db
      .getOrders()
      .filter(
        o =>
          o.assignedPartnerId === partner.id &&
          ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)
      );

    if (activeOrders.length > 1) {
      const savings = calculateBatchSavings(activeOrders, partner, db.simulation.fuelPricePerUnit);
      const corridor = detectCorridorName(
        activeOrders[0].deliveryAddress.address,
        activeOrders[1].deliveryAddress.address
      );
      const sharedBatchId =
        activeOrders[0].batchId ||
        `BATCH-${partner.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const allIds = activeOrders.map(o => o.id);

      for (const ord of activeOrders) {
        ord.isBatched = true;
        ord.batchId = sharedBatchId;
        ord.coDeliveryCorridor = corridor;
        ord.batchedWithOrderIds = allIds.filter(id => id !== ord.id);
        ord.batchFuelSavingsLiters = Number((savings.fuelSavedLiters / activeOrders.length).toFixed(2));
        ord.batchCostSavings = Math.round(savings.costSaved / activeOrders.length);
      }
    }
  }

  broadcastEvent('order_updated', {
    orderId: updated.id,
    status: 'ASSIGNED',
    partnerId,
    isBatched: updated.isBatched,
  });
  res.json({ order: updated });
});

// Manual Batch Assignment (Admin selects multiple orders to pool to one delivery person)
apiRouter.post('/orders/batch-assign', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { orderIds, partnerId } = req.body;
  if (!Array.isArray(orderIds) || orderIds.length === 0 || !partnerId) {
    return res.status(400).json({ error: 'orderIds array and partnerId are required' });
  }

  const partner = db.getPartnerById(partnerId);
  if (!partner) {
    return res.status(404).json({ error: 'Delivery partner not found' });
  }

  const cap = getVehicleCapacity(partner.vehicleType);
  if (orderIds.length > cap.maxOrders) {
    return res.status(400).json({
      error: `Vehicle capacity exceeded. ${partner.vehicleType.replace('_', ' ')} can carry a maximum of ${cap.maxOrders} orders simultaneously.`,
    });
  }

  const assignedOrders: Order[] = [];
  for (const id of orderIds) {
    const ord = db.assignOrderToPartner(id, partner.id);
    if (ord) assignedOrders.push(ord);
  }

  if (assignedOrders.length > 1) {
    const savings = calculateBatchSavings(assignedOrders, partner, db.simulation.fuelPricePerUnit);
    const corridor = detectCorridorName(
      assignedOrders[0].deliveryAddress.address,
      assignedOrders[1]?.deliveryAddress.address
    );
    const sharedBatchId = `BATCH-${partner.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const allIds = assignedOrders.map(o => o.id);

    for (const ord of assignedOrders) {
      ord.isBatched = true;
      ord.batchId = sharedBatchId;
      ord.coDeliveryCorridor = corridor;
      ord.batchedWithOrderIds = allIds.filter(id => id !== ord.id);
      ord.batchFuelSavingsLiters = Number((savings.fuelSavedLiters / assignedOrders.length).toFixed(2));
      ord.batchCostSavings = Math.round(savings.costSaved / assignedOrders.length);
    }
  }

  broadcastEvent('orders_batched', { partnerId: partner.id, orderIds });
  res.json({
    success: true,
    message: `Successfully batched ${assignedOrders.length} orders for ${partner.name}`,
    orders: assignedOrders,
  });
});

// Auto-Batch Optimizer: Automatically detects orders on the same path / area and clusters them to minimize fuel
apiRouter.post('/orders/auto-batch', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user || (user.role !== 'admin' && user.role !== 'delivery_partner')) {
    return res.status(403).json({ error: 'Admin or dispatcher access required' });
  }

  const onlinePartners = db.getDeliveryPartners().filter(p => p.isOnline);
  if (onlinePartners.length === 0) {
    return res.status(400).json({ error: 'No delivery partners are currently online for auto-batching.' });
  }

  const batches: BatchGroup[] = [];
  let totalFuelSaved = 0;
  let totalCostSaved = 0;
  let totalDistSaved = 0;
  let totalCO2Saved = 0;
  let ordersBatchedCount = 0;

  for (const partner of onlinePartners) {
    const cap = getVehicleCapacity(partner.vehicleType);
    let active = db
      .getOrders()
      .filter(
        o =>
          o.assignedPartnerId === partner.id &&
          ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)
      );

    // Look for unassigned or pending/packed orders in the same path/corridor
    const unassigned = db
      .getOrders()
      .filter(
        o => (!o.assignedPartnerId || o.status === 'PACKED' || o.status === 'CONFIRMED') &&
             !active.some(a => a.id === o.id)
      );

    for (const candidate of unassigned) {
      if (active.length >= cap.maxOrders) break;

      let matched = false;
      if (active.length === 0) {
        // Can take initial order
        matched = true;
      } else {
        for (const act of active) {
          const affinity = evaluateCorridorAffinity(act, candidate);
          if (affinity.inSamePath) {
            matched = true;
            break;
          }
        }
      }

      if (matched) {
        db.assignOrderToPartner(candidate.id, partner.id);
        active.push(candidate);
      }
    }

    // If partner has 2 or more orders along the corridor, finalize batch metrics
    if (active.length > 1) {
      const savings = calculateBatchSavings(active, partner, db.simulation.fuelPricePerUnit);
      const corridor = detectCorridorName(
        active[0].deliveryAddress.address,
        active[1].deliveryAddress.address
      );
      const sharedBatchId =
        active[0].batchId ||
        `BATCH-${partner.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const allIds = active.map(o => o.id);
      const custNames = Array.from(new Set(active.map(o => o.customerName)));

      for (const ord of active) {
        ord.isBatched = true;
        ord.batchId = sharedBatchId;
        ord.coDeliveryCorridor = corridor;
        ord.batchedWithOrderIds = allIds.filter(id => id !== ord.id);
        ord.batchFuelSavingsLiters = Number((savings.fuelSavedLiters / active.length).toFixed(2));
        ord.batchCostSavings = Math.round(savings.costSaved / active.length);
      }

      batches.push({
        batchId: sharedBatchId,
        partnerId: partner.id,
        partnerName: partner.name,
        vehicleType: partner.vehicleType,
        corridorName: corridor,
        orderIds: allIds,
        customerNames: custNames,
        totalDistanceKm: Number((savings.distanceSavedKm > 0 ? 8.5 : 5.2).toFixed(1)),
        unbatchedDistanceKm: Number((8.5 + savings.distanceSavedKm).toFixed(1)),
        distanceSavedKm: savings.distanceSavedKm,
        fuelSavedLiters: savings.fuelSavedLiters,
        costSaved: savings.costSaved,
        co2SavedKg: savings.co2SavedKg,
      });

      totalFuelSaved += savings.fuelSavedLiters;
      totalCostSaved += savings.costSaved;
      totalDistSaved += savings.distanceSavedKm;
      totalCO2Saved += savings.co2SavedKg;
      ordersBatchedCount += active.length;
    }
  }

  broadcastEvent('orders_batched', { batches, ordersBatchedCount, totalFuelSaved });

  const summaryResult: BatchDispatchSummary = {
    success: true,
    batchesCreated: batches.length,
    ordersBatched: ordersBatchedCount,
    totalFuelSavedLiters: Number(totalFuelSaved.toFixed(2)),
    totalCostSaved: Math.round(totalCostSaved),
    totalDistanceSavedKm: Number(totalDistSaved.toFixed(1)),
    totalCO2SavedKg: Number(totalCO2Saved.toFixed(2)),
    batches,
    summary: `Corridor Dispatch grouped ${ordersBatchedCount} orders across ${batches.length} shared co-delivery runs, preventing ${totalDistSaved.toFixed(1)} km of duplicate transit and saving ${totalFuelSaved.toFixed(2)} ${onlinePartners[0]?.fuelType === 'Electric' ? 'kWh' : 'liters'} of fuel (₹${Math.round(totalCostSaved)} saved).`,
  };

  res.json(summaryResult);
});

// Confirm Delivery with OTP or Photo proof
apiRouter.post('/orders/:id/confirm-delivery', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { otp, note, photoUrl } = req.body;
  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Validate OTP if provided
  if (order.otpCode && otp && otp.trim() !== order.otpCode) {
    return res.status(400).json({ error: 'Invalid delivery verification OTP' });
  }

  const proof = {
    otpVerified: Boolean(otp && otp.trim() === order.otpCode),
    note: note || 'Package securely delivered to customer',
    photoUrl: photoUrl || undefined,
    timestamp: new Date().toISOString(),
  };

  const updated = db.updateOrderStatus(order.id, 'DELIVERED', 'Delivered successfully and confirmed', proof);
  broadcastEvent('order_updated', { orderId: order.id, status: 'DELIVERED', proof });

  res.json({ order: updated, message: 'Delivery confirmed successfully' });
});

// Digital Receipt
apiRouter.get('/orders/:id/receipt', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const order = db.getOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (user.role === 'customer' && order.customerId !== user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const receipt = {
    storeName: 'SmartAI Logistics Quick-Commerce Pvt. Ltd.',
    gstNumber: '29AAECS1234F1Z5',
    orderId: order.id,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    orderDate: order.createdAt,
    deliveryDate: order.actualDeliveryTime || order.estimatedDeliveryTime,
    items: order.items,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    discount: order.discount,
    couponCode: order.couponCode,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    deliveryStatus: order.status,
    deliveryAddress: order.deliveryAddress.address,
    partnerName: order.assignedPartnerName,
  };

  res.json({ receipt });
});

// ==========================================
// DELIVERY PARTNER & AI ROUTE OPTIMIZATION
// ==========================================
apiRouter.get('/delivery/partner/:id', (req: Request, res: Response) => {
  const partner = db.getPartnerById(req.params.id) || db.getPartnerByUserId(req.params.id);
  if (!partner) {
    return res.status(404).json({ error: 'Delivery partner not found' });
  }
  res.json({ partner });
});

apiRouter.post('/delivery/toggle-availability', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const partner = db.getPartnerByUserId(user.id) || db.getDeliveryPartners()[0];
  if (!partner) return res.status(404).json({ error: 'Partner profile not found' });

  const { isOnline } = req.body;
  partner.isOnline = isOnline !== undefined ? isOnline : !partner.isOnline;
  broadcastEvent('fleet_updated', partner);
  res.json({ partner });
});

apiRouter.post('/delivery/update-location', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const partner = db.getPartnerByUserId(user.id) || db.getDeliveryPartners()[0];
  if (!partner) return res.status(404).json({ error: 'Partner profile not found' });

  const { lat, lng } = req.body;
  if (typeof lat === 'number' && typeof lng === 'number') {
    partner.currentLocation.lat = lat;
    partner.currentLocation.lng = lng;
    broadcastEvent('partner_location', { partnerId: partner.id, lat, lng });
  }
  res.json({ partner });
});

// AI-Assisted Route Optimization
apiRouter.get('/delivery/optimize-route/:partnerId', async (req: Request, res: Response) => {
  const partner = db.getPartnerById(req.params.partnerId) || db.getDeliveryPartners()[0];
  if (!partner) {
    return res.status(404).json({ error: 'Delivery partner not found' });
  }

  // Fetch all assigned, picked up, or out for delivery orders for this partner
  const assignedOrders = db
    .getOrders()
    .filter(
      o =>
        o.assignedPartnerId === partner.id &&
        ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)
    );

  const simulation = db.simulation;
  const routeResult = await optimizeDeliveryRoute(
    partner,
    assignedOrders,
    simulation.traffic,
    simulation.weather,
    simulation.fuelPricePerUnit
  );

  // Check if caller explicitly requested to apply the AI Smart Detour Bypass
  const shouldApplyDetour = req.query.applyDetour === 'true' || simulation.smartDetourActive;
  if (shouldApplyDetour && routeResult.smartDetourPolyline) {
    routeResult.alternativePolyline = routeResult.routePolyline;
    routeResult.routePolyline = routeResult.smartDetourPolyline;
    routeResult.totalDurationMinutes = Math.max(5, routeResult.totalDurationMinutes - (routeResult.smartDetourSavingsMinutes || 6));
    routeResult.appliedDetour = true;
    routeResult.aiExplanation = `[AI SMART DETOUR APPLIED] Diverted around 100ft road congestion via arterial bypass lanes, cutting transit by ~${routeResult.smartDetourSavingsMinutes} minutes. ${routeResult.aiExplanation}`;
  }

  // Optional Gemini AI enhancement
  const aiInsight = await generateAILogisticsInsight(partner, assignedOrders, routeResult, simulation);
  routeResult.aiExplanation = aiInsight.explanation;
  routeResult.recommendations = aiInsight.recommendations;

  res.json({ route: routeResult });
});

// ==========================================
// SIMULATION & FLEET MANAGEMENT
// ==========================================
apiRouter.get('/simulation', (req: Request, res: Response) => {
  if (!db.simulation.weatherTelemetry) {
    db.simulation.weatherTelemetry = generateWeatherTelemetry(db.simulation.weather);
  }
  res.json({ simulation: db.simulation });
});

apiRouter.post('/simulation', (req: Request, res: Response) => {
  const { traffic, weather, fuelPricePerUnit, smartDetourActive } = req.body;

  const update: Partial<typeof db.simulation> = {};
  if (traffic) {
    update.traffic = traffic;
    if (traffic === 'LOW') update.trafficMultiplier = 1.0;
    else if (traffic === 'MEDIUM') update.trafficMultiplier = 1.25;
    else if (traffic === 'HIGH') update.trafficMultiplier = 1.65;
    else if (traffic === 'SEVERE') update.trafficMultiplier = 2.2;
  }
  if (weather) {
    update.weather = weather;
    if (weather === 'CLEAR') update.weatherDelayMinutes = 0;
    else if (weather === 'CLOUDY') update.weatherDelayMinutes = 1;
    else if (weather === 'RAIN') update.weatherDelayMinutes = 5;
    else if (weather === 'THUNDERSTORM') update.weatherDelayMinutes = 8;
    else if (weather === 'HEATWAVE') update.weatherDelayMinutes = 2;
    else if (weather === 'FOG') update.weatherDelayMinutes = 4.5;
    update.weatherTelemetry = generateWeatherTelemetry(weather);
  }
  if (fuelPricePerUnit) update.fuelPricePerUnit = Number(fuelPricePerUnit);
  if (typeof smartDetourActive === 'boolean') update.smartDetourActive = smartDetourActive;

  const updatedSim = db.updateSimulation(update);
  broadcastEvent('simulation_updated', updatedSim);
  res.json({ simulation: updatedSim });
});

// Auto-Detect Environmental Traffic and Weather based on time of day & live simulation cycle
apiRouter.post('/simulation/auto-detect', (req: Request, res: Response) => {
  const hour = new Date().getHours();
  // Simulate rush-hour vs non-rush-hour
  let detectedTraffic: 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE' = 'MEDIUM';
  if ((hour >= 8 && hour <= 11) || (hour >= 17 && hour <= 21)) {
    detectedTraffic = Math.random() > 0.4 ? 'SEVERE' : 'HIGH';
  } else if (hour >= 12 && hour <= 16) {
    detectedTraffic = 'MEDIUM';
  } else {
    detectedTraffic = 'LOW';
  }

  // Random weather variance based on climate modeling
  const weatherOptions: ('CLEAR' | 'CLOUDY' | 'RAIN' | 'THUNDERSTORM' | 'HEATWAVE' | 'FOG')[] = [
    'CLEAR',
    'CLOUDY',
    'RAIN',
    'THUNDERSTORM',
    'HEATWAVE',
    'FOG',
  ];
  // Select a realistic shift or retain current
  const detectedWeather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];

  const update = {
    traffic: detectedTraffic,
    trafficMultiplier:
      detectedTraffic === 'SEVERE' ? 2.2 : detectedTraffic === 'HIGH' ? 1.65 : detectedTraffic === 'MEDIUM' ? 1.25 : 1.0,
    weather: detectedWeather,
    weatherDelayMinutes:
      detectedWeather === 'THUNDERSTORM' ? 8 : detectedWeather === 'RAIN' ? 5 : detectedWeather === 'FOG' ? 4.5 : detectedWeather === 'HEATWAVE' ? 2 : detectedWeather === 'CLOUDY' ? 1 : 0,
    weatherTelemetry: generateWeatherTelemetry(detectedWeather),
    simulationTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  const updatedSim = db.updateSimulation(update);
  broadcastEvent('simulation_updated', updatedSim);
  res.json({
    simulation: updatedSim,
    message: `Identified live conditions: ${detectedTraffic} traffic with ${detectedWeather} weather.`,
  });
});

apiRouter.get('/fleet', (req: Request, res: Response) => {
  const partners = db.getDeliveryPartners();
  res.json({ partners });
});

apiRouter.get('/analytics', (req: Request, res: Response) => {
  const analytics = db.getAnalytics();
  res.json({ analytics });
});
