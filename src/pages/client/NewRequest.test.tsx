import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import NewRequest from './NewRequest';
import * as referentielApi from '../../api/referentiel';
import * as demandeDevisApi from '../../api/demandeDevis';
import * as clientApi from '../../api/client';
import * as documentApi from '../../api/document';
import * as AuthContextModule from '../../contexts/AuthContext';

// ─── Mocks globaux ────────────────────────────────────────────────────────────

vi.mock('../../api/referentiel');
vi.mock('../../api/demandeDevis');
vi.mock('../../api/client');
vi.mock('../../api/document');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// ─── Données de test ──────────────────────────────────────────────────────────

const MOCK_TYPES = [
  { code: 'G0', libelle: 'G0 — Étude préalable' },
  { code: 'G2_PRO', libelle: 'G2 PRO — Projet' },
];

const MOCK_USER = { userId: 1, token: 'tok', role: 'CLIENT' as const, email: 'c@test.com' };
const MOCK_CLIENT = { id: 10 };

// ─── Helper de rendu ──────────────────────────────────────────────────────────

function renderNewRequest() {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: MOCK_USER,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  } as ReturnType<typeof AuthContextModule.useAuth>);

  return render(
    <MemoryRouter>
      <NewRequest />
    </MemoryRouter>
  );
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('NewRequest — chargement des types d\'étude', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (demandeDevisApi.createDemandeDevis as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (clientApi.getClientByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_CLIENT);
  });

  it('affiche "Chargement…" dans le select pendant la requête', async () => {
    // Promesse non résolue pour simuler un chargement en cours
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

    renderNewRequest();

    const option = screen.getByText('Chargement…');
    expect(option).toBeTruthy();
    // Le select doit être désactivé
    const select = option.closest('select');
    expect(select).toHaveAttribute('disabled');
  });

  it('affiche les libellés issus de l\'API après chargement', async () => {
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_TYPES);

    renderNewRequest();

    await waitFor(() => {
      expect(screen.getByText('G0 — Étude préalable')).toBeTruthy();
    });
    expect(screen.getByText('G2 PRO — Projet')).toBeTruthy();
  });

  it('retire le disabled du select après chargement', async () => {
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_TYPES);

    renderNewRequest();

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).not.toHaveAttribute('disabled');
    });
  });

  it('utilise le fallback statique (7 types) si l\'API échoue', async () => {
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('API down')
    );

    renderNewRequest();

    await waitFor(() => {
      expect(screen.getByText('G5 — Diagnostic')).toBeTruthy();
    });

    const options = screen.getAllByRole('option');
    // 1 option placeholder "Sélectionner…" + 7 types
    expect(options).toHaveLength(8);
  });

  it('affiche "Sélectionner…" comme option par défaut après chargement', async () => {
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_TYPES);

    renderNewRequest();

    await waitFor(() => {
      expect(screen.getByText('Sélectionner…')).toBeTruthy();
    });
  });
});

