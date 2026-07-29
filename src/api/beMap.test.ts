import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getBEMapData } from './beMap';
import api from './index';

vi.mock('./index', () => ({
  default: {
    get: vi.fn(),
  },
}));

const fakeMapData = {
  bureau: { id: 1, raisonSociale: 'BE Test', latitude: 48.8566, longitude: 2.3522 },
  demandes: [],
  etudes: [],
};

beforeEach(() => vi.clearAllMocks());

describe('getBEMapData', () => {
  it('appelle la carte du BE sans filtre par defaut', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: fakeMapData });

    const result = await getBEMapData();

    expect(api.get).toHaveBeenCalledWith('/bureauEtude/me/carte', { params: {} });
    expect(result).toEqual(fakeMapData);
  });

  it('transmet les filtres a l API', async () => {
    const filters = {
      type: 'G2_AVP' as const,
      etatEtude: 'DEVIS_SIGNE' as const,
      kind: 'ETUDE_EN_COURS' as const,
      withArchived: false,
    };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: fakeMapData });

    await getBEMapData(filters);

    expect(api.get).toHaveBeenCalledWith('/bureauEtude/me/carte', { params: filters });
  });
});
