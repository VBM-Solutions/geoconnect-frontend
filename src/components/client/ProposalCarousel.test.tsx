import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ProposalCarousel } from './ProposalCarousel';

const proposals = [
  { id: 1, statut: 'EN_ATTENTE' as const, prix: 1200, delaiMaxRendu: 3, documentId: 11, bureauEtude: { id: 1, raisonSociale: 'Premier bureau' } },
  { id: 2, statut: 'EN_ATTENTE' as const, prix: 1500, delaiMaxRendu: 4, bureauEtude: { id: 2, raisonSociale: 'Second bureau' } },
];

function renderCarousel(initialProposalId?: number) {
  const onAccept = vi.fn();
  const onRefuse = vi.fn();
  render(
    <MemoryRouter>
      <ProposalCarousel proposals={proposals} initialProposalId={initialProposalId} returnTo="/client/demande/12" onAccept={onAccept} onRefuse={onRefuse} />
    </MemoryRouter>,
  );
  return { onAccept, onRefuse };
}

describe('ProposalCarousel', () => {
  it('ne rend rien sans proposition', () => {
    const { container } = render(<ProposalCarousel proposals={[]} returnTo="/" onAccept={vi.fn()} onRefuse={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('sélectionne la proposition demandée et permet une navigation bornée', () => {
    renderCarousel(2);
    expect(screen.getByText('Second bureau')).toBeTruthy();
    expect(screen.getByRole('button', { name: /proposition suivante/i })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /proposition précédente/i }));
    expect(screen.getByText('Premier bureau')).toBeTruthy();
    expect(screen.getByTitle(/prévisualisation du devis de premier bureau/i)).toHaveAttribute('src', '/api/documents/11/download/devis.pdf');
  });

  it('déclenche les demandes de confirmation sans appliquer directement la décision', () => {
    const { onAccept, onRefuse } = renderCarousel();
    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Refuser' }));
    expect(onAccept).toHaveBeenCalledWith(1);
    expect(onRefuse).toHaveBeenCalledWith(1);
  });

  it('affiche les états terminaux sans actions', () => {
    render(
      <MemoryRouter>
        <ProposalCarousel proposals={[{ ...proposals[0], statut: 'ACCEPTEE' }]} returnTo="/" onAccept={vi.fn()} onRefuse={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByText(/proposition acceptée/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Accepter' })).toBeNull();
  });
});
