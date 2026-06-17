import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import BERegister from './BERegister';
import * as authApi from '../../api/auth';
import * as bureauEtudeApi from '../../api/bureauEtude';
import * as AuthContextModule from '../../contexts/AuthContext';

// ─── Mocks globaux ────────────────────────────────────────────────────────────

vi.mock('../../api/auth');
vi.mock('../../api/bureauEtude');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

// ─── Données de test ──────────────────────────────────────────────────────────

const MOCK_AUTH_RESPONSE = { userId: 42, token: 'tok-be', role: 'BUREAU_ETUDE' as const, email: 'be@test.fr' };
const VALID_PASSWORD = 'MotDePasse!123';
const OTHER_VALID_PASSWORD = 'AutreMotDePasse!123';

// ─── Helper de rendu ──────────────────────────────────────────────────────────

function renderBERegister() {
  const mockLogin = vi.fn();
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    logout: vi.fn(),
  } as ReturnType<typeof AuthContextModule.useAuth>);

  return { ...render(<MemoryRouter><BERegister /></MemoryRouter>), mockLogin };
}

/** Remplit tous les champs obligatoires */
async function fillAllRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('Ex: GeoExpert SAS'), 'GeoExpert SAS');
  await user.type(screen.getByPlaceholderText('contact@entreprise.fr'), 'contact@geoexpert.fr');
  await user.type(screen.getByPlaceholderText('01 23 45 67 89'), '0123456789');
  await user.type(screen.getByLabelText('Mot de passe *'), VALID_PASSWORD);
  await user.type(screen.getByLabelText('Confirmation du mot de passe *'), VALID_PASSWORD);
  await user.type(screen.getByPlaceholderText('10 rue de la Géologie'), '10 Rue de la Géologie');
  await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
  await user.type(screen.getByLabelText('Ville *'), 'Paris');
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BERegister — rendu initial', () => {
  beforeEach(() => vi.clearAllMocks());

  it('affiche le titre de la page', () => {
    renderBERegister();
    expect(screen.getByText('Rejoindre le réseau pro')).toBeTruthy();
  });

  it('affiche tous les champs requis', () => {
    renderBERegister();
    expect(screen.getByPlaceholderText('Ex: GeoExpert SAS')).toBeTruthy();
    expect(screen.getByPlaceholderText('contact@entreprise.fr')).toBeTruthy();
    expect(screen.getByPlaceholderText('01 23 45 67 89')).toBeTruthy();
    expect(screen.getByPlaceholderText('10 rue de la Géologie')).toBeTruthy();
    expect(screen.getByPlaceholderText('Ex : 75001')).toBeTruthy();
  });
});

describe('BERegister — soumission réussie', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authApi.registerCall as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_AUTH_RESPONSE);
    (bureauEtudeApi.createBureauEtude as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });
  });

  it('appelle registerCall puis createBureauEtude avec les bonnes données', async () => {
    const user = userEvent.setup();
    renderBERegister();

    await fillAllRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(authApi.registerCall).toHaveBeenCalledWith({
        login: 'contact@geoexpert.fr',
        password: VALID_PASSWORD,
        role: 'BUREAU_ETUDE',
      });
      expect(bureauEtudeApi.createBureauEtude).toHaveBeenCalledWith(
        expect.objectContaining({
          raisonSociale: 'GeoExpert SAS',
          emailContact: 'contact@geoexpert.fr',
          telContact: '0123456789',
          adresse: { rue: '10 Rue de la Géologie', codePostal: '75001', ville: 'Paris' },
        })
      );
    });
  });

  it('affiche l\'écran de succès après soumission', async () => {
    const user = userEvent.setup();
    renderBERegister();

    await fillAllRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(screen.getByText(/votre demande est enregistrée/i)).toBeTruthy();
    });
  });
});

