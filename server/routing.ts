import {
  GeoLocation,
  Order,
  DeliveryPartner,
  RouteOptimizationResult,
  TrafficCondition,
  WeatherCondition,
  TrafficSegment,
  TrafficIncident,
  WeatherTelemetry,
} from '../src/types.js';
import {
  detectCorridorName,
  calculateBatchSavings,
  getVehicleCapacity,
} from './batching.js';

// Weather Telemetry Generator
export function generateWeatherTelemetry(weather: WeatherCondition): WeatherTelemetry {
  switch (weather) {
    case 'RAIN':
      return {
        condition: 'RAIN',
        temperatureC: 22,
        precipitationChance: 85,
        humidityPercent: 92,
        windSpeedKmH: 26,
        visibilityKm: 3.5,
        roadFrictionIndex: 0.62,
        brakingDistancePenaltyPercent: 35,
        packagingDirectives: [
          '🌧️ MANDATORY: Double-layer waterproof shrink wrap on all paper bags',
          '💧 Verify rain cover is zipped on rider delivery crate',
          '🧾 Digital OTP & invoice preferred over paper slip',
        ],
        riderSafetyAdvisory:
          'Wet asphalt alert: Reduce cornering speeds at traffic roundabouts. Maintain a strict 4-second following distance.',
      };
    case 'THUNDERSTORM':
      return {
        condition: 'THUNDERSTORM',
        temperatureC: 20,
        precipitationChance: 96,
        humidityPercent: 98,
        windSpeedKmH: 44,
        visibilityKm: 1.8,
        roadFrictionIndex: 0.48,
        brakingDistancePenaltyPercent: 55,
        packagingDirectives: [
          '⛈️ CRITICAL: Sealed waterproof plastic tote bags only',
          '📦 Zero exposure for fresh bakery and sensitive electronics',
        ],
        riderSafetyAdvisory:
          'Flash storm warning: Avoid low-lying underpasses and flooded road curbs. Reduce top speed to 25 km/h.',
      };
    case 'HEATWAVE':
      return {
        condition: 'HEATWAVE',
        temperatureC: 38,
        precipitationChance: 0,
        humidityPercent: 25,
        windSpeedKmH: 9,
        visibilityKm: 10,
        roadFrictionIndex: 0.88,
        brakingDistancePenaltyPercent: 10,
        packagingDirectives: [
          '☀️ THERMAL PROTECTION: Double gel ice packs for milk, ice creams & fresh meats',
          '🥤 Thermally insulated silver pouch required for beverages',
        ],
        riderSafetyAdvisory:
          'Heat stress warning: Mandatory hydration pause every 40 minutes. Keep dispatch phone shaded from direct sunlight.',
      };
    case 'FOG':
      return {
        condition: 'FOG',
        temperatureC: 17,
        precipitationChance: 15,
        humidityPercent: 95,
        windSpeedKmH: 7,
        visibilityKm: 0.4,
        roadFrictionIndex: 0.78,
        brakingDistancePenaltyPercent: 25,
        packagingDirectives: [
          '🌫️ High-moisture condensation barrier on paper packaging',
        ],
        riderSafetyAdvisory:
          'Low visibility alert (<400m): Turn on high-intensity auxiliary headlights and reflective yellow vest at all times.',
      };
    case 'CLOUDY':
      return {
        condition: 'CLOUDY',
        temperatureC: 25,
        precipitationChance: 25,
        humidityPercent: 62,
        windSpeedKmH: 14,
        visibilityKm: 8,
        roadFrictionIndex: 0.90,
        brakingDistancePenaltyPercent: 5,
        packagingDirectives: [
          '☁️ Precautionary rain flap closed on rider delivery backpack',
        ],
        riderSafetyAdvisory:
          'Overcast skies with mild breeze. Standard riding velocities permitted.',
      };
    case 'CLEAR':
    default:
      return {
        condition: 'CLEAR',
        temperatureC: 28,
        precipitationChance: 5,
        humidityPercent: 45,
        windSpeedKmH: 12,
        visibilityKm: 10,
        roadFrictionIndex: 0.96,
        brakingDistancePenaltyPercent: 0,
        packagingDirectives: [
          'Standard eco-friendly recyclable craft paper bags',
        ],
        riderSafetyAdvisory:
          'Optimal dry road conditions with maximum traction. Full eco-cruising speeds enabled.',
      };
  }
}

