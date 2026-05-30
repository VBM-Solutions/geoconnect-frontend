import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
    (documentApi.uploadDocument as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 99 });
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
});


