import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BEDashboard from './Dashboard';

const mockUseBEDashboardData = vi.fn();
const mockToastError = vi.fn();

vi.mock('../../hooks/useBEDashboardData', () => ({
  useBEDashboardData: () => mockUseBEDashboardData(),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    toastError: mockToastError,
    toastSuccess: vi.fn(),
  }),
}));

vi.mock('../../components/map/BEInteractiveMap', () => ({
  BEInteractiveMap: ({ title }: { title: string }) => <div data-testid="be-interactive-map">{title}</div>,
}));

function renderDashboard(initialPath = '/be/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/be/dashboard" element={<BEDashboard />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('BEDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBEDashboardData.mockReturnValue({
      bureau: { id: 4, raisonSociale: 'Geo Atlantic' },
      demandes: [
        {
          id: 10,
          type: 'G2_PRO',
          description: 'Maison individuelle',
          adresseProjet: { ville: 'Nantes', codePostal: '44000' },
        },
        {
          id: 20,
          type: 'G5',
          description: 'Diagnostic structure',
          adresseProjet: { ville: 'Saint-Nazaire', codePostal: '44600' },
        },
      ],
      allPropositionsPerDemande: [[], []],
      myPropositions: [
        {
          id: 100,
          demandeDevisId: 20,
          statut: 'EN_ATTENTE',
          prix: 2400,
          delaiMaxRendu: 4,
        },
      ],
      etudes: [
        {
          id: 1,
          etat: 'DATE_INTERVENTION_PROPOSEE',
          propositionDevis: {
            prix: 2400,
            statut: 'ACCEPTEE',
            delaiMaxRendu: 4,
            delaiMaxIntervention: 2,
            demandeDevis: {
              id: 30,
              description: 'Residence',
              adresseProjet: { ville: 'Rennes', codePostal: '35000' },
              client: { prenom: 'Alice', nom: 'Martin' },
            },
          },
        },
        {
          id: 2,
          etat: 'PAIEMENT_EFFECTUE',
          propositionDevis: {
            prix: 1900,
            statut: 'ACCEPTEE',
            delaiMaxRendu: 3,
            delaiMaxIntervention: 1,
            demandeDevis: {
              id: 31,
              description: 'Extension',
              adresseProjet: { ville: 'Vannes', codePostal: '56000' },
              client: { prenom: 'Paul', nom: 'Durand' },
            },
          },
        },
      ],
      notificationPreferences: null,
      filterByDept: false,
      availableTotal: 1,
      pendingTotal: 1,
      activeEtudeTotal: 1,
      archivedEtudeTotal: 1,
      availablePage: 0,
      pendingPage: 0,
      activeEtudePage: 0,
      archivedEtudePage: 0,
      availableTotalPages: 1,
      pendingTotalPages: 1,
      activeEtudeTotalPages: 1,
      archivedEtudeTotalPages: 1,
      setFilterByDept: vi.fn(),
      setAvailablePage: vi.fn(),
      setPendingPage: vi.fn(),
      setActiveEtudePage: vi.fn(),
      setArchivedEtudePage: vi.fn(),
      isLoading: false,
      error: null,
    });
  });

  it('affiche le hero harmonise et les KPI principaux', () => {
    renderDashboard();

    expect(screen.getByRole('heading', { name: /tableau de bord/i })).toBeTruthy();
    expect(screen.getByText(/bureau d'études/i)).toBeTruthy();
    expect(screen.getByText(/geo atlantic/i)).toBeTruthy();
    expect(screen.getByText(/missions visibles/i)).toBeTruthy();
    expect(screen.getByText(/études finalisées/i)).toBeTruthy();
  });

  it('affiche le contenu de l onglet En attente apres navigation sidebar', async () => {
    const user = userEvent.setup();
    renderDashboard();

    expect(screen.getByText(/des propositions attendent un suivi/i)).toBeTruthy();
    const navigationButtons = screen.getAllByRole('button', { name: /En attente/i });
    await user.click(navigationButtons[navigationButtons.length - 1]);

    expect(screen.getByRole('heading', { name: /propositions en attente/i })).toBeTruthy();
    expect(screen.getByText(/reproposer une offre|voir détail|répondre au devis/i)).toBeTruthy();
  });

  it('prend en compte l onglet de l URL au chargement', () => {
    renderDashboard('/be/dashboard?tab=ARCHIVES');

    expect(screen.getByRole('heading', { name: /études archivées/i })).toBeTruthy();
    expect(screen.getByText(/paul durand/i)).toBeTruthy();
  });

  it('centre la vue sur les études via le CTA hero', async () => {
    const user = userEvent.setup();
    const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});

    renderDashboard();

    await user.click(screen.getByRole('button', { name: /suivre mes études/i }));

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(screen.getByRole('heading', { name: /études en cours/i })).toBeTruthy();
  });

  it('centre la vue sur les missions via le CTA hero', async () => {
    const user = userEvent.setup();
    const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});

    renderDashboard('/be/dashboard?tab=ETUDE_EN_COURS');

    const missionButtons = screen.getAllByRole('button', { name: /voir les missions/i });
    await user.click(missionButtons[0]);

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(screen.getByRole('heading', { name: /missions disponibles/i })).toBeTruthy();
  });

  it('conserve une hauteur stable lors du basculement carte liste', async () => {
    const user = userEvent.setup();
    renderDashboard();

    const viewContainer = screen.getByTestId('dashboard-switchable-view');
    expect(viewContainer.className).toContain('min-h-[520px]');

    await user.click(screen.getByRole('button', { name: 'Liste' }));

    expect(screen.queryByTestId('be-interactive-map')).toBeNull();
    expect(viewContainer.className).toContain('min-h-[520px]');
  });

  it('affiche les délais dans l ordre intervention puis rendu', async () => {
    const user = userEvent.setup();
    renderDashboard('/be/dashboard?tab=ETUDE_EN_COURS');
    await user.click(screen.getByRole('button', { name: 'Liste' }));

    const intervention = screen.getAllByText(/Intervention :/i)[0];
    const rendu = screen.getAllByText(/Rendu :/i)[0];
    expect(intervention.compareDocumentPosition(rendu) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});