describe('BERegister — validation des champs obligatoires', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authApi.registerCall as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_AUTH_RESPONSE);
    (bureauEtudeApi.createBureauEtude as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });
  });

  it('n\'appelle pas l\'API si la raison sociale est vide', async () => {
    const user = userEvent.setup();
    renderBERegister();

    // Tout remplir sauf raisonSociale
    await user.type(screen.getByPlaceholderText('contact@entreprise.fr'), 'contact@geoexpert.fr');
    await user.type(screen.getByPlaceholderText('01 23 45 67 89'), '0123456789');
    await user.type(screen.getByLabelText('Mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByLabelText('Confirmation du mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByPlaceholderText('10 rue de la Géologie'), '10 Rue Test');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByLabelText('Ville *'), 'Paris');
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(authApi.registerCall).not.toHaveBeenCalled();
    });
  });

  it('n\'appelle pas l\'API si le téléphone est vide', async () => {
    const user = userEvent.setup();
    renderBERegister();

    await user.type(screen.getByPlaceholderText('Ex: GeoExpert SAS'), 'GeoExpert SAS');
    await user.type(screen.getByPlaceholderText('contact@entreprise.fr'), 'contact@geoexpert.fr');
    // telContact non renseigné
    await user.type(screen.getByLabelText('Mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByLabelText('Confirmation du mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByPlaceholderText('10 rue de la Géologie'), '10 Rue Test');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByLabelText('Ville *'), 'Paris');
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(authApi.registerCall).not.toHaveBeenCalled();
    });
  });

  it('n\'appelle pas l\'API si la rue est vide', async () => {
    const user = userEvent.setup();
    renderBERegister();

    await user.type(screen.getByPlaceholderText('Ex: GeoExpert SAS'), 'GeoExpert SAS');
    await user.type(screen.getByPlaceholderText('contact@entreprise.fr'), 'contact@geoexpert.fr');
    await user.type(screen.getByPlaceholderText('01 23 45 67 89'), '0123456789');
    await user.type(screen.getByLabelText('Mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByLabelText('Confirmation du mot de passe *'), VALID_PASSWORD);
    // rue non renseignée
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByLabelText('Ville *'), 'Paris');
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(authApi.registerCall).not.toHaveBeenCalled();
    });
  });

  it('n\'appelle pas l\'API si la ville est vide', async () => {
    const user = userEvent.setup();
    renderBERegister();

    await user.type(screen.getByPlaceholderText('Ex: GeoExpert SAS'), 'GeoExpert SAS');
    await user.type(screen.getByPlaceholderText('contact@entreprise.fr'), 'contact@geoexpert.fr');
    await user.type(screen.getByPlaceholderText('01 23 45 67 89'), '0123456789');
    await user.type(screen.getByLabelText('Mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByLabelText('Confirmation du mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByPlaceholderText('10 rue de la Géologie'), '10 Rue Test');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    // ville non renseignée
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(authApi.registerCall).not.toHaveBeenCalled();
    });
  });
});

describe('BERegister — validation du code postal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authApi.registerCall as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_AUTH_RESPONSE);
    (bureauEtudeApi.createBureauEtude as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });
  });

  it('affiche "Requis" si le code postal est vide', async () => {
    const user = userEvent.setup();
    renderBERegister();

    await user.type(screen.getByPlaceholderText('Ex: GeoExpert SAS'), 'GeoExpert SAS');
    await user.type(screen.getByPlaceholderText('contact@entreprise.fr'), 'contact@geoexpert.fr');
    await user.type(screen.getByPlaceholderText('01 23 45 67 89'), '0612345678');
    await user.type(screen.getByLabelText('Mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByLabelText('Confirmation du mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByPlaceholderText('10 rue de la Géologie'), '10 Rue Test');
    // Code postal non renseigné
    await user.type(screen.getByLabelText('Ville *'), 'Paris');
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(screen.getByText('Requis')).toBeTruthy();
    });
    expect(authApi.registerCall).not.toHaveBeenCalled();
  });

  it('affiche "Code postal invalide (ex: 75001 ou 2A004)" si le code postal ne fait pas 5 chiffres', async () => {
    const user = userEvent.setup();
    renderBERegister();

    await user.type(screen.getByPlaceholderText('Ex: GeoExpert SAS'), 'GeoExpert SAS');
    await user.type(screen.getByPlaceholderText('contact@entreprise.fr'), 'contact@geoexpert.fr');
    await user.type(screen.getByPlaceholderText('01 23 45 67 89'), '0612345678');
    await user.type(screen.getByLabelText('Mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByLabelText('Confirmation du mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByPlaceholderText('10 rue de la Géologie'), '10 Rue Test');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '750'); // invalide
    await user.type(screen.getByLabelText('Ville *'), 'Paris');
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(screen.getByText('Code postal invalide (ex: 75001 ou 2A004)')).toBeTruthy();
    });
    expect(authApi.registerCall).not.toHaveBeenCalled();
  });

  it('affiche "Code postal invalide (ex: 75001 ou 2A004)" si le code postal contient des lettres', async () => {
    const user = userEvent.setup();
    renderBERegister();

    await user.type(screen.getByPlaceholderText('Ex: GeoExpert SAS'), 'GeoExpert SAS');
    await user.type(screen.getByPlaceholderText('contact@entreprise.fr'), 'contact@geoexpert.fr');
    await user.type(screen.getByPlaceholderText('01 23 45 67 89'), '0612345678');
    await user.type(screen.getByLabelText('Mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByLabelText('Confirmation du mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByPlaceholderText('10 rue de la Géologie'), '10 Rue Test');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), 'ABCDE'); // invalide
    await user.type(screen.getByLabelText('Ville *'), 'Paris');
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(screen.getByText('Code postal invalide (ex: 75001 ou 2A004)')).toBeTruthy();
    });
    expect(authApi.registerCall).not.toHaveBeenCalled();
  });

  it('accepte un code postal valide et soumet', async () => {
    const user = userEvent.setup();
    renderBERegister();

    await fillAllRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(authApi.registerCall).toHaveBeenCalledOnce();
    });
  });
});

