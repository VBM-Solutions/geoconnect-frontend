import { describe, expect, it } from 'vitest';
import type { BEMapMarkerDTO } from '../../types';
import { getMarkerVisualState } from './beMapMarkerStyles';

const base: BEMapMarkerDTO = {
  id: 1,
  kind: 'ETUDE_EN_COURS',
  adresseProjet: { latitude: 48.85, longitude: 2.35 },
};

describe('beMapMarkerStyles', () => {
  it('met en avant les interventions du jour', () => {
    expect(getMarkerVisualState({ ...base, dateIntervention: '2026-07-22' }, new Date('2026-07-22T09:00:00'))).toBe('INTERVENTION_TODAY');
  });

  it('identifie les interventions a planifier', () => {
    expect(getMarkerVisualState(base, new Date('2026-07-22T09:00:00'))).toBe('INTERVENTION_TO_PLAN');
  });

  it('identifie les missions et archives', () => {
    expect(getMarkerVisualState({ ...base, kind: 'DEMANDE_DISPONIBLE' })).toBe('MISSION');
    expect(getMarkerVisualState({ ...base, kind: 'ETUDE_ARCHIVEE', etatEtude: 'RAPPORT_TERMINE' })).toBe('ARCHIVED');
  });
});
