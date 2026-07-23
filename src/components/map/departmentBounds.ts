import type { LatLngBoundsExpression } from 'leaflet';

interface DepartmentViewportSeed {
  readonly center: readonly [number, number];
  readonly span: readonly [number, number];
}

// Lightweight viewport seeds used only to frame selected departments.
// They are intentionally approximate and can be replaced by GeoJSON bounds later.
const DEPARTMENT_VIEWPORT_SEEDS: Record<string, DepartmentViewportSeed> = {
  '01': { center: [46.1, 5.35], span: [0.9, 1] },
  '02': { center: [49.55, 3.55], span: [1, 1] },
  '03': { center: [46.35, 3.15], span: [1, 1.1] },
  '04': { center: [44.1, 6.25], span: [1.1, 1.2] },
  '05': { center: [44.65, 6.35], span: [1, 1] },
  '06': { center: [43.95, 7.18], span: [0.8, 0.9] },
  '07': { center: [44.75, 4.45], span: [1.1, 0.9] },
  '08': { center: [49.6, 4.65], span: [0.9, 0.9] },
  '09': { center: [42.9, 1.55], span: [0.9, 1] },
  '10': { center: [48.3, 4.2], span: [0.9, 1] },
  '11': { center: [43.1, 2.4], span: [0.9, 1.1] },
  '12': { center: [44.35, 2.6], span: [1.1, 1.2] },
  '13': { center: [43.45, 5.1], span: [0.8, 1.1] },
  '14': { center: [49.05, -0.35], span: [0.8, 1.2] },
  '15': { center: [45.05, 2.65], span: [1, 1] },
  '16': { center: [45.75, 0.2], span: [0.9, 1] },
  '17': { center: [45.85, -0.75], span: [1, 1.2] },
  '18': { center: [47.1, 2.4], span: [1, 1] },
  '19': { center: [45.35, 1.85], span: [0.9, 1] },
  '2A': { center: [41.85, 8.9], span: [0.8, 0.8] },
  '2B': { center: [42.55, 9.15], span: [0.9, 0.8] },
  '21': { center: [47.35, 4.75], span: [1, 1.1] },
  '22': { center: [48.45, -2.85], span: [0.9, 1.2] },
  '23': { center: [46.05, 2.05], span: [0.9, 1] },
  '24': { center: [45.05, 0.75], span: [1.1, 1.1] },
  '25': { center: [47.1, 6.35], span: [0.9, 0.9] },
  '26': { center: [44.7, 5.15], span: [1.1, 0.9] },
  '27': { center: [49.05, 1.05], span: [0.8, 1] },
  '28': { center: [48.45, 1.35], span: [0.9, 0.9] },
  '29': { center: [48.25, -4.1], span: [0.9, 1.3] },
  '30': { center: [43.95, 4.15], span: [0.9, 1] },
  '31': { center: [43.35, 1.25], span: [1.1, 1] },
  '32': { center: [43.7, 0.45], span: [0.9, 1] },
  '33': { center: [44.85, -0.45], span: [1.2, 1.2] },
  '34': { center: [43.55, 3.35], span: [0.8, 1.3] },
  '35': { center: [48.15, -1.65], span: [0.9, 1] },
  '36': { center: [46.8, 1.55], span: [0.9, 1] },
  '37': { center: [47.25, 0.7], span: [0.9, 1] },
  '38': { center: [45.25, 5.55], span: [1.1, 1.1] },
  '39': { center: [46.7, 5.7], span: [0.9, 0.9] },
  '40': { center: [44, -0.75], span: [1.1, 1.1] },
  '41': { center: [47.65, 1.45], span: [0.9, 1] },
  '42': { center: [45.75, 4.15], span: [1, 0.8] },
  '43': { center: [45.1, 3.8], span: [0.9, 0.9] },
  '44': { center: [47.35, -1.75], span: [1, 1.1] },
  '45': { center: [47.9, 2.2], span: [1, 1] },
  '46': { center: [44.65, 1.6], span: [0.9, 1] },
  '47': { center: [44.35, 0.45], span: [0.9, 1] },
  '48': { center: [44.5, 3.55], span: [0.9, 1] },
  '49': { center: [47.45, -0.55], span: [0.9, 1.1] },
  '50': { center: [49.05, -1.35], span: [1.1, 0.9] },
  '51': { center: [49, 4.25], span: [1, 1.1] },
  '52': { center: [48.15, 5.25], span: [0.9, 1] },
  '53': { center: [48.15, -0.65], span: [0.9, 0.9] },
  '54': { center: [48.75, 6.25], span: [0.9, 0.9] },
  '55': { center: [49, 5.35], span: [0.9, 0.9] },
  '56': { center: [47.85, -2.85], span: [0.9, 1.2] },
  '57': { center: [49.05, 6.65], span: [0.9, 1] },
  '58': { center: [47.1, 3.5], span: [0.9, 1] },
  '59': { center: [50.45, 3.25], span: [0.9, 1] },
  '60': { center: [49.4, 2.45], span: [0.8, 1] },
  '61': { center: [48.6, 0], span: [0.9, 1] },
  '62': { center: [50.5, 2.35], span: [0.9, 1.1] },
  '63': { center: [45.75, 3.15], span: [1, 1] },
  '64': { center: [43.25, -0.75], span: [0.9, 1.2] },
  '65': { center: [43.05, 0.15], span: [0.8, 0.9] },
  '66': { center: [42.6, 2.55], span: [0.8, 0.9] },
  '67': { center: [48.65, 7.55], span: [0.8, 0.8] },
  '68': { center: [47.85, 7.25], span: [0.8, 0.8] },
  '69': { center: [45.85, 4.65], span: [0.8, 0.8] },
  '70': { center: [47.65, 6.15], span: [0.9, 1] },
  '71': { center: [46.65, 4.55], span: [1, 1.1] },
  '72': { center: [48, 0.2], span: [0.9, 1] },
  '73': { center: [45.55, 6.45], span: [0.9, 0.9] },
  '74': { center: [46.05, 6.45], span: [0.8, 0.9] },
  '75': { center: [48.8566, 2.3522], span: [0.12, 0.18] },
  '76': { center: [49.65, 1.05], span: [1, 1.2] },
  '77': { center: [48.6, 2.95], span: [0.9, 1] },
  '78': { center: [48.8, 1.9], span: [0.8, 0.9] },
  '79': { center: [46.55, -0.35], span: [0.9, 1] },
  '80': { center: [49.9, 2.35], span: [0.8, 1] },
  '81': { center: [43.8, 2.15], span: [0.9, 0.9] },
  '82': { center: [44.1, 1.3], span: [0.8, 0.9] },
  '83': { center: [43.45, 6.25], span: [0.8, 1.1] },
  '84': { center: [44, 5.15], span: [0.8, 0.8] },
  '85': { center: [46.65, -1.3], span: [0.9, 1] },
  '86': { center: [46.6, 0.35], span: [0.9, 1] },
  '87': { center: [45.85, 1.25], span: [0.8, 0.9] },
  '88': { center: [48.2, 6.4], span: [0.9, 0.9] },
  '89': { center: [47.85, 3.65], span: [0.9, 1] },
  '90': { center: [47.65, 6.9], span: [0.35, 0.35] },
  '91': { center: [48.55, 2.25], span: [0.55, 0.6] },
  '92': { center: [48.84, 2.23], span: [0.25, 0.25] },
  '93': { center: [48.92, 2.48], span: [0.25, 0.3] },
  '94': { center: [48.78, 2.45], span: [0.28, 0.3] },
  '95': { center: [49.05, 2.2], span: [0.65, 0.7] },
  '971': { center: [16.25, -61.55], span: [0.8, 0.8] },
  '972': { center: [14.65, -61], span: [0.55, 0.55] },
  '973': { center: [4, -53], span: [4.2, 4.6] },
  '974': { center: [-21.1, 55.55], span: [0.65, 0.65] },
  '976': { center: [-12.82, 45.15], span: [0.35, 0.35] },
};

export function getDepartmentBounds(code: string): LatLngBoundsExpression | null {
  const seed = DEPARTMENT_VIEWPORT_SEEDS[code];
  if (!seed) return null;

  const [lat, lng] = seed.center;
  const [latSpan, lngSpan] = seed.span;
  return [
    [lat - latSpan / 2, lng - lngSpan / 2],
    [lat + latSpan / 2, lng + lngSpan / 2],
  ];
}

export function getDepartmentsBounds(codes: string[]): LatLngBoundsExpression | null {
  return mergeBounds(codes.map(getDepartmentBounds).filter(Boolean));
}

export function mergeBounds(bounds: LatLngBoundsExpression[]): LatLngBoundsExpression | null {
  if (bounds.length === 0) return null;

  const southWestLatitudes = bounds.map(bound => bound[0][0]);
  const southWestLongitudes = bounds.map(bound => bound[0][1]);
  const northEastLatitudes = bounds.map(bound => bound[1][0]);
  const northEastLongitudes = bounds.map(bound => bound[1][1]);

  return [
    [Math.min(...southWestLatitudes), Math.min(...southWestLongitudes)],
    [Math.max(...northEastLatitudes), Math.max(...northEastLongitudes)],
  ];
}