describe('BERegister — validation du téléphone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authApi.registerCall as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_AUTH_RESPONSE);
    (bureauEtudeApi.createBureauEtude as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });
  });

  it('affiche "Requis" si le téléphone est vide', async () => {
    const user = userEvent.setup();
    renderBERegister();

    await user.type(screen.getByPlaceholderText('Ex: GeoExpert SAS'), 'GeoExpert SAS');
    await user.type(screen.getByPlaceholderText('contact@entreprise.fr'), 'contact@geoexpert.fr');
    // telContact non renseigné
    await user.type(screen.getByLabelText('Mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByLabelText('Confirmation du mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByPlaceholderText('10 rue de la Géologie'), '10 Rue Test');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByLabelText('Ville *'), 'Paris');
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(screen.getByText('Requis')).toBeTruthy();
    });
    expect(authApi.registerCall).not.toHaveBeenCalled();
  });

  it('affiche le message d\'erreur pour un numéro de téléphone invalide', async () => {
    const user = userEvent.setup();
    renderBERegister();

    await user.type(screen.getByPlaceholderText('Ex: GeoExpert SAS'), 'GeoExpert SAS');
    await user.type(screen.getByPlaceholderText('contact@entreprise.fr'), 'contact@geoexpert.fr');
    await user.type(screen.getByPlaceholderText('01 23 45 67 89'), '123'); // trop court
    await user.type(screen.getByLabelText('Mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByLabelText('Confirmation du mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByPlaceholderText('10 rue de la Géologie'), '10 Rue Test');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByLabelText('Ville *'), 'Paris');
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(screen.getByText(/numéro invalide/i)).toBeTruthy();
    });
    expect(authApi.registerCall).not.toHaveBeenCalled();
  });

  it('n\'appelle pas l\'API pour un numéro de 9 chiffres seulement', async () => {
    const user = userEvent.setup();
    renderBERegister();

    await user.type(screen.getByPlaceholderText('Ex: GeoExpert SAS'), 'GeoExpert SAS');
    await user.type(screen.getByPlaceholderText('contact@entreprise.fr'), 'contact@geoexpert.fr');
    await user.type(screen.getByPlaceholderText('01 23 45 67 89'), '061234567'); // 9 chiffres
    await user.type(screen.getByLabelText('Mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByLabelText('Confirmation du mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByPlaceholderText('10 rue de la Géologie'), '10 Rue Test');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByLabelText('Ville *'), 'Paris');
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(authApi.registerCall).not.toHaveBeenCalled();
    });
  });

  it('accepte un numéro mobile valide (0612345678)', async () => {
    const user = userEvent.setup();
    renderBERegister();

    await fillAllRequiredFields(user); // utilise 0123456789
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(authApi.registerCall).toHaveBeenCalledOnce();
    });
  });

  it('accepte un numéro formaté avec espaces (06 12 34 56 78)', async () => {
    const user = userEvent.setup();
    renderBERegister();

    await user.type(screen.getByPlaceholderText('Ex: GeoExpert SAS'), 'GeoExpert SAS');
    await user.type(screen.getByPlaceholderText('contact@entreprise.fr'), 'contact@geoexpert.fr');
    await user.type(screen.getByPlaceholderText('01 23 45 67 89'), '06 12 34 56 78');
    await user.type(screen.getByLabelText('Mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByLabelText('Confirmation du mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByPlaceholderText('10 rue de la Géologie'), '10 Rue Test');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByLabelText('Ville *'), 'Paris');
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(authApi.registerCall).toHaveBeenCalledOnce();
    });
  });
});

