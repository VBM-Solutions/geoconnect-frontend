import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import BERegister from './BERegister';
import * as authApi from '../../api/auth';
import * as addressApi from '../../api/addressAutocomplete';
import * as AuthContextModule from '../../contexts/AuthContext';

vi.mock('../../api/auth');
vi.mock('../../api/addressAutocomplete');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useNavigate: () => mockNavigate,
}));

const authResponse = {
  userId: 42,
  bureauEtudeId: 7,
  role: 'BUREAU_ETUDE' as const,
  login: 'contact@geoexpert.fr',
};
const suggestion = {
  label: '10 rue de la Géologie 75001 Paris',
  rue: '10 rue de la Géologie',
  codePostal: '75001',
  ville: 'Paris',
  latitude: 48.86,
  longitude: 2.34,
  score: 0.98,
};

function renderPage() {
  const login = vi.fn();
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login,
    logout: vi.fn(),
  } as ReturnType<typeof AuthContextModule.useAuth>);
  return { login, ...render(<MemoryRouter><BERegister /></MemoryRouter>) };
}

async function fillIdentity(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('Ex: GeoExpert SAS'), 'GeoExpert SAS');
  await user.type(screen.getByPlaceholderText('contact@entreprise.fr'), 'contact@geoexpert.fr');
  await user.type(screen.getByPlaceholderText('01 23 45 67 89'), '0123456789');
  await user.type(screen.getByLabelText('Mot de passe *'), 'MotDePasse!123');
  await user.type(screen.getByLabelText('Confirmation du mot de passe *'), 'MotDePasse!123');
}

async function selectAddress(user: ReturnType<typeof userEvent.setup>) {
  vi.mocked(addressApi.searchAddressSuggestions).mockResolvedValue([suggestion]);
  await user.type(screen.getByPlaceholderText("Rechercher l'adresse de l'entreprise"), '10 rue');
  await waitFor(() => expect(screen.getByText(suggestion.label)).toBeTruthy());
  await user.click(screen.getByText(suggestion.label));
}

describe('BERegister', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authApi.registerBureauEtudeCall).mockResolvedValue(authResponse);
  });

  it('affiche la saisie d’adresse uniformisée', () => {
    renderPage();
    expect(screen.getByLabelText('Adresse *')).toBeTruthy();
    expect(screen.getByLabelText('Rue *')).toBeTruthy();
    expect(screen.getByLabelText('Code Postal *')).toBeTruthy();
    expect(screen.getByLabelText('Ville *')).toBeTruthy();
  });

  it('bloque la création tant qu’aucune proposition complète n’est sélectionnée', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillIdentity(user);
    await user.type(screen.getByLabelText('Rue *'), '10 rue libre');
    await user.type(screen.getByLabelText('Code Postal *'), '75001');
    await user.type(screen.getByLabelText('Ville *'), 'Paris');
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/sélectionner une adresse/i);
    expect(authApi.registerBureauEtudeCall).not.toHaveBeenCalled();
  });

  it('crée atomiquement le compte et le profil avec l’adresse sélectionnée', async () => {
    const user = userEvent.setup();
    const { login } = renderPage();
    await fillIdentity(user);
    await selectAddress(user);
    expect(screen.getByLabelText('Rue *')).toHaveValue('10 rue de la Géologie');
    expect(screen.getByLabelText('Code Postal *')).toHaveValue('75001');
    expect(screen.getByLabelText('Ville *')).toHaveValue('Paris');
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => expect(authApi.registerBureauEtudeCall).toHaveBeenCalledWith({
      login: 'contact@geoexpert.fr',
      password: 'MotDePasse!123',
      raisonSociale: 'GeoExpert SAS',
      telContact: '0123456789',
      adresse: {
        rue: '10 rue de la Géologie',
        codePostal: '75001',
        ville: 'Paris',
        latitude: 48.86,
        longitude: 2.34,
        geocodingScore: 0.98,
      },
    }));
    expect(login).toHaveBeenCalledWith(authResponse);
    expect(screen.getByText(/votre demande est enregistrée/i)).toBeTruthy();
  });

  it('invalide une sélection lorsque le texte est ensuite modifié', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillIdentity(user);
    await selectAddress(user);
    await user.type(screen.getByLabelText('Adresse *'), ' bis');
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(authApi.registerBureauEtudeCall).not.toHaveBeenCalled();
  });

  it('invalide aussi la sélection lorsqu’un champ prérempli est modifié', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillIdentity(user);
    await selectAddress(user);
    await user.type(screen.getByLabelText('Ville *'), ' 1er');
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(authApi.registerBureauEtudeCall).not.toHaveBeenCalled();
  });

  it('affiche l’erreur renvoyée par l’inscription atomique', async () => {
    vi.mocked(authApi.registerBureauEtudeCall).mockRejectedValue(new Error('Email déjà pris'));
    const user = userEvent.setup();
    renderPage();
    await fillIdentity(user);
    await selectAddress(user);
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));
    expect(await screen.findByText('Email déjà pris')).toBeTruthy();
  });

  it('retourne à la connexion après une inscription réussie', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillIdentity(user);
    await selectAddress(user);
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));
    await user.click(await screen.findByRole('button', { name: /retour à l'accueil/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
