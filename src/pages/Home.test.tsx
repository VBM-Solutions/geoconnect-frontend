import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';
import * as authApi from '../api/auth';
import * as clientApi from '../api/client';
import * as demandeDevisApi from '../api/demandeDevis';
import * as documentApi from '../api/document';
import * as referentielApi from '../api/referentiel';
import * as addressAutocompleteApi from '../api/addressAutocomplete';
import * as AuthContextModule from '../contexts/AuthContext';
import { setupDefaultDemandeMocks } from '../test-utils/demandeTestSetup';
import { getLastMockCallPayload } from '../test-utils/mockHelpers';

vi.mock('../api/auth');
vi.mock('../api/client');
vi.mock('../api/demandeDevis');
vi.mock('../api/document');
vi.mock('../api/referentiel');
vi.mock('../api/addressAutocomplete');

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const MOCK_AUTH_RESPONSE = {
  userId: 42,
  clientId: 10,
  login: 'client@test.fr',
  status: 'EMAIL_VERIFICATION_REQUIRED' as const,
};

const VALID_PASSWORD = 'MotDePasse!123';
const OTHER_VALID_PASSWORD = 'AutreMotDePasse!123';

function renderHome() {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    logout: vi.fn(),
  } as ReturnType<typeof AuthContextModule.useAuth>);

  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

async function startTunnel(user: ReturnType<typeof userEvent.setup>) {
  renderHome();
  await user.click(screen.getByRole('button', { name: /démarrer ma demande/i }));
  expect(await screen.findByText(/quel est votre besoin/i)).toBeTruthy();
}

async function completeStep1(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByText('G0 — Étude préalable');
  await user.selectOptions(screen.getByRole('combobox'), 'G0');
  await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
  await user.type(screen.getByLabelText('Code Postal *'), '75001');
  await user.type(screen.getByLabelText('Ville *'), 'Paris');
  await user.click(screen.getByRole('button', { name: /continuer ma demande/i }));

  expect(await screen.findByText(/détails du projet/i)).toBeTruthy();
}

async function completeStep2(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByLabelText('Description du projet *'),
    'Maison individuelle avec accès étroit.'
  );
  await user.click(screen.getByRole('button', { name: /suivant/i }));

  expect(await screen.findByText(/vos coordonnées/i)).toBeTruthy();
}

async function fillStep3Required(
  user: ReturnType<typeof userEvent.setup>,
  options?: { password?: string; confirmPassword?: string }
) {
  await user.selectOptions(screen.getByLabelText('Civilité *'), 'MR');
  await user.type(screen.getByLabelText('Prénom *'), 'Jean');
  await user.type(screen.getByLabelText('Nom *'), 'Dupont');
  await user.type(screen.getByPlaceholderText('06 00 00 00 00'), '0612345678');
  await user.type(screen.getByPlaceholderText('12 rue de la République'), '12 Rue de la République');
  await user.type(screen.getByLabelText('Code Postal *'), '75001');
  await user.type(screen.getByLabelText('Ville *'), 'Paris');
  await user.type(screen.getByPlaceholderText('votre@email.com'), 'jean.dupont@test.fr');
  const password = options?.password ?? VALID_PASSWORD;
  await user.type(screen.getByLabelText('Mot de passe *'), password);
  await user.type(
    screen.getByLabelText('Confirmation du mot de passe *'),
    options?.confirmPassword ?? password
  );
}

