import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import CreerUtilisateurPage from './CreerUtilisateurPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ toastSuccess: mockToastSuccess, toastError: mockToastError }),
}));

const creerUtilisateur = vi.fn();
vi.mock('../../api/admin', () => ({
  creerUtilisateur: (...args: unknown[]) => creerUtilisateur(...args),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <CreerUtilisateurPage />
    </MemoryRouter>,
  );
}

describe('CreerUtilisateurPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cree un compte et redirige vers la fiche', async () => {
    creerUtilisateur.mockResolvedValueOnce({ id: 42 });
    renderPage();

    fireEvent.change(screen.getByLabelText(/login/i), { target: { value: 'new@test.fr' } });
    fireEvent.change(screen.getByLabelText(/^mot de passe/i), { target: { value: 'MotDePasse123!' } });
    fireEvent.change(screen.getByLabelText(/confirmation du mot de passe/i), { target: { value: 'MotDePasse123!' } });
    fireEvent.click(screen.getByRole('button', { name: /creer le compte/i }));

    await waitFor(() => {
      expect(creerUtilisateur).toHaveBeenCalledWith({
        login: 'new@test.fr',
        motDePasse: 'MotDePasse123!',
        role: 'ADMIN',
      });
      expect(mockToastSuccess).toHaveBeenCalledWith('Compte cree avec succes');
      expect(mockNavigate).toHaveBeenCalledWith('/admin/utilisateurs/42');
    });
  });

  it('ne rend plus de selecteur de role', () => {
    renderPage();
    expect(screen.queryByLabelText(/^role$/i)).toBeNull();
  });

  it('affiche une erreur inline en cas de 409', async () => {
    creerUtilisateur.mockRejectedValueOnce({ response: { status: 409 } });
    renderPage();

    fireEvent.change(screen.getByLabelText(/login/i), { target: { value: 'used@test.fr' } });
    fireEvent.change(screen.getByLabelText(/^mot de passe/i), { target: { value: 'MotDePasse123!' } });
    fireEvent.change(screen.getByLabelText(/confirmation du mot de passe/i), { target: { value: 'MotDePasse123!' } });
    fireEvent.click(screen.getByRole('button', { name: /creer le compte/i }));

    expect(await screen.findByText(/deja utilisee/i)).toBeTruthy();
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('affiche une erreur serveur generique', async () => {
    creerUtilisateur.mockRejectedValueOnce(new Error('Serveur KO'));
    renderPage();

    fireEvent.change(screen.getByLabelText(/login/i), { target: { value: 'new@test.fr' } });
    fireEvent.change(screen.getByLabelText(/^mot de passe/i), { target: { value: 'MotDePasse123!' } });
    fireEvent.change(screen.getByLabelText(/confirmation du mot de passe/i), { target: { value: 'MotDePasse123!' } });
    fireEvent.click(screen.getByRole('button', { name: /creer le compte/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Serveur KO');
    });
  });
});