describe('NewRequest — soumission du formulaire', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_TYPES);
    (clientApi.getClientByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_CLIENT);
    (demandeDevisApi.createDemandeDevis as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (documentApi.uploadDocuments as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  it('soumet le formulaire et navigue vers /client/dashboard', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    // Attendre le chargement des types
    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    // Remplir les champs requis
    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');

    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(demandeDevisApi.createDemandeDevis).toHaveBeenCalledOnce();
      expect(mockNavigate).toHaveBeenCalledWith('/client/dashboard');
    });
  });

  it('affiche un message d\'erreur si la création échoue', async () => {
    const user = userEvent.setup();
    (demandeDevisApi.createDemandeDevis as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Erreur serveur')
    );

    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');

    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(screen.getByText('Erreur serveur')).toBeTruthy();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigue vers /client/dashboard au clic sur Annuler', async () => {
    const user = userEvent.setup();
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_TYPES);

    renderNewRequest();

    await user.click(screen.getByRole('button', { name: /annuler/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/client/dashboard');
  });

  it('transmet le clientId récupéré depuis l\'API', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G2 PRO — Projet'));

    await user.selectOptions(screen.getByRole('combobox'), 'G2_PRO');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '5 Boulevard Haussmann');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '69000');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Lyon');

    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(demandeDevisApi.createDemandeDevis).toHaveBeenCalledWith(
        expect.objectContaining({ clientId: 10, type: 'G2_PRO' })
      );
    });
  });

  it('envoie referencesCadastrales comme tableau vide si aucune référence saisie', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');

    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(demandeDevisApi.createDemandeDevis).toHaveBeenCalledWith(
        expect.objectContaining({ referencesCadastrales: [] })
      );
    });
  });

  it('envoie une seule référence cadastrale saisie dans le tableau', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText('Ex : AB 0042'), 'AB 0042');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');

    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(demandeDevisApi.createDemandeDevis).toHaveBeenCalledWith(
        expect.objectContaining({ referencesCadastrales: ['AB 0042'] })
      );
    });
  });

  it('envoie plusieurs références cadastrales après ajout dynamique', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    // Saisir la première référence
    const [firstInput] = screen.getAllByPlaceholderText('Ex : AB 0042');
    await user.type(firstInput, 'AB 0042');

    // Ajouter une deuxième référence
    await user.click(screen.getByRole('button', { name: /ajouter une référence/i }));

    const inputs = screen.getAllByPlaceholderText('Ex : AB 0042');
    expect(inputs).toHaveLength(2);
    await user.type(inputs[1], 'CD 0099');

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');

    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(demandeDevisApi.createDemandeDevis).toHaveBeenCalledWith(
        expect.objectContaining({ referencesCadastrales: ['AB 0042', 'CD 0099'] })
      );
    });
  });

  it('ne pas envoyer referenceCadastrale (ancien champ singulier)', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');

    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      const payload = (demandeDevisApi.createDemandeDevis as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(payload).not.toHaveProperty('referenceCadastrale');
    });
  });

  it('upload les documents joints avant de créer la demande', async () => {
    const user = userEvent.setup();
    (documentApi.uploadDocuments as ReturnType<typeof vi.fn>).mockResolvedValue([99, 100]);

    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    // Sélectionner plusieurs fichiers fictifs
    const files = [
      new File(['content'], 'plan.pdf', { type: 'application/pdf' }),
      new File(['image'], 'photo.png', { type: 'image/png' }),
    ];
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, files);

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');

    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(documentApi.uploadDocuments).toHaveBeenCalledWith(files);
      expect(demandeDevisApi.createDemandeDevis).toHaveBeenCalledWith(
        expect.objectContaining({ docsDevisIds: [99, 100] })
      );
    });
  });

  it('envoie docsDevisIds vide si aucun document n\'est sélectionné', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');

    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(documentApi.uploadDocuments).toHaveBeenCalledWith([]);
      expect(demandeDevisApi.createDemandeDevis).toHaveBeenCalledWith(
        expect.objectContaining({ docsDevisIds: [] })
      );
    });
  });

  it('affiche un bouton + pour ajouter d\'autres fichiers après sélection', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    const file = new File(['content'], 'plan.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('plan.pdf')).toBeTruthy();
      expect(screen.getByRole('button', { name: /ajouter d\'autres fichiers/i })).toBeTruthy();
    });
  });

  it('ajoute des fichiers supplémentaires via le bouton +', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    const file1 = new File(['content1'], 'plan.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file1);

    await waitFor(() => {
      expect(screen.getByText('plan.pdf')).toBeTruthy();
    });

    const file2 = new File(['content2'], 'photo.png', { type: 'image/png' });
    await user.click(screen.getByRole('button', { name: /ajouter d\'autres fichiers/i }));
    await user.upload(fileInput, file2);

    await waitFor(() => {
      expect(screen.getByText('plan.pdf')).toBeTruthy();
      expect(screen.getByText('photo.png')).toBeTruthy();
    });
  });

  it('supprime un fichier au clic sur le bouton ✕ individuel', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    const file1 = new File(['content1'], 'plan.pdf', { type: 'application/pdf' });
    const file2 = new File(['content2'], 'photo.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file1);

    await waitFor(() => expect(screen.getByText('plan.pdf')).toBeTruthy());

    await user.click(screen.getByRole('button', { name: /ajouter d\'autres fichiers/i }));
    await user.upload(fileInput, file2);

    await waitFor(() => {
      expect(screen.getByText('plan.pdf')).toBeTruthy();
      expect(screen.getByText('photo.png')).toBeTruthy();
    });

    const deleteButtons = screen.getAllByLabelText(/^Supprimer /);
    expect(deleteButtons).toHaveLength(2);

    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('plan.pdf')).toBeNull();
      expect(screen.getByText('photo.png')).toBeTruthy();
    });
  });

  it('permet de re-ajouter un fichier après suppression', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    const file = new File(['content'], 'plan.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Ajouter un fichier
    await user.upload(fileInput, file);
    await waitFor(() => expect(screen.getByText('plan.pdf')).toBeTruthy());

    // Supprimer le fichier
    const deleteButton = screen.getByLabelText('Supprimer plan.pdf');
    await user.click(deleteButton);
    await waitFor(() => expect(screen.queryByText('plan.pdf')).toBeNull());

    // Re-ajouter le même fichier (doit fonctionner)
    // Après suppression du dernier fichier, on revient au bouton initial
    const addFileDiv = screen.getByText(/Joindre un ou plusieurs fichiers/i);
    await user.click(addFileDiv);
    await user.upload(fileInput, file);

    // Vérifier que le fichier apparaît à nouveau
    await waitFor(() => {
      expect(screen.getByText('plan.pdf')).toBeTruthy();
    });
  });

});




describe('NewRequest — champ délai maximum souhaité (semaines)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_TYPES);
    (clientApi.getClientByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_CLIENT);
    (demandeDevisApi.createDemandeDevis as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  it('affiche le label "Délai maximum souhaité (semaines)"', async () => {
    renderNewRequest();
    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    expect(screen.getByText(/délai maximum souhaité \(semaines\)/i)).toBeTruthy();
  });

  it('envoie delaiMaxSouhaite comme nombre quand une valeur est saisie', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');
    await user.type(screen.getByPlaceholderText('Ex : 8'), '6');

    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(demandeDevisApi.createDemandeDevis).toHaveBeenCalledWith(
        expect.objectContaining({ delaiMaxSouhaite: 6 })
      );
    });
  });

  it("n'envoie pas delaiMaxSouhaite si le champ est laissé vide", async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');
    // champ délai non renseigné

    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      const payload = (demandeDevisApi.createDemandeDevis as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(payload.delaiMaxSouhaite).toBeUndefined();
    });
  });

  it("n'utilise plus le champ delaiMax (ancienne date)", async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');

    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      const payload = (demandeDevisApi.createDemandeDevis as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(payload).not.toHaveProperty('delaiMax');
    });
  });
});

