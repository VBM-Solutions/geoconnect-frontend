import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  proposerDateIntervention,
  validerDateIntervention,
  refuserDateIntervention,
  marquerInterventionEffectuee,
  terminerRapport,
  confirmerPaiement,
  attacherDevisSigne,
  uploaderDevisSigne,
  createEtude,
  updateEtude,
  getEtudesByBureauId,
  getEtudesByClientId,
  getEtudeDetailsByBureauId,
  getEtudeDetailsByBureauIdPaginated,
  getEtudeDetailsByClientId,
  getEtudeDetailsByClientIdPaginated,
  getEtudeDetailById,
  getEtudeDocuments,
  definirDateRenduPrevue,
  getEtudeIdsAEvaluer,
  getStatutEvaluation,
  evaluerEtude,
} from './etude';

vi.mock('./index', () => ({
  default: {
    get:    vi.fn(),
    post:   vi.fn(),
    put:    vi.fn(),
    patch:  vi.fn(),
    delete: vi.fn(),
  },
}));

import api from './index';

const fakeDetail = { id: 1, etat: 'DEVIS_VALIDE', bureauEtude: null, demandeDevis: null };
const fakeEtude  = { id: 1, etat: 'EN_COURS' };

beforeEach(() => vi.clearAllMocks());

describe('pagination des études client', () => {
  it('transmet catégorie, page et taille', async () => {
    const response = { items: [fakeDetail], page: 1, size: 8, totalItems: 9, totalPages: 2, hasNext: false };
    (api.get as any).mockResolvedValueOnce({ data: response });

    await expect(getEtudeDetailsByClientIdPaginated(3, 'ARCHIVED', 1, 8)).resolves.toEqual(response);
    expect(api.get).toHaveBeenCalledWith('/etude/client/3/details/paged', {
      params: { category: 'ARCHIVED', page: 1, size: 8 },
    });
  });
});

describe('évaluation d’étude', () => {
  it('charge en une requête les études encore à évaluer', async () => {
    (api.get as any).mockResolvedValueOnce({ data: [44, 42] });

    await expect(getEtudeIdsAEvaluer()).resolves.toEqual([44, 42]);
    expect(api.get).toHaveBeenCalledWith('/etude/evaluations/a-faire');
  });

  it('retourne une liste vide si aucune étude à évaluer n’est fournie', async () => {
    (api.get as any).mockResolvedValueOnce({ data: null });

    await expect(getEtudeIdsAEvaluer()).resolves.toEqual([]);
  });

  it('charge le statut de notation', async () => {
    (api.get as any).mockResolvedValueOnce({ data: { eligible: true } });

    await expect(getStatutEvaluation(42)).resolves.toEqual({ eligible: true });
    expect(api.get).toHaveBeenCalledWith('/etude/42/evaluation');
  });

  it('soumet les quatre critères au backend', async () => {
    const payload = {
      qualiteEchanges: 5,
      respectDelais: 4,
      qualiteRapport: 5,
    };
    (api.post as any).mockResolvedValueOnce({ data: { id: 1, ...payload } });

    await evaluerEtude(42, payload);

    expect(api.post).toHaveBeenCalledWith('/etude/42/evaluation', payload);
  });
});

// ─── Transitions d'état ───────────────────────────────────────────────────────

describe('proposerDateIntervention', () => {
  it('appelle PATCH /etude/{id}/proposer-date et retourne le détail', async () => {
    (api.patch as any).mockResolvedValueOnce({ data: fakeDetail });

    const result = await proposerDateIntervention(1, '2026-06-01');

    expect(api.patch).toHaveBeenCalledWith('/etude/1/proposer-date', { dateIntervention: '2026-06-01' });
    expect(result).toEqual(fakeDetail);
  });

  it('propage l\'erreur réseau', async () => {
    (api.patch as any).mockRejectedValueOnce(new Error('Network error'));
    await expect(proposerDateIntervention(1, '2026-06-01')).rejects.toThrow('Network error');
  });
});

describe('validerDateIntervention', () => {
  it('appelle PATCH /etude/{id}/valider-date', async () => {
    (api.patch as any).mockResolvedValueOnce({ data: fakeDetail });
    const result = await validerDateIntervention(1);
    expect(api.patch).toHaveBeenCalledWith('/etude/1/valider-date');
    expect(result).toEqual(fakeDetail);
  });
});

describe('refuserDateIntervention', () => {
  it('appelle PATCH /etude/{id}/refuser-date', async () => {
    (api.patch as any).mockResolvedValueOnce({ data: fakeDetail });
    const result = await refuserDateIntervention(1);
    expect(api.patch).toHaveBeenCalledWith('/etude/1/refuser-date');
    expect(result).toEqual(fakeDetail);
  });
});

