import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useClientParametres } from './useClientParametres';

vi.mock('../api/parametres', () => ({
  getClientProfil: vi.fn(),
  updateClientTelephone: vi.fn(),
  updateClientAdresseFacturation: vi.fn(),
  updateClientMotDePasse: vi.fn(),
}));

import {
  getClientProfil,
  updateClientAdresseFacturation,
  updateClientMotDePasse,
  updateClientTelephone,
} from '../api/parametres';

const fakeClient = {
  id: 12,
  civilite: 'MME',
  nom: 'Dupont',
  prenom: 'Jeanne',
  emailContact: 'jeanne.dupont@example.com',
  telContact: '0612345678',
  adresseFacturation: { rue: '12 rue de la Paix', codePostal: '75001', ville: 'Paris' },
  utilisateurId: 42,
};

describe('useClientParametres', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('charge le profil au montage', async () => {
    (getClientProfil as ReturnType<typeof vi.fn>).mockResolvedValue(fakeClient);

    const { result } = renderHook(() => useClientParametres());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.client).toEqual(fakeClient);
    expect(result.current.loadError).toBeNull();
  });

  it('positionne une erreur de chargement si le profil ne peut pas être récupéré', async () => {
    (getClientProfil as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useClientParametres());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.client).toBeNull();
    expect(result.current.loadError).toContain('Impossible de charger les paramètres');
  });

  it('saveTelephone met à jour le profil et les flags de chargement', async () => {
    (getClientProfil as ReturnType<typeof vi.fn>).mockResolvedValue(fakeClient);
    const updated = { ...fakeClient, telContact: '0698765432' };
    (updateClientTelephone as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

    const { result } = renderHook(() => useClientParametres());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let promise: Promise<any>;
    act(() => {
      promise = result.current.saveTelephone('0698765432');
    });
    expect(result.current.isSavingTelephone).toBe(true);

    await act(async () => {
      await promise!;
    });

    expect(updateClientTelephone).toHaveBeenCalledWith('0698765432');
    expect(result.current.client).toEqual(updated);
    expect(result.current.isSavingTelephone).toBe(false);
  });

  it('saveAdresseFacturation met à jour le profil et désactive le flag de sauvegarde', async () => {
    (getClientProfil as ReturnType<typeof vi.fn>).mockResolvedValue(fakeClient);
    const updated = { ...fakeClient, adresseFacturation: { rue: '8 avenue Montaigne', codePostal: '75008', ville: 'Paris' } };
    (updateClientAdresseFacturation as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

    const { result } = renderHook(() => useClientParametres());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.saveAdresseFacturation({ rue: '8 avenue Montaigne', codePostal: '75008', ville: 'Paris' });
    });

    expect(updateClientAdresseFacturation).toHaveBeenCalledWith({ rue: '8 avenue Montaigne', codePostal: '75008', ville: 'Paris' });
    expect(result.current.client).toEqual(updated);
    expect(result.current.isSavingAdresse).toBe(false);
  });

  it('saveMotDePasse appelle l API et gère le flag de sauvegarde', async () => {
    (getClientProfil as ReturnType<typeof vi.fn>).mockResolvedValue(fakeClient);
    let resolveSave!: () => void;
    (updateClientMotDePasse as ReturnType<typeof vi.fn>).mockReturnValue(new Promise<void>((resolve) => {
      resolveSave = resolve;
    }));

    const { result } = renderHook(() => useClientParametres());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      void result.current.saveMotDePasse({ ancienMotDePasse: 'ancien1234', nouveauMotDePasse: 'nouveau1234' });
    });
    expect(result.current.isSavingMotDePasse).toBe(true);

    await act(async () => {
      resolveSave();
    });

    expect(updateClientMotDePasse).toHaveBeenCalledWith({ ancienMotDePasse: 'ancien1234', nouveauMotDePasse: 'nouveau1234' });
    expect(result.current.isSavingMotDePasse).toBe(false);
  });
});


