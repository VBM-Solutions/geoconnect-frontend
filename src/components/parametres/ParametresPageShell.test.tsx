import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ParametresPageShell } from './ParametresPageShell';

describe('ParametresPageShell', () => {
  it('affiche le titre, le sous-titre et le contenu', () => {
    render(
      <ParametresPageShell title="Paramètres" subtitle="Sous-titre">
        <div>contenu</div>
      </ParametresPageShell>,
    );

    expect(screen.getByRole('heading', { name: /paramètres/i })).toBeTruthy();
    expect(screen.getByText('Sous-titre')).toBeTruthy();
    expect(screen.getByText('contenu')).toBeTruthy();
  });
});

