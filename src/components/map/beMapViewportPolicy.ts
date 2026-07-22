import type { BEMapMarkerDTO } from '../../types';
import type { MapDistanceFilter, MapPoint } from './beMapFiltering';
import { getDepartmentsBounds } from './departmentBounds';
import {
  BEMapViewportTarget,
  BUREAU_REGION_ZOOM,
  DEFAULT_CENTER,
  DEFAULT_FRANCE_ZOOM,
  MARKER_FOCUS_ZOOM,
  getDistanceBounds,
  getMarkersBounds,
} from './beMapViewport';

export function getAutoViewport(params: Readonly<{
  markers: BEMapMarkerDTO[];
  bureauPoint: MapPoint | null;
  distanceKm: MapDistanceFilter;
  selectedDepartments: string[];
}>): BEMapViewportTarget {
  if (params.distanceKm !== 'ALL' && params.bureauPoint) {
    return { mode: 'BOUNDS', bounds: getDistanceBounds(params.bureauPoint, params.distanceKm), padding: [24, 24] };
  }

  if (params.selectedDepartments.length > 0) {
    const departmentBounds = getDepartmentsBounds(params.selectedDepartments);
    if (departmentBounds) return { mode: 'BOUNDS', bounds: departmentBounds, padding: [36, 36] };
  }

  if (params.markers.length > 1) {
    const bounds = getMarkersBounds(params.markers);
    if (bounds) return { mode: 'BOUNDS', bounds, padding: [48, 48] };
  }

  if (params.markers.length === 1) {
    const marker = params.markers[0];
    const latitude = marker.adresseProjet?.latitude;
    const longitude = marker.adresseProjet?.longitude;
    if (latitude != null && longitude != null) {
      return { mode: 'CENTER', center: [latitude, longitude], zoom: MARKER_FOCUS_ZOOM };
    }
  }

  if (params.bureauPoint) {
    return { mode: 'CENTER', center: [params.bureauPoint.latitude, params.bureauPoint.longitude], zoom: BUREAU_REGION_ZOOM };
  }

  return { mode: 'CENTER', center: DEFAULT_CENTER, zoom: DEFAULT_FRANCE_ZOOM };
}
