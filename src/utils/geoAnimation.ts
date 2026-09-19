export interface VehicleAnimState {
  currentPos: [number, number];
  heading: number; // in degrees (0 = North, 90 = East, 180 = South, 270 = West)
  speedKmH: number;
  progressPercent: number; // 0 to 100
  distanceTraveledKm: number;
  remainingDistanceKm: number;
  currentSegmentIndex: number;
  isFinished: boolean;
}

// Haversine formula to compute distance between 2 lat/lng in kilometers
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

// Compute compass bearing from pt1 to pt2 (degrees 0..360)
export function getBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Calculate total length of polyline in km
export function getPolylineTotalDistanceKm(points: [number, number][]): number {
  if (!points || points.length < 2) return 0;
  let dist = 0;
  for (let i = 0; i < points.length - 1; i++) {
    dist += getDistanceKm(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
  }
  return dist;
}

// Get interpolated point, bearing, and distance along polyline at distance d
export function interpolatePolyline(
  points: [number, number][],
  targetDistKm: number
): {
  pos: [number, number];
  heading: number;
  segmentIndex: number;
  traveledKm: number;
  totalKm: number;
} {
  if (!points || points.length === 0) {
    return { pos: [0, 0], heading: 0, segmentIndex: 0, traveledKm: 0, totalKm: 0 };
  }
  if (points.length === 1) {
    return { pos: points[0], heading: 0, segmentIndex: 0, traveledKm: 0, totalKm: 0 };
  }

  const totalKm = getPolylineTotalDistanceKm(points);
  const clampedDist = Math.max(0, Math.min(targetDistKm, totalKm));

  let accumulatedDist = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segDist = getDistanceKm(p1[0], p1[1], p2[0], p2[1]);

    if (accumulatedDist + segDist >= clampedDist || i === points.length - 2) {
      const remainingInSeg = clampedDist - accumulatedDist;
      const ratio = segDist > 0 ? Math.min(1, Math.max(0, remainingInSeg / segDist)) : 0;

      const lat = p1[0] + (p2[0] - p1[0]) * ratio;
      const lng = p1[1] + (p2[1] - p1[1]) * ratio;
      const heading = getBearing(p1[0], p1[1], p2[0], p2[1]);

      return {
        pos: [lat, lng],
        heading,
        segmentIndex: i,
        traveledKm: clampedDist,
        totalKm,
      };
    }
    accumulatedDist += segDist;
  }

  const last = points[points.length - 1];
  const secondLast = points[points.length - 2];
  return {
    pos: last,
    heading: getBearing(secondLast[0], secondLast[1], last[0], last[1]),
    segmentIndex: points.length - 2,
    traveledKm: totalKm,
    totalKm,
  };
}
