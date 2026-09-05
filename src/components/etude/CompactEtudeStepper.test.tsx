import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CompactEtudeStepper } from './CompactEtudeStepper';

describe('CompactEtudeStepper', () => {
  it('ne rend rien sans état', () => {
    const { container } = render(<CompactEtudeStepper />);
    expect(container).toBeEmptyDOMElement();
  });

  it('n’affiche que le nom de l’étape courante et marque les précédentes en vert', () => {
    render(<CompactEtudeStepper etat="DATE_INTERVENTION_FIXEE" />);

    expect(screen.getByText('Date confirmée')).toBeTruthy();
    expect(screen.queryByText('Devis accepté')).toBeNull();
    expect(screen.getByLabelText('Devis accepté : validée')).toBeTruthy();
    expect(screen.getByLabelText('Intervention réalisée : à valider')).toBeTruthy();
  });

  it('met en évidence l’action attendue du client avec le libellé métier', () => {
    render(<CompactEtudeStepper etat="RAPPORT_TERMINE" />);

    expect(screen.getByText(/confirmez le paiement pour clôturer le dossier/i)).toHaveClass('text-orange-700');
  });
});
