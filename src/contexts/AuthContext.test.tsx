import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { LAST_ACTIVITY_AT_KEY, SESSION_STARTED_AT_KEY } from '../lib/authSessionStorage';

vi.mock('../api/auth', () => ({
  logoutCall: vi.fn().mockResolvedValue(undefined),
}));

// Composant helper pour accéder au contexte dans les tests
const AuthConsumer: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="authenticated">{String(isAuthenticated)}</span>
      <span data-testid="userId">{user?.userId ?? 'none'}</span>
    </div>
  );
};

const AuthActionsConsumer: React.FC = () => {
  const { login, logout, user } = useAuth();
  return (
    <div>
      <span data-testid="userId">{user?.userId ?? 'none'}</span>
      <button onClick={() => login({ userId: 42, role: 'CLIENT', login: 'a@b.com' })}>
        login
      </button>
      <button onClick={logout}>logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("démarre en état chargement puis non authentifié si sessionStorage vide", async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('userId').textContent).toBe('none');
  });

  it("restaure l'utilisateur depuis sessionStorage au rechargement", async () => {
    const fakeUser = { userId: 1, role: 'CLIENT', login: 'test@test.com' };
    sessionStorage.setItem('user', JSON.stringify(fakeUser));

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('userId').textContent).toBe('1');
  });

  it("ne crashe pas si le JSON du sessionStorage est corrompu", async () => {
    sessionStorage.setItem('user', '{invalid-json}');

    expect(() =>
      render(
        <AuthProvider>
          <AuthConsumer />
        </AuthProvider>
      )
    ).not.toThrow();

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
  });

  it("login() stocke les infos utilisateur dans sessionStorage (sans token)", async () => {
    const { getByText } = render(
      <AuthProvider>
        <AuthActionsConsumer />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('userId').textContent).toBe('none');
    });

    act(() => { getByText('login').click(); });

    const stored = JSON.parse(sessionStorage.getItem('user')!);
    expect(stored.userId).toBe(42);
    expect(stored.token).toBeUndefined();
    expect(localStorage.getItem(SESSION_STARTED_AT_KEY)).toBeTruthy();
    expect(localStorage.getItem(LAST_ACTIVITY_AT_KEY)).toBeTruthy();
    expect(screen.getByTestId('userId').textContent).toBe('42');
  });

  it("logout() vide sessionStorage, appelle logoutCall et remet user à null", async () => {
    const { logoutCall } = await import('../api/auth');
    sessionStorage.setItem('user', JSON.stringify({ userId: 42, role: 'CLIENT', login: 'a@b.com' }));

    const { getByText } = render(
      <AuthProvider>
        <AuthActionsConsumer />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId('userId').textContent).toBe('42');
    });

    act(() => { getByText('logout').click(); });

    expect(sessionStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem(SESSION_STARTED_AT_KEY)).toBeNull();
    expect(localStorage.getItem(LAST_ACTIVITY_AT_KEY)).toBeNull();
    expect(screen.getByTestId('userId').textContent).toBe('none');
    expect(logoutCall).toHaveBeenCalledOnce();
  });

  it("useAuth() lève une erreur si utilisé hors AuthProvider", () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<AuthConsumer />)).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });
});

