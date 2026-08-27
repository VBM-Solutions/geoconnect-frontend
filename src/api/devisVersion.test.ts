import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './index';
import {
  deposerDernierDevisSigne, getDevisVersions, proposerDevisVersion,
  refuserDernierDevisSigne, validerDernierDevisSigne,
} from './devisVersion';

vi.mock('./index', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

describe('API des versions de devis', () => {
  beforeEach(() => vi.clearAllMocks());

  it('liste les versions dans une étude', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ id: 1, numero: 1 }] });
    expect(await getDevisVersions(8)).toHaveLength(1);
    expect(api.get).toHaveBeenCalledWith('/etude/8/devis-versions');
  });

  it('retourne une liste vide lorsque la réponse ne contient pas de données', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: undefined });
    expect(await getDevisVersions(8)).toEqual([]);
  });

  it('publie le PDF en multipart sans conserver le Content-Type JSON global', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 2, numero: 2 } });
    const file = new File(['pdf'], 'v2.pdf', { type: 'application/pdf' });
    await proposerDevisVersion(8, file);
    const [, form] = vi.mocked(api.post).mock.calls[0];
    expect(api.post).toHaveBeenCalledWith('/etude/8/devis-versions', expect.any(FormData), {
      headers: { 'Content-Type': undefined },
    });
    expect((form as FormData).get('file')).toBe(file);
  });

  it('dépose puis permet au BE de valider ou refuser le devis signé', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    vi.mocked(api.patch).mockResolvedValue({});
    vi.mocked(api.delete).mockResolvedValue({});
    await deposerDernierDevisSigne(8, new File(['pdf'], 'signe.pdf'));
    await validerDernierDevisSigne(8);
    await refuserDernierDevisSigne(8);
    expect(api.post).toHaveBeenCalledWith('/etude/8/devis-versions/signe', expect.any(FormData), {
      headers: { 'Content-Type': undefined },
    });
    expect(api.patch).toHaveBeenCalledWith('/etude/8/devis-versions/signe/validation');
    expect(api.delete).toHaveBeenCalledWith('/etude/8/devis-versions/signe');
  });
});
