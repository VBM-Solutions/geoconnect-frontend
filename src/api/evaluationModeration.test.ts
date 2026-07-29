import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './index';
import {
  listerEvaluationsSignalees,
  modererEvaluation,
  signalerEvaluation,
} from './evaluationModeration';

vi.mock('./index', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

beforeEach(() => vi.clearAllMocks());

describe('evaluationModeration', () => {
  it('transmet le signalement du BE', async () => {
    const response = { id: 9, statut: 'EN_ATTENTE' };
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: response });

    await expect(signalerEvaluation(9, 'AUTRE', 'À vérifier')).resolves.toEqual(response);
    expect(api.post).toHaveBeenCalledWith(
      '/bureauEtude/me/evaluations/9/signalement',
      { motif: 'AUTRE', details: 'À vérifier' },
    );
  });

  it('liste puis modère les commentaires signalés', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [{ id: 9 }] });
    (api.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { id: 9, statut: 'COMMENTAIRE_MASQUE' },
    });

    await expect(listerEvaluationsSignalees()).resolves.toEqual([{ id: 9 }]);
    await modererEvaluation(9, 'MASQUER');

    expect(api.get).toHaveBeenCalledWith('/admin/evaluations/signalees');
    expect(api.patch).toHaveBeenCalledWith(
      '/admin/evaluations/9/moderation',
      { decision: 'MASQUER' },
    );
  });
});
