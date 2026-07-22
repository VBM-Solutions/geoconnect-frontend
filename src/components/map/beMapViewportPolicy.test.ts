import { describe, expect, it } from 'vitest';
import type { BEMapMarkerDTO } from '../../types';
import { BUREAU_REGION_ZOOM, DEFAULT_FRANCE_ZOOM, MARKER_FOCUS_ZOOM } from './beMapViewport';
import { getAutoViewport } from './beMapViewportPolicy';

const bureau = { latitude: 48.8566, longitude: 2.3522 };

const markerParis: BEMapMarkerDTO = {
  id: 1,
  kind: 'DEMANDE_DISPONIBLE',
  adresseProjet: { latitude: 48.86, longitude: 2.35, codePostal: '75018' },
};

const markerLyon: BEMapMarkerDTO = {
  id: 2,
  kind: 'DEMANDE_DISPONIBLE',
  adresseProjet: { latitude: 45.76, longitude: 4.84, codePostal: '69001' },
};

describe('beMapViewportPolicy', () => {
  it('priorise le filtre distance sur les departements selectionnes', () => {
    const viewport = getAutoViewport({
      markers: [markerParis, markerLyon],
      bureauPoint: bureau,
      distanceKm: 25,
      selectedDepartments: ['69'],
    });

    expect(viewport.mode).toBe('BOUNDS');
    if (viewport.mode === 'BOUNDS') {
      expect(viewport.bounds[0][0]).toBeGreaterThan(48);
      expect(viewport.bounds[1][0]).toBeLessThan(50);
    }
  });

  it('cadre sur un departement selectionne meme sans marker visible', () => {
    const viewport = getAutoViewport({
      markers: [],
      bureauPoint: bureau,
      distanceKm: 'ALL',
      selectedDepartments: ['69'],
    });

    expect(viewport.mode).toBe('BOUNDS');
    if (viewport.mode === 'BOUNDS') {
      expect(viewport.bounds[0][0]).toBeLessThan(45.85);
      expect(viewport.bounds[1][1]).toBeGreaterThan(4.65);
    }
  });

  it('fusionne plusieurs departements selectionnes', () => {
    const viewport = getAutoViewport({
      markers: [],
      bureauPoint: bureau,
      distanceKm: 'ALL',
      selectedDepartments: ['75', '69'],
    });

    expect(viewport.mode).toBe('BOUNDS');
    if (viewport.mode === 'BOUNDS') {
      expect(viewport.bounds[0][0]).toBeLessThan(46);
      expect(viewport.bounds[1][0]).toBeGreaterThan(48.8);
    }
  });

  it('cadre sur les marqueurs visibles sans filtre spatial fort', () => {
    const viewport = getAutoViewport({
      markers: [markerParis, markerLyon],
      bureauPoint: bureau,
      distanceKm: 'ALL',
      selectedDepartments: [],
    });

    expect(viewport.mode).toBe('BOUNDS');
  });

  it('centre localement sur un seul marqueur', () => {
    const viewport = getAutoViewport({
      markers: [markerParis],
      bureauPoint: bureau,
      distanceKm: 'ALL',
      selectedDepartments: [],
    });

    expect(viewport).toEqual({ mode: 'CENTER', center: [48.86, 2.35], zoom: MARKER_FOCUS_ZOOM });
  });

  it('retombe sur le BE puis la France en fallback', () => {
    expect(getAutoViewport({ markers: [], bureauPoint: bureau, distanceKm: 'ALL', selectedDepartments: [] }))
      .toEqual({ mode: 'CENTER', center: [bureau.latitude, bureau.longitude], zoom: BUREAU_REGION_ZOOM });

    expect(getAutoViewport({ markers: [], bureauPoint: null, distanceKm: 'ALL', selectedDepartments: [] }))
      .toEqual({ mode: 'CENTER', center: [46.603354, 1.888334], zoom: DEFAULT_FRANCE_ZOOM });
  });
});
