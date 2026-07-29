import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '../../contexts/ToastContext';
import {
  listerEvaluationsSignalees,
  modererEvaluation,
} from '../../api/evaluationModeration';
import ModerationEvaluationsPage from './ModerationEvaluationsPage';

vi.mock('../../api/evaluationModeration', () => ({
  listerEvaluationsSignalees: vi.fn(),
  modererEvaluation: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

describe('ModerationEvaluationsPage', () => {
  it('permet à un admin de masquer un commentaire sans supprimer la note', async () => {
    const user = userEvent.setup();
    (listerEvaluationsSignalees as ReturnType<typeof vi.fn>).mockResolvedValueOnce([{
      id: 9,
      etudeId: 42,
      noteGlobale: 2.5,
      commentaire: 'Commentaire contesté',
      motif: 'INFORMATION_FAUSSE',
      details: 'À vérifier',
      statut: 'EN_ATTENTE',
      signaleAt: '2026-07-29T10:15:30',
    }]);
    (modererEvaluation as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 9,
      statut: 'COMMENTAIRE_MASQUE',
    });

    render(
      <ToastProvider>
        <ModerationEvaluationsPage />
      </ToastProvider>,
    );

    expect(await screen.findByText('Commentaire contesté')).toBeInTheDocument();
    expect(screen.getByText('2.5/5')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Masquer/ }));

    expect(modererEvaluation).toHaveBeenCalledWith(9, 'MASQUER');
    await waitFor(() => {
      expect(screen.queryByText('Commentaire contesté')).not.toBeInTheDocument();
    });
  });
});
