import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ClientRequestDetail from './RequestDetail';
import { getDemandeDetail } from '../../api/demandeDevis';

vi.mock('../../api/demandeDevis', () => ({
  getDemandeDetail: vi.fn(),
}));

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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/client/demande/12']}>
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
});
