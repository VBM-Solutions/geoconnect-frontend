import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BERequestDetail from './RequestDetail';
import * as demandeDevisApi from '../../api/demandeDevis';
import * as propositionDevisApi from '../../api/propositionDevis';
import * as bureauEtudeApi from '../../api/bureauEtude';
import * as documentApi from '../../api/document';
import * as AuthContextModule from '../../contexts/AuthContext';
import * as ToastContextModule from '../../contexts/ToastContext';

// ─── Mocks globaux ────────────────────────────────────────────────────────────

vi.mock('../../api/demandeDevis');
vi.mock('../../api/propositionDevis');
vi.mock('../../api/bureauEtude');
vi.mock('../../api/document');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// ─── Données de test ──────────────────────────────────────────────────────────

const MOCK_USER = { userId: 5, token: 'tok-be', role: 'BUREAU_ETUDE' as const, email: 'be@test.fr' };
const MOCK_BUREAU = { id: 10, raisonSociale: 'GeoExpert SAS' };
const MOCK_DEMANDE = {
  id: 1,
  type: 'G0',
  description: 'Terrain en pente',
  adresseProjet: { rue: '10 Rue Test', codePostal: '75001', ville: 'Paris' },
};

// ─── Helper de rendu ──────────────────────────────────────────────────────────

function renderRequestDetail(demandeId = '1') {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: MOCK_USER,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  } as ReturnType<typeof AuthContextModule.useAuth>);

  vi.spyOn(ToastContextModule, 'useToast').mockReturnValue({
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
  } as ReturnType<typeof ToastContextModule.useToast>);

  return render(
    <MemoryRouter initialEntries={[`/be/demandes/${demandeId}`]}>
      <Routes>
        <Route path="/be/demandes/:id" element={<BERequestDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BERequestDetail — rendu initial', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (bureauEtudeApi.getBureauByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_BUREAU);
    (demandeDevisApi.getDemandeDevisById as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_DEMANDE);
    (propositionDevisApi.getPropositionDevisByDemandeId as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (documentApi.getAllDocuments as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it('affiche le formulaire de proposition quand aucune offre n\'existe', async () => {
    renderRequestDetail();

    await waitFor(() => {
      expect(screen.getByText(/formuler une offre/i)).toBeTruthy();
    });
  });

  it('affiche les champs prix, délai rendu et délai intervention', async () => {
    renderRequestDetail();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ex: 4200')).toBeTruthy();
      expect(screen.getByPlaceholderText('Ex: 4')).toBeTruthy();
      expect(screen.getByPlaceholderText('Ex: 2')).toBeTruthy();
    });
  });

  it('affiche les documents joints de la demande quand docsDevisIds est renseigné', async () => {
    (demandeDevisApi.getDemandeDevisById as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...MOCK_DEMANDE,
      docsDevisIds: [12, 13],
    });
    (documentApi.getAllDocuments as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 12, nomTelechargement: 'MARTIN_JEAN-G1_ELAN-DOCS_CLIENT.pdf' },
      { id: 13, nomTelechargement: 'MARTIN_JEAN-G1_ELAN-DOCS_CLIENT-2.pdf' },
    ]);

    renderRequestDetail();

    await waitFor(() => {
      expect(screen.getByText('MARTIN_JEAN-G1_ELAN-DOCS_CLIENT.pdf')).toBeTruthy();
      expect(screen.getByText('MARTIN_JEAN-G1_ELAN-DOCS_CLIENT-2.pdf')).toBeTruthy();
    });
  });
});

