import {
  Order,
  DeliveryPartner,
  VehicleType,
  BatchGroup,
  BatchDispatchSummary,
} from '../src/types.js';
import { calculateHaversineDistance } from './routing.js';

export interface VehicleCapacity {
  maxOrders: number;
  maxWeightKg: number;
}

export function getVehicleCapacity(vehicleType: VehicleType): VehicleCapacity {
  switch (vehicleType) {
    case 'electric_van':
      return { maxOrders: 12, maxWeightKg: 120 };
    case 'motorcycle':
      return { maxOrders: 5, maxWeightKg: 25 };
    case 'electric_bike':
    default:
      return { maxOrders: 4, maxWeightKg: 15 };
  }
}

export function estimateOrderWeightKg(order: Order): number {
  if (order.estimatedWeightKg && order.estimatedWeightKg > 0) {
    return order.estimatedWeightKg;
  }
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  // Estimate approx ~0.45 kg per standard grocery/retail item
  return Number((Math.max(1, itemCount) * 0.45).toFixed(1));
}

export function detectCorridorName(addressA: string, addressB?: string): string {
  const text = `${addressA} ${addressB || ''}`.toLowerCase();

  if (text.includes('indiranagar') || text.includes('cmh') || text.includes('100ft') || text.includes('12th main')) {
    return 'Indiranagar - CMH Metro Corridor';
  }
  if (text.includes('koramangala') || text.includes('sony') || text.includes('forum')) {
    return 'Koramangala 4th-6th Block Corridor';
  }
  if (text.includes('domlur') || text.includes('egl') || text.includes('inner ring')) {
    return 'Domlur - Inner Ring Corridor';
  }
  if (text.includes('hsr') || text.includes('silk board')) {
    return 'HSR Sector 1-2 Corridor';
  }
  if (text.includes('mg road') || text.includes('brigade') || text.includes('cbd')) {
    return 'CBD - MG Road Central Corridor';
  }
  return 'Metro Urban Central Corridor';
}

/**
 * Checks if two orders are in the same delivery path or geographical area.
 * Returns proximity and distance saving metrics.
 */
export function evaluateCorridorAffinity(orderA: Order, orderB: Order): {
  inSamePath: boolean;
  proximityKm: number;
  corridorName: string;
  distanceSavedKm: number;
} {
  const proximityKm = Number(
    calculateHaversineDistance(
      orderA.deliveryAddress.lat,
      orderA.deliveryAddress.lng,
      orderB.deliveryAddress.lat,
      orderB.deliveryAddress.lng
    ).toFixed(2)
  );

  const corridorName = detectCorridorName(
    orderA.deliveryAddress.address,
    orderB.deliveryAddress.address
  );

  // Proximity threshold: within 3.2 km or sharing exact neighborhood
  const hasSharedNeighborhood =
    (orderA.deliveryAddress.address.toLowerCase().includes('indiranagar') &&
      orderB.deliveryAddress.address.toLowerCase().includes('indiranagar')) ||
    (orderA.deliveryAddress.address.toLowerCase().includes('koramangala') &&
      orderB.deliveryAddress.address.toLowerCase().includes('koramangala')) ||
    (orderA.deliveryAddress.address.toLowerCase().includes('domlur') &&
      orderB.deliveryAddress.address.toLowerCase().includes('domlur'));

  const inSamePath = proximityKm <= 3.2 || (hasSharedNeighborhood && proximityKm <= 4.5);

  // Distance from warehouse
  const distWarehouseA = calculateHaversineDistance(
    orderA.warehouseLocation.lat,
    orderA.warehouseLocation.lng,
    orderA.deliveryAddress.lat,
    orderA.deliveryAddress.lng
  );
  const distWarehouseB = calculateHaversineDistance(
    orderB.warehouseLocation.lat,
    orderB.warehouseLocation.lng,
    orderB.deliveryAddress.lat,
    orderB.deliveryAddress.lng
  );

  // Separate trips: 2 round trips from warehouse
  const unbatchedDistance = 2 * distWarehouseA + 2 * distWarehouseB;
  // Batched trip: Warehouse -> A -> B -> Warehouse
  const batchedDistance = distWarehouseA + proximityKm + distWarehouseB;
  const distanceSavedKm = Number(Math.max(1.5, unbatchedDistance - batchedDistance).toFixed(1));

  return {
    inSamePath,
    proximityKm,
    corridorName,
    distanceSavedKm,
  };
}

/**
 * Computes savings when multiple orders are batched together onto one delivery partner.
 */