describe('marquerInterventionEffectuee', () => {
  it('appelle PATCH /etude/{id}/intervention-effectuee', async () => {
    (api.patch as any).mockResolvedValueOnce({ data: fakeDetail });
    const result = await marquerInterventionEffectuee(1);
    expect(api.patch).toHaveBeenCalledWith('/etude/1/intervention-effectuee');
    expect(result).toEqual(fakeDetail);
  });
});

describe('terminerRapport', () => {
  it('appelle PATCH /etude/{id}/rapport-termine avec rapportId uniquement (dateRendu fixée automatiquement par le backend)', async () => {
    (api.patch as any).mockResolvedValueOnce({ data: fakeDetail });
    const result = await terminerRapport(1, 99);
    expect(api.patch).toHaveBeenCalledWith('/etude/1/rapport-termine', { rapportId: 99 });
    expect(result).toEqual(fakeDetail);
  });

  it('propage l\'erreur réseau', async () => {
    (api.patch as any).mockRejectedValueOnce(new Error('Network error'));
    await expect(terminerRapport(1, 99)).rejects.toThrow('Network error');
  });
});

describe('confirmerPaiement', () => {
  it('appelle PATCH /etude/{id}/paiement-effectue', async () => {
    (api.patch as any).mockResolvedValueOnce({ data: fakeDetail });
    const result = await confirmerPaiement(1);
    expect(api.patch).toHaveBeenCalledWith('/etude/1/paiement-effectue');
    expect(result).toEqual(fakeDetail);
  });
});

describe('attacherDevisSigne', () => {
  it('appelle PATCH /etude/{id}/devis-signe avec documentId', async () => {
    (api.patch as any).mockResolvedValueOnce({ data: fakeDetail });
    const result = await attacherDevisSigne(1, 55);
    expect(api.patch).toHaveBeenCalledWith('/etude/1/devis-signe', { documentId: 55 });
    expect(result).toEqual(fakeDetail);
  });
});

describe('definirDateRenduPrevue', () => {
  it('appelle PATCH /etude/{id}/date-rendu-prevue avec la date fournie', async () => {
    (api.patch as any).mockResolvedValueOnce({ data: fakeDetail });
    const result = await definirDateRenduPrevue(1, '2026-08-15');
    expect(api.patch).toHaveBeenCalledWith('/etude/1/date-rendu-prevue', { dateRenduPrevue: '2026-08-15' });
    expect(result).toEqual(fakeDetail);
  });
});

// ─── uploaderDevisSigne ───────────────────────────────────────────────────────

describe('uploaderDevisSigne', () => {
  it('envoie un POST multipart /etude/{id}/devis-signe/upload avec le fichier', async () => {
    (api.post as any).mockResolvedValueOnce({ data: undefined });

    const file = new File(['data'], 'devis-signe.pdf', { type: 'application/pdf' });
    await uploaderDevisSigne(1, file);

    expect(api.post).toHaveBeenCalledOnce();
    const [url, body, config] = (api.post as any).mock.calls[0];
    expect(url).toBe('/etude/1/devis-signe/upload');
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('file')).toBe(file);
    expect(config.headers['Content-Type']).toBeUndefined();
  });

  it('propage l\'erreur réseau', async () => {
    (api.post as any).mockRejectedValueOnce(new Error('Network error'));
    const file = new File(['data'], 'devis-signe.pdf');
    await expect(uploaderDevisSigne(1, file)).rejects.toThrow('Network error');
  });

  it('propage l\'erreur 403 si l\'étude n\'appartient pas au client', async () => {
    const err = { response: { status: 403, data: { message: 'Accès refusé : droits insuffisants' } } };
    (api.post as any).mockRejectedValueOnce(err);
    const file = new File(['data'], 'devis-signe.pdf');
    await expect(uploaderDevisSigne(1, file)).rejects.toEqual(err);
  });
});

// ─── CRUD de base ─────────────────────────────────────────────────────────────

describe('createEtude', () => {
  it('appelle POST /etude et retourne la donnée', async () => {
    (api.post as any).mockResolvedValueOnce({ data: fakeEtude });
    const result = await createEtude(fakeEtude as any);
    expect(api.post).toHaveBeenCalledWith('/etude', fakeEtude);
    expect(result).toEqual(fakeEtude);
  });
});

