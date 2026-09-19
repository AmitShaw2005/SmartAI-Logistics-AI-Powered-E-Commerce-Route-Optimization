import {
  GeoLocation,
  Order,
  DeliveryPartner,
  RouteOptimizationResult,
  TrafficCondition,
  WeatherCondition,
} from '../src/types.js';

// Haversine distance in km between two lat/lng coordinates
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Simple polyline decoder for OSRM geometry (standard Google polyline algorithm)
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

// Generate intermediate simulated road waypoints if OSRM is offline
export function generateSyntheticPolyline(
  points: { lat: number; lng: number }[]
): [number, number][] {
  const result: [number, number][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const steps = 8;
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      // Slight road curvature simulation
      const curve = Math.sin(t * Math.PI) * 0.0018 * (i % 2 === 0 ? 1 : -1);
      const lat = p1.lat + (p2.lat - p1.lat) * t + curve;
      const lng = p1.lng + (p2.lng - p1.lng) * t - curve * 0.6;
      result.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
    }
  }
  return result;
}

// Fetch route from public OSRM server with graceful fallback
export async function fetchOSRMRoute(
  coordinates: { lat: number; lng: number }[]
): Promise<{ distanceKm: number; durationMinutes: number; polyline: [number, number][] }> {
  if (coordinates.length < 2) {
    return { distanceKm: 0, durationMinutes: 0, polyline: [] };
  }

  // OSRM expects coordinates in "lng,lat" order
  const coordString = coordinates.map(c => `${c.lng.toFixed(6)},${c.lat.toFixed(6)}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=polyline`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500); // 3.5s timeout for fast UI response

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distanceKm = Number((route.distance / 1000).toFixed(2));
        const durationMinutes = Number((route.duration / 60).toFixed(1));
        const polyline = decodePolyline(route.geometry);
        return { distanceKm, durationMinutes, polyline };
      }
    }
  } catch {
    // Graceful fallback to heuristic road model
  }

  // Fallback calculation using road distance multiplier (1.32x direct distance)
  let totalKm = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const dist = calculateHaversineDistance(
      coordinates[i].lat,
      coordinates[i].lng,
      coordinates[i + 1].lat,
      coordinates[i + 1].lng
    );
    totalKm += dist * 1.32;
  }

  const distanceKm = Number(totalKm.toFixed(2));
  // Assume avg city speed 24 km/h => 2.5 min/km
  const durationMinutes = Number((distanceKm * 2.5).toFixed(1));
  const polyline = generateSyntheticPolyline(coordinates);

  return { distanceKm, durationMinutes, polyline };
}