describe('BERegister — validation de la confirmation du mot de passe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authApi.registerCall as ReturnType<typeof vi.fn>).mockResolvedValue(MOCK_AUTH_RESPONSE);
    (bureauEtudeApi.createBureauEtude as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 1 });
  });

  it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
    const user = userEvent.setup();
    renderBERegister();

    await user.type(screen.getByPlaceholderText('Ex: GeoExpert SAS'), 'GeoExpert SAS');
    await user.type(screen.getByPlaceholderText('contact@entreprise.fr'), 'contact@geoexpert.fr');
    await user.type(screen.getByPlaceholderText('01 23 45 67 89'), '0123456789');
    await user.type(screen.getByLabelText('Mot de passe *'), VALID_PASSWORD);
    await user.type(screen.getByLabelText('Confirmation du mot de passe *'), OTHER_VALID_PASSWORD); // différent
    await user.type(screen.getByPlaceholderText('10 rue de la Géologie'), '10 Rue Test');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByLabelText('Ville *'), 'Paris');
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeTruthy();
    });
    expect(authApi.registerCall).not.toHaveBeenCalled();
  });

  it('n\'affiche pas d\'erreur si les mots de passe correspondent', async () => {
    const user = userEvent.setup();
    renderBERegister();

    await fillAllRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(screen.queryByText('Les mots de passe ne correspondent pas')).toBeNull();
    });
  });

  it('affiche les critères manquants si le mot de passe est trop faible', async () => {
    const user = userEvent.setup();
    renderBERegister();

    await user.type(screen.getByPlaceholderText('Ex: GeoExpert SAS'), 'GeoExpert SAS');
    await user.type(screen.getByPlaceholderText('contact@entreprise.fr'), 'contact@geoexpert.fr');
    await user.type(screen.getByPlaceholderText('01 23 45 67 89'), '0123456789');
    await user.type(screen.getByLabelText('Mot de passe *'), 'motdepasse');
    await user.type(screen.getByLabelText('Confirmation du mot de passe *'), 'motdepasse');
    await user.type(screen.getByPlaceholderText('10 rue de la Géologie'), '10 Rue Test');
    await user.type(screen.getByPlaceholderText('Ex : 75001'), '75001');
    await user.type(screen.getByLabelText('Ville *'), 'Paris');
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(screen.getByText(/Le mot de passe doit contenir : une majuscule, un chiffre, un caractère spécial\./i)).toBeTruthy();
      expect(screen.getByLabelText('Critère manquant : Une majuscule')).toBeTruthy();
      expect(screen.getByLabelText('Critère manquant : Un chiffre')).toBeTruthy();
      expect(screen.getByLabelText('Critère manquant : Un caractère spécial')).toBeTruthy();
    });

    expect(authApi.registerCall).not.toHaveBeenCalled();
  });
});

describe('BERegister — erreur de l\'API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('affiche un message d\'erreur si registerCall échoue', async () => {
    (authApi.registerCall as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Email déjà pris')
    );

    const user = userEvent.setup();
    renderBERegister();

    await fillAllRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /soumettre ma candidature/i }));

    await waitFor(() => {
      expect(screen.getByText('Email déjà pris')).toBeTruthy();
    });
  });
});










