import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  ParametresInlineFieldError,
  ParametresLoadErrorState,
  ParametresLoadingState,
  ParametresSubmitButton,
} from './ParametresCommonUI';

describe('ParametresCommonUI', () => {
  it('affiche l état de chargement', () => {
    render(<ParametresLoadingState />);
    expect(screen.getByText(/chargement des paramètres/i)).toBeTruthy();
  });

  it('affiche l état d erreur de chargement', () => {
    render(<ParametresLoadErrorState message="Erreur réseau" />);
    expect(screen.getByText('Erreur réseau')).toBeTruthy();
  });

  it('affiche une erreur inline de champ', () => {
    render(<ParametresInlineFieldError id="field-error" message="Champ invalide" />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Champ invalide')).toBeTruthy();
  });

  it('affiche le bouton submit en mode idle', () => {
    render(<ParametresSubmitButton isSaving={false} />);
    const button = screen.getByRole('button', { name: /enregistrer/i });
    expect(button).not.toBeDisabled();
  });

  it('affiche le bouton submit en mode saving', () => {
    render(<ParametresSubmitButton isSaving idleLabel="Changer" savingLabel="Enregistrement…" />);
    const button = screen.getByRole('button', { name: /enregistrement/i });
    expect(button).toBeDisabled();
  });
});

