import {
  User,
  Product,
  Order,
  DeliveryPartner,
  SimulationState,
  AnalyticsSummary,
} from '../src/types.js';

// Pre-seeded Demo Users (Passwords can be entered or quick-switched)
export const initialUsers: (User & { passwordHash: string })[] = [
  {
    id: 'user_cust_1',
    name: 'Aarav Sharma',
    email: 'customer@smartai.com',
    role: 'customer',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80',
    address: 'Flat 402, Green Valley Apts, Indiranagar, Bengaluru',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    passwordHash: 'password123',
  },
  {
    id: 'user_rider_1',
    name: 'Rohan Verma',
    email: 'rider@smartai.com',
    role: 'delivery_partner',
    phone: '+91 91234 56789',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=160&q=80',
    address: 'Koramangala Hub, Bengaluru',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    passwordHash: 'password123',
  },
  {
    id: 'user_rider_2',
    name: 'Pooja Nair',
    email: 'pooja.rider@smartai.com',
    role: 'delivery_partner',
    phone: '+91 92345 67890',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
    address: 'HSR Layout Sector 2, Bengaluru',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    passwordHash: 'password123',
  },
  {
    id: 'user_admin_1',
    name: 'Vikram Mehta (Operations Admin)',
    email: 'admin@smartai.com',
    role: 'admin',
    phone: '+91 99887 76655',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=160&q=80',
    address: 'SmartAI Central Logistics HQ, Domlur, Bengaluru',
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    passwordHash: 'admin123',
  },
];

export const initialDeliveryPartners: DeliveryPartner[] = [
  {
    id: 'dp_1',
    userId: 'user_rider_1',
    name: 'Rohan Verma',
    gender: 'male',
    phone: '+91 91234 56789',
    isOnline: true,
    currentLocation: {
      lat: 12.9716,
      lng: 77.6412,
      address: 'Indiranagar 100ft Road, Bengaluru',
      city: 'Bengaluru',
    },
    vehicleType: 'electric_bike',
    vehiclePlate: 'KA 03 EV 2049',
    vehicleEfficiency: 4.2, // 4.2 kWh / 100km
    fuelType: 'Electric',
    totalDeliveries: 342,
    rating: 4.9,
    totalDistanceKm: 1840.5,
    totalFuelUsed: 77.3,
    todayEarnings: 840,
    activeOrderIds: ['ORD-7821', 'ORD-7822'],
  },
  {
    id: 'dp_2',
    userId: 'user_rider_2',
    name: 'Pooja Nair',
    gender: 'female',
    phone: '+91 92345 67890',
    isOnline: true,
    currentLocation: {
      lat: 12.9352,
      lng: 77.6245,
      address: 'Koramangala 4th Block, Bengaluru',
      city: 'Bengaluru',
    },
    vehicleType: 'motorcycle',
    vehiclePlate: 'KA 01 EK 8812',
    vehicleEfficiency: 2.8, // 2.8 L / 100km
    fuelType: 'Petrol',
    totalDeliveries: 418,
    rating: 4.95,
    totalDistanceKm: 2310.0,
    totalFuelUsed: 64.6,
    todayEarnings: 1120,
    activeOrderIds: ['ORD-7823'],
  },
  {
    id: 'dp_3',
    userId: 'user_rider_3',
    name: 'Karan Patel',
    gender: 'male',
    phone: '+91 93456 78901',
    isOnline: false,
    currentLocation: {
      lat: 12.9121,
      lng: 77.6446,
      address: 'HSR Sector 1, Bengaluru',
      city: 'Bengaluru',
    },
    vehicleType: 'electric_van',
    vehiclePlate: 'KA 05 EV 9901',
    vehicleEfficiency: 14.5, // 14.5 kWh / 100km
    fuelType: 'Electric',
    totalDeliveries: 512,
    rating: 4.88,
    totalDistanceKm: 3420.2,
    totalFuelUsed: 495.9,
    todayEarnings: 0,
    activeOrderIds: [],
  },
];