describe('Home — tunnel utilisateur', () => {
  beforeEach(() => {
    localStorage.clear();
    setupDefaultDemandeMocks();
    vi.mocked(referentielApi.getTypesEtude).mockResolvedValue([
      { code: 'G0', libelle: 'G0 — Étude préalable' },
      { code: 'G1', libelle: 'G1 — Étude de site' },
      { code: 'G2_AVP', libelle: 'G2 AVP — Avant-projet' },
      { code: 'G2_PRO', libelle: 'G2 PRO — Projet' },
      { code: 'G5', libelle: 'Mission G5' },
    ]);
    vi.mocked(authApi.registerClientCall).mockResolvedValue(MOCK_AUTH_RESPONSE);
    vi.mocked(clientApi.getClientByUserId).mockResolvedValue({ id: 10 });
    vi.mocked(demandeDevisApi.createDemandeDevis).mockResolvedValue({});
    vi.mocked(documentApi.uploadDocuments).mockResolvedValue([]);
    vi.mocked(addressAutocompleteApi.searchAddressSuggestions).mockResolvedValue([]);
  });

  it("remplit l'adresse du projet depuis une suggestion officielle", async () => {
    vi.mocked(addressAutocompleteApi.searchAddressSuggestions).mockResolvedValue([
      {
        label: '10 Rue de la Paix 75002 Paris',
        rue: '10 Rue de la Paix',
        codePostal: '75002',
        ville: 'Paris',
      },
    ]);
    const user = userEvent.setup();
    await startTunnel(user);

    await user.type(screen.getByLabelText("Rechercher l'adresse du projet"), '10 rue de la paix');
    await user.click(await screen.findByRole('button', { name: /10 Rue de la Paix 75002 Paris/i }));

    expect(screen.getByPlaceholderText(/15 Avenue des Champs/i)).toHaveValue('10 Rue de la Paix');
    expect(document.querySelector('#codePostalProjet')).toHaveValue('75002');
    expect(document.querySelector('#villeProjet')).toHaveValue('Paris');
  });

  it('envoie plusieurs références cadastrales dans le même format que la nouvelle demande', async () => {
    const user = userEvent.setup();
    await startTunnel(user);
    await completeStep1(user);

    const [firstReferenceInput] = screen.getAllByPlaceholderText('Ex : AB 0042');
    await user.type(firstReferenceInput, ' AB 0042 ');
    await user.click(screen.getByRole('button', { name: /ajouter une référence/i }));

    const referencesInputs = screen.getAllByPlaceholderText('Ex : AB 0042');
    await user.type(referencesInputs[1], 'CD 0099');

    await completeStep2(user);
    await fillStep3Required(user);
    await user.click(screen.getByRole('button', { name: /publier ma demande/i }));

    await waitFor(() => {
      expect(vi.mocked(authApi.registerClientCall)).toHaveBeenCalledWith(expect.objectContaining({
        login: 'jean.dupont@test.fr',
        password: VALID_PASSWORD,
        civilite: 'MR',
        nom: 'Dupont',
        prenom: 'Jean',
        telContact: '0612345678',
        adresseFacturation: {
          rue: '12 Rue de la République',
          codePostal: '75001',
          ville: 'Paris',
        },
        demande: expect.objectContaining({
          type: 'G0',
          referencesCadastrales: ['AB 0042', 'CD 0099'],
        }),
      }), []);
      expect(mockNavigate).toHaveBeenCalledWith('/verification-email-envoyee', expect.anything());
    });

    expect(localStorage.getItem('geoconnect.pending-client-request')).toBeNull();
  }, 10000);

  it('bloque la soumission si la confirmation du mot de passe est différente', async () => {
    const user = userEvent.setup();
    await startTunnel(user);
    await completeStep1(user);
    await completeStep2(user);
    await fillStep3Required(user, { confirmPassword: OTHER_VALID_PASSWORD });

    await user.click(screen.getByRole('button', { name: /publier ma demande/i }));

    expect(await screen.findByText('Les mots de passe ne correspondent pas')).toBeTruthy();

    expect(vi.mocked(authApi.registerClientCall)).not.toHaveBeenCalled();
    expect(vi.mocked(demandeDevisApi.createDemandeDevis)).not.toHaveBeenCalled();
  }, 20000);

  it('bloque la soumission si le mot de passe ne respecte pas les critères de sécurité', async () => {
    const user = userEvent.setup();
    await startTunnel(user);
    await completeStep1(user);
    await completeStep2(user);
    await fillStep3Required(user, { password: 'motdepasse' });

    await user.click(screen.getByRole('button', { name: /publier ma demande/i }));

    expect(await screen.findByText(/Le mot de passe doit contenir : une majuscule, un chiffre, un caractère spécial\./i)).toBeTruthy();
    expect(screen.getByLabelText('Critère manquant : Une majuscule')).toBeTruthy();
    expect(screen.getByLabelText('Critère manquant : Un chiffre')).toBeTruthy();
    expect(screen.getByLabelText('Critère manquant : Un caractère spécial')).toBeTruthy();

    expect(vi.mocked(authApi.registerClientCall)).not.toHaveBeenCalled();
    expect(vi.mocked(demandeDevisApi.createDemandeDevis)).not.toHaveBeenCalled();
  }, 10000);

  it('upload plusieurs documents et transmet docsDevisIds dans la demande', async () => {
    const user = userEvent.setup();
    const files = [
      new File(['plan'], 'plan.pdf', { type: 'application/pdf' }),
      new File(['photo'], 'photo.png', { type: 'image/png' }),
    ];
    vi.mocked(documentApi.uploadDocuments).mockResolvedValue([99, 100]);

    await startTunnel(user);
    await completeStep1(user);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, files);

    await completeStep2(user);
    await fillStep3Required(user);
    await user.click(screen.getByRole('button', { name: /publier ma demande/i }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(
      '/verification-email-envoyee', expect.anything()));
    expect(vi.mocked(authApi.registerClientCall)).toHaveBeenCalledWith(
      expect.objectContaining({ demande: expect.any(Object) }), files);
    expect(localStorage.getItem('geoconnect.pending-client-request')).toBeNull();
    expect(vi.mocked(documentApi.uploadDocuments)).not.toHaveBeenCalled();
  }, 10000);

  it('affiche le bouton + pour ajouter des fichiers après sélection dans le tunnel', async () => {
    const user = userEvent.setup();
    vi.mocked(documentApi.uploadDocuments).mockResolvedValue([]);

    await startTunnel(user);
    await completeStep1(user);

    const file = new File(['content'], 'plan.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    expect(await screen.findByText('plan.pdf')).toBeTruthy();
    expect(screen.getByText(/Ajouter d'autres fichiers/i)).toBeTruthy();
  });

  it('ajoute des fichiers supplémentaires dans le tunnel via le bouton +', async () => {
    const user = userEvent.setup();
    vi.mocked(documentApi.uploadDocuments).mockResolvedValue([]);

    await startTunnel(user);
    await completeStep1(user);

    const file1 = new File(['content1'], 'plan.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file1);

    expect(await screen.findByText('plan.pdf')).toBeTruthy();

    const file2 = new File(['content2'], 'photo.png', { type: 'image/png' });
    const addLink = screen.getByText(/Ajouter d'autres fichiers/i);
    await user.click(addLink);
    await user.upload(fileInput, file2);

    expect(await screen.findByText('plan.pdf')).toBeTruthy();
    expect(screen.getByText('photo.png')).toBeTruthy();
  });

  it('supprime un fichier au clic sur le bouton ✕ individuel dans le tunnel', async () => {
    const user = userEvent.setup();
    vi.mocked(documentApi.uploadDocuments).mockResolvedValue([]);

    await startTunnel(user);
    await completeStep1(user);

    const file1 = new File(['content1'], 'plan.pdf', { type: 'application/pdf' });
    const file2 = new File(['content2'], 'photo.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file1);

    expect(await screen.findByText('plan.pdf')).toBeTruthy();

    const addLink = screen.getByText(/Ajouter d'autres fichiers/i);
    await user.click(addLink);
    await user.upload(fileInput, file2);

    expect(await screen.findByText('plan.pdf')).toBeTruthy();
    expect(screen.getByText('photo.png')).toBeTruthy();

    const deleteButtons = screen.getAllByLabelText(/^Supprimer /);
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2);

    await user.click(deleteButtons[0]);

    await waitFor(() => expect(screen.queryByText('plan.pdf')).toBeNull());
    expect(screen.getByText('photo.png')).toBeTruthy();
  });

  it('permet de re-ajouter un fichier après suppression dans le tunnel', async () => {
    const user = userEvent.setup();
    vi.mocked(documentApi.uploadDocuments).mockResolvedValue([]);

    await startTunnel(user);
    await completeStep1(user);

    const file = new File(['content'], 'plan.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(fileInput, file);
    expect(await screen.findByText('plan.pdf')).toBeTruthy();

    const deleteButton = screen.getByLabelText('Supprimer plan.pdf');
    await user.click(deleteButton);
    await waitFor(() => expect(screen.queryByText('plan.pdf')).toBeNull());

    const addFileDiv = screen.getByText(/Joindre un ou plusieurs fichiers/i);
    await user.click(addFileDiv);
    await user.upload(fileInput, file);

    expect(await screen.findByText('plan.pdf')).toBeTruthy();
  });

  it('bloque le tunnel si superficie négative', async () => {
    const user = userEvent.setup();
    await startTunnel(user);
    await completeStep1(user);
    await user.type(
      screen.getByLabelText('Description du projet *'),
      'Maison individuelle avec accès étroit.'
    );

    const superficieInput = screen.getByPlaceholderText('Ex : 500') as HTMLInputElement;
    await user.clear(superficieInput);
    await user.type(superficieInput, '-10');
    await user.click(screen.getByRole('button', { name: /suivant/i }));

    expect(await screen.findByText('La superficie doit être positive')).toBeTruthy();
    expect(screen.queryByText(/vos coordonnées/i)).toBeNull();
  });

  it('empêche la saisie des caractères incompatibles avec un nombre de lots positif', async () => {
    const user = userEvent.setup();
    await startTunnel(user);
    await completeStep1(user);
    await user.type(
      screen.getByLabelText('Description du projet *'),
      'Maison individuelle avec accès étroit.'
    );

    const lotsInput = screen.getByPlaceholderText('Ex : 1') as HTMLInputElement;
    await user.clear(lotsInput);
    await user.type(lotsInput, '-e.2');

    expect(lotsInput.value).toBe('2');
  });

  it('bloque le tunnel si description > 2000 caractères', async () => {
    const user = userEvent.setup();
    await startTunnel(user);
    await completeStep1(user);

    const descInput = screen.getByLabelText('Description du projet *') as HTMLTextAreaElement;
    const longDesc = 'A'.repeat(2001);
    await user.clear(descInput);
    descInput.value = longDesc;
    descInput.dispatchEvent(new Event('input', { bubbles: true }));
    await user.click(screen.getByRole('button', { name: /suivant/i }));

    expect(await screen.findByText('La description ne doit pas dépasser 2000 caractères')).toBeTruthy();
    expect(screen.queryByText(/vos coordonnées/i)).toBeNull();
  });
});
