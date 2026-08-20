import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import UtilisateurDetailPage from './UtilisateurDetailPage';

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

const getUtilisateur = vi.fn();
const activerUtilisateur = vi.fn();
const desactiverUtilisateur = vi.fn();
const reinitialiserMotDePasse = vi.fn();
const renvoyerInvitationBureauEtude = vi.fn();
const supprimerInvitationBureauEtude = vi.fn();

vi.mock('../../api/admin', () => ({
  getUtilisateur: (...args: unknown[]) => getUtilisateur(...args),
  activerUtilisateur: (...args: unknown[]) => activerUtilisateur(...args),
  desactiverUtilisateur: (...args: unknown[]) => desactiverUtilisateur(...args),
  reinitialiserMotDePasse: (...args: unknown[]) => reinitialiserMotDePasse(...args),
  renvoyerInvitationBureauEtude: (...args: unknown[]) => renvoyerInvitationBureauEtude(...args),
  supprimerInvitationBureauEtude: (...args: unknown[]) => supprimerInvitationBureauEtude(...args),
}));

function renderPage(initialPath = '/admin/utilisateurs/10') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin/utilisateurs/:id" element={<UtilisateurDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('UtilisateurDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUtilisateur.mockResolvedValue({
      id: 10,
      login: 'detail@test.fr',
      role: 'CLIENT',
      enabled: true,
      createdAt: '2026-01-10T10:00:00',
    });
    activerUtilisateur.mockResolvedValue(undefined);
    desactiverUtilisateur.mockResolvedValue(undefined);
    reinitialiserMotDePasse.mockResolvedValue(undefined);
    renvoyerInvitationBureauEtude.mockResolvedValue(undefined);
    supprimerInvitationBureauEtude.mockResolvedValue(undefined);
  });

  it('charge et affiche les informations de l utilisateur', async () => {
    renderPage();

    expect(await screen.findByText('detail@test.fr')).toBeTruthy();
    expect(getUtilisateur).toHaveBeenCalledWith(10);
  });

  it('redirige si id invalide', async () => {
    renderPage('/admin/utilisateurs/abc');

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/admin/utilisateurs', { replace: true });
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  it('desactive un compte depuis la modale', async () => {
    renderPage();

    await screen.findByText('detail@test.fr');
    fireEvent.click(screen.getByRole('button', { name: /^desactiver$/i }));
    fireEvent.click(screen.getAllByRole('button', { name: /^desactiver$/i })[1]);

    await waitFor(() => {
      expect(desactiverUtilisateur).toHaveBeenCalledWith(10);
      expect(mockToastSuccess).toHaveBeenCalledWith('Compte desactive');
    });
  });

  it('ouvre reset mot de passe et envoie la demande', async () => {
    renderPage();

    await screen.findByText('detail@test.fr');
    fireEvent.click(screen.getByRole('button', { name: /reinitialiser le mot de passe/i }));

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), { target: { value: 'MotDePasse123!' } });
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), { target: { value: 'MotDePasse123!' } });
    fireEvent.click(screen.getByRole('button', { name: /^reinitialiser$/i }));

    await waitFor(() => {
      expect(reinitialiserMotDePasse).toHaveBeenCalledWith(10, 'MotDePasse123!');
      expect(mockToastSuccess).toHaveBeenCalledWith('Mot de passe reinitialise');
    });
  });

  it('active un compte desactive', async () => {
    getUtilisateur.mockResolvedValueOnce({
      id: 10,
      login: 'detail@test.fr',
      role: 'CLIENT',
      enabled: false,
      createdAt: '2026-01-10T10:00:00',
    });

    renderPage();

    await screen.findByText('detail@test.fr');
    fireEvent.click(screen.getByRole('button', { name: /^activer$/i }));

    await waitFor(() => {
      expect(activerUtilisateur).toHaveBeenCalledWith(10);
      expect(mockToastSuccess).toHaveBeenCalledWith('Compte active');
    });
  });

  it('renvoie l invitation d un compte BE en attente', async () => {
    getUtilisateur.mockResolvedValueOnce({ id: 10, login: 'be@test.fr', role: 'BUREAU_ETUDE', enabled: true,
      activationStatus: 'INVITED', createdAt: '2026-01-10T10:00:00' });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /renvoyer l'e-mail d'activation/i }));
    await waitFor(() => expect(renvoyerInvitationBureauEtude).toHaveBeenCalledWith(10));
    expect(mockToastSuccess).toHaveBeenCalledWith("L'e-mail d'activation a été renvoyé");
    expect(screen.queryByRole('button', { name: /reinitialiser/i })).toBeNull();
  });

  it('supprime une invitation BE après confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    getUtilisateur.mockResolvedValueOnce({ id: 10, login: 'be@test.fr', role: 'BUREAU_ETUDE', enabled: true,
      activationStatus: 'INVITED', createdAt: '2026-01-10T10:00:00' });
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: /supprimer l'invitation/i }));
    await waitFor(() => expect(supprimerInvitationBureauEtude).toHaveBeenCalledWith(10));
    expect(mockNavigate).toHaveBeenCalledWith('/admin/utilisateurs');
  });
});


