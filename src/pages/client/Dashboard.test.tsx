import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ClientDashboard from './Dashboard';

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
        <Route path="/client/dashboard" element={<ClientDashboard />} />
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
          propositions: [{ id: 100, statut: 'EN_ATTENTE' }],
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
    });
  });

  it('affiche le hero client et les cartes KPI', () => {
    renderDashboard();

    expect(screen.getByRole('heading', { name: /mon espace projet/i })).toBeTruthy();
    expect(screen.getByText(/tableau de bord client/i)).toBeTruthy();
    expect(screen.getByText(/études totales/i)).toBeTruthy();
    expect(screen.getByText(/demandes ouvertes/i)).toBeTruthy();
  });

  it('affiche un fil d activité derive des donnees et permet de naviguer vers les archives', async () => {
    const user = userEvent.setup();
    renderDashboard();

    expect(screen.getByText(/de nouvelles offres sont arrivées/i)).toBeTruthy();
    expect(screen.getByText(/des livrables sont disponibles/i)).toBeTruthy();
    expect(screen.getByText(/votre avis compte/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /consulter les archives/i }));

    expect(screen.getByRole('heading', { name: /études archivées/i })).toBeTruthy();
    expect(screen.getByText(/consulter et noter/i)).toBeTruthy();
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

  it('centre la vue sur le panneau des études via le CTA hero', async () => {
    const user = userEvent.setup();
    const scrollSpy = vi.spyOn(Element.prototype, 'scrollIntoView').mockImplementation(() => {});

    renderDashboard('/client/dashboard?tab=DEMANDES');

    await user.click(screen.getByRole('button', { name: /voir mes études/i }));

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    expect(screen.getByRole('heading', { name: /études en cours/i })).toBeTruthy();
  });
});



