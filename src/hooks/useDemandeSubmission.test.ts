import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDemandeSubmission } from './useDemandeSubmission';
import * as demandeDevisApi from '../api/demandeDevis';
import * as documentApi from '../api/document';

vi.mock('../api/demandeDevis');
vi.mock('../api/document');

describe('useDemandeSubmission', () => {
  it('soumet avec succès documents + demande', async () => {
    vi.mocked(documentApi.uploadDocuments).mockResolvedValue([10, 11]);
    vi.mocked(demandeDevisApi.createDemandeDevis).mockResolvedValue({ id: 99 });
    const onSuccess = vi.fn();

    const { result } = renderHook(() => useDemandeSubmission({
      onSuccess,
      onError: vi.fn(),
    }));

    await result.current.submit(
      { clientId: 42, type: 'G0', adresseProjet: { rue: 'Rue', codePostal: '75001', ville: 'Paris' } } as any,
      [new File(['a'], 'f.pdf')],
    );

    expect(documentApi.uploadDocuments).toHaveBeenCalledWith(expect.any(Array));
    expect(demandeDevisApi.createDemandeDevis).toHaveBeenCalledWith(
      expect.objectContaining({ docsDevisIds: [10, 11] }),
    );
    expect(onSuccess).toHaveBeenCalledOnce();
    expect(result.current.isSubmitting).toBe(false);
  });

  it('gère une erreur API avec message backend', async () => {
    const axiosErr = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { data: { message: 'Erreur métier' } },
    });
    vi.mocked(documentApi.uploadDocuments).mockRejectedValue(axiosErr);
    const onError = vi.fn();

    const { result } = renderHook(() => useDemandeSubmission({
      onSuccess: vi.fn(),
      onError,
    }));

    await result.current.submit(
      { clientId: 42, type: 'G0', adresseProjet: { rue: 'Rue', codePostal: '75001', ville: 'Paris' } } as any,
      [],
    );

    expect(onError).toHaveBeenCalledWith('Erreur métier');
    expect(result.current.isSubmitting).toBe(false);
  });

  it('gère une erreur générique', async () => {
    vi.mocked(documentApi.uploadDocuments).mockRejectedValue(new Error('Network down'));
    const onError = vi.fn();

    const { result } = renderHook(() => useDemandeSubmission({
      onSuccess: vi.fn(),
      onError,
    }));

    await result.current.submit(
      { clientId: 42, type: 'G0', adresseProjet: { rue: 'Rue', codePostal: '75001', ville: 'Paris' } } as any,
      [],
    );

    expect(onError).toHaveBeenCalledWith('Network down');
    expect(result.current.isSubmitting).toBe(false);
  });
});
