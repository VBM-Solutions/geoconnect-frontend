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
});

