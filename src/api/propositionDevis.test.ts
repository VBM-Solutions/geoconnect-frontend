import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createPropositionDevis,
  findActivePropositionAfterUncertainSubmission,
  getPropositionDevisById,
  getPropositionDevisByDemandeId,
  getPropositionsByDemandeIds,
  getPropositionDevisByBureauId,
  accepterPropositionDevis,
  refuserPropositionDevis,
  deletePropositionDevis, modifierPropositionDevis,
} from './propositionDevis';

vi.mock('./index', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    patch:  vi.fn(),
    delete: vi.fn(),
  },
}));

import api from './index';

const fakeProposition = { id: 5, bureauEtudeId: 10, demandeDevisId: 1, statut: 'EN_ATTENTE', montant: 1500 };

beforeEach(() => vi.clearAllMocks());

describe('createPropositionDevis', () => {
  it('appelle POST /propositionDevis et retourne la donnée', async () => {
    (api.post as any).mockResolvedValueOnce({ data: fakeProposition });
    const result = await createPropositionDevis(fakeProposition as any);
    expect(api.post).toHaveBeenCalledWith('/propositionDevis', fakeProposition);
    expect(result).toEqual(fakeProposition);
  });

  it('propage l\'erreur', async () => {
    (api.post as any).mockRejectedValueOnce(new Error('Bad request'));
    await expect(createPropositionDevis(fakeProposition as any)).rejects.toThrow('Bad request');
  });
});

describe('findActivePropositionAfterUncertainSubmission', () => {
  it('retrouve la proposition active du bureau avec un timeout court', async () => {
    const refused = { ...fakeProposition, id: 4, statut: 'REFUSEE' };
    (api.get as any).mockResolvedValueOnce({ data: [refused, fakeProposition] });

    await expect(findActivePropositionAfterUncertainSubmission(1, 10))
      .resolves.toEqual(fakeProposition);
    expect(api.get).toHaveBeenCalledWith('/propositionDevis/devis/1', { timeout: 15_000 });
  });

  it('retourne null sans proposition active appartenant au bureau', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: [{ ...fakeProposition, bureauEtudeId: 11, statut: 'EN_ATTENTE' }],
    });
    await expect(findActivePropositionAfterUncertainSubmission(1, 10)).resolves.toBeNull();
  });
});

describe('getPropositionDevisById', () => {
  it('appelle GET /propositionDevis/{id} et retourne la proposition', async () => {
    (api.get as any).mockResolvedValueOnce({ data: fakeProposition });
    const result = await getPropositionDevisById(5);
    expect(api.get).toHaveBeenCalledWith('/propositionDevis/5');
    expect(result).toEqual(fakeProposition);
  });

  it('propage l\'erreur si non trouvé', async () => {
    (api.get as any).mockRejectedValueOnce(new Error('Not found'));
    await expect(getPropositionDevisById(999)).rejects.toThrow('Not found');
  });
});

describe('getPropositionDevisByDemandeId', () => {
  it('appelle GET /propositionDevis/devis/{demandeId} et retourne la liste', async () => {
    (api.get as any).mockResolvedValueOnce({ data: [fakeProposition] });
    const result = await getPropositionDevisByDemandeId(1);
    expect(api.get).toHaveBeenCalledWith('/propositionDevis/devis/1');
    expect(result).toEqual([fakeProposition]);
  });
});

describe('getPropositionsByDemandeIds', () => {
  it('regroupe les identifiants dans un seul appel GET', async () => {
    const grouped = { 1: [fakeProposition], 2: [] };
    (api.get as any).mockResolvedValueOnce({ data: grouped });

    const result = await getPropositionsByDemandeIds([1, 2, 1]);

    expect(api.get).toHaveBeenCalledWith('/propositionDevis/devis', {
      params: { ids: '1,2' },
    });
    expect(result).toEqual(grouped);
  });

  it('ne fait aucun appel pour une liste vide', async () => {
    await expect(getPropositionsByDemandeIds([])).resolves.toEqual({});
    expect(api.get).not.toHaveBeenCalled();
  });

  it('retourne un objet vide quand le backend ne renvoie aucune donnée', async () => {
    (api.get as any).mockResolvedValueOnce({ data: null });
    await expect(getPropositionsByDemandeIds([1])).resolves.toEqual({});
  });
});

describe('getPropositionDevisByBureauId', () => {
  it('appelle GET /propositionDevis/bureauEtude/{bureauId} et retourne la liste', async () => {
    (api.get as any).mockResolvedValueOnce({ data: [fakeProposition] });
    const result = await getPropositionDevisByBureauId(10);
    expect(api.get).toHaveBeenCalledWith('/propositionDevis/bureauEtude/10');
    expect(result).toEqual([fakeProposition]);
  });
});

describe('accepterPropositionDevis', () => {
  it('appelle PATCH /propositionDevis/{id}/accepter', async () => {
    const accepted = { ...fakeProposition, statut: 'ACCEPTEE' };
    (api.patch as any).mockResolvedValueOnce({ data: accepted });
    const result = await accepterPropositionDevis(5);
    expect(api.patch).toHaveBeenCalledWith('/propositionDevis/5/accepter');
    expect(result).toEqual(accepted);
  });
});

describe('refuserPropositionDevis', () => {
  it('appelle PATCH /propositionDevis/{id}/refuser', async () => {
    const refused = { ...fakeProposition, statut: 'REFUSEE' };
    (api.patch as any).mockResolvedValueOnce({ data: refused });
    const result = await refuserPropositionDevis(5);
    expect(api.patch).toHaveBeenCalledWith('/propositionDevis/5/refuser');
    expect(result).toEqual(refused);
  });
});

describe('deletePropositionDevis', () => {
  it('appelle DELETE /propositionDevis/{id}', async () => {
    (api.delete as any).mockResolvedValueOnce({});
    await deletePropositionDevis(5);
    expect(api.delete).toHaveBeenCalledWith('/propositionDevis/5');
  });
});

describe('modifierPropositionDevis', () => {
  it('appelle le PATCH de modification', async () => {
    const payload = { prix: 1200, delaiMaxIntervention: 2, delaiMaxRendu: 4 };
    (api.patch as any).mockResolvedValueOnce({ data: fakeProposition });
    await expect(modifierPropositionDevis(5, payload)).resolves.toEqual(fakeProposition);
    expect(api.patch).toHaveBeenCalledWith('/propositionDevis/5', payload);
  });
});

