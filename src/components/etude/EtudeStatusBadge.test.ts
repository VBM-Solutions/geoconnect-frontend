import { describe, it, expect } from 'vitest';
import { getEtatLabel, clientMustAct, beMustAct } from './EtudeStatusBadge';
import { EtatEtude } from '../../types';

const ALL_ETATS: EtatEtude[] = [
  'DEVIS_VALIDE',
  'DEVIS_SIGNE',
  'DATE_INTERVENTION_PROPOSEE',
  'DATE_INTERVENTION_FIXEE',
  'INTERVENTION_EFFECTUEE',
  'RAPPORT_TERMINE',
  'PAIEMENT_EFFECTUE',
];

describe('getEtatLabel', () => {
  it('retourne "—" si etat est undefined', () => {
    expect(getEtatLabel(undefined)).toBe('—');
  });

  it('retourne le libellé correspondant à chaque état', () => {
    expect(getEtatLabel('DEVIS_VALIDE')).toBe('Devis validé');
    expect(getEtatLabel('DEVIS_SIGNE')).toBe('Devis signé');
    expect(getEtatLabel('DATE_INTERVENTION_PROPOSEE')).toBe('Date proposée');
    expect(getEtatLabel('DATE_INTERVENTION_FIXEE')).toBe('Date fixée');
    expect(getEtatLabel('INTERVENTION_EFFECTUEE')).toBe('Intervention effectuée');
    expect(getEtatLabel('RAPPORT_TERMINE')).toBe('Rapport terminé');
    expect(getEtatLabel('PAIEMENT_EFFECTUE')).toBe('Clôturée');
  });

  it('couvre tous les états définis dans EtatEtude', () => {
    ALL_ETATS.forEach(etat => {
      const label = getEtatLabel(etat);
      expect(label).not.toBe('—');
      expect(label.length).toBeGreaterThan(0);
    });
  });
});

describe('clientMustAct', () => {
  it('retourne true pour DATE_INTERVENTION_PROPOSEE', () => {
    expect(clientMustAct('DATE_INTERVENTION_PROPOSEE')).toBe(true);
  });

  it('retourne true pour RAPPORT_TERMINE', () => {
    expect(clientMustAct('RAPPORT_TERMINE')).toBe(true);
  });

  it('retourne false pour les autres états', () => {
    const autresEtats: EtatEtude[] = [
      'DEVIS_VALIDE',
      'DATE_INTERVENTION_FIXEE',
      'INTERVENTION_EFFECTUEE',
      'PAIEMENT_EFFECTUE',
    ];
    autresEtats.forEach(etat => {
      expect(clientMustAct(etat)).toBe(false);
    });
  });

  it('retourne false si etat est undefined', () => {
    expect(clientMustAct(undefined)).toBe(false);
  });
});

describe('beMustAct', () => {
  const etatsDeclencheurs: EtatEtude[] = [
    'DEVIS_SIGNE',
    'DATE_INTERVENTION_PROPOSEE',
    'DATE_INTERVENTION_FIXEE',
    'INTERVENTION_EFFECTUEE',
  ];

  it.each(etatsDeclencheurs)('retourne true pour %s', (etat) => {
    expect(beMustAct(etat)).toBe(true);
  });

  it('retourne false pour RAPPORT_TERMINE', () => {
    expect(beMustAct('RAPPORT_TERMINE')).toBe(false);
  });

  it('retourne false pour PAIEMENT_EFFECTUE', () => {
    expect(beMustAct('PAIEMENT_EFFECTUE')).toBe(false);
  });

  it('retourne false si etat est undefined', () => {
    expect(beMustAct(undefined)).toBe(false);
  });
});