export const initialProducts: Product[] = [
  // Grocery & Essentials
  {
    id: 'prod_1',
    name: 'Fresh Organic Alphonso Mangoes',
    category: 'Grocery & Essentials',
    description: 'Naturally ripened, premium export quality GI-tagged Alphonso mangoes with rich aroma and sweet pulp.',
    price: 380,
    originalPrice: 480,
    discountPercent: 21,
    stock: 45,
    rating: 4.9,
    reviewsCount: 184,
    image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
    unit: '1 kg (approx 4-5 pcs)',
    warehouse: 'Bengaluru East Fulfillment Hub',
    estimatedMinutes: 12,
    isPopular: true,
  },
  {
    id: 'prod_2',
    name: 'Farm-Fresh Cow Milk (A2 Pasteurized)',
    category: 'Grocery & Essentials',
    description: 'Chilled, pure single-origin A2 cow milk delivered in recyclable glass bottles within 6 hours of milking.',
    price: 68,
    originalPrice: 75,
    discountPercent: 9,
    stock: 120,
    rating: 4.8,
    reviewsCount: 540,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
    unit: '1 Litre',
    warehouse: 'Bengaluru East Fulfillment Hub',
    estimatedMinutes: 10,
    isPopular: true,
  },
  {
    id: 'prod_3',
    name: 'Organic Whole Wheat Sourdough Bread',
    category: 'Grocery & Essentials',
    description: 'Artisanal 24-hour slow fermented sourdough bread baked fresh every morning with 100% stoneground flour.',
    price: 110,
    originalPrice: 130,
    discountPercent: 15,
    stock: 28,
    rating: 4.7,
    reviewsCount: 92,
    image: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80',
    unit: '400g Loaf',
    warehouse: 'Indiranagar Micro-Warehouse',
    estimatedMinutes: 15,
  },
  {
    id: 'prod_4',
    name: 'California Jumbo Almonds',
    category: 'Grocery & Essentials',
    description: 'Crisp, vacuum-packed California badam rich in Vitamin E, proteins, and healthy dietary fiber.',
    price: 399,
    originalPrice: 550,
    discountPercent: 27,
    stock: 65,
    rating: 4.9,
    reviewsCount: 220,
    image: 'https://images.unsplash.com/photo-1508061252224-237ff54ed5a9?auto=format&fit=crop&w=600&q=80',
    unit: '500g Pouch',
    warehouse: 'Bengaluru East Fulfillment Hub',
    estimatedMinutes: 12,
  },
  // Food & Beverages
  {
    id: 'prod_5',
    name: 'Cold-Pressed Valencia Orange Juice',
    category: 'Food & Beverages',
    description: '100% pure squeezed oranges with natural pulp. No added sugars, preservatives, or artificial flavors.',
    price: 145,
    originalPrice: 175,
    discountPercent: 17,
    stock: 35,
    rating: 4.8,
    reviewsCount: 164,
    image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
    unit: '500ml Bottle',
    warehouse: 'Indiranagar Micro-Warehouse',
    estimatedMinutes: 10,
    isPopular: true,
  },
  {
    id: 'prod_6',
    name: 'Artisan Dark Roast Ground Coffee',
    category: 'Food & Beverages',
    description: 'Single-estate Arabica beans from Chikmagalur hills, medium-dark roasted with notes of hazelnut and cacao.',
    price: 340,
    originalPrice: 420,
    discountPercent: 19,
    stock: 50,
    rating: 4.9,
    reviewsCount: 310,
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    unit: '250g Tin',
    warehouse: 'Central Hub Domlur',
    estimatedMinutes: 15,
  },
  // Electronics
  {
    id: 'prod_7',
    name: 'Smart ANC True Wireless Earbuds',
    category: 'Electronics',
    description: 'Active Noise Cancellation up to 35dB, 40-hour battery life with Qi wireless charging case and IPX5 water resistance.',
    price: 1899,
    originalPrice: 2999,
    discountPercent: 37,
    stock: 18,
    rating: 4.7,
    reviewsCount: 88,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
    unit: '1 Unit',
    warehouse: 'Central Hub Domlur',
    estimatedMinutes: 20,
    isPopular: true,
  },
  {
    id: 'prod_8',
    name: '65W GaN Fast Charger with Dual Type-C',
    category: 'Electronics',
    description: 'Ultra-compact Gallium Nitride wall adapter supporting Power Delivery 3.0, PPS, and laptop fast charging.',
    price: 1249,
    originalPrice: 1999,
    discountPercent: 38,
    stock: 30,
    rating: 4.8,
    reviewsCount: 142,
    image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80',
    unit: '1 Unit',
    warehouse: 'Central Hub Domlur',
    estimatedMinutes: 18,
  },
  // Healthcare & Personal
  {
    id: 'prod_9',
    name: 'Advanced Electrolyte Hydration Drink',
    category: 'Healthcare & Personal',
    description: 'Instant electrolyte replenishment with potassium, magnesium, zinc and natural berry flavor for fast recovery.',
    price: 95,
    originalPrice: 120,
    discountPercent: 21,
    stock: 80,
    rating: 4.8,
    reviewsCount: 205,
    image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80',
    unit: 'Pack of 4 (250ml each)',
    warehouse: 'Indiranagar Micro-Warehouse',
    estimatedMinutes: 12,
  },
  {
    id: 'prod_10',
    name: 'Gentle Foaming Ceramide Face Cleanser',
    category: 'Healthcare & Personal',
    description: 'Dermatologist-tested hydrating cleanser formulated with 3 essential ceramides and hyaluronic acid.',
    price: 360,
    originalPrice: 450,
    discountPercent: 20,
    stock: 22,
    rating: 4.9,
    reviewsCount: 174,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
    unit: '200ml Pump',
    warehouse: 'Bengaluru East Fulfillment Hub',
    estimatedMinutes: 15,
  },
  // Fashion
  {
    id: 'prod_11',
    name: '100% Organic Pima Cotton Oversized Tee',
    category: 'Fashion',
    description: 'Breathable heavyweight 240 GSM pre-shrunk cotton t-shirt with reinforced crew neck and minimal drape.',
    price: 799,
    originalPrice: 1299,
    discountPercent: 38,
    stock: 40,
    rating: 4.6,
    reviewsCount: 65,
    image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    unit: 'Size L (Sage Green)',
    warehouse: 'Central Hub Domlur',
    estimatedMinutes: 25,
  },
  // Household Products
  {
    id: 'prod_12',
    name: 'Eco-Friendly Plant-Powered Dishwash Liquid',
    category: 'Household Products',
    description: 'Non-toxic, grease-cutting formula powered by citrus enzymes and aloe vera. Safe for baby utensils and hands.',
    price: 185,
    originalPrice: 220,
    discountPercent: 16,
    stock: 55,
    rating: 4.8,
    reviewsCount: 130,
    image: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=600&q=80',
    unit: '1 Litre Refill',
    warehouse: 'Indiranagar Micro-Warehouse',
    estimatedMinutes: 12,
  },
];

