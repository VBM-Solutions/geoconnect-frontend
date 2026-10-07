import { describe, expect, it } from 'vitest';
import { groupCurrentProposals } from './proposalHistory';

describe('groupCurrentProposals', () => {
  it('masque les offres uniquement refusées et conserve la dernière offre active avec son historique', () => {
    const result = groupCurrentProposals([
      { id: 1, bureauEtudeId: 7, statut: 'REFUSEE', createdAt: '2026-09-01T10:00:00Z', prix: 1000 },
      { id: 2, bureauEtudeId: 7, statut: 'EN_ATTENTE', createdAt: '2026-09-03T10:00:00Z', prix: 900 },
      { id: 3, bureauEtudeId: 8, statut: 'REFUSEE', createdAt: '2026-09-02T10:00:00Z', prix: 1200 },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].current.id).toBe(2);
    expect(result[0].refusedHistory.map(proposal => proposal.id)).toEqual([1]);
  });

  it('couvre les identifiants embarqués, absents et les valeurs de repli du tri', () => {
    const result = groupCurrentProposals([
      { statut: 'EN_ATTENTE', createdAt: undefined, bureauEtude: { id: 2, raisonSociale: 'B' } },
      { id: 8, statut: 'EN_ATTENTE', createdAt: '2026-01-01T00:00:00Z' },
      { statut: 'EN_ATTENTE', createdAt: undefined },
      { id: 7, statut: 'REFUSEE', createdAt: '2026-01-01T00:00:00Z' },
    ]);
    expect(result.map(group => group.current.id)).toEqual([undefined, 8, undefined]);
  });

  it('départage les versions sans date par identifiant et accepte un appel sans argument', () => {
    expect(groupCurrentProposals()).toEqual([]);
    const result = groupCurrentProposals([
      { id: 1, bureauEtudeId: 3, statut: 'EN_ATTENTE' },
      { id: 2, bureauEtudeId: 3, statut: 'EN_ATTENTE' },
    ]);
    expect(result[0].current.id).toBe(2);
    const missingRightId = groupCurrentProposals([
      { id: 2, bureauEtudeId: 4, statut: 'EN_ATTENTE' },
      { bureauEtudeId: 4, statut: 'EN_ATTENTE' },
    ]);
    expect(missingRightId).toHaveLength(1);
    const missingLeftId = groupCurrentProposals([
      { bureauEtudeId: 5, statut: 'EN_ATTENTE' },
      { id: 2, bureauEtudeId: 5, statut: 'EN_ATTENTE' },
    ]);
    expect(missingLeftId).toHaveLength(1);
  });
});

