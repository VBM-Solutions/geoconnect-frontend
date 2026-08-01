import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BureauEtudeProfileLink } from './BureauEtudeProfileLink';

describe('BureauEtudeProfileLink', () => {
  it('rend le nom cliquable vers la fiche avec le retour contextuel', () => {
    render(
      <BureauEtudeProfileLink
        raisonSociale="Géo Conseil"
        slug="geo-conseil"
        returnTo="/client/dashboard"
      />,
    );

    const lien = screen.getByRole('link', { name: /consulter la fiche de géo conseil/i });
    expect(lien.getAttribute('href'))
      .toBe('/bureaux-etudes/geo-conseil?retour=%2Fclient%2Fdashboard');
    expect(lien.getAttribute('target')).toBe('_blank');
    expect(lien.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('conserve le nom sans lien lorsque le profil nest pas publié', () => {
    render(
      <BureauEtudeProfileLink
        raisonSociale="Géo Conseil"
        returnTo="/client/dashboard"
      />,
    );

    expect(screen.getByText('Géo Conseil')).toBeTruthy();
    expect(screen.queryByRole('link')).toBeNull();
  });
});
