import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EtudeStepper } from './EtudeStepper';

describe('EtudeStepper', () => {
  it('affiche à droite la date connue des étapes franchies', () => {
    render(
      <EtudeStepper
        etat="INTERVENTION_EFFECTUEE"
        role="CLIENT"
        datesEtapes={{
          DEVIS_VALIDE: '2026-08-10T09:00:00',
          DEVIS_SIGNE: '2026-08-12T14:30:00',
          INTERVENTION_EFFECTUEE: '2026-08-20T16:00:00',
          RAPPORT_TERMINE: '2026-08-25T08:00:00',
        }}
      />,
    );

    expect(screen.getByText('10 août 2026')).toBeTruthy();
    expect(screen.getByText('12 août 2026')).toBeTruthy();
    expect(screen.getByText('20 août 2026')).toBeTruthy();
    expect(screen.queryByText('25 août 2026')).toBeNull();
  });
});