// Generate Realistic Traffic Bottlenecks and Incidents along the corridor
export function generateTrafficIncidents(
  traffic: TrafficCondition,
  weather: WeatherCondition,
  polyline: [number, number][]
): TrafficIncident[] {
  const incidents: TrafficIncident[] = [];
  if (!polyline || polyline.length === 0) return incidents;

  const midPoint = polyline[Math.floor(polyline.length * 0.45)] || polyline[0];
  const laterPoint = polyline[Math.floor(polyline.length * 0.75)] || polyline[polyline.length - 1];

  if (weather === 'RAIN' || weather === 'THUNDERSTORM') {
    incidents.push({
      id: 'inc_waterlogging',
      lat: midPoint[0] + 0.0008,
      lng: midPoint[1] - 0.0005,
      type: 'WATERLOGGING',
      severity: weather === 'THUNDERSTORM' ? 'CRITICAL' : 'HIGH',
      title: 'Waterlogged Roadway Alert',
      description: 'Curb water accumulation near 100ft Road underpass. Vehicles slowing to single file.',
      delayImpactMinutes: weather === 'THUNDERSTORM' ? 9 : 5,
      detourRecommended: true,
    });
  }

  if (traffic === 'SEVERE') {
    incidents.push({
      id: 'inc_gridlock_1',
      lat: midPoint[0],
      lng: midPoint[1],
      type: 'BOTTLENECK',
      severity: 'CRITICAL',
      title: 'Severe Arterial Gridlock',
      description: 'Signal deadlock & peak rush hour congestion on main junction corridor.',
      delayImpactMinutes: 12,
      detourRecommended: true,
    });
    incidents.push({
      id: 'inc_signal_2',
      lat: laterPoint[0],
      lng: laterPoint[1],
      type: 'SIGNAL_CONGESTION',
      severity: 'HIGH',
      title: 'Metro Construction Bottleneck',
      description: 'Lane narrowed to single carriage; heavy commercial vehicle tailback.',
      delayImpactMinutes: 8,
      detourRecommended: true,
    });
  } else if (traffic === 'HIGH') {
    incidents.push({
      id: 'inc_choke_1',
      lat: midPoint[0],
      lng: midPoint[1],
      type: 'BOTTLENECK',
      severity: 'HIGH',
      title: 'Heavy Traffic Choke Point',
      description: 'Slow-moving commercial traffic with average speed below 12 km/h.',
      delayImpactMinutes: 6,
      detourRecommended: true,
    });
  } else if (traffic === 'MEDIUM') {
    incidents.push({
      id: 'inc_moderate_1',
      lat: midPoint[0],
      lng: midPoint[1],
      type: 'SIGNAL_CONGESTION',
      severity: 'MEDIUM',
      title: 'Moderate Signal Queuing',
      description: 'Expect 1-2 traffic light cycles delay at main intersection.',
      delayImpactMinutes: 2.5,
      detourRecommended: false,
    });
  }

  return incidents;
}

// Generate Segment-by-Segment Congestion Colors along Route
export function generateTrafficSegments(
  polyline: [number, number][],
  traffic: TrafficCondition
): TrafficSegment[] {
  if (!polyline || polyline.length < 2) return [];

  const total = polyline.length;
  const p1 = Math.floor(total * 0.3);
  const p2 = Math.floor(total * 0.7);

  let middleStatus: TrafficCondition = traffic;
  let middleColor = '#22c55e';
  let middleSpeed = 34;
  let middleDelay = 0;

  if (traffic === 'SEVERE') {
    middleStatus = 'SEVERE';
    middleColor = '#b91c1c'; // Crimson
    middleSpeed = 6;
    middleDelay = 11;
  } else if (traffic === 'HIGH') {
    middleStatus = 'HIGH';
    middleColor = '#ef4444'; // Red
    middleSpeed = 13;
    middleDelay = 6;
  } else if (traffic === 'MEDIUM') {
    middleStatus = 'MEDIUM';
    middleColor = '#f59e0b'; // Amber
    middleSpeed = 22;
    middleDelay = 2.5;
  } else {
    middleStatus = 'LOW';
    middleColor = '#22c55e'; // Green
    middleSpeed = 36;
    middleDelay = 0;
  }

  return [
    {
      startIdx: 0,
      endIdx: p1,
      status: 'LOW',
      color: '#22c55e',
      speedKmH: 35,
      roadName: 'Departure Corridor (Clear Flow)',
      delayMinutes: 0.5,
    },
    {
      startIdx: p1,
      endIdx: p2,
      status: middleStatus,
      color: middleColor,
      speedKmH: middleSpeed,
      roadName: 'Main Arterial Avenue (Traffic Zone)',
      delayMinutes: middleDelay,
    },
    {
      startIdx: p2,
      endIdx: total - 1,
      status: traffic === 'SEVERE' ? 'MEDIUM' : 'LOW',
      color: traffic === 'SEVERE' ? '#f59e0b' : '#22c55e',
      speedKmH: traffic === 'SEVERE' ? 24 : 32,
      roadName: 'Neighborhood Delivery Link (Residential)',
      delayMinutes: 1,
    },
  ];
}