describe('BERequestDetail — validation du formulaire de proposition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (bureauEtudeApi.getBureauByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_BUREAU);
    (demandeDevisApi.getDemandeDevisById as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_DEMANDE);
    (propositionDevisApi.getPropositionDevisByDemandeId as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (propositionDevisApi.createPropositionDevis as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 99 });
  });

  /**
   * Le bouton "SOUMETTRE MON OFFRE" est de type "button" → il ouvre directement la modale.
   * La validation react-hook-form s'exécute à la confirmation dans la modale.
   * Si le formulaire est invalide, onSubmit n'est pas appelé et les erreurs apparaissent dans le formulaire.
   */

  it('ouvre toujours la modale de confirmation au clic sur "SOUMETTRE"', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    await waitFor(() => screen.getByPlaceholderText('Ex: 4200'));

    // Prix vide → modale s'ouvre quand même
    await user.click(screen.getByRole('button', { name: /soumettre mon offre/i }));

    await waitFor(() => {
      expect(screen.getByText('Confirmer la soumission')).toBeTruthy();
    });
  });

  it('n\'appelle pas createPropositionDevis si le prix est vide après confirmation', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    await waitFor(() => screen.getByPlaceholderText('Ex: 4200'));

    // Laisser le prix vide, remplir le reste
    await user.type(screen.getByPlaceholderText('Ex: 4'), '4');
    await user.type(screen.getByPlaceholderText('Ex: 2'), '2');

    // Ouvrir la modale et confirmer
    await user.click(screen.getByRole('button', { name: /soumettre mon offre/i }));
    await waitFor(() => screen.getByText('Confirmer la soumission'));
    await user.click(screen.getByRole('button', { name: /^soumettre$/i }));

    await waitFor(() => {
      expect(propositionDevisApi.createPropositionDevis).not.toHaveBeenCalled();
    });
  });

  it('affiche "Doit être > 0" si le prix est 0 après confirmation', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    await waitFor(() => screen.getByPlaceholderText('Ex: 4200'));

    await user.type(screen.getByPlaceholderText('Ex: 4200'), '0');
    await user.type(screen.getByPlaceholderText('Ex: 4'), '4');
    await user.type(screen.getByPlaceholderText('Ex: 2'), '2');

    await user.click(screen.getByRole('button', { name: /soumettre mon offre/i }));
    await waitFor(() => screen.getByText('Confirmer la soumission'));
    await user.click(screen.getByRole('button', { name: /^soumettre$/i }));

    await waitFor(() => {
      expect(screen.getByText('Doit être > 0')).toBeTruthy();
    });
    expect(propositionDevisApi.createPropositionDevis).not.toHaveBeenCalled();
  });

  it('n\'appelle pas createPropositionDevis si le délai de rendu est vide après confirmation', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    await waitFor(() => screen.getByPlaceholderText('Ex: 4200'));

    await user.type(screen.getByPlaceholderText('Ex: 4200'), '4200');
    // délai rendu non renseigné
    await user.type(screen.getByPlaceholderText('Ex: 2'), '2');

    await user.click(screen.getByRole('button', { name: /soumettre mon offre/i }));
    await waitFor(() => screen.getByText('Confirmer la soumission'));
    await user.click(screen.getByRole('button', { name: /^soumettre$/i }));

    await waitFor(() => {
      expect(propositionDevisApi.createPropositionDevis).not.toHaveBeenCalled();
    });
  });

  it('affiche "Minimum 1 semaine" si délai rendu < 1 après confirmation', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    await waitFor(() => screen.getByPlaceholderText('Ex: 4200'));

    await user.type(screen.getByPlaceholderText('Ex: 4200'), '4200');
    await user.type(screen.getByPlaceholderText('Ex: 4'), '0'); // invalide
    await user.type(screen.getByPlaceholderText('Ex: 2'), '2');

    await user.click(screen.getByRole('button', { name: /soumettre mon offre/i }));
    await waitFor(() => screen.getByText('Confirmer la soumission'));
    await user.click(screen.getByRole('button', { name: /^soumettre$/i }));

    await waitFor(() => {
      expect(screen.getByText('Minimum 1 semaine')).toBeTruthy();
    });
  });

  it('n\'appelle pas createPropositionDevis si le délai d\'intervention est vide après confirmation', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    await waitFor(() => screen.getByPlaceholderText('Ex: 4200'));

    await user.type(screen.getByPlaceholderText('Ex: 4200'), '4200');
    await user.type(screen.getByPlaceholderText('Ex: 4'), '4');
    // délai intervention non renseigné

    await user.click(screen.getByRole('button', { name: /soumettre mon offre/i }));
    await waitFor(() => screen.getByText('Confirmer la soumission'));
    await user.click(screen.getByRole('button', { name: /^soumettre$/i }));

    await waitFor(() => {
      expect(propositionDevisApi.createPropositionDevis).not.toHaveBeenCalled();
    });
  });

  it('soumet la proposition après confirmation de la modale avec données valides', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    await waitFor(() => screen.getByPlaceholderText('Ex: 4200'));

    await user.type(screen.getByPlaceholderText('Ex: 4200'), '4200');
    await user.type(screen.getByPlaceholderText('Ex: 4'), '4');
    await user.type(screen.getByPlaceholderText('Ex: 2'), '2');
    await user.click(screen.getByRole('button', { name: /soumettre mon offre/i }));

    await waitFor(() => screen.getByText('Confirmer la soumission'));

    // Clic précis sur le bouton "Soumettre" de la modale (pas l'autre bouton du formulaire)
    const submitButtons = screen.getAllByRole('button', { name: /soumettre/i });
    const modalSubmitBtn = submitButtons.find(b =>
      b.textContent?.trim() === 'Soumettre' || b.closest('[role="dialog"]') !== null
    ) ?? submitButtons[submitButtons.length - 1];
    await user.click(modalSubmitBtn);

    await waitFor(() => {
      expect(propositionDevisApi.createPropositionDevis).toHaveBeenCalledWith(
        expect.objectContaining({
          demandeDevisId: 1,
          bureauEtudeId: 10,
          prix: 4200,
          delaiMaxRendu: 4,
          delaiMaxIntervention: 2,
        })
      );
    });
  });

  it('accepte un prix minimum de 0.01 comme valide', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    await waitFor(() => screen.getByPlaceholderText('Ex: 4200'));

    await user.type(screen.getByPlaceholderText('Ex: 4200'), '0.01');
    await user.type(screen.getByPlaceholderText('Ex: 4'), '4');
    await user.type(screen.getByPlaceholderText('Ex: 2'), '2');
    await user.click(screen.getByRole('button', { name: /soumettre mon offre/i }));

    await waitFor(() => {
      expect(screen.getByText('Confirmer la soumission')).toBeTruthy();
    });

    const submitButtons = screen.getAllByRole('button', { name: /soumettre/i });
    const modalSubmitBtn = submitButtons.find(b =>
      b.textContent?.trim() === 'Soumettre' || b.closest('[role="dialog"]') !== null
    ) ?? submitButtons[submitButtons.length - 1];
    await user.click(modalSubmitBtn);

    await waitFor(() => {
      expect(propositionDevisApi.createPropositionDevis).toHaveBeenCalledOnce();
    });
    expect(screen.queryByText('Doit être > 0')).toBeNull();
  });
});


