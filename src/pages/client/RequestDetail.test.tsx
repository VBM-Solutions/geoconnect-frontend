import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ClientRequestDetail from './RequestDetail';
import { getDemandeDetail, updateDemandeDevis } from '../../api/demandeDevis';
import { uploadDocuments } from '../../api/document';

vi.mock('../../api/demandeDevis', () => ({
  getDemandeDetail: vi.fn(),
  updateDemandeDevis: vi.fn(),
}));

vi.mock('../../api/document', () => ({ uploadDocuments: vi.fn() }));

vi.mock('../../api/propositionDevis', () => ({
  getPropositionDevisByDemandeId: vi.fn(),
  accepterPropositionDevis: vi.fn(),
  refuserPropositionDevis: vi.fn(),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    toastError: vi.fn(),
    toastSuccess: vi.fn(),
  }),
}));

function renderPage(url = '/client/demande/12') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/client/demande/:id" element={<ClientRequestDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ClientRequestDetail — identité du bureau', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDemandeDetail).mockResolvedValue({ demande: {
      id: 12,
      type: 'G2_AVP',
      description: 'Projet de maison individuelle',
      adresseProjet: { ville: 'Nantes', codePostal: '44000' },
    }, propositions: [], bureauEtudeId: null });
  });

  it('affiche le nom réel, la ville et le lien vers la fiche publique', async () => {
    vi.mocked(getDemandeDetail).mockResolvedValue({ demande: { id: 12, adresseProjet: { ville: 'Nantes', codePostal: '44000' } }, propositions: [{
      id: 42,
      prix: 1800,
      delaiMaxRendu: 4,
      statut: 'EN_ATTENTE',
      bureauEtude: {
        id: 7,
        raisonSociale: 'Géo Conseil Atlantique',
        ville: 'Saint-Herblain',
        profilPublicSlug: 'geo-conseil-atlantique',
      },
    }], bureauEtudeId: null });

    renderPage();

    expect(await screen.findByText('Géo Conseil Atlantique')).toBeTruthy();
    expect(screen.getByText('Saint-Herblain')).toBeTruthy();
    const lien = screen.getByRole('link', { name: /consulter la fiche de géo conseil atlantique/i });
    expect(lien.getAttribute('href')).toBe(
      '/bureaux-etudes/geo-conseil-atlantique?retour=%2Fclient%2Fdemande%2F12',
    );
    expect(lien.getAttribute('target')).toBe('_blank');
    expect(lien.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('affiche toujours le nom réel quand la fiche publique nest pas publiée', async () => {
    vi.mocked(getDemandeDetail).mockResolvedValue({ demande: { id: 12, adresseProjet: { ville: 'Nantes', codePostal: '44000' } }, propositions: [{
      id: 43,
      prix: 1600,
      delaiMaxRendu: 3,
      statut: 'EN_ATTENTE',
      bureauEtude: {
        id: 8,
        raisonSociale: 'Sols & Structures',
        ville: 'Rennes',
      },
    }], bureauEtudeId: null });

    renderPage();

    expect(await screen.findByText('Sols & Structures')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /consulter la fiche/i })).toBeNull();
  });

  it('sélectionne visuellement la proposition ciblée par une notification', async () => {
    vi.mocked(getDemandeDetail).mockResolvedValue({ demande: { id: 12, adresseProjet: { ville: 'Nantes' } }, propositions: [{
      id: 43, prix: 1600, delaiMaxRendu: 3, statut: 'EN_ATTENTE',
      bureauEtude: { id: 8, raisonSociale: 'Sols & Structures' },
    }], bureauEtudeId: null });

    renderPage('/client/demande/12?section=propositions&proposition=43');

    expect(await screen.findByText('Sols & Structures')).toBeTruthy();
    expect(screen.getByText('Proposition 1 sur 1')).toBeTruthy();
  });

  it('affiche les caractéristiques cadastrales du projet', async () => {
    vi.mocked(getDemandeDetail).mockResolvedValue({ demande: {
      id: 12,
      superficie: 450,
      nombreLot: 2,
      referencesCadastrales: ['AB 42', 'AC 7'],
      adresseProjet: { ville: 'Nantes', codePostal: '44000' },
    }, propositions: [], bureauEtudeId: null });

    renderPage();

    expect(await screen.findByText('450 m²')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('AB 42, AC 7')).toBeTruthy();
  });

  it('ajoute des documents sans proposer leur téléchargement', async () => {
    const user = userEvent.setup();
    vi.mocked(uploadDocuments).mockResolvedValue([91]);
    vi.mocked(updateDemandeDevis).mockResolvedValue(undefined);
    vi.mocked(getDemandeDetail)
      .mockResolvedValueOnce({ demande: { id: 12, clientId: 4, type: 'G2_AVP', adresseProjet: { rue: '1 rue Test', ville: 'Nantes', codePostal: '44000' }, docsDevisIds: [] }, propositions: [], bureauEtudeId: null })
      .mockResolvedValueOnce({ demande: { id: 12, clientId: 4, type: 'G2_AVP', adresseProjet: { rue: '1 rue Test', ville: 'Nantes', codePostal: '44000' }, docsDevisIds: [91], documentsDevis: [{ id: 91, nomTelechargement: 'plan.pdf' }] }, propositions: [], bureauEtudeId: null });
    renderPage();

    const input = await screen.findByLabelText(/attacher des documents/i);
    await user.upload(input, new File(['plan'], 'plan.pdf', { type: 'application/pdf' }));

    await waitFor(() => expect(uploadDocuments).toHaveBeenCalledTimes(1));
    expect(updateDemandeDevis).toHaveBeenCalledWith(expect.objectContaining({ docsDevisIds: [91] }));
    expect(await screen.findByText('plan.pdf')).toBeTruthy();
    expect(screen.queryByTitle('Télécharger')).toBeNull();
  });
});