// Generate Smart AI Detour Route that bypasses congested corridors
export function generateSmartDetourRoute(
  origin: GeoLocation,
  orders: Order[],
  basePolyline: [number, number][]
): { polyline: [number, number][]; savingsMinutes: number; explanation: string } {
  if (!basePolyline || basePolyline.length < 3) {
    return { polyline: basePolyline, savingsMinutes: 0, explanation: '' };
  }

  // Create an alternative bypass polyline curving around the congested middle segment
  const detourPolyline: [number, number][] = [];
  const total = basePolyline.length;

  for (let i = 0; i < total; i++) {
    const pt = basePolyline[i];
    const progress = i / (total - 1);

    // Apply lateral offset in the middle third (representing arterial bypass streets like 12th Main)
    if (progress > 0.25 && progress < 0.75) {
      const arch = Math.sin(((progress - 0.25) / 0.5) * Math.PI);
      const lateralShiftLat = 0.0035 * arch;
      const lateralShiftLng = 0.0042 * arch;
      detourPolyline.push([
        Number((pt[0] + lateralShiftLat).toFixed(6)),
        Number((pt[1] + lateralShiftLng).toFixed(6)),
      ]);
    } else {
      detourPolyline.push(pt);
    }
  }

  return {
    polyline: detourPolyline,
    savingsMinutes: 7,
    explanation:
      'AI Smart Bypass: Diverts through 12th Main Residential Corridor (+0.4 km) avoiding 100ft road choke point, saving approximately 7 minutes in transit.',
  };
}

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
  else if (weather === 'THUNDERSTORM') weatherDelayPerStop = 7;
  else if (weather === 'HEATWAVE') weatherDelayPerStop = 2;
  else if (weather === 'FOG') weatherDelayPerStop = 4.5;

  const weatherTelemetry = generateWeatherTelemetry(weather);
  const incidents = generateTrafficIncidents(traffic, weather, optimizedResult.polyline);
  const trafficSegments = generateTrafficSegments(optimizedResult.polyline, traffic);
  const smartDetour = generateSmartDetourRoute(origin, sequencedOrders, optimizedResult.polyline);

  const smartDetourAvailable =
    traffic === 'HIGH' || traffic === 'SEVERE' || weather === 'RAIN' || weather === 'THUNDERSTORM';

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
  const vehicleCap = getVehicleCapacity(partner.vehicleType);
  const isMultiOrder = sequencedOrders.length > 1;
  const batchSavings = isMultiOrder
    ? calculateBatchSavings(sequencedOrders, partner, fuelPrice)
    : {
        distanceSavedKm: 0,
        fuelSavedLiters: 0,
        costSaved: 0,
        co2SavedKg: 0,
        totalWeightKg: 0,
        capacityUtilizationPct: 0,
      };

  const corridorName = isMultiOrder
    ? detectCorridorName(
        sequencedOrders[0].deliveryAddress.address,
        sequencedOrders[1]?.deliveryAddress.address
      )
    : detectCorridorName(sequencedOrders[0]?.deliveryAddress.address || '');

  const bundledCustomers = Array.from(new Set(sequencedOrders.map(o => o.customerName)));

  const firstStop = stops[0];
  const explanations: string[] = [];

  if (isMultiOrder) {
    explanations.push(
      `📦 Multi-Order Co-Delivery Active: Carrying ${sequencedOrders.length} orders for ${bundledCustomers.join(' & ')} along the ${corridorName}. Delivering multiple customer items together in the same path avoids ${batchSavings.distanceSavedKm} km of duplicate round-trips, directly saving ~${batchSavings.fuelSavedLiters} ${partner.fuelType === 'Electric' ? 'kWh' : 'liters'} of fuel (₹${batchSavings.costSaved} saved).`
    );
  }

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

  if (incidents.length > 0) {
    explanations.push(
      `Traffic engine identified ${incidents.length} congestion bottleneck(s) on primary corridor (Avg impact: +${incidents.reduce((sum, inc) => sum + inc.delayImpactMinutes, 0).toFixed(0)}m).`
    );
  }

  const trafficImpact =
    traffic === 'SEVERE'
      ? '🚨 Critical gridlock: Average corridor speed dropped below 7 km/h (+120% delay). Smart Detour recommended.'
      : traffic === 'HIGH'
      ? '⚠️ High traffic intensity: Arterial congestion (+65% delay). Traffic signal throttling detected.'
      : traffic === 'MEDIUM'
      ? 'Moderate rush-hour traffic (+25% delay). Transit flowing with minor signal stops.'
      : '🟢 Smooth velocity: Free flowing road conditions across all sectors.';

  const weatherImpact =
    weather === 'THUNDERSTORM'
      ? '⛈️ Severe Thunderstorm: Extreme road friction loss (-52%), braking penalty +55%, waterproof tote bags mandatory.'
      : weather === 'RAIN'
      ? '🌧️ Rain Alert: Wet asphalt friction 0.62 (-38%), braking distance +35%, waterproof packaging required.'
      : weather === 'HEATWAVE'
      ? '☀️ Heatwave Warning (38°C): Thermal insulated packaging & ice gel packs required for fresh dairy and meats.'
      : weather === 'FOG'
      ? '🌫️ Low Visibility Fog (<400m): High-beam safety illumination and reflective vest mandatory.'
      : weather === 'CLOUDY'
      ? '☁️ Overcast skies: Mild ambient temperatures, normal road surface traction.'
      : '☀️ Clear weather: Optimal road surface grip and ideal transit conditions.';

  const recommendations = [
    `Sequence saves ${Math.max(0, baselineResult.distanceKm - optimizedResult.distanceKm).toFixed(1)} km vs unoptimized route.`,
    isMultiOrder
      ? `Co-delivery batching prevents ${batchSavings.distanceSavedKm} km extra travel, saving ~${batchSavings.fuelSavedLiters} ${partner.fuelType === 'Electric' ? 'kWh' : 'L'} fuel.`
      : `Projected fuel expense: ₹${estimatedFuelCost} (saving approx ₹${costSaved}).`,
    traffic === 'SEVERE' || traffic === 'HIGH'
      ? '🚦 Active bottleneck alert: Consider switching to the AI Smart Bypass route to save up to 7 minutes.'
      : 'Maintain steady 25-30 km/h cruising speed for optimum battery/fuel efficiency.',
    weatherTelemetry.riderSafetyAdvisory,
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
    trafficSegments,
    incidents,
    weatherTelemetry,
    smartDetourAvailable,
    smartDetourSavingsMinutes: smartDetour.savingsMinutes,
    smartDetourPolyline: smartDetour.polyline,
    smartDetourExplanation: smartDetour.explanation,
    isMultiOrderBatch: isMultiOrder,
    batchedOrdersCount: sequencedOrders.length,
    unbatchedTotalDistanceKm: Number((optimizedResult.distanceKm + batchSavings.distanceSavedKm).toFixed(1)),
    batchDistanceSavedKm: batchSavings.distanceSavedKm,
    batchFuelSavedLiters: batchSavings.fuelSavedLiters,
    batchCostSaved: batchSavings.costSaved,
    batchCO2SavedKg: batchSavings.co2SavedKg,
    coDeliveryCorridor: corridorName,
    bundledCustomers,
    capacityUtilization: {
      currentOrders: sequencedOrders.length,
      maxOrders: vehicleCap.maxOrders,
      currentWeightKg: batchSavings.totalWeightKg,
      maxWeightKg: vehicleCap.maxWeightKg,
    },
  };
}
