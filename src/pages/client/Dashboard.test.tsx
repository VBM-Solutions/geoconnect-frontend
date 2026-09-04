import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ClientDashboard from './Dashboard';
import { ClientSpaceLayout } from '../../components/layout/ClientSpaceLayout';

const mockUseClientDashboardData = vi.fn();
const mockToastError = vi.fn();

vi.mock('../../hooks/useClientDashboardData', () => ({
  useClientDashboardData: () => mockUseClientDashboardData(),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    toastError: mockToastError,
    toastSuccess: vi.fn(),
  }),
}));

function renderDashboard(initialPath = '/client/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<ClientSpaceLayout />}>
          <Route path="/client/dashboard" element={<ClientDashboard />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ClientDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseClientDashboardData.mockReturnValue({
      demandes: [
        {
          id: 10,
          type: 'G2_PRO',
          description: 'Maison individuelle',
          adresseProjet: { ville: 'Nantes', codePostal: '44000' },
          delaiMaxSouhaite: 6,
          propositions: [{
            id: 100,
            statut: 'EN_ATTENTE',
            prix: 1250,
            delaiMaxRendu: 4,
            bureauEtude: { id: 3, raisonSociale: 'Geo Devis' },
          }],
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
            bureauEtude: { raisonSociale: 'Geo Atlantic', profilPublicSlug: 'geo-atlantic' },
            demandeDevis: {
              id: 10,
              description: 'Maison individuelle',
              adresseProjet: { ville: 'Nantes', codePostal: '44000' },
              delaiMaxSouhaite: 6,
            },
          },
        },
        {
          id: 2,
          etat: 'PAIEMENT_EFFECTUE',
          propositionDevis: {
            prix: 1800,
            statut: 'ACCEPTEE',
            delaiMaxRendu: 3,
            delaiMaxIntervention: 1,
            bureauEtude: { raisonSociale: 'Geo Archive', profilPublicSlug: 'geo-archive' },
            demandeDevis: {
              id: 11,
              description: 'Extension',
              adresseProjet: { ville: 'Rennes', codePostal: '35000' },
              delaiMaxSouhaite: 5,
            },
          },
        },
      ],
      etudeIdsAEvaluer: [2],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      client: null,
      demandePage: 0,
      activeEtudePage: 0,
      archivedEtudePage: 0,
      demandeTotal: 1,
      activeEtudeTotal: 1,
      archivedEtudeTotal: 1,
      completedEtudeTotal: 1,
      demandeTotalPages: 1,
      activeEtudeTotalPages: 1,
      archivedEtudeTotalPages: 1,
      setDemandePage: vi.fn(),
      setActiveEtudePage: vi.fn(),
      setArchivedEtudePage: vi.fn(),
    });
  });

  it('affiche un bandeau client épuré sans KPI ni fil d activité', () => {
    renderDashboard('/client/dashboard?tab=DEMANDES');

    expect(screen.getByRole('heading', { name: /^mon espace$/i })).toBeTruthy();
    expect(screen.queryByText(/tableau de bord client/i)).toBeNull();
    expect(screen.queryByText(/études totales/i)).toBeNull();
    expect(screen.queryByText(/vos études avancent/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /voir mes études/i })).toBeNull();
  });

  it('affiche les propositions à largeur fixe et transmet la proposition sélectionnée au détail', () => {
    renderDashboard('/client/dashboard?tab=DEMANDES');

    const proposition = screen.getByRole('link', { name: /geo devis/i });
    expect(proposition.className).toContain('w-64');
    expect(proposition.className).toContain('shrink-0');
    expect(proposition.getAttribute('href')).toBe('/client/demande/10?proposition=100');
  });

  it('prend en compte l onglet actif transmis dans l URL', () => {
    renderDashboard('/client/dashboard?tab=ARCHIVES');

    expect(screen.getByRole('heading', { name: /études archivées/i })).toBeTruthy();
    expect(screen.queryByText(/les études dont le paiement a été effectué apparaîtront ici\./i)).toBeNull();
    expect(screen.getByText(/geo archive/i)).toBeTruthy();
    expect(screen.getByText(/votre avis facultatif est attendu/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /consulter la fiche de geo archive/i }).getAttribute('href'))
      .toBe('/bureaux-etudes/geo-archive?retour=%2Fclient%2Fdashboard');
  });

  it('permet de naviguer entre les trois affichages avec la sidebar', async () => {
    const user = userEvent.setup();
    renderDashboard('/client/dashboard?tab=DEMANDES');

    await user.click(screen.getByRole('button', { name: /mes études/i }));

    expect(screen.getByRole('heading', { name: /études en cours/i })).toBeTruthy();
  });
});



