import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createBureauEtude,
  updateBureauEtude,
  getBureauEtudeById,
  getAllBureauEtude,
  getCurrentBureauEtude,
  getBureauByUserId,
  deleteBureauEtude,
} from './bureauEtude';

vi.mock('./index', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}));

import api from './index';

const fakeBureau = { id: 10, raisonSociale: 'Bureau Test', siret: '12345678900001' };

beforeEach(() => vi.clearAllMocks());

describe('createBureauEtude', () => {
  it('appelle POST /bureauEtude et retourne la donnée', async () => {
    (api.post as any).mockResolvedValueOnce({ data: fakeBureau });
    const result = await createBureauEtude(fakeBureau as any);
    expect(api.post).toHaveBeenCalledWith('/bureauEtude', fakeBureau);
    expect(result).toEqual(fakeBureau);
  });

  it('propage l\'erreur', async () => {
    (api.post as any).mockRejectedValueOnce(new Error('Conflict'));
    await expect(createBureauEtude(fakeBureau as any)).rejects.toThrow('Conflict');
  });
});

describe('updateBureauEtude', () => {
  it('appelle PUT /bureauEtude et retourne la donnée mise à jour', async () => {
    const updated = { ...fakeBureau, raisonSociale: 'Bureau Modifié' };
    (api.put as any).mockResolvedValueOnce({ data: updated });
    const result = await updateBureauEtude(updated as any);
    expect(api.put).toHaveBeenCalledWith('/bureauEtude', updated);
    expect(result).toEqual(updated);
  });
});

describe('getBureauEtudeById', () => {
  it('appelle GET /bureauEtude/{id} et retourne le bureau', async () => {
    (api.get as any).mockResolvedValueOnce({ data: fakeBureau });
    const result = await getBureauEtudeById(10);
    expect(api.get).toHaveBeenCalledWith('/bureauEtude/10');
    expect(result).toEqual(fakeBureau);
  });

  it('propage l\'erreur si non trouvé', async () => {
    (api.get as any).mockRejectedValueOnce(new Error('Not found'));
    await expect(getBureauEtudeById(999)).rejects.toThrow('Not found');
  });
});

describe('getAllBureauEtude', () => {
  it('appelle GET /bureauEtude et retourne la liste', async () => {
    (api.get as any).mockResolvedValueOnce({ data: [fakeBureau] });
    const result = await getAllBureauEtude();
    expect(api.get).toHaveBeenCalledWith('/bureauEtude');
    expect(result).toEqual([fakeBureau]);
  });
});

describe('getBureauByUserId', () => {
  it('appelle GET /bureauEtude/me et retourne le bureau', async () => {
    (api.get as any).mockResolvedValueOnce({ data: fakeBureau });
    const result = await getBureauByUserId(1);
    expect(api.get).toHaveBeenCalledWith('/bureauEtude/me');
    expect(result).toEqual(fakeBureau);
  });

  it('retourne null si data est null/undefined', async () => {
    (api.get as any).mockResolvedValueOnce({ data: null });
    const result = await getBureauByUserId(1);
    expect(result).toBeNull();
  });

  it('propage l\'erreur réseau', async () => {
    (api.get as any).mockRejectedValueOnce(new Error('Unauthorized'));
    await expect(getBureauByUserId(1)).rejects.toThrow('Unauthorized');
  });
});

describe('getCurrentBureauEtude', () => {
  it('appelle GET /bureauEtude/me et retourne le bureau', async () => {
    (api.get as any).mockResolvedValueOnce({ data: fakeBureau });
    const result = await getCurrentBureauEtude();
    expect(api.get).toHaveBeenCalledWith('/bureauEtude/me');
    expect(result).toEqual(fakeBureau);
  });

  it('retourne null si data est null/undefined', async () => {
    (api.get as any).mockResolvedValueOnce({ data: null });
    const result = await getCurrentBureauEtude();
    expect(result).toBeNull();
  });
});

describe('deleteBureauEtude', () => {
  it('appelle DELETE /bureauEtude/{id}', async () => {
    (api.delete as any).mockResolvedValueOnce({});
    await deleteBureauEtude(10);
    expect(api.delete).toHaveBeenCalledWith('/bureauEtude/10');
  });
});

