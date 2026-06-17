import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createDemandeDevis,
  updateDemandeDevis,
  getDemandeDevisById,
  getAllDemandeDevis,
  deleteDemandeDevis,
} from './demandeDevis';

vi.mock('./index', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    delete: vi.fn(),
  },
}));

import api from './index';

const fakeDemande = {
  id: 7,
  description: 'Travaux toiture',
  clientId: 3,
  statut: 'EN_ATTENTE',
};

beforeEach(() => vi.clearAllMocks());

describe('createDemandeDevis', () => {
  it('appelle POST /demandeDevis et retourne la demande créée', async () => {
    (api.post as any).mockResolvedValueOnce({ data: fakeDemande });

    const result = await createDemandeDevis(fakeDemande as any);

    expect(api.post).toHaveBeenCalledWith('/demandeDevis', fakeDemande);
    expect(result).toEqual(fakeDemande);
  });

  it('propage l\'erreur', async () => {
    (api.post as any).mockRejectedValueOnce(new Error('Bad request'));

    await expect(createDemandeDevis(fakeDemande as any)).rejects.toThrow('Bad request');
  });
});

describe('updateDemandeDevis', () => {
  it('appelle PUT /demandeDevis et retourne la demande mise à jour', async () => {
    const updated = { ...fakeDemande, description: 'Travaux façade' };
    (api.put as any).mockResolvedValueOnce({ data: updated });

    const result = await updateDemandeDevis(updated as any);

    expect(api.put).toHaveBeenCalledWith('/demandeDevis', updated);
    expect(result).toEqual(updated);
  });

  it('propage l\'erreur', async () => {
    (api.put as any).mockRejectedValueOnce(new Error('Serveur KO'));

    await expect(updateDemandeDevis(fakeDemande as any)).rejects.toThrow('Serveur KO');
  });
});

describe('getDemandeDevisById', () => {
  it('appelle GET /demandeDevis/{id} et retourne la demande', async () => {
    (api.get as any).mockResolvedValueOnce({ data: fakeDemande });

    const result = await getDemandeDevisById(7);

    expect(api.get).toHaveBeenCalledWith('/demandeDevis/7');
    expect(result).toEqual(fakeDemande);
  });

  it('propage l\'erreur si non trouvé', async () => {
    (api.get as any).mockRejectedValueOnce(new Error('Not found'));

    await expect(getDemandeDevisById(999)).rejects.toThrow('Not found');
  });
});

describe('getAllDemandeDevis', () => {
  it('appelle GET /demandeDevis et retourne la liste complète', async () => {
    (api.get as any).mockResolvedValueOnce({ data: [fakeDemande] });

    const result = await getAllDemandeDevis();

    expect(api.get).toHaveBeenCalledWith('/demandeDevis');
    expect(result).toEqual([fakeDemande]);
  });

  it('retourne une liste vide si aucune demande', async () => {
    (api.get as any).mockResolvedValueOnce({ data: [] });

    const result = await getAllDemandeDevis();

    expect(result).toEqual([]);
  });
});

describe('deleteDemandeDevis', () => {
  it('appelle DELETE /demandeDevis/{id}', async () => {
    (api.delete as any).mockResolvedValueOnce({});

    await deleteDemandeDevis(7);

    expect(api.delete).toHaveBeenCalledWith('/demandeDevis/7');
  });

  it('propage l\'erreur', async () => {
    (api.delete as any).mockRejectedValueOnce(new Error('Forbidden'));

    await expect(deleteDemandeDevis(7)).rejects.toThrow('Forbidden');
  });
});

