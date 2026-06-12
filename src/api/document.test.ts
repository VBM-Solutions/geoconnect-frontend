import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { openDocument, downloadDocument, uploadDocument, uploadDocuments, deleteDocument } from './document';

vi.mock('./index', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('openDocument', () => {
  beforeEach(() => {
    vi.spyOn(window, 'open').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ouvre /api/documents/{id}/download/{nomTelechargement} — aucun token dans l\'URL', () => {
    openDocument(42, 'DUPONT_JEAN-G1-RAPPORT.pdf');

    expect(window.open).toHaveBeenCalledWith(
      '/api/documents/42/download/DUPONT_JEAN-G1-RAPPORT.pdf',
      '_blank',
    );
    const url = (window.open as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).not.toContain('token');
  });

  it('encode les caractères spéciaux dans nomTelechargement', () => {
    openDocument(42, 'MARTIN SOPHIE-G2_PRO-DEVIS SIGNÉ.pdf');

    const url = (window.open as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).not.toContain(' ');
    expect(url).not.toContain('É');
    expect(url).toContain('/api/documents/42/download/');
  });

  it('utilise "document-{id}.pdf" en fallback si nomTelechargement est absent', () => {
    openDocument(99);

    expect(window.open).toHaveBeenCalledWith(
      '/api/documents/99/download/document-99.pdf',
      '_blank',
    );
  });
});

describe('downloadDocument', () => {
  const mockBlob = new Blob(['content'], { type: 'application/pdf' });
  let clickedLinks: HTMLAnchorElement[] = [];

  beforeEach(() => {
    clickedLinks = [];
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url');
    vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);
    vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = { href: '', download: '', click: vi.fn() } as unknown as HTMLAnchorElement;
      if (tag === 'a') clickedLinks.push(el);
      return el as any;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('utilise nomTelechargement comme attribut download du lien', async () => {
    const { default: api } = await import('./index');
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockBlob, headers: {} });

    await downloadDocument(12, 'MARTIN_SOPHIE-G2_PRO-DEVIS_SIGNE.pdf');

    expect(clickedLinks[0].download).toBe('MARTIN_SOPHIE-G2_PRO-DEVIS_SIGNE.pdf');
    expect(clickedLinks[0].click).toHaveBeenCalled();
  });

  it('utilise "document-{id}" si nomTelechargement n\'est pas fourni', async () => {
    const { default: api } = await import('./index');
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockBlob, headers: {} });

    await downloadDocument(7);

    expect(clickedLinks[0].download).toBe('document-7');
  });
});

// ─── uploadDocument ───────────────────────────────────────────────────────────

describe('uploadDocument', () => {
  afterEach(() => vi.restoreAllMocks());

  it('envoie un POST /documents/upload avec un FormData et retourne le DocumentDTO', async () => {
    const fakeDoc = { id: 1, nomTelechargement: 'rapport.pdf', nomOriginal: 'rapport.pdf' };
    const { default: api } = await import('./index');
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: fakeDoc });

    const file = new File(['content'], 'rapport.pdf', { type: 'application/pdf' });
    const result = await uploadDocument(file);

    expect(api.post).toHaveBeenCalledOnce();
    const [url, body, config] = (api.post as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('/documents/upload');
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('file')).toBe(file);
    expect(config.headers['Content-Type']).toBeUndefined();
    expect(result).toEqual(fakeDoc);
  });

  it('propage l\'erreur si l\'upload échoue', async () => {
    const { default: api } = await import('./index');
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Payload too large'));

    const file = new File(['x'], 'big.pdf');
    await expect(uploadDocument(file)).rejects.toThrow('Payload too large');
  });
});

describe('uploadDocuments', () => {
  afterEach(() => vi.restoreAllMocks());

  it('upload les fichiers séquentiellement en les renommant avec un numéro et retourne les ids dans le même ordre', async () => {
    const { default: api } = await import('./index');
    (api.post as ReturnType<typeof vi.fn>).mockClear();
    (api.post as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: { id: 11, nomTelechargement: 'plan_1.pdf' } })
      .mockResolvedValueOnce({ data: { id: 22, nomTelechargement: 'photo_2.png' } });

    const files = [
      new File(['a'], 'plan.pdf', { type: 'application/pdf' }),
      new File(['b'], 'photo.png', { type: 'image/png' }),
    ];

    await expect(uploadDocuments(files)).resolves.toEqual([11, 22]);
    expect(api.post).toHaveBeenCalledTimes(2);

    // Vérifier que les fichiers ont été renommés avec des numéros
    const firstCall = (api.post as ReturnType<typeof vi.fn>).mock.calls[0];
    const secondCall = (api.post as ReturnType<typeof vi.fn>).mock.calls[1];

    const firstFormData = firstCall[1] as FormData;
    const secondFormData = secondCall[1] as FormData;

    const firstFile = firstFormData.get('file') as File;
    const secondFile = secondFormData.get('file') as File;

    expect(firstFile.name).toBe('plan_1.pdf');
    expect(secondFile.name).toBe('photo_2.png');
  });

  it('renomme les fichiers sans extension correctement', async () => {
    const { default: api } = await import('./index');
    (api.post as ReturnType<typeof vi.fn>).mockClear();
    (api.post as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ data: { id: 33 } });

    const files = [new File(['a'], 'README', { type: 'text/plain' })];

    await uploadDocuments(files);

    const call = (api.post as ReturnType<typeof vi.fn>).mock.calls[0];
    const formData = call[1] as FormData;
    const file = formData.get('file') as File;

    expect(file.name).toBe('README_1');
  });

  it('échoue si un document uploadé ne retourne pas d\'id', async () => {
    const { default: api } = await import('./index');
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { nomTelechargement: 'sans-id_1.pdf' } });

    await expect(uploadDocuments([new File(['a'], 'sans-id.pdf')])).rejects.toThrow('sans-id.pdf');
  });
});

// ─── deleteDocument ───────────────────────────────────────────────────────────

describe('deleteDocument', () => {
  afterEach(() => vi.restoreAllMocks());

  it('appelle DELETE /documents/{id}', async () => {
    const { default: api } = await import('./index');
    (api.delete as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

    await deleteDocument(42);

    expect(api.delete).toHaveBeenCalledWith('/documents/42');
  });

  it('propage l\'erreur si le document n\'existe pas', async () => {
    const { default: api } = await import('./index');
    (api.delete as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Not found'));

    await expect(deleteDocument(999)).rejects.toThrow('Not found');
  });
});

