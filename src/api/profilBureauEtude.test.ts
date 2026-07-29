import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  depublierMonProfilPublic,
  getMaFicheBureauEtude,
  publierMonProfilPublic,
  updateMonProfilPublic,
} from './profilBureauEtude';

vi.mock('./index', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
  },
}));

describe('profilBureauEtude API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('charge la fiche privée du bureau connecté', async () => {
    const { default: api } = await import('./index');
    const fiche = { profilPublic: { slug: 'geo-44' }, activite: {} };
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: fiche });

    await expect(getMaFicheBureauEtude()).resolves.toEqual(fiche);
    expect(api.get).toHaveBeenCalledWith('/bureauEtude/me/fiche');
  });

  it('met à jour le profil public', async () => {
    const { default: api } = await import('./index');
    const payload = {
      afficherAdresseComplete: false,
      typesEtude: ['G2_AVP' as const],
      zonesIntervention: ['44'],
    };
    (api.put as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { slug: 'geo-44' } });

    await updateMonProfilPublic(payload);

    expect(api.put).toHaveBeenCalledWith('/bureauEtude/me/profil-public', payload);
  });

  it('publie et dépublie avec les endpoints de commande', async () => {
    const { default: api } = await import('./index');
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { slug: 'geo-44' } });

    await publierMonProfilPublic();
    await depublierMonProfilPublic();

    expect(api.post).toHaveBeenNthCalledWith(1, '/bureauEtude/me/profil-public/publier');
    expect(api.post).toHaveBeenNthCalledWith(2, '/bureauEtude/me/profil-public/depublier');
  });
});
