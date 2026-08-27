import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfilBureauEtudeEvaluations } from './ProfilBureauEtudeEvaluations';
import { ToastProvider } from '../../contexts/ToastContext';
import { signalerEvaluation } from '../../api/evaluationModeration';

vi.mock('../../api/evaluationModeration', () => ({
  signalerEvaluation: vi.fn(),
}));

const renderEvaluations = (evaluations: React.ComponentProps<
  typeof ProfilBureauEtudeEvaluations
>['evaluations']) => render(
  <ToastProvider>
    <ProfilBureauEtudeEvaluations evaluations={evaluations} />
  </ToastProvider>,
);

beforeEach(() => vi.clearAllMocks());

describe('ProfilBureauEtudeEvaluations', () => {
  it('affiche les moyennes et les avis issus d’études vérifiées', () => {
    renderEvaluations({
      nombreEvaluations: 2,
      noteGlobale: 4.5,
      qualiteEchanges: 5,
      respectDelais: 4,
      qualiteRapport: 4.5,
      avis: [{
        noteGlobale: 4.5,
        commentaire: 'Très bon accompagnement.',
        createdAt: '2026-07-29T15:00:00',
        etudeVerifiee: true,
      }],
    });

    expect(screen.getAllByText('4.5/5')).toHaveLength(2);
    expect(screen.getByText('Très bon accompagnement.')).toBeInTheDocument();
    expect(screen.getByText('Étude vérifiée')).toBeInTheDocument();
  });

  it('explique le fonctionnement avant le premier avis', () => {
    renderEvaluations({
      nombreEvaluations: 0,
      avis: [],
    });

    expect(screen.getByText(/Aucun avis pour le moment/i)).toBeInTheDocument();
  });

  it('permet au BE de signaler une seule fois un commentaire vérifié', async () => {
    const user = userEvent.setup();
    (signalerEvaluation as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 9,
      etudeId: 42,
      noteGlobale: 2.5,
      commentaire: 'Avis contesté',
      motif: 'INFORMATION_FAUSSE',
      statut: 'EN_ATTENTE',
      signaleAt: '2026-07-29T10:15:30',
    });
    renderEvaluations({
      nombreEvaluations: 1,
      noteGlobale: 2.5,
      qualiteEchanges: 2,
      respectDelais: 3,
      qualiteRapport: 2,
      avis: [{
        evaluationId: 9,
        noteGlobale: 2.5,
        commentaire: 'Avis contesté',
        createdAt: '2026-07-29T09:00:00',
        etudeVerifiee: true,
        statutSignalement: 'AUCUN',
      }],
    });

    await user.click(screen.getByRole('button', { name: 'Signaler ce commentaire' }));
    await user.selectOptions(screen.getByLabelText('Motif'), 'INFORMATION_FAUSSE');
    await user.type(screen.getByLabelText(/Précisions/), 'Information à vérifier');
    await user.click(screen.getByRole('button', { name: 'Envoyer le signalement' }));

    expect(signalerEvaluation).toHaveBeenCalledWith(
      9,
      'INFORMATION_FAUSSE',
      'Information à vérifier',
    );
    expect(await screen.findByText(/Signalement en cours/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Signaler ce commentaire' })).not.toBeInTheDocument();
  });
});