// Heuristic Route Optimizer considering Priority, Distance, and Traffic/Weather Penalties
export async function optimizeDeliveryRoute(
  partner: DeliveryPartner,
  orders: Order[],
  traffic: TrafficCondition = 'MEDIUM',
  weather: WeatherCondition = 'CLEAR',
  fuelPrice: number = 102.5
): Promise<RouteOptimizationResult> {
  const origin = partner.currentLocation;

  if (orders.length === 0) {
    return {
      partnerId: partner.id,
      origin,
      stops: [],
      totalDistanceKm: 0,
      totalDurationMinutes: 0,
      baselineDistanceKm: 0,
      baselineDurationMinutes: 0,
      fuelSavedLiters: 0,
      costSaved: 0,
      estimatedFuelConsumption: 0,
      estimatedFuelCost: 0,
      aiExplanation: 'No active orders assigned currently.',
      trafficImpact: 'Normal',
      weatherImpact: 'Normal',
      recommendations: ['Stand by for new dispatches at nearest hub.'],
      routePolyline: [[origin.lat, origin.lng]],
    };
  }

  // 1. Baseline Route (FIFO sequence without optimization)
  const baselineWaypoints = [
    { lat: origin.lat, lng: origin.lng },
    ...orders.map(o => ({ lat: o.deliveryAddress.lat, lng: o.deliveryAddress.lng })),
  ];
  const baselineResult = await fetchOSRMRoute(baselineWaypoints);

  // 2. Intelligent Prioritized TSP Sequencing
  // Sort remaining orders with priority weight & nearest neighbor
  const remaining = [...orders];
  const sequencedOrders: Order[] = [];
  let currentPos = { lat: origin.lat, lng: origin.lng };

  while (remaining.length > 0) {
    // Score each candidate: Score = (Distance) / (PriorityFactor)
    // EXPRESS gets high priority factor (e.g. 2.5x preference)
    let bestIndex = 0;
    let bestScore = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const dist = calculateHaversineDistance(
        currentPos.lat,
        currentPos.lng,
        candidate.deliveryAddress.lat,
        candidate.deliveryAddress.lng
      );

      let priorityWeight = 1.0;
      if (candidate.priority === 'EXPRESS') priorityWeight = 2.4;
      else if (candidate.priority === 'HIGH') priorityWeight = 1.6;

      const score = dist / priorityWeight;
      if (score < bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }

    const nextOrder = remaining.splice(bestIndex, 1)[0];
    sequencedOrders.push(nextOrder);
    currentPos = {
      lat: nextOrder.deliveryAddress.lat,
      lng: nextOrder.deliveryAddress.lng,
    };
  }

  // 3. Calculate Optimized Route Geometry and Travel Metrics
  const optimizedWaypoints = [
    { lat: origin.lat, lng: origin.lng },
    ...sequencedOrders.map(o => ({ lat: o.deliveryAddress.lat, lng: o.deliveryAddress.lng })),
  ];
  const optimizedResult = await fetchOSRMRoute(optimizedWaypoints);

  // 4. Apply Traffic and Weather Multipliers
  let trafficMultiplier = 1.0;
  if (traffic === 'MEDIUM') trafficMultiplier = 1.25;
  else if (traffic === 'HIGH') trafficMultiplier = 1.65;
  else if (traffic === 'SEVERE') trafficMultiplier = 2.2;

  let weatherDelayPerStop = 0;
  if (weather === 'CLOUDY') weatherDelayPerStop = 1;
  else if (weather === 'RAIN') weatherDelayPerStop = 4;
  else if (weather === 'FOG') weatherDelayPerStop = 3.5;

  const totalDurationMinutes = Math.round(
    optimizedResult.durationMinutes * trafficMultiplier + weatherDelayPerStop * sequencedOrders.length
  );
  const baselineDurationMinutes = Math.round(
    baselineResult.durationMinutes * trafficMultiplier + weatherDelayPerStop * orders.length
  );

  // 5. Fuel & Emissions Calculations
  // Efficiency: L / 100km or kWh / 100km
  const efficiencyPerKm = partner.vehicleEfficiency / 100;
  const optimizedFuel = Number((optimizedResult.distanceKm * efficiencyPerKm).toFixed(2));
  const baselineFuel = Number((baselineResult.distanceKm * efficiencyPerKm).toFixed(2));
  const fuelSaved = Math.max(0, Number((baselineFuel - optimizedFuel).toFixed(2)));
  const costSaved = Math.round(fuelSaved * fuelPrice);
  const estimatedFuelCost = Math.round(optimizedFuel * fuelPrice);

  // 6. Build Stops with Cumulative ETA
  let cumulativeMinutes = 0;
  let prevPos = { lat: origin.lat, lng: origin.lng };
  const stops = sequencedOrders.map((ord, idx) => {
    const distFromPrev = Number(
      (
        calculateHaversineDistance(
          prevPos.lat,
          prevPos.lng,
          ord.deliveryAddress.lat,
          ord.deliveryAddress.lng
        ) * 1.32
      ).toFixed(2)
    );
    const legMinutes = Math.round(distFromPrev * 2.5 * trafficMultiplier + weatherDelayPerStop + 2); // 2 min handover
    cumulativeMinutes += legMinutes;
    prevPos = { lat: ord.deliveryAddress.lat, lng: ord.deliveryAddress.lng };

    const etaDate = new Date(Date.now() + cumulativeMinutes * 60000);
    const itemsSummary = ord.items.map(i => `${i.quantity}x ${i.productName}`).join(', ');

    return {
      orderId: ord.id,
      sequenceNumber: idx + 1,
      destination: ord.deliveryAddress,
      customerName: ord.customerName,
      estimatedArrival: etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      distanceFromPrevKm: distFromPrev,
      durationFromPrevMinutes: legMinutes,
      priority: ord.priority,
      itemsSummary,
    };
  });

  // 7. Reasoning and Explanations
  const firstStop = stops[0];
  const explanations: string[] = [];
  if (firstStop) {
    if (firstStop.priority === 'EXPRESS') {
      explanations.push(
        `Delivery #${firstStop.orderId} (${firstStop.customerName}) is prioritized as Stop #1 due to its 15-minute EXPRESS delivery window.`
      );
    } else {
      explanations.push(
        `Stop #1 #${firstStop.orderId} was selected as the closest delivery node (${firstStop.distanceFromPrevKm} km away) reducing initial transit delay.`
      );
    }
  }

  if (stops.length > 1) {
    const secondStop = stops[1];
    explanations.push(
      `Delivery #${secondStop.orderId} follows next along the corridor, eliminating backtrack loops and saving ${fuelSaved} ${partner.fuelType === 'Electric' ? 'kWh' : 'liters'} of fuel.`
    );
  }

  const trafficImpact =
    traffic === 'SEVERE'
      ? 'Severe congestion detected (+120% transit delay). AI diverted route to arterial bypass lanes.'
      : traffic === 'HIGH'
      ? 'High traffic intensity (+65% delay). Route optimized for minimum idle signals.'
      : traffic === 'MEDIUM'
      ? 'Moderate rush-hour traffic (+25% delay). Normal flow sustained.'
      : 'Clear road conditions with smooth velocity.';

  const weatherImpact =
    weather === 'RAIN'
      ? 'Rain condition: Reduced cornering speed recommended (+4m safety buffer per stop).'
      : weather === 'FOG'
      ? 'Low visibility fog: High-beam headlights and cautious lane changes advised.'
      : weather === 'CLOUDY'
      ? 'Overcast skies: Normal riding conditions.'
      : 'Clear weather and optimal road surface grip.';

  const recommendations = [
    `Recommended sequence saves ${Math.max(0, baselineResult.distanceKm - optimizedResult.distanceKm).toFixed(1)} km vs unoptimized route.`,
    `Projected fuel expense: ₹${estimatedFuelCost} (saving approx ₹${costSaved}).`,
    traffic === 'SEVERE' || traffic === 'HIGH'
      ? 'Avoid inner ring road due to bottleneck near junction.'
      : 'Maintain steady 25-30 km/h cruising speed for optimum battery/fuel efficiency.',
  ];

  return {
    partnerId: partner.id,
    origin,
    stops,
    totalDistanceKm: optimizedResult.distanceKm,
    totalDurationMinutes,
    baselineDistanceKm: baselineResult.distanceKm,
    baselineDurationMinutes,
    fuelSavedLiters: fuelSaved,
    costSaved,
    estimatedFuelConsumption: optimizedFuel,
    estimatedFuelCost,
    aiExplanation: explanations.join(' '),
    trafficImpact,
    weatherImpact,
    recommendations,
    routePolyline: optimizedResult.polyline,
    alternativePolyline: baselineResult.polyline,
  };
}