describe('updateEtude', () => {
  it('appelle PUT /etude et retourne la donnée', async () => {
    (api.put as any).mockResolvedValueOnce({ data: fakeEtude });
    const result = await updateEtude(fakeEtude as any);
    expect(api.put).toHaveBeenCalledWith('/etude', fakeEtude);
    expect(result).toEqual(fakeEtude);
  });
});

describe('getEtudesByBureauId', () => {
  it('retourne la liste des études pour un bureau', async () => {
    (api.get as any).mockResolvedValueOnce({ data: [fakeEtude] });
    const result = await getEtudesByBureauId(10);
    expect(api.get).toHaveBeenCalledWith('/etude/bureauEtude/10');
    expect(result).toEqual([fakeEtude]);
  });

  it('retourne [] si data est null/undefined', async () => {
    (api.get as any).mockResolvedValueOnce({ data: null });
    const result = await getEtudesByBureauId(10);
    expect(result).toEqual([]);
  });
});

describe('getEtudesByClientId', () => {
  it('retourne la liste des études pour un client', async () => {
    (api.get as any).mockResolvedValueOnce({ data: [fakeEtude] });
    const result = await getEtudesByClientId(5);
    expect(api.get).toHaveBeenCalledWith('/etude/client/5');
    expect(result).toEqual([fakeEtude]);
  });

  it('retourne [] si data est null/undefined', async () => {
    (api.get as any).mockResolvedValueOnce({ data: undefined });
    const result = await getEtudesByClientId(5);
    expect(result).toEqual([]);
  });
});

describe('scoped etude details', () => {
  it('retourne tous les détails du bureau en un appel', async () => {
    (api.get as any).mockResolvedValueOnce({ data: [fakeDetail] });
    await expect(getEtudeDetailsByBureauId(10)).resolves.toEqual([fakeDetail]);
    expect(api.get).toHaveBeenCalledWith('/etude/bureauEtude/10/details');
  });

  it('retourne tous les détails du client en un appel', async () => {
    (api.get as any).mockResolvedValueOnce({ data: [fakeDetail] });
    await expect(getEtudeDetailsByClientId(5)).resolves.toEqual([fakeDetail]);
    expect(api.get).toHaveBeenCalledWith('/etude/client/5/details');
  });

  it('normalise une réponse vide', async () => {
    (api.get as any).mockResolvedValueOnce({ data: null });
    await expect(getEtudeDetailsByClientId(5)).resolves.toEqual([]);
  });
});

describe('getEtudeDetailById', () => {
  it('appelle GET /etude/{id}/detail et retourne le détail', async () => {
    (api.get as any).mockResolvedValueOnce({ data: fakeDetail });
    const result = await getEtudeDetailById(1);
    expect(api.get).toHaveBeenCalledWith('/etude/1/detail');
    expect(result).toEqual(fakeDetail);
  });

  it('propage l\'erreur', async () => {
    (api.get as any).mockRejectedValueOnce(new Error('Not found'));
    await expect(getEtudeDetailById(999)).rejects.toThrow('Not found');
  });

});

describe('getEtudeDocuments', () => {
  it('appelle GET /etude/{id}/documents et retourne le DTO', async () => {
    const fakeDocs = {
      documentsDemandeDevis: [{ id: 1, nomTelechargement: 'doc1.pdf' }],
      devisPdf: { id: 2, nomTelechargement: 'devis.pdf' },
    };
    (api.get as any).mockResolvedValueOnce({ data: fakeDocs });
    const result = await getEtudeDocuments(1);
    expect(api.get).toHaveBeenCalledWith('/etude/1/documents');
    expect(result).toEqual(fakeDocs);
  });

  it('propage l\'erreur', async () => {
    (api.get as any).mockRejectedValueOnce(new Error('Forbidden'));
    await expect(getEtudeDocuments(999)).rejects.toThrow('Forbidden');
  });
});

describe('getEtudeDetailsByBureauIdPaginated', () => {
  it('transmet la catégorie et les valeurs de pagination', async () => {
    const response = { items: [], page: 2, size: 12, totalItems: 0, totalPages: 0, hasNext: false };
    (api.get as any).mockResolvedValueOnce({ data: response });
    await expect(getEtudeDetailsByBureauIdPaginated(10, 'ARCHIVED', 2, 12)).resolves.toEqual(response);
    expect(api.get).toHaveBeenCalledWith('/etude/bureauEtude/10/details/paged', {
      params: { category: 'ARCHIVED', page: 2, size: 12 },
    });
  });
});

it('normalise une réponse vide pour les détails bureau', async () => {
  (api.get as any).mockResolvedValueOnce({ data: undefined });
  await expect(getEtudeDetailsByBureauId(10)).resolves.toEqual([]);
});

