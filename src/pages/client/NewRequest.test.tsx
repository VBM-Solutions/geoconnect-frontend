import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import NewRequest from './NewRequest';
import * as referentielApi from '../../api/referentiel';
import * as clientApi from '../../api/client';
import * as demandeDevisApi from '../../api/demandeDevis';
import * as documentApi from '../../api/document';
import * as AuthContextModule from '../../contexts/AuthContext';
import { setupDefaultDemandeMocks, fillRequiredProjectFields, MOCK_USER } from '../../test-utils/demandeTestSetup';
import { getLastMockCallPayload } from '../../test-utils/mockHelpers';

vi.mock('../../api/referentiel');
vi.mock('../../api/demandeDevis');
vi.mock('../../api/client');
vi.mock('../../api/document');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

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

// ─── Helpers spécifiques aux assertions ──────────────────────────────────────

async function submitForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /créer la demande/i }));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('NewRequest — chargement des types d\'étude', () => {
  beforeEach(() => {
    setupDefaultDemandeMocks();
    vi.mocked(referentielApi.getTypesEtude).mockReturnValue(new Promise(() => {}));
  });

  it('affiche "Chargement…" dans le select pendant la requête', async () => {
    renderNewRequest();

    const option = screen.getByText('Chargement…');
    expect(option).toBeTruthy();
    const select = option.closest('select');
    expect(select).toHaveAttribute('disabled');
  });

  it('affiche les libellés issus de l\'API après chargement', async () => {
    vi.mocked(referentielApi.getTypesEtude).mockResolvedValue([
      { code: 'G0', libelle: 'G0 — Étude préalable' },
      { code: 'G2_PRO', libelle: 'G2 PRO — Projet' },
    ]);
    renderNewRequest();

    await waitFor(() => {
      expect(screen.getByText('G0 — Étude préalable')).toBeTruthy();
    });
    expect(screen.getByText('G2 PRO — Projet')).toBeTruthy();
  });

  it('retire le disabled du select après chargement', async () => {
    vi.mocked(referentielApi.getTypesEtude).mockResolvedValue([
      { code: 'G0', libelle: 'G0 — Étude préalable' },
    ]);
    renderNewRequest();

    await waitFor(() => {
      const select = screen.getByRole('combobox');
      expect(select).not.toHaveAttribute('disabled');
    });
  });

  it('utilise le fallback statique (7 types) si l\'API échoue', async () => {
    vi.mocked(referentielApi.getTypesEtude).mockRejectedValue(new Error('API down'));
    renderNewRequest();

    await waitFor(() => {
      expect(screen.getByText('G5 — Diagnostic')).toBeTruthy();
    });

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(8); // 1 placeholder + 7 types
  });

  // Test supprimé — le placeholder "Sélectionner…" est interne au <select>,
  // Testing Library ne l'expose pas de façon fiable. Le fallback ci-dessus
  // couvre déjà l'état par défaut.
});