export const initialOrders: Order[] = [
  {
    id: 'ORD-7821',
    customerId: 'user_cust_1',
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98765 43210',
    items: [
      {
        productId: 'prod_1',
        productName: 'Fresh Organic Alphonso Mangoes',
        quantity: 2,
        price: 380,
        image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80',
      },
      {
        productId: 'prod_5',
        productName: 'Cold-Pressed Valencia Orange Juice',
        quantity: 1,
        price: 145,
        image: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
      },
    ],
    subtotal: 905,
    deliveryFee: 25,
    discount: 50,
    couponCode: 'SMARTAI50',
    total: 880,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    status: 'OUT_FOR_DELIVERY',
    deliveryAddress: {
      lat: 12.9784,
      lng: 77.6408,
      address: '402, Green Valley Apartments, 12th Main, Indiranagar',
      city: 'Bengaluru',
    },
    warehouseLocation: {
      lat: 12.9698,
      lng: 77.6501,
      address: 'Indiranagar Micro-Fulfillment Hub #4',
      city: 'Bengaluru',
    },
    assignedPartnerId: 'dp_1',
    assignedPartnerName: 'Rohan Verma',
    assignedPartnerVehicle: 'Electric Bike (KA 03 EV 2049)',
    assignedPartnerRating: 4.9,
    priority: 'EXPRESS',
    createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    estimatedDeliveryTime: new Date(Date.now() + 10 * 60000).toISOString(),
    statusHistory: [
      {
        status: 'PLACED',
        timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
        note: 'Order placed by customer via UPI',
      },
      {
        status: 'CONFIRMED',
        timestamp: new Date(Date.now() - 32 * 60000).toISOString(),
        note: 'Inventory allocated at Indiranagar Hub',
      },
      {
        status: 'PACKED',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        note: 'Packed in eco-insulated thermal tote',
      },
      {
        status: 'ASSIGNED',
        timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
        note: 'Dispatched to Rohan Verma (Electric Bike)',
      },
      {
        status: 'PICKED_UP',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
        note: 'Driver verified barcodes and departed warehouse',
      },
      {
        status: 'OUT_FOR_DELIVERY',
        timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
        note: 'Driver on optimized route. Approaching customer area',
      },
    ],
    otpCode: '4829',
    isBatched: true,
    batchId: 'BATCH-INDIRA-01',
    coDeliveryCorridor: 'Indiranagar - CMH Metro Corridor',
    batchedWithOrderIds: ['ORD-7822'],
    batchFuelSavingsLiters: 0.38,
    batchCostSavings: 39,
    estimatedWeightKg: 1.8,
  },
  {
    id: 'ORD-7822',
    customerId: 'user_cust_2',
    customerName: 'Meera Iyer',
    customerPhone: '+91 97654 32109',
    items: [
      {
        productId: 'prod_2',
        productName: 'Farm-Fresh Cow Milk (A2 Pasteurized)',
        quantity: 2,
        price: 68,
        image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
      },
      {
        productId: 'prod_3',
        productName: 'Organic Whole Wheat Sourdough Bread',
        quantity: 1,
        price: 110,
        image: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=600&q=80',
      },
    ],
    subtotal: 246,
    deliveryFee: 15,
    discount: 0,
    total: 261,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    status: 'PICKED_UP',
    deliveryAddress: {
      lat: 12.9667,
      lng: 77.6369,
      address: 'B-14, Shanti Niketan, CMH Road, Indiranagar',
      city: 'Bengaluru',
    },
    warehouseLocation: {
      lat: 12.9698,
      lng: 77.6501,
      address: 'Indiranagar Micro-Fulfillment Hub #4',
      city: 'Bengaluru',
    },
    assignedPartnerId: 'dp_1',
    assignedPartnerName: 'Rohan Verma',
    assignedPartnerVehicle: 'Electric Bike (KA 03 EV 2049)',
    assignedPartnerRating: 4.9,
    priority: 'HIGH',
    createdAt: new Date(Date.now() - 28 * 60000).toISOString(),
    estimatedDeliveryTime: new Date(Date.now() + 22 * 60000).toISOString(),
    statusHistory: [
      {
        status: 'PLACED',
        timestamp: new Date(Date.now() - 28 * 60000).toISOString(),
      },
      {
        status: 'CONFIRMED',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      },
      {
        status: 'PACKED',
        timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
      },
      {
        status: 'ASSIGNED',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        status: 'PICKED_UP',
        timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
      },
    ],
    otpCode: '7193',
    isBatched: true,
    batchId: 'BATCH-INDIRA-01',
    coDeliveryCorridor: 'Indiranagar - CMH Metro Corridor',
    batchedWithOrderIds: ['ORD-7821'],
    batchFuelSavingsLiters: 0.38,
    batchCostSavings: 39,
    estimatedWeightKg: 1.4,
  },
  {
    id: 'ORD-7823',
    customerId: 'user_cust_3',
    customerName: 'Devansh Kulkarni',
    customerPhone: '+91 96543 21098',
    items: [
      {
        productId: 'prod_7',
        productName: 'Smart ANC True Wireless Earbuds',
        quantity: 1,
        price: 1899,
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
      },
    ],
    subtotal: 1899,
    deliveryFee: 0,
    discount: 100,
    couponCode: 'WELCOME100',
    total: 1799,
    paymentMethod: 'Card',
    paymentStatus: 'PAID',
    status: 'ASSIGNED',
    deliveryAddress: {
      lat: 12.9344,
      lng: 77.6189,
      address: '77, 5th Block, Koramangala',
      city: 'Bengaluru',
    },
    warehouseLocation: {
      lat: 12.9560,
      lng: 77.6400,
      address: 'Domlur Logistics Center',
      city: 'Bengaluru',
    },
    assignedPartnerId: 'dp_2',
    assignedPartnerName: 'Pooja Nair',
    assignedPartnerVehicle: 'Motorcycle (KA 01 EK 8812)',
    assignedPartnerRating: 4.95,
    priority: 'NORMAL',
    createdAt: new Date(Date.now() - 40 * 60000).toISOString(),
    estimatedDeliveryTime: new Date(Date.now() + 30 * 60000).toISOString(),
    statusHistory: [
      {
        status: 'PLACED',
        timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
      },
      {
        status: 'CONFIRMED',
        timestamp: new Date(Date.now() - 36 * 60000).toISOString(),
      },
      {
        status: 'PACKED',
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
      },
      {
        status: 'ASSIGNED',
        timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      },
    ],
    otpCode: '3150',
  },
  {
    id: 'ORD-7824',
    customerId: 'user_cust_1',
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98765 43210',
    items: [
      {
        productId: 'prod_6',
        productName: 'Artisan Dark Roast Ground Coffee',
        quantity: 1,
        price: 340,
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
      },
      {
        productId: 'prod_4',
        productName: 'California Jumbo Almonds',
        quantity: 1,
        price: 399,
        image: 'https://images.unsplash.com/photo-1508061252224-237ff54ed5a9?auto=format&fit=crop&w=600&q=80',
      },
    ],
    subtotal: 739,
    deliveryFee: 0,
    discount: 50,
    total: 689,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    status: 'PACKED',
    deliveryAddress: {
      lat: 12.9362,
      lng: 77.6210,
      address: '18, 4th Cross, 6th Block, Koramangala',
      city: 'Bengaluru',
    },
    warehouseLocation: {
      lat: 12.9560,
      lng: 77.6400,
      address: 'Domlur Logistics Center',
      city: 'Bengaluru',
    },
    priority: 'HIGH',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    estimatedDeliveryTime: new Date(Date.now() + 25 * 60000).toISOString(),
    statusHistory: [
      {
        status: 'PLACED',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        status: 'CONFIRMED',
        timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
      },
      {
        status: 'PACKED',
        timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        note: 'Packed and staged at Koramangala corridor dispatch bay',
      },
    ],
    otpCode: '5924',
    estimatedWeightKg: 1.2,
  },
  {
    id: 'ORD-7819',
    customerId: 'user_cust_1',
    customerName: 'Aarav Sharma',
    customerPhone: '+91 98765 43210',
    items: [
      {
        productId: 'prod_4',
        productName: 'California Jumbo Almonds',
        quantity: 1,
        price: 399,
        image: 'https://images.unsplash.com/photo-1508061252224-237ff54ed5a9?auto=format&fit=crop&w=600&q=80',
      },
      {
        productId: 'prod_6',
        productName: 'Artisan Dark Roast Ground Coffee',
        quantity: 1,
        price: 340,
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
      },
    ],
    subtotal: 739,
    deliveryFee: 20,
    discount: 0,
    total: 759,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    status: 'DELIVERED',
    deliveryAddress: {
      lat: 12.9784,
      lng: 77.6408,
      address: '402, Green Valley Apartments, 12th Main, Indiranagar',
      city: 'Bengaluru',
    },
    warehouseLocation: {
      lat: 12.9698,
      lng: 77.6501,
      address: 'Indiranagar Micro-Fulfillment Hub #4',
      city: 'Bengaluru',
    },
    assignedPartnerId: 'dp_1',
    assignedPartnerName: 'Rohan Verma',
    assignedPartnerVehicle: 'Electric Bike (KA 03 EV 2049)',
    assignedPartnerRating: 4.9,
    priority: 'NORMAL',
    createdAt: new Date(Date.now() - 180 * 60000).toISOString(),
    estimatedDeliveryTime: new Date(Date.now() - 150 * 60000).toISOString(),
    actualDeliveryTime: new Date(Date.now() - 148 * 60000).toISOString(),
    statusHistory: [
      {
        status: 'PLACED',
        timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
      },
      {
        status: 'CONFIRMED',
        timestamp: new Date(Date.now() - 175 * 60000).toISOString(),
      },
      {
        status: 'PACKED',
        timestamp: new Date(Date.now() - 170 * 60000).toISOString(),
      },
      {
        status: 'ASSIGNED',
        timestamp: new Date(Date.now() - 165 * 60000).toISOString(),
      },
      {
        status: 'PICKED_UP',
        timestamp: new Date(Date.now() - 160 * 60000).toISOString(),
      },
      {
        status: 'OUT_FOR_DELIVERY',
        timestamp: new Date(Date.now() - 155 * 60000).toISOString(),
      },
      {
        status: 'DELIVERED',
        timestamp: new Date(Date.now() - 148 * 60000).toISOString(),
        note: 'Handed over to customer with OTP verification',
      },
    ],
    deliveryProof: {
      otpVerified: true,
      note: 'Left at doorstep as requested / verified by customer Aarav',
      timestamp: new Date(Date.now() - 148 * 60000).toISOString(),
    },
  },
];

