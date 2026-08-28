import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { EvaluationEtudeCard } from './EvaluationEtudeCard';

const getStatutEvaluation = vi.fn();
const evaluerEtude = vi.fn();
const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('../../api/etude', () => ({
  getStatutEvaluation: (...args: unknown[]) => getStatutEvaluation(...args),
  evaluerEtude: (...args: unknown[]) => evaluerEtude(...args),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ toastSuccess, toastError }),
}));

describe('EvaluationEtudeCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStatutEvaluation.mockResolvedValue({ eligible: true });
  });

  it('propose les trois critères uniquement quand l’étude est éligible', async () => {
    render(<EvaluationEtudeCard etudeId={42} />);

    expect(await screen.findByText('Qualité des échanges')).toBeInTheDocument();
    expect(screen.getByText('Respect des délais')).toBeInTheDocument();
    expect(screen.getByText('Qualité et clarté du rapport')).toBeInTheDocument();
    expect(screen.queryByText('Adéquation au besoin')).not.toBeInTheDocument();
    expect(getStatutEvaluation).toHaveBeenCalledWith(42);
  });

  it('n’affiche pas le formulaire si la notation n’est pas éligible', async () => {
    getStatutEvaluation.mockResolvedValue({ eligible: false });

    const { container } = render(<EvaluationEtudeCard etudeId={42} />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(getStatutEvaluation).toHaveBeenCalledWith(42);
  });

  it('envoie une note complète une seule fois et affiche la confirmation', async () => {
    evaluerEtude.mockResolvedValue({
      id: 8,
      etudeId: 42,
      qualiteEchanges: 5,
      respectDelais: 4,
      qualiteRapport: 5,
      noteGlobale: 4.67,
      createdAt: '2026-07-29T15:00:00',
    });
    render(<EvaluationEtudeCard etudeId={42} />);
    await screen.findByText('Qualité des échanges');

    for (const label of [
      '5 sur 5 pour Qualité des échanges',
      '4 sur 5 pour Respect des délais',
      '5 sur 5 pour Qualité et clarté du rapport',
    ]) {
      fireEvent.click(screen.getByRole('button', { name: label }));
    }
    fireEvent.change(screen.getByLabelText(/Commentaire public/i), {
      target: { value: 'Très bon accompagnement.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer mon avis' }));

    await waitFor(() => expect(evaluerEtude).toHaveBeenCalledWith(42, {
      qualiteEchanges: 5,
      respectDelais: 4,
      qualiteRapport: 5,
      commentaire: 'Très bon accompagnement.',
    }));
    expect(await screen.findByText(/Note globale/i)).toHaveTextContent('4.7/5');
    expect(toastSuccess).toHaveBeenCalled();
  });

  it('affiche directement la confirmation si l’étude a déjà été évaluée', async () => {
    getStatutEvaluation.mockResolvedValue({
      eligible: false,
      evaluation: { noteGlobale: 4.75 },
    });

    render(<EvaluationEtudeCard etudeId={42} />);

    expect(await screen.findByText(/Note globale/i)).toHaveTextContent('4.8/5');
    expect(screen.queryByRole('button', { name: 'Envoyer mon avis' })).not.toBeInTheDocument();
  });
});