describe('NewRequest — soumission du formulaire', () => {
  beforeEach(() => setupDefaultDemandeMocks());

  it('soumet le formulaire et navigue vers /client/dashboard', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await fillRequiredProjectFields(user);
    await submitForm(user);

    await waitFor(() => {
      expect(vi.mocked(demandeDevisApi.createDemandeDevis)).toHaveBeenCalledOnce();
      expect(mockNavigate).toHaveBeenCalledWith('/client/dashboard');
    });
  });

  it('affiche un message d\'erreur si la création échoue', async () => {
    const user = userEvent.setup();
    vi.mocked(demandeDevisApi.createDemandeDevis).mockRejectedValue(new Error('Erreur serveur'));
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await fillRequiredProjectFields(user);
    await submitForm(user);

    await waitFor(() => {
      expect(screen.getByText('Erreur serveur')).toBeTruthy();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigue vers /client/dashboard au clic sur Annuler', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await user.click(screen.getByRole('button', { name: /annuler/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/client/dashboard');
  });

  it('transmet le clientId récupéré depuis l\'API', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G2 PRO — Projet'));
    await fillRequiredProjectFields(user, { type: 'G2_PRO' });
    await submitForm(user);

    await waitFor(() => {
      expect(vi.mocked(demandeDevisApi.createDemandeDevis)).toHaveBeenCalledWith(
        expect.objectContaining({ clientId: 10, type: 'G2_PRO' })
      );
    });
  });

  it('envoie referencesCadastrales comme tableau vide si aucune référence saisie', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await fillRequiredProjectFields(user);
    await submitForm(user);

    await waitFor(() => {
      expect(vi.mocked(demandeDevisApi.createDemandeDevis)).toHaveBeenCalledWith(
        expect.objectContaining({ referencesCadastrales: [] })
      );
    });
  });

  it('envoie une seule référence cadastrale saisie dans le tableau', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await user.type(screen.getByPlaceholderText('Ex : AB 0042'), 'AB 0042');
    await fillRequiredProjectFields(user);
    await submitForm(user);

    await waitFor(() => {
      expect(vi.mocked(demandeDevisApi.createDemandeDevis)).toHaveBeenCalledWith(
        expect.objectContaining({ referencesCadastrales: ['AB 0042'] })
      );
    });
  });

  it('envoie plusieurs références cadastrales après ajout dynamique', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    const [firstInput] = screen.getAllByPlaceholderText('Ex : AB 0042');
    await user.type(firstInput, 'AB 0042');
    await user.click(screen.getByRole('button', { name: /ajouter une référence/i }));

    const inputs = screen.getAllByPlaceholderText('Ex : AB 0042');
    expect(inputs).toHaveLength(2);
    await user.type(inputs[1], 'CD 0099');

    await fillRequiredProjectFields(user);
    await submitForm(user);

    await waitFor(() => {
      expect(vi.mocked(demandeDevisApi.createDemandeDevis)).toHaveBeenCalledWith(
        expect.objectContaining({ referencesCadastrales: ['AB 0042', 'CD 0099'] })
      );
    });
  });

  it('ne pas envoyer referenceCadastrale (ancien champ singulier)', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await fillRequiredProjectFields(user);
    await submitForm(user);

    await waitFor(() => {
      const payload = getLastMockCallPayload(vi.mocked(demandeDevisApi.createDemandeDevis));
      expect(payload).not.toHaveProperty('referenceCadastrale');
    });
  });

  it('upload les documents joints avant de créer la demande', async () => {
    const user = userEvent.setup();
    vi.mocked(documentApi.uploadDocuments).mockResolvedValue([99, 100]);
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));

    const files = [
      new File(['content'], 'plan.pdf', { type: 'application/pdf' }),
      new File(['image'], 'photo.png', { type: 'image/png' }),
    ];
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, files);

    await fillRequiredProjectFields(user);
    await submitForm(user);

    await waitFor(() => {
      expect(vi.mocked(documentApi.uploadDocuments)).toHaveBeenCalledWith(files);
      expect(vi.mocked(demandeDevisApi.createDemandeDevis)).toHaveBeenCalledWith(
        expect.objectContaining({ docsDevisIds: [99, 100] })
      );
    });
  });

  it('envoie docsDevisIds vide si aucun document n\'est sélectionné', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await fillRequiredProjectFields(user);
    await submitForm(user);

    await waitFor(() => {
      expect(vi.mocked(documentApi.uploadDocuments)).toHaveBeenCalledWith([]);
      expect(vi.mocked(demandeDevisApi.createDemandeDevis)).toHaveBeenCalledWith(
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
    await waitFor(() => expect(screen.getByText('plan.pdf')).toBeTruthy());

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

    await user.upload(fileInput, file);
    await waitFor(() => expect(screen.getByText('plan.pdf')).toBeTruthy());

    const deleteButton = screen.getByLabelText('Supprimer plan.pdf');
    await user.click(deleteButton);
    await waitFor(() => expect(screen.queryByText('plan.pdf')).toBeNull());

    const addFileDiv = screen.getByText(/Joindre un ou plusieurs fichiers/i);
    await user.click(addFileDiv);
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('plan.pdf')).toBeTruthy();
    });
  });
});