export const simulationState: SimulationState = {
  traffic: 'MEDIUM',
  trafficMultiplier: 1.25,
  weather: 'CLEAR',
  weatherDelayMinutes: 0,
  fuelPricePerUnit: 102.5, // INR per liter for petrol
  electricityPricePerKwh: 8.5, // INR per kWh
  simulationTime: new Date().toISOString(),
  activeDispatches: 3,
};

// In-Memory Database Store Class
class DataStore {
  users = [...initialUsers];
  products = [...initialProducts];
  orders = [...initialOrders];
  deliveryPartners = [...initialDeliveryPartners];
  simulation = { ...simulationState };

  // Helper methods
  findUserByEmail(email: string) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string) {
    return this.users.find(u => u.id === id);
  }

  createUser(user: User & { passwordHash: string }) {
    this.users.push(user);
    return user;
  }

  getProducts() {
    return this.products;
  }

  getProductById(id: string) {
    return this.products.find(p => p.id === id);
  }

  saveProduct(product: Product) {
    const idx = this.products.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      this.products[idx] = product;
    } else {
      this.products.unshift(product);
    }
    return product;
  }

  deleteProduct(id: string) {
    const idx = this.products.findIndex(p => p.id === id);
    if (idx >= 0) {
      this.products.splice(idx, 1);
      return true;
    }
    return false;
  }

  getOrders() {
    return this.orders;
  }

  getOrderById(id: string) {
    return this.orders.find(o => o.id === id);
  }

  createOrder(order: Order) {
    this.orders.unshift(order);
    return order;
  }

  updateOrderStatus(
    orderId: string,
    status: Order['status'],
    note?: string,
    proof?: Order['deliveryProof']
  ) {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${status}`,
    });

    if (proof) {
      order.deliveryProof = proof;
    }

    if (status === 'DELIVERED') {
      order.actualDeliveryTime = new Date().toISOString();
      // update partner metrics if assigned
      if (order.assignedPartnerId) {
        const partner = this.deliveryPartners.find(
          p => p.id === order.assignedPartnerId
        );
        if (partner) {
          partner.totalDeliveries += 1;
          partner.todayEarnings += 45;
          partner.activeOrderIds = partner.activeOrderIds.filter(
            id => id !== orderId
          );
        }
      }
    }

    return order;
  }

  assignOrderToPartner(orderId: string, partnerId: string) {
    const order = this.getOrderById(orderId);
    const partner = this.deliveryPartners.find(p => p.id === partnerId);
    if (!order || !partner) return null;

    order.assignedPartnerId = partner.id;
    order.assignedPartnerName = partner.name;
    order.assignedPartnerVehicle = `${partner.vehicleType === 'electric_bike' ? 'Electric Bike' : partner.vehicleType === 'motorcycle' ? 'Motorcycle' : 'Electric Van'} (${partner.vehiclePlate})`;
    order.assignedPartnerRating = partner.rating;
    order.status = 'ASSIGNED';
    order.statusHistory.push({
      status: 'ASSIGNED',
      timestamp: new Date().toISOString(),
      note: `Assigned to ${partner.name} (${partner.vehiclePlate})`,
    });

    if (!partner.activeOrderIds.includes(orderId)) {
      partner.activeOrderIds.push(orderId);
    }

    return order;
  }

  getDeliveryPartners() {
    return this.deliveryPartners;
  }

  getPartnerById(id: string) {
    return this.deliveryPartners.find(p => p.id === id);
  }

  getPartnerByUserId(userId: string) {
    return this.deliveryPartners.find(p => p.userId === userId);
  }

  updatePartnerLocation(id: string, lat: number, lng: number) {
    const partner = this.getPartnerById(id);
    if (!partner) return null;
    partner.currentLocation.lat = lat;
    partner.currentLocation.lng = lng;
    return partner;
  }

  updatePartnerAvailability(id: string, isOnline: boolean) {
    const partner = this.getPartnerById(id);
    if (!partner) return null;
    partner.isOnline = isOnline;
    return partner;
  }

  updateSimulation(update: Partial<SimulationState>) {
    Object.assign(this.simulation, update);
    return this.simulation;
  }

  getAnalytics(): AnalyticsSummary {
    const totalOrders = this.orders.length;
    const deliveredOrders = this.orders.filter(o => o.status === 'DELIVERED').length;
    const pendingOrders = totalOrders - deliveredOrders;
    const totalRevenue = this.orders.reduce((sum, o) => sum + o.total, 0);
    const activeDeliveryPartners = this.deliveryPartners.filter(p => p.isOnline).length;

    // Category Sales breakdown
    const catMap = new Map<string, { count: number; revenue: number }>();
    this.orders.forEach(order => {
      order.items.forEach(item => {
        const prod = this.getProductById(item.productId);
        const cat = prod ? prod.category : 'General';
        const current = catMap.get(cat) || { count: 0, revenue: 0 };
        current.count += item.quantity;
        current.revenue += item.price * item.quantity;
        catMap.set(cat, current);
      });
    });

    const categorySales = Array.from(catMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      revenue: data.revenue,
    }));

    return {
      totalOrders,
      totalRevenue,
      deliveredOrders,
      pendingOrders,
      activeDeliveryPartners,
      averageDeliveryMinutes: 18.5,
      totalDistanceCoveredKm: 7570.7,
      totalFuelSavedLiters: 142.8,
      categorySales,
      dailyDeliveries: [
        { date: 'Mon', orders: 24, revenue: 14200 },
        { date: 'Tue', orders: 31, revenue: 18900 },
        { date: 'Wed', orders: 28, revenue: 16500 },
        { date: 'Thu', orders: 35, revenue: 21400 },
        { date: 'Fri', orders: 48, revenue: 32000 },
        { date: 'Sat', orders: 62, revenue: 41200 },
        { date: 'Sun (Today)', orders: totalOrders, revenue: totalRevenue },
      ],
    };
  }
}

export const db = new DataStore();