describe('NewRequest — références cadastrales dynamiques', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_TYPES);
    (clientApi.getClientByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_CLIENT);
    (demandeDevisApi.createDemandeDevis as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  it('affiche un input de référence cadastrale par défaut', async () => {
    renderNewRequest();

    const inputs = screen.getAllByPlaceholderText('Ex : AB 0042');
    expect(inputs).toHaveLength(1);
  });

  it('n\'affiche pas le bouton supprimer quand il n\'y a qu\'un seul input', async () => {
    renderNewRequest();

    expect(screen.queryByTitle('Supprimer')).toBeNull();
  });

  it('ajoute un nouvel input au clic sur "Ajouter une référence"', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await user.click(screen.getByRole('button', { name: /ajouter une référence/i }));

    const inputs = screen.getAllByPlaceholderText('Ex : AB 0042');
    expect(inputs).toHaveLength(2);
  });

  it('affiche le bouton supprimer quand il y a plusieurs inputs', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await user.click(screen.getByRole('button', { name: /ajouter une référence/i }));

    const deleteButtons = screen.getAllByTitle('Supprimer');
    expect(deleteButtons).toHaveLength(2);
  });

  it('supprime un input au clic sur le bouton supprimer', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    // Ajouter une deuxième référence
    await user.click(screen.getByRole('button', { name: /ajouter une référence/i }));
    expect(screen.getAllByPlaceholderText('Ex : AB 0042')).toHaveLength(2);

    // Supprimer la première
    const [firstDelete] = screen.getAllByTitle('Supprimer');
    await user.click(firstDelete);

    expect(screen.getAllByPlaceholderText('Ex : AB 0042')).toHaveLength(1);
  });

  it('masque le bouton supprimer quand il ne reste plus qu\'un input', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await user.click(screen.getByRole('button', { name: /ajouter une référence/i }));
    const [firstDelete] = screen.getAllByTitle('Supprimer');
    await user.click(firstDelete);

    expect(screen.queryByTitle('Supprimer')).toBeNull();
  });

  it('filtre les références vides avant la soumission', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    // Ajouter une deuxième référence mais ne rien saisir dedans
    await user.click(screen.getByRole('button', { name: /ajouter une référence/i }));

    const [firstInput] = screen.getAllByPlaceholderText('Ex : AB 0042');
    await user.type(firstInput, 'AB 0042');

    // Remplir les champs requis et soumettre
    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');
    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(demandeDevisApi.createDemandeDevis).toHaveBeenCalledWith(
        expect.objectContaining({ referencesCadastrales: ['AB 0042'] })
      );
    });
  });
});

// ─── Validation des champs obligatoires ───────────────────────────────────────

