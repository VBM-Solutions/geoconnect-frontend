import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProfilBureauEtudeEvaluations } from './ProfilBureauEtudeEvaluations';

describe('ProfilBureauEtudeEvaluations', () => {
  it('affiche les moyennes et les avis issus d’études vérifiées', () => {
    render(<ProfilBureauEtudeEvaluations evaluations={{
      nombreEvaluations: 2,
      noteGlobale: 4.5,
      qualiteEchanges: 5,
      respectDelais: 4,
      qualiteRapport: 4.5,
      adequationBesoin: 4.5,
      avis: [{
        noteGlobale: 4.5,
        commentaire: 'Très bon accompagnement.',
        createdAt: '2026-07-29T15:00:00',
        etudeVerifiee: true,
      }],
    }} />);

    expect(screen.getAllByText('4.5/5')).toHaveLength(2);
    expect(screen.getByText('Très bon accompagnement.')).toBeInTheDocument();
    expect(screen.getByText('Étude vérifiée')).toBeInTheDocument();
  });

  it('explique le fonctionnement avant le premier avis', () => {
    render(<ProfilBureauEtudeEvaluations evaluations={{
      nombreEvaluations: 0,
      avis: [],
    }} />);

    expect(screen.getByText(/Aucun avis pour le moment/i)).toBeInTheDocument();
  });
});
