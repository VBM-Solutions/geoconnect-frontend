import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  depublierMonProfilPublic,
  getMaFicheBureauEtude,
  publierMonProfilPublic,
  updateMonProfilPublic,
  getMaPerformance,
  uploadMediaProfil,
  downloadMediaProfil,
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

  it('charge les performances sur la période demandée', async () => {
    const { default: api } = await import('./index');
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { etudesEnCours: 2 } });

    await expect(getMaPerformance('2026-08-01', '2026-08-21')).resolves.toEqual({ etudesEnCours: 2 });
    expect(api.get).toHaveBeenCalledWith('/bureauEtude/me/performance', {
      params: { debut: '2026-08-01', fin: '2026-08-21' },
    });
  });

  it('envoie un média de profil en multipart', async () => {
    const { default: api } = await import('./index');
    const file = new File(['image'], 'logo.png', { type: 'image/png' });
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { logoDocumentId: 4 } });

    await expect(uploadMediaProfil('LOGO', file)).resolves.toEqual({ logoDocumentId: 4 });
    const [url, body, config] = (api.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/bureauEtude/me/profil-public/media');
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('type')).toBe('LOGO');
    expect(body.get('file')).toBe(file);
    expect(config.headers['Content-Type']).toBeUndefined();
  });

  it('télécharge un média existant pour le recadrer', async () => {
    const { default: api } = await import('./index');
    const blob = new Blob(['image'], { type: 'image/webp' });
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({ data: blob });

    await expect(downloadMediaProfil(7)).resolves.toBe(blob);
    expect(api.get).toHaveBeenCalledWith('/public/profil-media/7', { responseType: 'blob' });
  });
});
