import { LatLng } from "react-native-maps";

export type StepMarker = {
  id: string;
  tripId: string;
  stepId: string;
  lat: number;
  lng: number;
};

const MIN_LAT_DELTA = 40;
const MIN_LNG_DELTA = 90;

export function getRegionForCoords(coords: LatLng[]) {
  let minLat = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let minLng = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;

  coords.forEach((c) => {
    minLat = Math.min(minLat, c.latitude);
    maxLat = Math.max(maxLat, c.latitude);
    minLng = Math.min(minLng, c.longitude);
    maxLng = Math.max(maxLng, c.longitude);
  });

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // span needed to include all points
  const spanLat = maxLat - minLat || 0.1;
  const spanLng = maxLng - minLng || 0.1;

  // enforce minimum “province” size & add a bit of padding
  const latitudeDelta = Math.max(spanLat, MIN_LAT_DELTA) * 1.1; // 10% padding
  const longitudeDelta = Math.max(spanLng, MIN_LNG_DELTA) * 1.1;

  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta,
    longitudeDelta,
  };
}
