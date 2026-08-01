import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
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

vi.mock('../../api', () => ({
  default: {
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

function makeAxiosError(status: number, message?: string) {
  return {
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

  it('redirige vers /login et appelle logout sur une erreur 401', async () => {
    renderSetup();
    const error = makeAxiosError(401);

    await expect(capturedErrorHandler!(error)).rejects.toBeDefined();

    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
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

