import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PasswordRequirementsHint } from './PasswordRequirementsHint';

describe('PasswordRequirementsHint', () => {
  it('affiche tous les critères comme manquants tant que rien n’est saisi', () => {
    render(<PasswordRequirementsHint password="" />);

    expect(screen.getByLabelText('Critère manquant : Au moins 8 caractères')).toBeTruthy();
    expect(screen.getByLabelText('Critère manquant : Une majuscule')).toBeTruthy();
    expect(screen.getByLabelText('Critère manquant : Une minuscule')).toBeTruthy();
    expect(screen.getByLabelText('Critère manquant : Un chiffre')).toBeTruthy();
    expect(screen.getByLabelText('Critère manquant : Un caractère spécial')).toBeTruthy();
  });

  it('met à jour les critères remplis au fur et à mesure', () => {
    const { rerender } = render(<PasswordRequirementsHint password="Abcdefgh" />);

    expect(screen.getByLabelText('Critère rempli : Au moins 8 caractères')).toBeTruthy();
    expect(screen.getByLabelText('Critère rempli : Une majuscule')).toBeTruthy();
    expect(screen.getByLabelText('Critère rempli : Une minuscule')).toBeTruthy();
    expect(screen.getByLabelText('Critère manquant : Un chiffre')).toBeTruthy();
    expect(screen.getByLabelText('Critère manquant : Un caractère spécial')).toBeTruthy();

    rerender(<PasswordRequirementsHint password="Abcdefg!1" />);

    expect(screen.getByLabelText('Critère rempli : Un chiffre')).toBeTruthy();
    expect(screen.getByLabelText('Critère rempli : Un caractère spécial')).toBeTruthy();
  });
});