export function calculateBatchSavings(
  orders: Order[],
  partner: DeliveryPartner,
  fuelPrice: number = 102.5
): {
  distanceSavedKm: number;
  fuelSavedLiters: number;
  costSaved: number;
  co2SavedKg: number;
  totalWeightKg: number;
  capacityUtilizationPct: number;
} {
  const cap = getVehicleCapacity(partner.vehicleType);
  const totalWeightKg = Number(
    orders.reduce((sum, ord) => sum + estimateOrderWeightKg(ord), 0).toFixed(1)
  );
  const capacityUtilizationPct = Math.min(
    100,
    Math.round((orders.length / cap.maxOrders) * 100)
  );

  if (orders.length <= 1) {
    return {
      distanceSavedKm: 0,
      fuelSavedLiters: 0,
      costSaved: 0,
      co2SavedKg: 0,
      totalWeightKg,
      capacityUtilizationPct,
    };
  }

  // Calculate unbatched total round trips from warehouse for each order
  let unbatchedDistance = 0;
  for (const ord of orders) {
    const d = calculateHaversineDistance(
      ord.warehouseLocation.lat,
      ord.warehouseLocation.lng,
      ord.deliveryAddress.lat,
      ord.deliveryAddress.lng
    );
    unbatchedDistance += d * 2; // round-trip
  }

  // Batched distance: Warehouse -> Stop 1 -> Stop 2 -> ... -> Stop N
  let batchedDistance = calculateHaversineDistance(
    orders[0].warehouseLocation.lat,
    orders[0].warehouseLocation.lng,
    orders[0].deliveryAddress.lat,
    orders[0].deliveryAddress.lng
  );

  for (let i = 0; i < orders.length - 1; i++) {
    batchedDistance += calculateHaversineDistance(
      orders[i].deliveryAddress.lat,
      orders[i].deliveryAddress.lng,
      orders[i + 1].deliveryAddress.lat,
      orders[i + 1].deliveryAddress.lng
    );
  }
  // Return leg to warehouse
  const lastOrder = orders[orders.length - 1];
  batchedDistance += calculateHaversineDistance(
    lastOrder.deliveryAddress.lat,
    lastOrder.deliveryAddress.lng,
    lastOrder.warehouseLocation.lat,
    lastOrder.warehouseLocation.lng
  );

  const distanceSavedKm = Number(Math.max(0, unbatchedDistance - batchedDistance).toFixed(1));
  const efficiencyPerKm = partner.vehicleEfficiency / 100;
  const fuelSavedLiters = Number((distanceSavedKm * efficiencyPerKm).toFixed(2));
  const costSaved = Math.round(fuelSavedLiters * fuelPrice);
  const isElectric = partner.fuelType === 'Electric';
  const co2Factor = isElectric ? 0.72 : 2.31;
  const co2SavedKg = Number((fuelSavedLiters * co2Factor).toFixed(2));

  return {
    distanceSavedKm,
    fuelSavedLiters,
    costSaved,
    co2SavedKg,
    totalWeightKg,
    capacityUtilizationPct,
  };
}

/**
 * Finds the best delivery partner for an order, prioritizing partners who already
 * have active orders in the same path/area and have carrying capacity.
 */
export function findBestPartnerForOrder(
  newOrder: Order,
  partners: DeliveryPartner[],
  allOrders: Order[]
): {
  partner: DeliveryPartner | null;
  isBatched: boolean;
  corridorName: string;
  batchedWithOrderIds: string[];
  fuelSavedLiters: number;
  costSaved: number;
} {
  const onlinePartners = partners.filter(p => p.isOnline);
  if (onlinePartners.length === 0) {
    return {
      partner: null,
      isBatched: false,
      corridorName: detectCorridorName(newOrder.deliveryAddress.address),
      batchedWithOrderIds: [],
      fuelSavedLiters: 0,
      costSaved: 0,
    };
  }

  const orderWeight = estimateOrderWeightKg(newOrder);

  let bestPartner: DeliveryPartner | null = null;
  let bestScore = -Infinity;
  let isBatched = false;
  let batchedWith: string[] = [];
  let corridor = detectCorridorName(newOrder.deliveryAddress.address);
  let batchSavingsLiters = 0;
  let batchSavingsCost = 0;

  for (const partner of onlinePartners) {
    const cap = getVehicleCapacity(partner.vehicleType);
    const currentOrders = allOrders.filter(
      o => o.assignedPartnerId === partner.id && o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
    );

    const currentWeight = currentOrders.reduce(
      (sum, ord) => sum + estimateOrderWeightKg(ord),
      0
    );

    // Check capacity constraint
    if (currentOrders.length >= cap.maxOrders || currentWeight + orderWeight > cap.maxWeightKg) {
      continue; // Partner is at full capacity
    }

    // Check if partner already has orders in the same path or area
    let candidateBatchedWith: string[] = [];
    let minDistanceToStop = Infinity;
    let matchingCorridor = '';

    for (const existing of currentOrders) {
      const affinity = evaluateCorridorAffinity(existing, newOrder);
      if (affinity.inSamePath) {
        candidateBatchedWith.push(existing.id);
        matchingCorridor = affinity.corridorName;
        if (affinity.proximityKm < minDistanceToStop) {
          minDistanceToStop = affinity.proximityKm;
        }
      }
    }

    if (candidateBatchedWith.length > 0) {
      // HIGH REWARD: Co-delivery along same path saves fuel!
      const savings = calculateBatchSavings([...currentOrders, newOrder], partner);
      const score = 200 + savings.fuelSavedLiters * 30 - minDistanceToStop * 5;

      if (score > bestScore) {
        bestScore = score;
        bestPartner = partner;
        isBatched = true;
        batchedWith = candidateBatchedWith;
        corridor = matchingCorridor;
        batchSavingsLiters = savings.fuelSavedLiters;
        batchSavingsCost = savings.costSaved;
      }
    } else if (!isBatched) {
      // Fallback: Partner without same-corridor orders; score by proximity to warehouse
      const distToWarehouse = calculateHaversineDistance(
        partner.currentLocation.lat,
        partner.currentLocation.lng,
        newOrder.warehouseLocation.lat,
        newOrder.warehouseLocation.lng
      );
      // Prefer partners with fewer orders
      const score = 50 - distToWarehouse * 2 - currentOrders.length * 10;
      if (score > bestScore) {
        bestScore = score;
        bestPartner = partner;
      }
    }
  }

  // Fallback to any online partner if none qualified with strict capacity
  if (!bestPartner && onlinePartners.length > 0) {
    bestPartner = onlinePartners[0];
  }

  return {
    partner: bestPartner,
    isBatched,
    corridorName: corridor,
    batchedWithOrderIds: batchedWith,
    fuelSavedLiters: batchSavingsLiters,
    costSaved: batchSavingsCost,
  };
}
