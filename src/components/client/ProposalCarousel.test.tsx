import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProposalCarousel } from './ProposalCarousel';
import api from '../../api';

vi.mock('../../api', () => ({ default: { get: vi.fn() } }));

const proposals = [
  { id: 1, statut: 'EN_ATTENTE' as const, prix: 1200, delaiMaxIntervention: 2, delaiMaxRendu: 3, documentId: 11, nomTelechargement: 'MES-12-G2_AVP-DEVIS.pdf', inclusions: ['Sondage pressiométrique'], exclusions: ['Accès chantier'], validiteOffreJusquAu: '2026-11-15', bureauEtude: { id: 1, raisonSociale: 'Premier bureau', profilPublicSlug: 'premier-bureau' } },
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
  beforeEach(() => {
    vi.mocked(api.get).mockReset().mockRejectedValue(new Error('Aperçu indisponible'));
  });

  it('ne rend rien sans proposition', () => {
    const { container } = render(<ProposalCarousel proposals={[]} returnTo="/" onAccept={vi.fn()} onRefuse={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('sélectionne la proposition demandée et permet une navigation bornée', async () => {
    renderCarousel(2);
    expect(screen.getByText('Second bureau')).toBeTruthy();
    expect(screen.getByRole('button', { name: /proposition suivante/i })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /proposition précédente/i }));
    expect(screen.getByText('Premier bureau')).toBeTruthy();
    expect(await screen.findByText(/prévisualisation du devis indisponible/i)).toBeTruthy();
  });

  it('déclenche les demandes de confirmation sans appliquer directement la décision', () => {
    const { onAccept, onRefuse } = renderCarousel();
    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Refuser' }));
    expect(onAccept).toHaveBeenCalledWith(1);
    expect(onRefuse).toHaveBeenCalledWith(1);
  });

  it('affiche les informations complètes de la proposition', () => {
    renderCarousel();
    expect(screen.getByText('1200.00 € HT · TVA non renseignée')).toBeTruthy();
    expect(screen.getByText(/2 sem/)).toBeTruthy();
    expect(screen.getByText(/3 sem/)).toBeTruthy();
    expect(screen.getByText('Sondage pressiométrique')).toBeTruthy();
    expect(screen.getByText('Accès chantier')).toBeTruthy();
    expect(screen.getByText('Jusqu’au 15/11/2026')).toBeTruthy();
    expect(screen.getByRole('link', { name: /consulter la fiche de premier bureau/i })).toHaveAttribute('href', '/bureaux-etudes/premier-bureau?retour=%2Fclient%2Fdemande%2F12');
  });

  it('présente séparément les données d’une offre précédemment refusée', () => {
    render(
      <MemoryRouter>
        <ProposalCarousel
          proposals={proposals}
          refusedHistoryByProposalId={new Map([[1, [{ id: 9, statut: 'REFUSEE', prix: 1400, delaiMaxIntervention: 5, delaiMaxRendu: 6, motifRefus: 'PRIX', commentaireRefus: 'Budget dépassé.' }]]])}
          returnTo="/"
          onAccept={vi.fn()}
          onRefuse={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('Offre précédente refusée')).toBeTruthy();
    fireEvent.click(screen.getByText('Offre précédente refusée'));
    expect(screen.getByText('1400.00 € HT · TVA non renseignée')).toBeTruthy();
    expect(screen.getByText(/Budget dépassé/)).toBeTruthy();
  });

  it('dimensionne l’aperçu pour afficher une page complète', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: new Blob(['pdf']) });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:devis');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

    renderCarousel();

    expect(await screen.findByTitle('Prévisualisation du devis de Premier bureau')).toHaveClass('h-[clamp(42rem,85vh,70rem)]');
    expect(api.get).toHaveBeenCalledWith('/documents/11/download/MES-12-G2_AVP-DEVIS.pdf', { responseType: 'blob' });
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