describe('NewRequest — validation des champs obligatoires', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_TYPES);
    (clientApi.getClientByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_CLIENT);
    (demandeDevisApi.createDemandeDevis as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  it('n\'appelle pas createDemandeDevis si le type n\'est pas sélectionné', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    // Remplir tout sauf le type
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');
    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(screen.getByText('Ce champ est requis')).toBeTruthy();
    });
    expect(demandeDevisApi.createDemandeDevis).not.toHaveBeenCalled();
  });

  it('n\'appelle pas createDemandeDevis si la rue est vide', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    // Rue non renseignée
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');
    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(demandeDevisApi.createDemandeDevis).not.toHaveBeenCalled();
    });
  });

  it('n\'appelle pas createDemandeDevis si la ville est vide', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    // Ville non renseignée
    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(demandeDevisApi.createDemandeDevis).not.toHaveBeenCalled();
    });
  });

  it('envoie l\'adresse du projet dans la charge utile', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '42 Rue Oberkampf');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75011');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');
    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(demandeDevisApi.createDemandeDevis).toHaveBeenCalledWith(
        expect.objectContaining({
          adresseProjet: { rue: '42 Rue Oberkampf', codePostal: '75011', ville: 'Paris' },
        })
      );
    });
  });
});

describe('NewRequest — validation du code postal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_TYPES);
    (clientApi.getClientByUserId as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_CLIENT);
    (demandeDevisApi.createDemandeDevis as ReturnType<typeof vi.fn>).mockResolvedValue({});
  });

  it('affiche "Requis" si le code postal est vide', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    // Code postal non renseigné
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');
    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(screen.getByText('Requis')).toBeTruthy();
    });
    expect(demandeDevisApi.createDemandeDevis).not.toHaveBeenCalled();
  });

  it('affiche "5 chiffres requis" si le code postal ne fait pas 5 chiffres', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '750'); // invalide
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');
    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(screen.getByText('5 chiffres requis')).toBeTruthy();
    });
    expect(demandeDevisApi.createDemandeDevis).not.toHaveBeenCalled();
  });

  it('affiche une erreur si le code postal contient des lettres', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), 'ABCDE'); // invalide
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');
    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(screen.getByText('5 chiffres requis')).toBeTruthy();
    });
    expect(demandeDevisApi.createDemandeDevis).not.toHaveBeenCalled();
  });

  it('n\'appelle pas createDemandeDevis si le code postal est vide', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    // Code postal non renseigné
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');
    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(demandeDevisApi.createDemandeDevis).not.toHaveBeenCalled();
    });
  });

  it('accepte un code postal valide à 5 chiffres et soumet', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '13001'); // valide
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Marseille');
    await user.click(screen.getByRole('button', { name: /créer la demande/i }));

    await waitFor(() => {
      expect(demandeDevisApi.createDemandeDevis).toHaveBeenCalledOnce();
    });
  });

  it('bloque la soumission si superficie négative', async () => {
    const user = userEvent.setup();
    renderNewRequest();
    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');
    const superficieInput = screen.getByPlaceholderText('Ex : 500') as HTMLInputElement;
    superficieInput.value = '-10';
    fireEvent.input(superficieInput);
    await user.click(screen.getByRole('button', { name: /créer la demande/i }));
    await waitFor(() => {
      expect(demandeDevisApi.createDemandeDevis).not.toHaveBeenCalled();
    });
  });

  it('bloque la soumission si nombre de lots négatif', async () => {
    const user = userEvent.setup();
    renderNewRequest();
    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');
    const lotsInput = screen.getByPlaceholderText('Ex : 1') as HTMLInputElement;
    lotsInput.value = '-2';
    fireEvent.input(lotsInput);
    await user.click(screen.getByRole('button', { name: /créer la demande/i }));
    await waitFor(() => {
      expect(demandeDevisApi.createDemandeDevis).not.toHaveBeenCalled();
    });
  });

  it('bloque la soumission si description > 2000 caractères', async () => {
    const user = userEvent.setup();
    renderNewRequest();
    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');
    const descInput = screen.getByPlaceholderText(/terrain en pente/i) as HTMLTextAreaElement;
    const longDesc = 'A'.repeat(2001);
    descInput.value = longDesc;
    fireEvent.input(descInput);
    fireEvent.blur(descInput);
    await user.click(screen.getByRole('button', { name: /créer la demande/i }));
    await waitFor(() => {
      expect(screen.getByText('La description ne doit pas dépasser 2000 caractères')).toBeTruthy();
    });
    expect(demandeDevisApi.createDemandeDevis).not.toHaveBeenCalled();
  });
});

