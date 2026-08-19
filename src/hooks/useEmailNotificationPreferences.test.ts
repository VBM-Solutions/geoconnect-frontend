import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getEmailNotificationPreferences, updateEmailNotificationPreferences } from '../api/parametres';
import { useEmailNotificationPreferences } from './useEmailNotificationPreferences';

vi.mock('../api/parametres', () => ({
  getEmailNotificationPreferences: vi.fn(),
  updateEmailNotificationPreferences: vi.fn(),
}));

describe('useEmailNotificationPreferences', () => {
  beforeEach(() => vi.clearAllMocks());

  it('charge les catégories actives', async () => {
    vi.mocked(getEmailNotificationPreferences).mockResolvedValue({ categoriesActives: ['OPPORTUNITES'] });
    const { result } = renderHook(() => useEmailNotificationPreferences());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.categoriesActives).toEqual(['OPPORTUNITES']);
    expect(result.current.loadError).toBeNull();
  });

  it('expose une erreur de chargement', async () => {
    vi.mocked(getEmailNotificationPreferences).mockRejectedValue(new Error('indisponible'));
    const { result } = renderHook(() => useEmailNotificationPreferences());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.loadError).toBe('Impossible de charger les préférences email.');
  });

  it('sauvegarde et remplace les catégories avec la réponse serveur', async () => {
    vi.mocked(getEmailNotificationPreferences).mockResolvedValue({ categoriesActives: [] });
    vi.mocked(updateEmailNotificationPreferences).mockResolvedValue({ categoriesActives: ['DOCUMENTS_LIVRABLES'] });
    const { result } = renderHook(() => useEmailNotificationPreferences());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let success = false;
    await act(async () => { success = await result.current.save(['DOCUMENTS_LIVRABLES']); });

    expect(success).toBe(true);
    expect(result.current.categoriesActives).toEqual(['DOCUMENTS_LIVRABLES']);
    expect(result.current.isSaving).toBe(false);
  });

  it('retourne false si la sauvegarde échoue', async () => {
    vi.mocked(getEmailNotificationPreferences).mockResolvedValue({ categoriesActives: [] });
    vi.mocked(updateEmailNotificationPreferences).mockRejectedValue(new Error('échec'));
    const { result } = renderHook(() => useEmailNotificationPreferences());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let success = true;
    await act(async () => { success = await result.current.save(['PROPOSITIONS']); });

    expect(success).toBe(false);
    expect(result.current.isSaving).toBe(false);
  });
});
