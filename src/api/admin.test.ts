import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  activerUtilisateur,
  creerUtilisateur,
  desactiverUtilisateur,
  getUtilisateur,
  listerUtilisateurs,
  listerUtilisateursPagines,
  reinitialiserMotDePasse,
  renvoyerInvitationBureauEtude,
  supprimerInvitationBureauEtude,
} from './admin';

vi.mock('./index', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from './index';

const fakeUtilisateur = {
  id: 1,
  login: 'admin@test.fr',
  role: 'ADMIN',
  enabled: true,
  createdAt: '2026-01-01T10:00:00',
};

beforeEach(() => vi.clearAllMocks());

describe('listerUtilisateurs', () => {
  it('appelle GET /admin/utilisateurs et retourne la liste', async () => {
    (api.get as any).mockResolvedValueOnce({ data: [fakeUtilisateur] });

    const result = await listerUtilisateurs();

    expect(api.get).toHaveBeenCalledWith('/admin/utilisateurs');
    expect(result).toEqual([fakeUtilisateur]);
  });
});

describe('listerUtilisateursPagines', () => {
  it('transmet les paramètres et retourne les métadonnées', async () => {
    const page = { items: [fakeUtilisateur], page: 1, size: 25, totalItems: 30, totalPages: 2, hasNext: false };
    (api.get as any).mockResolvedValueOnce({ data: page });

    await expect(listerUtilisateursPagines(1, 25)).resolves.toEqual(page);
    expect(api.get).toHaveBeenCalledWith('/admin/utilisateurs/paged', {
      params: { page: 1, size: 25 },
    });
  });
});

describe('getUtilisateur', () => {
  it('appelle GET /admin/utilisateurs/{id}', async () => {
    (api.get as any).mockResolvedValueOnce({ data: fakeUtilisateur });

    const result = await getUtilisateur(1);

    expect(api.get).toHaveBeenCalledWith('/admin/utilisateurs/1');
    expect(result).toEqual(fakeUtilisateur);
  });
});

describe('creerUtilisateur', () => {
  it('appelle POST /admin/utilisateurs', async () => {
    const payload = { login: 'client@test.fr', motDePasse: 'MotDePasse123!', role: 'CLIENT' as const };
    (api.post as any).mockResolvedValueOnce({ data: { ...fakeUtilisateur, ...payload, id: 12 } });

    const result = await creerUtilisateur(payload);

    expect(api.post).toHaveBeenCalledWith('/admin/utilisateurs', payload);
    expect(result.id).toBe(12);
  });
});

describe('activerUtilisateur', () => {
  it('appelle PATCH /admin/utilisateurs/{id}/activer', async () => {
    (api.patch as any).mockResolvedValueOnce({});

    await activerUtilisateur(5);

    expect(api.patch).toHaveBeenCalledWith('/admin/utilisateurs/5/activer');
  });
});

describe('desactiverUtilisateur', () => {
  it('appelle PATCH /admin/utilisateurs/{id}/desactiver', async () => {
    (api.patch as any).mockResolvedValueOnce({});

    await desactiverUtilisateur(5);

    expect(api.patch).toHaveBeenCalledWith('/admin/utilisateurs/5/desactiver');
  });
});

describe('reinitialiserMotDePasse', () => {
  it('appelle PATCH /admin/utilisateurs/{id}/password', async () => {
    (api.patch as any).mockResolvedValueOnce({});

    await reinitialiserMotDePasse(5, 'Nouveau123!');

    expect(api.patch).toHaveBeenCalledWith('/admin/utilisateurs/5/password', { nouveauMotDePasse: 'Nouveau123!' });
  });
});

describe('gestion invitation BE', () => {
  it('renvoie une invitation', async () => {
    (api.post as any).mockResolvedValueOnce({});
    await renvoyerInvitationBureauEtude(8);
    expect(api.post).toHaveBeenCalledWith('/admin/utilisateurs/8/invitation');
  });

  it('supprime une invitation', async () => {
    (api.delete as any).mockResolvedValueOnce({});
    await supprimerInvitationBureauEtude(8);
    expect(api.delete).toHaveBeenCalledWith('/admin/utilisateurs/8/invitation');
  });
});

