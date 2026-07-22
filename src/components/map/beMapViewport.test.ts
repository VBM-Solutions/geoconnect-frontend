import { describe, expect, it } from 'vitest';
import type { BEMapMarkerDTO } from '../../types';
import {
  BUREAU_REGION_ZOOM,
  MARKER_FOCUS_ZOOM,
  getDefaultViewport,
  getDistanceBounds,
  getDistanceZoom,
  getMarkersBounds,
} from './beMapViewport';

const bureau = { latitude: 48.8566, longitude: 2.3522 };

const markerA: BEMapMarkerDTO = {
  id: 1,
  kind: 'ETUDE_EN_COURS',
  adresseProjet: { latitude: 48.85, longitude: 2.35 },
};

const markerB: BEMapMarkerDTO = {
  id: 2,
  kind: 'ETUDE_EN_COURS',
  adresseProjet: { latitude: 45.76, longitude: 4.84 },
};

describe('beMapViewport', () => {
  it('associe un zoom regional aux rayons de distance', () => {
    expect(getDistanceZoom(25)).toBe(10);
    expect(getDistanceZoom(100)).toBe(8);
    expect(getDistanceZoom('ALL')).toBe(BUREAU_REGION_ZOOM);
  });

  it('construit des bounds autour du BE pour le filtre distance', () => {
    const bounds = getDistanceBounds(bureau, 50);

    expect(bounds[0][0]).toBeLessThan(bureau.latitude);
    expect(bounds[1][0]).toBeGreaterThan(bureau.latitude);
    expect(bounds[0][1]).toBeLessThan(bureau.longitude);
    expect(bounds[1][1]).toBeGreaterThan(bureau.longitude);
  });

  it('encadre tous les marqueurs geolocalises', () => {
    const bounds = getMarkersBounds([markerA, markerB]);

    expect(bounds).toEqual([
      [45.76, 2.35],
      [48.85, 4.84],
    ]);
  });

  it('prefere les bounds lorsque plusieurs points sont visibles', () => {
    const viewport = getDefaultViewport({ markers: [markerA, markerB], bureauPoint: bureau, distanceKm: 'ALL' });

    expect(viewport.mode).toBe('BOUNDS');
  });

  it('centre localement quand un seul point est visible', () => {
    const viewport = getDefaultViewport({ markers: [markerA], bureauPoint: bureau, distanceKm: 'ALL' });

    expect(viewport).toEqual({ mode: 'CENTER', center: [48.85, 2.35], zoom: MARKER_FOCUS_ZOOM });
  });

  it('calibre le viewport sur le rayon distance quand il est actif', () => {
    const viewport = getDefaultViewport({ markers: [markerA, markerB], bureauPoint: bureau, distanceKm: 100 });

    expect(viewport.mode).toBe('BOUNDS');
  });
});