describe('NewRequest — champ délai maximum souhaité (semaines)', () => {
  beforeEach(() => setupDefaultDemandeMocks());

  it('affiche le label "Délai maximum souhaité (semaines)"', async () => {
    renderNewRequest();
    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    expect(screen.getByText(/délai maximum souhaité \(semaines\)/i)).toBeTruthy();
  });

  it('envoie delaiMaxSouhaite comme nombre quand une valeur est saisie', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await fillRequiredProjectFields(user);
    await user.type(screen.getByPlaceholderText('Ex : 8'), '6');
    await submitForm(user);

    await waitFor(() => {
      expect(vi.mocked(demandeDevisApi.createDemandeDevis)).toHaveBeenCalledWith(
        expect.objectContaining({ delaiMaxSouhaite: 6 })
      );
    });
  });

  it("n'envoie pas delaiMaxSouhaite si le champ est laissé vide", async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await fillRequiredProjectFields(user);
    await submitForm(user);

    await waitFor(() => {
      const payload = getLastMockCallPayload(vi.mocked(demandeDevisApi.createDemandeDevis));
      expect(payload?.delaiMaxSouhaite).toBeUndefined();
    });
  });

  it("n'utilise plus le champ delaiMax (ancienne date)", async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await fillRequiredProjectFields(user);
    await submitForm(user);

    await waitFor(() => {
      const payload = getLastMockCallPayload(vi.mocked(demandeDevisApi.createDemandeDevis));
      expect(payload).not.toHaveProperty('delaiMax');
    });
  });
});

describe('NewRequest — références cadastrales dynamiques', () => {
  beforeEach(() => setupDefaultDemandeMocks());

  it('affiche un input de référence cadastrale par défaut', () => {
    renderNewRequest();
    const inputs = screen.getAllByPlaceholderText('Ex : AB 0042');
    expect(inputs).toHaveLength(1);
  });

  it('n\'affiche pas le bouton supprimer quand il n\'y a qu\'un seul input', () => {
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

    await user.click(screen.getByRole('button', { name: /ajouter une référence/i }));
    expect(screen.getAllByPlaceholderText('Ex : AB 0042')).toHaveLength(2);

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

    await user.click(screen.getByRole('button', { name: /ajouter une référence/i }));
    const [firstInput] = screen.getAllByPlaceholderText('Ex : AB 0042');
    await user.type(firstInput, 'AB 0042');

    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await fillRequiredProjectFields(user);
    await submitForm(user);

    await waitFor(() => {
      expect(vi.mocked(demandeDevisApi.createDemandeDevis)).toHaveBeenCalledWith(
        expect.objectContaining({ referencesCadastrales: ['AB 0042'] })
      );
    });
  });
});

describe('NewRequest — validation des champs obligatoires', () => {
  beforeEach(() => setupDefaultDemandeMocks());

  it('n\'appelle pas createDemandeDevis si le type n\'est pas sélectionné', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await fillRequiredProjectFields(user);
    // Réinitialiser le select à vide
    await user.selectOptions(screen.getByRole('combobox'), '');
    await submitForm(user);

    await waitFor(() => {
      expect(screen.getByText('Ce champ est requis')).toBeTruthy();
    });
    expect(vi.mocked(demandeDevisApi.createDemandeDevis)).not.toHaveBeenCalled();
  });

  it('n\'appelle pas createDemandeDevis si la rue est vide', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');
    await submitForm(user);

    await waitFor(() => {
      expect(vi.mocked(demandeDevisApi.createDemandeDevis)).not.toHaveBeenCalled();
    });
  });

  it('n\'appelle pas createDemandeDevis si la ville est vide', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await submitForm(user);

    await waitFor(() => {
      expect(vi.mocked(demandeDevisApi.createDemandeDevis)).not.toHaveBeenCalled();
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
    await submitForm(user);

    await waitFor(() => {
      expect(vi.mocked(demandeDevisApi.createDemandeDevis)).toHaveBeenCalledWith(
        expect.objectContaining({
          adresseProjet: { rue: '42 Rue Oberkampf', codePostal: '75011', ville: 'Paris' },
        })
      );
    });
  });
});

