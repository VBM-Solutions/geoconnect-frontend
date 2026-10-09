import { describe, expect, it } from 'vitest';
import { computeProposalHighlights, getDefaultProposalSort, sortProposals } from './proposalComparison';
import { PropositionDevisDTO } from '../types';

const proposal = (id: number, overrides: Partial<PropositionDevisDTO> = {}): PropositionDevisDTO => ({
  id, createdAt: `2026-01-0${id}T10:00:00`, statut: 'EN_ATTENTE', prix: id * 100,
  delaiMaxIntervention: id, delaiMaxRendu: id + 2,
  bureauEtude: { id, raisonSociale: `Bureau ${id}`, noteGlobale: id, nombreAvis: 10 }, ...overrides,
});

describe('proposalComparison', () => {
  it('utilise le tri récent par défaut', () => expect(getDefaultProposalSort()).toBe('RECENT'));

  it.each([
    ['RECENT', [3, 2, 1]], ['PRIX_ASC', [1, 2, 3]], ['INTERVENTION_ASC', [1, 2, 3]],
    ['RENDU_ASC', [1, 2, 3]], ['NOTE_DESC', [3, 2, 1]],
  ] as const)('trie selon %s', (sort, ids) => {
    expect(sortProposals([proposal(2), proposal(1), proposal(3)], sort).map(item => item.id)).toEqual(ids);
  });

  it('place les valeurs absentes et les offres refusées après les offres comparables', () => {
    const result = sortProposals([
      proposal(1, { prix: undefined }), proposal(2, { prix: 200 }), proposal(3, { prix: 50, statut: 'REFUSEE' }),
    ], 'PRIX_ASC');
    expect(result.map(item => item.id)).toEqual([2, 1, 3]);
  });

  it('départage les égalités par date puis identifiant', () => {
    const same = { prix: 100, createdAt: '2026-01-01T10:00:00' };
    expect(sortProposals([proposal(2, same), proposal(1, same)], 'PRIX_ASC').map(item => item.id)).toEqual([1, 2]);
  });

  it('attribue tous les badges, y compris aux ex aequo', () => {
    const result = computeProposalHighlights([
      proposal(1, { prix: 100, delaiMaxIntervention: 1, delaiMaxRendu: 2, bureauEtude: { id: 1, raisonSociale: 'A', noteGlobale: 4.8, nombreAvis: 10 } }),
      proposal(2, { prix: 100, delaiMaxIntervention: 2, delaiMaxRendu: 3, bureauEtude: { id: 2, raisonSociale: 'B', noteGlobale: 4.8, nombreAvis: 12 } }),
    ]);
    expect([...result.get(1)!]).toEqual(['PRIX', 'INTERVENTION', 'RENDU', 'NOTE']);
    expect(result.get(2)).toEqual(new Set(['PRIX', 'NOTE']));
  });

  it('ignore la note sous dix avis et les offres refusées si des offres actives existent', () => {
    const result = computeProposalHighlights([
      proposal(1, { bureauEtude: { id: 1, raisonSociale: 'A', noteGlobale: 5, nombreAvis: 9 } }),
      proposal(2), proposal(3, { prix: 1, statut: 'REFUSEE' }),
    ]);
    expect(result.get(1)?.has('NOTE')).toBe(false);
    expect(result.get(3)).toBeUndefined();
  });

  it('ne calcule aucun badge avec moins de deux offres', () => {
    expect(computeProposalHighlights([proposal(1)]).size).toBe(0);
  });

  it('couvre toutes les valeurs absentes du comparateur et les replis stables', () => {
    const withoutValues = [
      proposal(1, { prix: undefined, totalTTC: undefined, delaiMaxIntervention: undefined, delaiMaxRendu: undefined, bureauEtude: undefined, createdAt: undefined }),
      proposal(2, { prix: undefined, totalTTC: undefined, delaiMaxIntervention: undefined, delaiMaxRendu: undefined, bureauEtude: undefined, createdAt: undefined }),
    ];
    expect(sortProposals(withoutValues, 'PRIX_ASC').map(item => item.id)).toEqual([1, 2]);
    expect(sortProposals([proposal(1), proposal(2, { prix: undefined })], 'PRIX_ASC').map(item => item.id)).toEqual([1, 2]);
    expect(sortProposals([proposal(1, { prix: undefined }), proposal(2)], 'PRIX_ASC').map(item => item.id)).toEqual([2, 1]);
    expect(sortProposals([proposal(1, { createdAt: '2026-01-01' }), proposal(2, { createdAt: '2026-01-02' })], 'RECENT').map(item => item.id)).toEqual([2, 1]);
    expect(computeProposalHighlights(withoutValues).size).toBe(0);
    expect(sortProposals([
      { statut: undefined, createdAt: undefined, id: undefined },
      { statut: undefined, createdAt: undefined, id: 2 },
    ], 'RECENT')).toHaveLength(2);
    expect(sortProposals([
      { statut: undefined, createdAt: undefined, id: 1 },
      { statut: undefined, createdAt: undefined, id: undefined },
    ], 'RECENT')).toHaveLength(2);
    expect(computeProposalHighlights([
      proposal(1, { statut: undefined }), proposal(2, { statut: undefined }),
    ])).not.toBeNull();
  });

  it('compare les offres refusées entre elles et ignore les candidats incomplets aux badges', () => {
    const refused = [
      proposal(1, { statut: 'REFUSEE', bureauEtude: { id: 1, raisonSociale: 'A', noteGlobale: undefined, nombreAvis: 10 } }),
      proposal(2, { statut: 'REFUSEE', bureauEtude: { id: 2, raisonSociale: 'B', noteGlobale: 5, nombreAvis: undefined } }),
      proposal(3, { statut: 'REFUSEE', id: undefined }),
    ];
    expect(computeProposalHighlights(refused).get(1)?.has('PRIX')).toBe(true);
    expect(computeProposalHighlights(refused).get(2)?.has('NOTE')).toBeFalsy();
  });

  it('utilise le TTC avant le prix historique et conserve les badges déjà attribués', () => {
    const result = computeProposalHighlights([
      proposal(1, { totalTTC: 90, prix: 500 }),
      proposal(2, { totalTTC: 100, prix: 50 }),
    ]);
    expect(result.get(1)).toEqual(new Set(['PRIX', 'INTERVENTION', 'RENDU']));
  });
});
