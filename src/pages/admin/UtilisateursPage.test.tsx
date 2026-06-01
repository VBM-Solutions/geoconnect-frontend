import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import UtilisateursPage from './UtilisateursPage';

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ toastSuccess: mockToastSuccess, toastError: mockToastError }),
}));

const listerUtilisateurs = vi.fn();
const activerUtilisateur = vi.fn();
const desactiverUtilisateur = vi.fn();
const reinitialiserMotDePasse = vi.fn();

vi.mock('../../api/admin', () => ({
  listerUtilisateurs: (...args: unknown[]) => listerUtilisateurs(...args),
  activerUtilisateur: (...args: unknown[]) => activerUtilisateur(...args),
  desactiverUtilisateur: (...args: unknown[]) => desactiverUtilisateur(...args),
  reinitialiserMotDePasse: (...args: unknown[]) => reinitialiserMotDePasse(...args),
}));

const utilisateurs = [
  { id: 1, login: 'zeta@test.fr', role: 'CLIENT', enabled: true, createdAt: '2026-01-01T09:00:00' },
  { id: 2, login: 'alpha@test.fr', role: 'ADMIN', enabled: true, createdAt: '2026-01-02T09:00:00' },
  { id: 3, login: 'beta@test.fr', role: 'BUREAU_ETUDE', enabled: true, createdAt: '2026-01-03T09:00:00' },
  { id: 4, login: 'charlie@test.fr', role: 'CLIENT', enabled: true, createdAt: '2026-01-04T09:00:00' },
  { id: 5, login: 'delta@test.fr', role: 'CLIENT', enabled: true, createdAt: '2026-01-05T09:00:00' },
  { id: 6, login: 'echo@test.fr', role: 'CLIENT', enabled: true, createdAt: '2026-01-06T09:00:00' },
  { id: 7, login: 'foxtrot@test.fr', role: 'CLIENT', enabled: true, createdAt: '2026-01-07T09:00:00' },
  { id: 8, login: 'golf@test.fr', role: 'CLIENT', enabled: true, createdAt: '2026-01-08T09:00:00' },
  { id: 9, login: 'inactive@test.fr', role: 'CLIENT', enabled: false, createdAt: '2025-01-09T09:00:00' },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <UtilisateursPage />
    </MemoryRouter>,
  );
}

describe('UtilisateursPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listerUtilisateurs.mockResolvedValue(utilisateurs);
    activerUtilisateur.mockResolvedValue(undefined);
    desactiverUtilisateur.mockResolvedValue(undefined);
    reinitialiserMotDePasse.mockResolvedValue(undefined);
  });

  it('charge et affiche la liste initiale paginee', async () => {
    renderPage();

    expect(await screen.findByText('alpha@test.fr')).toBeTruthy();
    expect(screen.queryByText('inactive@test.fr')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /suivant/i }));

    expect(await screen.findByText('inactive@test.fr')).toBeTruthy();
  });

  it('filtre par role et recherche', async () => {
    renderPage();

    await screen.findByText('alpha@test.fr');

    fireEvent.change(screen.getByDisplayValue('Tous les roles'), {
      target: { value: 'ADMIN' },
    });

    expect(screen.getByText('alpha@test.fr')).toBeTruthy();
    expect(screen.queryByText('beta@test.fr')).toBeNull();

    fireEvent.change(screen.getByPlaceholderText('Rechercher par email'), {
      target: { value: 'zzz' },
    });

    expect(screen.getByText(/aucun utilisateur ne correspond/i)).toBeTruthy();
  });

  it('trie par login', async () => {
    renderPage();

    await screen.findByText('alpha@test.fr');

    fireEvent.click(screen.getByRole('button', { name: /trier par login/i }));

    const rows = document.querySelectorAll('tbody tr');
    expect(rows.item(0).textContent).toContain('alpha@test.fr');
  });

  it('active un utilisateur inactif', async () => {
    renderPage();

    await screen.findByText('alpha@test.fr');
    fireEvent.click(screen.getByRole('button', { name: /suivant/i }));
    await screen.findByText('inactive@test.fr');

    fireEvent.click(screen.getByRole('button', { name: /^activer$/i }));

    await waitFor(() => {
      expect(activerUtilisateur).toHaveBeenCalledWith(9);
      expect(mockToastSuccess).toHaveBeenCalledWith('Compte active');
    });
  });

  it('desactive via la modale de confirmation', async () => {
    renderPage();

    await screen.findByText('alpha@test.fr');

    fireEvent.click(screen.getAllByRole('button', { name: /desactiver/i })[0]);
    const confirmButtons = screen.getAllByRole('button', { name: /^desactiver$/i });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(desactiverUtilisateur).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledWith('Compte desactive');
    });
  });

  it('ouvre la modale reset et envoie le nouveau mot de passe', async () => {
    renderPage();

    await screen.findByText('alpha@test.fr');

    fireEvent.click(screen.getAllByRole('button', { name: /reset mdp/i })[0]);

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), { target: { value: 'MotDePasse123!' } });
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), { target: { value: 'MotDePasse123!' } });
    fireEvent.click(screen.getByRole('button', { name: /^reinitialiser$/i }));

    await waitFor(() => {
      expect(reinitialiserMotDePasse).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledWith('Mot de passe reinitialise');
    });
  });

  it('affiche un toast en erreur de chargement', async () => {
    listerUtilisateurs.mockRejectedValueOnce(new Error('Erreur reseau'));

    renderPage();

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Erreur reseau');
    });
  });
});


