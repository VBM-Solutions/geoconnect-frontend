import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';
import * as authApi from '../api/auth';
import * as clientApi from '../api/client';
import * as demandeDevisApi from '../api/demandeDevis';
import * as documentApi from '../api/document';
import * as referentielApi from '../api/referentiel';
import * as AuthContextModule from '../contexts/AuthContext';

vi.mock('../api/auth');
vi.mock('../api/client');
vi.mock('../api/demandeDevis');
vi.mock('../api/document');
vi.mock('../api/referentiel');

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const MOCK_TYPES = [
  { code: 'G0', libelle: 'G0 — Étude préalable' },
  { code: 'G2_PRO', libelle: 'G2 PRO — Projet' },
];

const MOCK_AUTH_RESPONSE = {
  userId: 42,
  token: 'tok-client',
  role: 'CLIENT' as const,
  email: 'client@test.fr',
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
  await user.click(screen.getByRole('button', { name: /démarrer le tunnel/i }));
  await waitFor(() => {
    expect(screen.getByText(/quel est votre besoin/i)).toBeTruthy();
  });
}

async function completeStep1(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => screen.getByText('G0 — Étude préalable'));
  await user.selectOptions(screen.getByRole('combobox'), 'G0');
  await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), '10 Rue de la Paix');
  await user.type(screen.getByLabelText('Code Postal *'), '75001');
  await user.type(screen.getByLabelText('Ville *'), 'Paris');
  await user.click(screen.getByRole('button', { name: /suivant/i }));

  await waitFor(() => {
    expect(screen.getByText(/détails du projet/i)).toBeTruthy();
  });
}

