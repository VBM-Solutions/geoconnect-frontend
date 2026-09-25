import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ClientRequestDetail from './RequestDetail';
import { enrichirDemande, getDemandeDetail } from '../../api/demandeDevis';
import { uploadDocument } from '../../api/document';
import { accepterPropositionDevis } from '../../api/propositionDevis';

vi.mock('../../api/demandeDevis', () => ({
  getDemandeDetail: vi.fn(),
  enrichirDemande: vi.fn(),
}));

vi.mock('../../api/document', () => ({ uploadDocument: vi.fn(), openDocument: vi.fn() }));

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

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>;
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

  it('redirige vers le stepper de l’étude après acceptation du devis', async () => {
    const user = userEvent.setup();
    vi.mocked(accepterPropositionDevis).mockResolvedValue({ etudeId: 42 });
    vi.mocked(getDemandeDetail).mockResolvedValue({
      demande: { id: 12, adresseProjet: { ville: 'Nantes', codePostal: '44000' } },
      propositions: [{ id: 43, prix: 1600, delaiMaxRendu: 3, statut: 'EN_ATTENTE', bureauEtude: { id: 8, raisonSociale: 'Sols & Structures' } }],
      bureauEtudeId: null,
    });

    render(
      <MemoryRouter initialEntries={['/client/demande/12']}>
        <Routes>
          <Route path="/client/demande/:id" element={<ClientRequestDetail />} />
          <Route path="/client/etude/:id" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );
    await user.click(await screen.findByRole('button', { name: 'Accepter' }));
    await user.click(screen.getByRole('button', { name: "Accepter l'offre" }));

    await waitFor(() => expect(accepterPropositionDevis).toHaveBeenCalledWith(43));
    await user.click(await screen.findByRole('button', { name: 'Accéder à l’étude' }));
    expect(await screen.findByTestId('location')).toHaveTextContent('/client/etude/42');
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
    const user = userEvent.setup();
    vi.mocked(getDemandeDetail).mockResolvedValue({ demande: {
      id: 12,
      superficie: 450,
      nombreLot: 2,
      referencesCadastrales: ['AB 42', 'AC 7'],
      adresseProjet: { ville: 'Nantes', codePostal: '44000' },
    }, propositions: [], bureauEtudeId: null });

    renderPage();

    expect(await screen.findByRole('button', { name: 'Offres reçues' })).toBeInTheDocument();
    expect(screen.queryByText('450 m²')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Description' }));
    expect(await screen.findByText('450 m²')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('AB 42, AC 7')).toBeTruthy();
  });

  it('ajoute des documents sans proposer leur téléchargement', async () => {
    const user = userEvent.setup();
    vi.mocked(uploadDocument).mockResolvedValue({ id: 91, nomFichierOriginal: 'plan.pdf' });
    const initial = { id: 12, clientId: 4, type: 'G2_AVP' as const, adresseProjet: { rue: '1 rue Test', ville: 'Nantes', codePostal: '44000' }, docsDevisIds: [], presenceReseaux: 'NE_SAIS_PAS' as const, accessibiliteMachines: 'NE_SAIS_PAS' as const };
    vi.mocked(getDemandeDetail).mockResolvedValue({ demande: initial, propositions: [], bureauEtudeId: null });
    vi.mocked(enrichirDemande).mockResolvedValue({ ...initial, docsDevisIds: [91], documentsDevis: [{ id: 91, nomFichierOriginal: 'plan.pdf', categorieDemande: 'PLAN_SITUATION' }] });
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Documents' }));
    await user.click(await screen.findByRole('button', { name: 'Ajouter — Plan de situation' }));
    const input = screen.getByLabelText('Fichier document');
    await user.upload(input, new File(['plan'], 'plan.pdf', { type: 'application/pdf' }));

    await waitFor(() => expect(uploadDocument).toHaveBeenCalledTimes(1));
    expect(enrichirDemande).toHaveBeenCalledWith(12, expect.objectContaining({ documentsDemande: [expect.objectContaining({ documentId: 91, categorie: 'PLAN_SITUATION' })] }));
    expect(await screen.findByText('plan.pdf')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Visualiser plan.pdf' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Télécharger plan.pdf' })).toBeTruthy();
  });

  it('n’affiche l’édition que dans l’onglet Description', async () => {
    const user = userEvent.setup();
    vi.mocked(getDemandeDetail).mockResolvedValue({ demande: { id: 12, adresseProjet: { ville: 'Nantes' } }, propositions: [], bureauEtudeId: null });
    renderPage();
    expect(await screen.findByRole('button', { name: 'Offres reçues' })).toBeInTheDocument();
    expect(screen.getByText('Offres Reçues (0)')).toBeInTheDocument();
    expect(screen.queryByText('Description de la demande')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Modifier' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Description' }));
    expect(screen.getByRole('heading', { name: 'Description de la demande' }).parentElement?.parentElement)
      .toHaveClass('rounded-lg', 'border', 'bg-white');
    expect(screen.getByRole('button', { name: 'Modifier' })).toBeInTheDocument();
  });
});