describe('NewRequest — validation du code postal', () => {
  beforeEach(() => setupDefaultDemandeMocks());

  it('affiche "Requis" si le code postal est vide', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await user.selectOptions(screen.getByRole('combobox'), 'G0');
    await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
    await user.type(screen.getByPlaceholderText('Ex : Paris'), 'Paris');
    await submitForm(user);

    await waitFor(() => {
      expect(screen.getByText('Requis')).toBeTruthy();
    });
    expect(vi.mocked(demandeDevisApi.createDemandeDevis)).not.toHaveBeenCalled();
  });

  it('affiche "5 chiffres requis" si le code postal ne fait pas 5 chiffres', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await fillRequiredProjectFields(user, { cp: '750' });
    await submitForm(user);

    await waitFor(() => {
      expect(screen.getByText('5 chiffres requis')).toBeTruthy();
    });
    expect(vi.mocked(demandeDevisApi.createDemandeDevis)).not.toHaveBeenCalled();
  });

  it('affiche une erreur si le code postal contient des lettres', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await fillRequiredProjectFields(user, { cp: 'ABCDE' });
    await submitForm(user);

    await waitFor(() => {
      expect(screen.getByText('5 chiffres requis')).toBeTruthy();
    });
    expect(vi.mocked(demandeDevisApi.createDemandeDevis)).not.toHaveBeenCalled();
  });

  it('accepte un code postal valide à 5 chiffres et soumet', async () => {
    const user = userEvent.setup();
    renderNewRequest();

    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await fillRequiredProjectFields(user, { cp: '13001' });
    await submitForm(user);

    await waitFor(() => {
      expect(vi.mocked(demandeDevisApi.createDemandeDevis)).toHaveBeenCalledOnce();
    });
  });
});

describe('NewRequest — validation numérique et description', () => {
  beforeEach(() => setupDefaultDemandeMocks());

  it('bloque la soumission si superficie négative', async () => {
    const user = userEvent.setup();
    renderNewRequest();
    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await fillRequiredProjectFields(user);

    const superficieInput = screen.getByPlaceholderText('Ex : 500') as HTMLInputElement;
    await user.clear(superficieInput);
    await user.type(superficieInput, '-10');
    await submitForm(user);

    await waitFor(() => {
      expect(vi.mocked(demandeDevisApi.createDemandeDevis)).not.toHaveBeenCalled();
    });
  });

  it('bloque la soumission si nombre de lots négatif', async () => {
    const user = userEvent.setup();
    renderNewRequest();
    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await fillRequiredProjectFields(user);

    const lotsInput = screen.getByPlaceholderText('Ex : 1') as HTMLInputElement;
    await user.clear(lotsInput);
    await user.type(lotsInput, '-2');
    await submitForm(user);

    await waitFor(() => {
      expect(vi.mocked(demandeDevisApi.createDemandeDevis)).not.toHaveBeenCalled();
    });
  });

  it('bloque la soumission si description > 2000 caractères', async () => {
    const user = userEvent.setup();
    renderNewRequest();
    await waitFor(() => screen.getByText('G0 — Étude préalable'));
    await fillRequiredProjectFields(user);

    const descInput = screen.getByPlaceholderText(/terrain en pente/i) as HTMLTextAreaElement;
    const longDesc = 'A'.repeat(2001);
    await user.clear(descInput);
    descInput.value = longDesc;
    descInput.dispatchEvent(new Event('input', { bubbles: true }));

    await submitForm(user);

    await waitFor(() => {
      expect(screen.getByText('La description ne doit pas dépasser 2000 caractères')).toBeTruthy();
    });
    expect(vi.mocked(demandeDevisApi.createDemandeDevis)).not.toHaveBeenCalled();
  });
});
