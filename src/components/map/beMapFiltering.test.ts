import { describe, expect, it } from 'vitest';
import type { BEMapMarkerDTO } from '../../types';
import {
  DEFAULT_LOCAL_BE_MAP_FILTERS,
  buildFilterOptions,
  createDefaultLocalFilters,
  filterMarkers,
  getDistanceKm,
  matchesInterventionTiming,
} from './beMapFiltering';

const bureau = { latitude: 48.8566, longitude: 2.3522 };

const markers: BEMapMarkerDTO[] = [
  {
    id: 1,
    kind: 'DEMANDE_DISPONIBLE',
    demandeDevisId: 10,
    type: 'G2_PRO',
    ville: 'Paris',
    codePostal: '75018',
    adresseProjet: { ville: 'Paris', codePostal: '75018', rue: 'Boulevard Barbes', latitude: 48.892, longitude: 2.35 },
  },
  {
    id: 2,
    kind: 'DEMANDE_DISPONIBLE',
    demandeDevisId: 20,
    type: 'G5',
    ville: 'Lyon',
    codePostal: '69001',
    adresseProjet: { ville: 'Lyon', codePostal: '69001', rue: 'Avenue Test', latitude: 45.764, longitude: 4.8357 },
  },
  {
    id: 3,
    kind: 'ETUDE_EN_COURS',
    etatEtude: 'DATE_INTERVENTION_FIXEE',
    dateIntervention: '2026-07-22',
    ville: 'Versailles',
    codePostal: '78000',
    adresseProjet: { ville: 'Versailles', codePostal: '78000', latitude: 48.8049, longitude: 2.1204 },
  },
  {
    id: 4,
    kind: 'ETUDE_ARCHIVEE',
    etatEtude: 'RAPPORT_TERMINE',
    ville: 'Nanterre',
    codePostal: '92000',
    adresseProjet: { ville: 'Nanterre', codePostal: '92000', latitude: 48.8924, longitude: 2.2153 },
  },
];

describe('beMapFiltering', () => {
  it('masque les etudes archivees par defaut', () => {
    const result = filterMarkers(markers, DEFAULT_LOCAL_BE_MAP_FILTERS, bureau);

    expect(result.map(marker => marker.id)).toEqual([1, 2, 3]);
  });

  it('autorise les archives quand includeArchived est actif', () => {
    const result = filterMarkers(markers, { ...DEFAULT_LOCAL_BE_MAP_FILTERS, includeArchived: true }, bureau);

    expect(result.map(marker => marker.id)).toContain(4);
  });

  it('applique les departements de notification aux missions par defaut', () => {
    const filters = createDefaultLocalFilters({ context: 'MISSIONS_DISPONIBLES', restrictToNotificationDepartments: true });
    const result = filterMarkers(markers, filters, bureau, ['75']);

    expect(result.map(marker => marker.id)).toEqual([1]);
  });

  it('construit les options departements depuis les codes postaux des marqueurs', () => {
    const options = buildFilterOptions(markers);

    expect(options.departments).toEqual(['69', '75', '78', '92']);
  });

  it('filtre par departements selectionnes', () => {
    const result = filterMarkers(markers, { ...DEFAULT_LOCAL_BE_MAP_FILTERS, departments: ['69', '78'] }, bureau);

    expect(result.map(marker => marker.id)).toEqual([2, 3]);
  });

  it('filtre par recherche texte sur ville code postal rue et reference', () => {
    const byCity = filterMarkers(markers, { ...DEFAULT_LOCAL_BE_MAP_FILTERS, search: 'lyon' }, bureau);
    const byReference = filterMarkers(markers, { ...DEFAULT_LOCAL_BE_MAP_FILTERS, search: 'MES-10' }, bureau);
    const byStreet = filterMarkers(markers, { ...DEFAULT_LOCAL_BE_MAP_FILTERS, search: 'barbes' }, bureau);

    expect(byCity.map(marker => marker.id)).toEqual([2]);
    expect(byReference.map(marker => marker.id)).toEqual([1]);
    expect(byStreet.map(marker => marker.id)).toEqual([1]);
  });

  it('filtre par rayon autour du BE', () => {
    const result = filterMarkers(markers, { ...DEFAULT_LOCAL_BE_MAP_FILTERS, distanceKm: 25 }, bureau);

    expect(result.map(marker => marker.id)).toEqual([1, 3]);
  });

  it('detecte les dates intervention du jour demain et non planifiees', () => {
    const now = new Date('2026-07-22T10:00:00');
    const today = markers[2];
    const tomorrow: BEMapMarkerDTO = { ...today, id: 5, dateIntervention: '2026-07-23' };
    const unplanned: BEMapMarkerDTO = { ...today, id: 6, dateIntervention: undefined };

    expect(matchesInterventionTiming(today, 'TODAY', now)).toBe(true);
    expect(matchesInterventionTiming(tomorrow, 'TOMORROW', now)).toBe(true);
    expect(matchesInterventionTiming(unplanned, 'UNPLANNED', now)).toBe(true);
  });

  it('calcule une distance coherente entre Paris et Lyon', () => {
    const distance = getDistanceKm(bureau, { latitude: 45.764, longitude: 4.8357 });

    expect(distance).toBeGreaterThan(380);
    expect(distance).toBeLessThan(410);
  });
});
