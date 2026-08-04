import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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

function renderLayout(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/client/dashboard" element={<div>client</div>} />
          <Route path="/be/dashboard" element={<div>be</div>} />
          <Route path="/admin/utilisateurs" element={<div>admin</div>} />
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
});


