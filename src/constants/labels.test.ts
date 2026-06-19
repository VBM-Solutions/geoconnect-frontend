import { describe, it, expect } from 'vitest';
import { ETAT_LABELS, STATUT_LABELS, TYPE_LABELS } from './labels';
import { EtatEtude, StatutProposition, TypeDemandeDevis } from '../types';
import { ALL_ETATS } from './__fixtures__/etatEtude.fixture';

const ALL_STATUTS: StatutProposition[] = ['EN_ATTENTE', 'ACCEPTEE', 'REFUSEE'];

const ALL_TYPES: TypeDemandeDevis[] = [
  'ASSAINISSEMENT',
  'G0',
  'G1_ES_PGC',
  'G1_ELAN',
  'G2_AVP',
  'G2_PRO',
  'G5',
];

describe('ETAT_LABELS', () => {
  it('couvre tous les EtatEtude sans entrée manquante', () => {
    ALL_ETATS.forEach(etat => {
      expect(ETAT_LABELS[etat]).toBeDefined();
    });
  });

  it('chaque entrée possède un label non vide', () => {
    ALL_ETATS.forEach(etat => {
      expect(ETAT_LABELS[etat].label.length).toBeGreaterThan(0);
    });
  });

  it('chaque entrée possède une couleur non vide', () => {
    ALL_ETATS.forEach(etat => {
      expect(ETAT_LABELS[etat].color.length).toBeGreaterThan(0);
    });
  });

  it('ne contient pas de clés inconnues', () => {
    const keys = Object.keys(ETAT_LABELS) as EtatEtude[];
    keys.forEach(key => {
      expect(ALL_ETATS).toContain(key);
    });
  });
});

describe('STATUT_LABELS', () => {
  it('couvre tous les StatutProposition', () => {
    ALL_STATUTS.forEach(statut => {
      expect(STATUT_LABELS[statut]).toBeDefined();
      expect(STATUT_LABELS[statut].length).toBeGreaterThan(0);
    });
  });

  it('les libellés sont corrects', () => {
    expect(STATUT_LABELS['EN_ATTENTE']).toBe('En attente');
    expect(STATUT_LABELS['ACCEPTEE']).toBe('Acceptée');
    expect(STATUT_LABELS['REFUSEE']).toBe('Refusée');
  });
});

describe('TYPE_LABELS', () => {
  it('couvre tous les TypeDemandeDevis', () => {
    ALL_TYPES.forEach(type => {
      expect(TYPE_LABELS[type]).toBeDefined();
      expect(TYPE_LABELS[type].length).toBeGreaterThan(0);
    });
  });

  it('les libellés contiennent le code de type', () => {
    expect(TYPE_LABELS['G1_ES_PGC']).toContain('G1');
    expect(TYPE_LABELS['G1_ELAN']).toContain('G1');
    expect(TYPE_LABELS['G2_AVP']).toContain('G2 AVP');
    expect(TYPE_LABELS['G2_PRO']).toContain('G2 PRO');
    expect(TYPE_LABELS['G0']).toContain('G0');
    expect(TYPE_LABELS['G5']).toContain('G5');
  });
});

