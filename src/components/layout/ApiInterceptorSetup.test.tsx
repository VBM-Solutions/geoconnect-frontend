import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockToastError = vi.fn();
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ toastError: mockToastError }),
}));

const mockLogout = vi.fn();
let mockIsAuthenticated = true;
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ logout: mockLogout, isAuthenticated: mockIsAuthenticated }),
}));

// Stocke le handler d'erreur enregistré par l'intercepteur
let capturedErrorHandler: ((error: unknown) => Promise<unknown>) | null = null;
const mockEject = vi.fn();
const mockRequest = vi.fn();
const mockRefreshCall = vi.fn();

vi.mock('../../api/auth', () => ({
  refreshCall: () => mockRefreshCall(),
}));

vi.mock('../../api', () => ({
  default: {
    request: (...args: unknown[]) => mockRequest(...args),
    interceptors: {
      response: {
        use: vi.fn((_ok: unknown, onError: (e: unknown) => Promise<unknown>) => {
          capturedErrorHandler = onError;
          return 42; // id fictif
        }),
        eject: (id: number) => mockEject(id),
      },
    },
  },
}));

import { ApiInterceptorSetup } from './ApiInterceptorSetup';
import api from '../../api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeAxiosError(status: number, message?: string, url = '/client/me') {
  return {
    config: { url },
    response: {
      status,
      data: message ? { message } : {},
    },
  };
}

function renderSetup() {
  return render(React.createElement(ApiInterceptorSetup));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ApiInterceptorSetup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedErrorHandler = null;
    mockIsAuthenticated = true;
    mockRefreshCall.mockResolvedValue(undefined);
    mockRequest.mockResolvedValue({ data: 'retried' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('enregistre un intercepteur de réponse au montage', () => {
    renderSetup();
    expect(api.interceptors.response.use).toHaveBeenCalledOnce();
  });

  it('éjecte l\'intercepteur au démontage', () => {
    const { unmount } = renderSetup();
    unmount();
    expect(mockEject).toHaveBeenCalledWith(42);
  });

  it('rafraîchit le token puis rejoue la requête sur une erreur 401', async () => {
    renderSetup();
    const error = makeAxiosError(401);

    await expect(capturedErrorHandler!(error)).resolves.toEqual({ data: 'retried' });

    expect(mockRefreshCall).toHaveBeenCalledOnce();
    expect(mockRequest).toHaveBeenCalledWith(expect.objectContaining({
      url: '/client/me',
      _retryAfterRefresh: true,
    }));
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('déconnecte si le refresh échoue', async () => {
    mockRefreshCall.mockRejectedValueOnce(new Error('refresh refusé'));
    renderSetup();

    await expect(capturedErrorHandler!(makeAxiosError(401))).rejects.toBeDefined();

    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('ne tente pas de refresh en boucle pour une requête déjà rejouée', async () => {
    renderSetup();
    const error = makeAxiosError(401);
    error.config = { url: '/client/me', _retryAfterRefresh: true } as typeof error.config;

    await expect(capturedErrorHandler!(error)).rejects.toBeDefined();

    expect(mockRefreshCall).not.toHaveBeenCalled();
    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it('laisse les endpoints d\'authentification gérer leur propre erreur', async () => {
    renderSetup();

    await expect(capturedErrorHandler!(makeAxiosError(401, undefined, '/auth/refresh'))).rejects.toBeDefined();

    expect(mockRefreshCall).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('mutualise les refresh concurrents et rejoue toutes les requêtes', async () => {
    let resolveRefresh!: () => void;
    mockRefreshCall.mockReturnValueOnce(new Promise<void>(resolve => { resolveRefresh = resolve; }));
    renderSetup();

    const first = capturedErrorHandler!(makeAxiosError(401, undefined, '/client/me'));
    const second = capturedErrorHandler!(makeAxiosError(401, undefined, '/notifications/count'));
    resolveRefresh();

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(mockRefreshCall).toHaveBeenCalledOnce();
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });

  it('ne redirige pas un visiteur anonyme si un endpoint public retourne 401', async () => {
    mockIsAuthenticated = false;
    renderSetup();

    await expect(capturedErrorHandler!(makeAxiosError(401))).rejects.toBeDefined();

    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('appelle toastError avec le message backend sur une erreur 403', async () => {
    renderSetup();
    const error = makeAxiosError(403, 'Accès refusé : droits insuffisants');

    await expect(capturedErrorHandler!(error)).rejects.toBeDefined();

    expect(mockToastError).toHaveBeenCalledWith('Accès refusé : droits insuffisants');
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('utilise le message par défaut sur 403 sans message backend', async () => {
    renderSetup();
    const error = { response: { status: 403, data: {} } };

    await expect(capturedErrorHandler!(error)).rejects.toBeDefined();

    expect(mockToastError).toHaveBeenCalledWith(
      "Accès refusé : vous n'êtes pas autorisé à effectuer cette action.",
    );
  });

  it('ne fait rien de spécial sur une erreur 404 (laisse l\'appelant gérer)', async () => {
    renderSetup();
    const error = makeAxiosError(404);

    await expect(capturedErrorHandler!(error)).rejects.toBeDefined();

    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('ne fait rien de spécial sur une erreur réseau sans response', async () => {
    renderSetup();
    const error = new Error('Network Error');

    await expect(capturedErrorHandler!(error)).rejects.toBeDefined();

    expect(mockLogout).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('ne rend rien dans le DOM', () => {
    const { container } = renderSetup();
    expect(container.firstChild).toBeNull();
  });
});

