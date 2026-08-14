import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginCall, registerBureauEtudeCall, registerClientCall, logoutCall, confirmEmailCall, resendVerificationEmailCall, refreshCall, getSessionConfigCall } from './auth';

vi.mock('./index', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import api from './index';

const fakeAuthResponse = { userId: 1, login: 'user@test.com', role: 'CLIENT' as const };

beforeEach(() => vi.clearAllMocks());

describe('loginCall', () => {
  it('appelle POST /auth/login avec les credentials et retourne le DTO auth', async () => {
    (api.post as any).mockResolvedValueOnce({ data: fakeAuthResponse });

    const credentials = { login: 'user@test.com', password: 'secret' };
    const result = await loginCall(credentials);

    expect(api.post).toHaveBeenCalledWith('/auth/login', credentials);
    expect(result).toEqual(fakeAuthResponse);
  });

  it('propage l\'erreur si le serveur retourne 401', async () => {
    (api.post as any).mockRejectedValueOnce(new Error('Unauthorized'));

    await expect(loginCall({ login: 'bad', password: 'bad' })).rejects.toThrow('Unauthorized');
  });
});

describe('registerClientCall', () => {
  it('crée atomiquement le compte et le profil client', async () => {
    const registration = {
      login: 'client@test.com',
      password: 'Password123!',
      civilite: 'MR' as const,
      nom: 'Dupont',
      prenom: 'Jean',
      telContact: '0612345678',
      adresseFacturation: { rue: '12 rue de la Paix', codePostal: '75001', ville: 'Paris' },
      demande: { type: 'G0' as const, adresseProjet: { rue: '1 rue du Projet', codePostal: '75002', ville: 'Paris' } },
    };
    const response = { ...fakeAuthResponse, clientId: 10 };
    (api.post as any).mockResolvedValueOnce({ data: response });

    await expect(registerClientCall(registration)).resolves.toEqual(response);
    expect(api.post).toHaveBeenCalledWith('/auth/register/client', expect.any(FormData), {
      headers: { 'Content-Type': undefined },
    });
    const body = (api.post as any).mock.calls[0][1] as FormData;
    expect(body.get('registration')).toBeInstanceOf(Blob);
    expect(body.getAll('documents')).toHaveLength(0);
  });

  it('ajoute chaque document au multipart', async () => {
    (api.post as any).mockResolvedValueOnce({ data: fakeAuthResponse });
    const registration = { login: 'a@b.fr' } as any;
    const files = [new File(['a'], 'a.pdf'), new File(['b'], 'b.pdf')];
    await registerClientCall(registration, files);
    const body = (api.post as any).mock.calls[0][1] as FormData;
    expect(body.getAll('documents')).toEqual(files);
  });
});

describe('validation email', () => {
  it('confirme le jeton', async () => {
    (api.post as any).mockResolvedValueOnce({});
    await expect(confirmEmailCall('token')).resolves.toBeUndefined();
    expect(api.post).toHaveBeenCalledWith('/auth/email-verifications/confirm', { token: 'token' });
  });

  it('demande le renvoi pour le login', async () => {
    (api.post as any).mockResolvedValueOnce({});
    await expect(resendVerificationEmailCall('client@test.fr')).resolves.toBeUndefined();
    expect(api.post).toHaveBeenCalledWith('/auth/email-verifications/resend', { login: 'client@test.fr' });
  });
});

describe('registerBureauEtudeCall', () => {
  it('crée atomiquement le compte et le profil bureau d’études', async () => {
    const registration = {
      login: 'be@test.com',
      password: 'Password123!',
      raisonSociale: 'GeoExpert',
      telContact: '0612345678',
      adresse: { rue: '10 rue de la Géologie', codePostal: '75001', ville: 'Paris' },
    };
    const response = { ...fakeAuthResponse, role: 'BUREAU_ETUDE' as const, bureauEtudeId: 7 };
    (api.post as any).mockResolvedValueOnce({ data: response });

    await expect(registerBureauEtudeCall(registration)).resolves.toEqual(response);
    expect(api.post).toHaveBeenCalledWith('/auth/register/bureau-etude', registration);
  });
});

describe('logoutCall', () => {
  it('appelle POST /auth/logout et résout sans valeur', async () => {
    (api.post as any).mockResolvedValueOnce({});

    await expect(logoutCall()).resolves.toBeUndefined();
    expect(api.post).toHaveBeenCalledWith('/auth/logout');
  });

  it('propage l\'erreur réseau', async () => {
    (api.post as any).mockRejectedValueOnce(new Error('Network error'));

    await expect(logoutCall()).rejects.toThrow('Network error');
  });
});

describe('session', () => {
  it('renouvelle les cookies de session', async () => {
    (api.post as any).mockResolvedValueOnce({});

    await expect(refreshCall()).resolves.toBeUndefined();
    expect(api.post).toHaveBeenCalledWith('/auth/refresh');
  });

  it('charge la politique de session du backend', async () => {
    const config = {
      idleTimeoutMs: 1_200_000,
      warningDurationMs: 120_000,
      absoluteTimeoutMs: 36_000_000,
    };
    (api.get as any).mockResolvedValueOnce({ data: config });

    await expect(getSessionConfigCall()).resolves.toEqual(config);
    expect(api.get).toHaveBeenCalledWith('/auth/session-config');
  });
});

