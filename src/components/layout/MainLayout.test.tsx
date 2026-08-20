import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import MainLayout from './MainLayout';

const useAuthMock = vi.fn();
const useNotificationsMock = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => useNotificationsMock(),
}));

vi.mock('../../api/client', () => ({
  getClientByUserId: vi.fn().mockResolvedValue({ prenom: 'Jean', nom: 'Dupont' }),
}));

vi.mock('../../api/bureauEtude', () => ({
  getBureauByUserId: vi.fn().mockResolvedValue({ raisonSociale: 'ABC Ingénierie' }),
}));

vi.mock('../ui/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

vi.mock('../ui/ParametresButton', () => ({
  ParametresButton: ({ to }: { to: string }) => <div data-testid="parametres-button" data-to={to} />,
}));

function LoginDestination() {
  const location = useLocation();
  return <div>login-state:{location.state === null ? 'cleared' : 'present'}</div>;
}

function renderLayout(path: string, state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state }]}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<div>public</div>} />
          <Route path="/client/dashboard" element={<div>client</div>} />
          <Route path="/be/dashboard" element={<div>be</div>} />
          <Route path="/admin/utilisateurs" element={<div>admin</div>} />
          <Route path="/login" element={<LoginDestination />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('MainLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotificationsMock.mockReturnValue({
      unreadCount: 0,
      notifications: [],
      isLoadingList: false,
      listError: null,
      loadNotifications: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
    });
  });

  it('affiche le bouton paramètres client avec la bonne route', async () => {
    useAuthMock.mockReturnValue({
      user: { role: 'CLIENT', userId: 1, login: 'client' },
      logout: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    });

    renderLayout('/client/dashboard');

    await waitFor(() => expect(screen.getByTestId('parametres-button').getAttribute('data-to')).toBe('/client/parametres'));
    expect(screen.getByText('client').closest('main')).toHaveClass('px-4', 'lg:px-8', 'xl:px-10', 'overflow-auto');
    expect(screen.getByText(/serveur opérationnel/i)).toBeVisible();
  });

  it('affiche le bouton paramètres BE avec la bonne route', async () => {
    useAuthMock.mockReturnValue({
      user: { role: 'BUREAU_ETUDE', userId: 2, login: 'be' },
      logout: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    });

    renderLayout('/be/dashboard');

    await waitFor(() => expect(screen.getByTestId('parametres-button').getAttribute('data-to')).toBe('/be/parametres'));
    expect(screen.getByRole('link', { name: 'Accueil' }).getAttribute('href')).toBe('/be/dashboard');
    expect(screen.queryByRole('link', { name: /marketplace/i })).toBeNull();
    expect(screen.getByRole('link', { name: /ma fiche/i }).getAttribute('href')).toBe('/be/ma-fiche');
  });

  it('n’affiche pas de bouton paramètres pour l’admin', () => {
    useAuthMock.mockReturnValue({
      user: { role: 'ADMIN', userId: 3, login: 'admin' },
      logout: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    });

    renderLayout('/admin/utilisateurs');

    expect(screen.queryByTestId('parametres-button')).toBeNull();
  });

  it('purge la destination précédente lors de la déconnexion manuelle', async () => {
    const logout = vi.fn();
    useAuthMock.mockReturnValue({
      user: { role: 'CLIENT', userId: 1, login: 'client' },
      logout,
      isAuthenticated: true,
      isLoading: false,
    });

    renderLayout('/client/dashboard', { returnTo: '/be/demande/12' });
    await userEvent.click(screen.getByTitle('Se déconnecter'));

    expect(await screen.findByText('login-state:cleared')).toBeVisible();
    expect(logout).toHaveBeenCalledOnce();
  });

  it('affiche la marque, la navigation éditoriale et les liens légaux au public', () => {
    useAuthMock.mockReturnValue({
      user: null,
      logout: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
    });

    renderLayout('/');

    expect(screen.getByRole('img', { name: 'Mon étude de sol.fr' })).toBeVisible();
    expect(screen.getByRole('link', { name: /comment ça marche/i })).toHaveAttribute('href', '/#fonctionnement');
    expect(screen.getByRole('link', { name: /conditions générales/i })).toHaveAttribute('href', '#conditions');
    expect(screen.getByText(/© 2026 Mon Étude de Sol SAS/i)).toBeVisible();
    expect(screen.queryByText(/serveur opérationnel/i)).toBeNull();
  });
});


