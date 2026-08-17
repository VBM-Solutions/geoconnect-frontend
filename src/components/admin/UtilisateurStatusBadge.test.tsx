import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { UtilisateurStatusBadge } from './UtilisateurStatusBadge';

describe('UtilisateurStatusBadge', () => {
  it('affiche Actif pour un compte active', () => {
    render(<UtilisateurStatusBadge enabled />);
    const badge = screen.getByText('Actif');
    expect(badge.className).toContain('border-green-200');
  });

  it('affiche Desactive pour un compte inactif', () => {
    render(<UtilisateurStatusBadge enabled={false} />);
    const badge = screen.getByText('Desactive');
    expect(badge.className).toContain('border-slate-300');
  });

  it('affiche Invitation en attente avant activation', () => {
    render(<UtilisateurStatusBadge enabled activationStatus="INVITED" />);
    expect(screen.getByText('Invitation en attente')).toBeTruthy();
  });
});

