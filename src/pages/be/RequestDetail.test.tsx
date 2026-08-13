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
    (demandeDevisApi.getDemandeDetail as ReturnType<typeof vi.fn>).mockResolvedValue({ demande: MOCK_DEMANDE, propositions: [], bureauEtudeId: MOCK_BUREAU.id });
  });

  it('affiche le formulaire de proposition quand aucune offre n\'existe', async () => {
    renderRequestDetail();

    expect(await screen.findByText(/formuler une offre/i)).toBeTruthy();
  });

  it('affiche les champs prix, délai rendu et délai intervention', async () => {
    renderRequestDetail();

    expect(await screen.findByPlaceholderText('Ex: 4200')).toBeTruthy();
    expect(screen.getByPlaceholderText('Ex: 4')).toBeTruthy();
    expect(screen.getByPlaceholderText('Ex: 2')).toBeTruthy();
  });

  it('présente les champs dans l ordre prix intervention puis rendu', async () => {
    renderRequestDetail();

    const prix = await screen.findByPlaceholderText('Ex: 4200');
    const intervention = screen.getByPlaceholderText('Ex: 2');
    const rendu = screen.getByPlaceholderText('Ex: 4');

    expect(prix.compareDocumentPosition(intervention) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(intervention.compareDocumentPosition(rendu) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('affiche les noms de téléchargement calculés par le backend', async () => {
    (demandeDevisApi.getDemandeDetail as ReturnType<typeof vi.fn>).mockResolvedValue({
      demande: { ...MOCK_DEMANDE, documentsDevis: [
        { id: 12, nomTelechargement: 'DUPONT_JEAN-G1_ES_PGC-DOCS_CLIENT_1.pdf' },
        { id: 13, nomTelechargement: 'DUPONT_JEAN-G1_ES_PGC-DOCS_CLIENT_2.png' },
      ] }, propositions: [], bureauEtudeId: MOCK_BUREAU.id,
    });

    renderRequestDetail();

    expect(await screen.findByText('DUPONT_JEAN-G1_ES_PGC-DOCS_CLIENT_1.pdf')).toBeTruthy();
    expect(screen.getByText('DUPONT_JEAN-G1_ES_PGC-DOCS_CLIENT_2.png')).toBeTruthy();
  });
});

describe('BERequestDetail — validation du formulaire de proposition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (demandeDevisApi.getDemandeDetail as ReturnType<typeof vi.fn>).mockResolvedValue({ demande: MOCK_DEMANDE, propositions: [], bureauEtudeId: MOCK_BUREAU.id });
    (propositionDevisApi.createPropositionDevis as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 99 });
    (documentApi.uploadDocument as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 77 });
  });

  /**
   * Le bouton "SOUMETTRE MON OFFRE" est de type "button" → il ouvre directement la modale.
   * La validation react-hook-form s'exécute à la confirmation dans la modale.
   * Si le formulaire est invalide, onSubmit n'est pas appelé et les erreurs apparaissent dans le formulaire.
   */

  it('ouvre toujours la modale de confirmation au clic sur "SOUMETTRE"', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    await screen.findByPlaceholderText('Ex: 4200');

    // Prix vide → modale s'ouvre quand même
    await user.click(screen.getByRole('button', { name: /soumettre mon offre/i }));

    expect(await screen.findByText('Confirmer la soumission')).toBeTruthy();
  });

  it('n\'appelle pas createPropositionDevis si le prix est vide après confirmation', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    await screen.findByPlaceholderText('Ex: 4200');

    // Laisser le prix vide, remplir le reste
    await user.type(screen.getByPlaceholderText('Ex: 4'), '4');
    await user.type(screen.getByPlaceholderText('Ex: 2'), '2');

    // Ouvrir la modale et confirmer
    await user.click(screen.getByRole('button', { name: /soumettre mon offre/i }));
    await screen.findByText('Confirmer la soumission');
    await user.click(screen.getByRole('button', { name: /^soumettre$/i }));

    await waitFor(() => {
      expect(propositionDevisApi.createPropositionDevis).not.toHaveBeenCalled();
    });
  });

  it('affiche "Doit être > 0" si le prix est 0 après confirmation', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    await screen.findByPlaceholderText('Ex: 4200');

    await user.type(screen.getByPlaceholderText('Ex: 4200'), '0');
    await user.type(screen.getByPlaceholderText('Ex: 4'), '4');
    await user.type(screen.getByPlaceholderText('Ex: 2'), '2');

    await user.click(screen.getByRole('button', { name: /soumettre mon offre/i }));
    await screen.findByText('Confirmer la soumission');
    await user.click(screen.getByRole('button', { name: /^soumettre$/i }));

    expect(await screen.findByText('Doit être > 0')).toBeTruthy();
    expect(propositionDevisApi.createPropositionDevis).not.toHaveBeenCalled();
  });

  it('n\'appelle pas createPropositionDevis si le délai de rendu est vide après confirmation', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    await screen.findByPlaceholderText('Ex: 4200');

    await user.type(screen.getByPlaceholderText('Ex: 4200'), '4200');
    // délai rendu non renseigné
    await user.type(screen.getByPlaceholderText('Ex: 2'), '2');

    await user.click(screen.getByRole('button', { name: /soumettre mon offre/i }));
    await screen.findByText('Confirmer la soumission');
    await user.click(screen.getByRole('button', { name: /^soumettre$/i }));

    await waitFor(() => {
      expect(propositionDevisApi.createPropositionDevis).not.toHaveBeenCalled();
    });
  });

  it('affiche "Minimum 1 semaine" si délai rendu < 1 après confirmation', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    await screen.findByPlaceholderText('Ex: 4200');

    await user.type(screen.getByPlaceholderText('Ex: 4200'), '4200');
    await user.type(screen.getByPlaceholderText('Ex: 4'), '0'); // invalide
    await user.type(screen.getByPlaceholderText('Ex: 2'), '2');

    await user.click(screen.getByRole('button', { name: /soumettre mon offre/i }));
    await screen.findByText('Confirmer la soumission');
    await user.click(screen.getByRole('button', { name: /^soumettre$/i }));

    expect(await screen.findByText('Minimum 1 semaine')).toBeTruthy();
  });

  it('n\'appelle pas createPropositionDevis si le délai d\'intervention est vide après confirmation', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    await screen.findByPlaceholderText('Ex: 4200');

    await user.type(screen.getByPlaceholderText('Ex: 4200'), '4200');
    await user.type(screen.getByPlaceholderText('Ex: 4'), '4');
    // délai intervention non renseigné

    await user.click(screen.getByRole('button', { name: /soumettre mon offre/i }));
    await screen.findByText('Confirmer la soumission');
    await user.click(screen.getByRole('button', { name: /^soumettre$/i }));

    await waitFor(() => {
      expect(propositionDevisApi.createPropositionDevis).not.toHaveBeenCalled();
    });
  });

  it('soumet la proposition après confirmation de la modale avec données valides', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    await screen.findByPlaceholderText('Ex: 4200');

    await user.type(screen.getByPlaceholderText('Ex: 4200'), '4200');
    await user.type(screen.getByPlaceholderText('Ex: 4'), '4');
    await user.type(screen.getByPlaceholderText('Ex: 2'), '2');
    await user.upload(
      screen.getByLabelText(/devis pdf/i),
      new File(['devis'], 'devis.pdf', { type: 'application/pdf' }),
    );
    await user.click(screen.getByRole('button', { name: /soumettre mon offre/i }));

    await screen.findByText('Confirmer la soumission');

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
          documentId: 77,
        })
      );
    });
  });

  it('accepte un prix minimum de 0.01 comme valide', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    await screen.findByPlaceholderText('Ex: 4200');

    await user.type(screen.getByPlaceholderText('Ex: 4200'), '0.01');
    await user.type(screen.getByPlaceholderText('Ex: 4'), '4');
    await user.type(screen.getByPlaceholderText('Ex: 2'), '2');
    await user.upload(
      screen.getByLabelText(/devis pdf/i),
      new File(['devis'], 'devis.pdf', { type: 'application/pdf' }),
    );
    await user.click(screen.getByRole('button', { name: /soumettre mon offre/i }));

    expect(await screen.findByText('Confirmer la soumission')).toBeTruthy();

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

  it('refuse la soumission sans devis PDF', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    await user.type(await screen.findByPlaceholderText('Ex: 4200'), '4200');
    await user.type(screen.getByPlaceholderText('Ex: 4'), '4');
    await user.type(screen.getByPlaceholderText('Ex: 2'), '2');
    await user.click(screen.getByRole('button', { name: /soumettre mon offre/i }));

    expect(await screen.findByText('Le devis PDF est obligatoire.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /^soumettre$/i }));

    await waitFor(() => {
      expect(documentApi.uploadDocument).not.toHaveBeenCalled();
      expect(propositionDevisApi.createPropositionDevis).not.toHaveBeenCalled();
    });
  });

  it('permet de retirer le devis PDF sélectionné', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    const pdfInput = await screen.findByLabelText(/devis pdf/i) as HTMLInputElement;
    await user.upload(pdfInput, new File(['devis'], 'devis.pdf', { type: 'application/pdf' }));

    expect(screen.getByText('devis.pdf')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Retirer le devis PDF sélectionné' }));

    expect(screen.queryByText('devis.pdf')).toBeNull();
    expect(screen.getByText(/joindre un fichier pdf/i)).toBeTruthy();
  });

  it('refuse un délai d’intervention supérieur au délai de rendu', async () => {
    const user = userEvent.setup();
    renderRequestDetail();

    await user.type(await screen.findByPlaceholderText('Ex: 4200'), '4200');
    await user.type(screen.getByPlaceholderText('Ex: 4'), '4');
    await user.type(screen.getByPlaceholderText('Ex: 2'), '5');
    await user.upload(
      screen.getByLabelText(/devis pdf/i),
      new File(['devis'], 'devis.pdf', { type: 'application/pdf' }),
    );
    await user.click(screen.getByRole('button', { name: /soumettre mon offre/i }));
    await user.click(screen.getByRole('button', { name: /^soumettre$/i }));

    expect(await screen.findByText("Le délai de rendu ne peut pas être inférieur au délai d'intervention.")).toBeTruthy();
    expect(propositionDevisApi.createPropositionDevis).not.toHaveBeenCalled();
  });
});