async function completeStep2(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByPlaceholderText(/décrivez votre besoin, contraintes particulières/i),
    'Maison individuelle avec accès étroit.'
  );
  await user.click(screen.getByRole('button', { name: /suivant/i }));

  await waitFor(() => {
    expect(screen.getByText(/vos coordonnées/i)).toBeTruthy();
  });
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
    vi.clearAllMocks();
    (referentielApi.getTypesEtude as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_TYPES);
    (authApi.registerCall as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_AUTH_RESPONSE);
    (clientApi.createClient as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 10 });
    (clientApi.getClientByUserId as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 10 });
    (demandeDevisApi.createDemandeDevis as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (documentApi.uploadDocuments as ReturnType<typeof vi.fn>).mockResolvedValue([]);
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
      expect(authApi.registerCall).toHaveBeenCalledWith({
        login: 'jean.dupont@test.fr',
        password: VALID_PASSWORD,
        role: 'CLIENT',
      });
      expect(demandeDevisApi.createDemandeDevis).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 10,
          docsDevisIds: [],
          referencesCadastrales: ['AB 0042', 'CD 0099'],
        })
      );
    });

    const payload = (demandeDevisApi.createDemandeDevis as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(payload).not.toHaveProperty('referenceCadastrale');
  }, 10000);

  it('bloque la soumission si la confirmation du mot de passe est différente', async () => {
    const user = userEvent.setup();
    await startTunnel(user);
    await completeStep1(user);
    await completeStep2(user);
    await fillStep3Required(user, { confirmPassword: OTHER_VALID_PASSWORD });

    await user.click(screen.getByRole('button', { name: /publier ma demande/i }));

    await waitFor(() => {
      expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeTruthy();
    });

    expect(authApi.registerCall).not.toHaveBeenCalled();
    expect(demandeDevisApi.createDemandeDevis).not.toHaveBeenCalled();
  });

  it('bloque la soumission si le mot de passe ne respecte pas les critères de sécurité', async () => {
    const user = userEvent.setup();
    await startTunnel(user);
    await completeStep1(user);
    await completeStep2(user);
    await fillStep3Required(user, { password: 'motdepasse' });

    await user.click(screen.getByRole('button', { name: /publier ma demande/i }));

    await waitFor(() => {
      expect(screen.getByText(/Le mot de passe doit contenir : une majuscule, un chiffre, un caractère spécial\./i)).toBeTruthy();
      expect(screen.getByLabelText('Critère manquant : Une majuscule')).toBeTruthy();
      expect(screen.getByLabelText('Critère manquant : Un chiffre')).toBeTruthy();
      expect(screen.getByLabelText('Critère manquant : Un caractère spécial')).toBeTruthy();
    });

    expect(authApi.registerCall).not.toHaveBeenCalled();
    expect(demandeDevisApi.createDemandeDevis).not.toHaveBeenCalled();
  });

  it('upload plusieurs documents et transmet docsDevisIds dans la demande', async () => {
    const user = userEvent.setup();
    const files = [
      new File(['plan'], 'plan.pdf', { type: 'application/pdf' }),
      new File(['photo'], 'photo.png', { type: 'image/png' }),
    ];
    (documentApi.uploadDocuments as ReturnType<typeof vi.fn>).mockResolvedValue([99, 100]);

    await startTunnel(user);
    await completeStep1(user);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, files);

    await completeStep2(user);
    await fillStep3Required(user);
    await user.click(screen.getByRole('button', { name: /publier ma demande/i }));

    await waitFor(() => {
      expect(documentApi.uploadDocuments).toHaveBeenCalledWith(files);
      expect(demandeDevisApi.createDemandeDevis).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 10,
          docsDevisIds: [99, 100],
        })
      );
    });
  });

  it('affiche le bouton + pour ajouter des fichiers après sélection dans le tunnel', async () => {
    const user = userEvent.setup();
    (documentApi.uploadDocuments as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await startTunnel(user);
    await completeStep1(user);

    const file = new File(['content'], 'plan.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('plan.pdf')).toBeTruthy();
      expect(screen.getByRole('button', { name: /ajouter d\'autres fichiers/i })).toBeTruthy();
    });
  });

  it('ajoute des fichiers supplémentaires dans le tunnel via le bouton +', async () => {
    const user = userEvent.setup();
    (documentApi.uploadDocuments as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await startTunnel(user);
    await completeStep1(user);

    const file1 = new File(['content1'], 'plan.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file1);

    await waitFor(() => {
      expect(screen.getByText('plan.pdf')).toBeTruthy();
    });

    const file2 = new File(['content2'], 'photo.png', { type: 'image/png' });
    const addButtons = screen.getAllByRole('button', { name: /ajouter d\'autres fichiers/i });
    await user.click(addButtons[0]);
    await user.upload(fileInput, file2);

    await waitFor(() => {
      expect(screen.getByText('plan.pdf')).toBeTruthy();
      expect(screen.getByText('photo.png')).toBeTruthy();
    });
  });

  it('supprime un fichier au clic sur le bouton ✕ individuel dans le tunnel', async () => {
    const user = userEvent.setup();
    (documentApi.uploadDocuments as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await startTunnel(user);
    await completeStep1(user);

    const file1 = new File(['content1'], 'plan.pdf', { type: 'application/pdf' });
    const file2 = new File(['content2'], 'photo.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, file1);

    await waitFor(() => {
      expect(screen.getByText('plan.pdf')).toBeTruthy();
    });

    const addButtons = screen.getAllByRole('button', { name: /ajouter d\'autres fichiers/i });
    await user.click(addButtons[0]);
    await user.upload(fileInput, file2);

    await waitFor(() => {
      expect(screen.getByText('plan.pdf')).toBeTruthy();
      expect(screen.getByText('photo.png')).toBeTruthy();
    });

    const deleteButtons = screen.getAllByLabelText(/^Supprimer /);
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2);

    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('plan.pdf')).toBeNull();
      expect(screen.getByText('photo.png')).toBeTruthy();
    });
  });

  it('permet de re-ajouter un fichier après suppression dans le tunnel', async () => {
    const user = userEvent.setup();
    (documentApi.uploadDocuments as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await startTunnel(user);
    await completeStep1(user);

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

  it('bloque le tunnel si superficie négative', async () => {
    const user = userEvent.setup();
    await startTunnel(user);
    await completeStep1(user);
    await user.type(
      screen.getByPlaceholderText(/décrivez votre besoin, contraintes particulières/i),
      'Maison individuelle avec accès étroit.'
    );
    fireEvent.change(screen.getByPlaceholderText('Ex : 500'), { target: { value: '-10' } });
    await user.click(screen.getByRole('button', { name: /suivant/i }));
    await waitFor(() => {
      expect(screen.getByText('La superficie doit être positive')).toBeTruthy();
    });
    expect(screen.queryByText(/vos coordonnées/i)).toBeNull();
  });

  it('bloque le tunnel si nombre de lots négatif', async () => {
    const user = userEvent.setup();
    await startTunnel(user);
    await completeStep1(user);
    await user.type(
      screen.getByPlaceholderText(/décrivez votre besoin, contraintes particulières/i),
      'Maison individuelle avec accès étroit.'
    );
    fireEvent.change(screen.getByPlaceholderText('Ex : 1'), { target: { value: '-2' } });
    await user.click(screen.getByRole('button', { name: /suivant/i }));
    await waitFor(() => {
      expect(screen.getByText('Le nombre de lots doit être positif')).toBeTruthy();
    });
    expect(screen.queryByText(/vos coordonnées/i)).toBeNull();
  });

  it('bloque le tunnel si description > 2000 caractères', async () => {
    const user = userEvent.setup();
    await startTunnel(user);
    await completeStep1(user);
    const longDesc = 'A'.repeat(2001);
    fireEvent.change(screen.getByPlaceholderText(/décrivez votre besoin, contraintes particulières/i), { target: { value: longDesc } });
    await user.click(screen.getByRole('button', { name: /suivant/i }));
    await waitFor(() => {
      expect(screen.getByText('La description ne doit pas dépasser 2000 caractères')).toBeTruthy();
    });
    expect(screen.queryByText(/vos coordonnées/i)).toBeNull();
  });
});


