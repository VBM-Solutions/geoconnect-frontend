import { LatLngBoundsExpression, LatLngExpression } from 'leaflet';
import type { BEMapMarkerDTO } from '../../types';
import { MapDistanceFilter, MapPoint, getMarkerPoint } from './beMapFiltering';

export type BEMapViewportTarget =
  | { readonly mode: 'CENTER'; readonly center: LatLngExpression; readonly zoom: number }
  | { readonly mode: 'BOUNDS'; readonly bounds: LatLngBoundsExpression; readonly padding?: [number, number] };

export const DEFAULT_CENTER: LatLngExpression = [46.603354, 1.888334];
export const DEFAULT_FRANCE_ZOOM = 6;
export const BUREAU_REGION_ZOOM = 8;
export const MARKER_FOCUS_ZOOM = 13;

const DISTANCE_PADDING_FACTOR = 1.15;

export function getDistanceZoom(distanceKm: MapDistanceFilter): number {
  if (distanceKm === 25) return 10;
  if (distanceKm === 50) return 9;
  if (distanceKm === 100) return 8;
  if (distanceKm === 200) return 7;
  return BUREAU_REGION_ZOOM;
}

export function getDistanceBounds(center: MapPoint, radiusKm: Exclude<MapDistanceFilter, 'ALL'>): LatLngBoundsExpression {
  const latDelta = radiusKm / 111 * DISTANCE_PADDING_FACTOR;
  const lngDelta = radiusKm / (111 * Math.max(Math.cos(center.latitude * Math.PI / 180), 0.2)) * DISTANCE_PADDING_FACTOR;

  return [
    [center.latitude - latDelta, center.longitude - lngDelta],
    [center.latitude + latDelta, center.longitude + lngDelta],
  ];
}

export function getMarkersBounds(markers: BEMapMarkerDTO[]): LatLngBoundsExpression | null {
  const points = markers.map(getMarkerPoint).filter(Boolean);
  if (points.length === 0) return null;

  return [
    [Math.min(...points.map(point => point.latitude)), Math.min(...points.map(point => point.longitude))],
    [Math.max(...points.map(point => point.latitude)), Math.max(...points.map(point => point.longitude))],
  ];
}

export function getDefaultViewport(params: Readonly<{
  markers: BEMapMarkerDTO[];
  bureauPoint: MapPoint | null;
  distanceKm: MapDistanceFilter;
}>): BEMapViewportTarget {
  if (params.distanceKm !== 'ALL' && params.bureauPoint) {
    return { mode: 'BOUNDS', bounds: getDistanceBounds(params.bureauPoint, params.distanceKm), padding: [24, 24] };
  }

  if (params.markers.length > 1) {
    const bounds = getMarkersBounds(params.markers);
    if (bounds) return { mode: 'BOUNDS', bounds, padding: [48, 48] };
  }

  if (params.markers.length === 1) {
    const point = getMarkerPoint(params.markers[0]);
    if (point) return { mode: 'CENTER', center: [point.latitude, point.longitude], zoom: MARKER_FOCUS_ZOOM };
  }

  if (params.bureauPoint) {
    return { mode: 'CENTER', center: [params.bureauPoint.latitude, params.bureauPoint.longitude], zoom: BUREAU_REGION_ZOOM };
  }

  return { mode: 'CENTER', center: DEFAULT_CENTER, zoom: DEFAULT_FRANCE_ZOOM };
}
