import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useBureauEtudeIban } from './useBureauEtudeIban';

vi.mock('../api/bureauEtude', () => ({
  getCurrentBureauEtude: vi.fn(),
}));

vi.mock('../api/parametres', () => ({
  updateBureauEtudeIban: vi.fn(),
  updateBureauEtudeMotDePasse: vi.fn(),
}));

import { getCurrentBureauEtude } from '../api/bureauEtude';
import { updateBureauEtudeIban, updateBureauEtudeMotDePasse } from '../api/parametres';

const fakeBureau = {
  id: 3,
  raisonSociale: 'ABC Ingénierie',
  emailContact: 'contact@abc.fr',
  telContact: '0145678901',
  iban: 'FR7630006000011234567890189',
  adresse: { rue: '15 rue des Ingénieurs', codePostal: '69001', ville: 'Lyon' },
  utilisateurId: 9,
};

describe('useBureauEtudeIban', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('charge le bureau connecté au montage', async () => {
    (getCurrentBureauEtude as ReturnType<typeof vi.fn>).mockResolvedValue(fakeBureau);

    const { result } = renderHook(() => useBureauEtudeIban());
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.bureau).toEqual(fakeBureau);
  });

  it('positionne une erreur si le bureau ne peut pas être chargé', async () => {
    (getCurrentBureauEtude as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('403'));

    const { result } = renderHook(() => useBureauEtudeIban());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.loadError).toContain('Impossible de charger les paramètres');
  });

  it('saveIban met à jour le bureau et désactive le flag de sauvegarde', async () => {
    (getCurrentBureauEtude as ReturnType<typeof vi.fn>).mockResolvedValue(fakeBureau);
    const updated = { ...fakeBureau, iban: 'FR7612345678901234567890123' };
    (updateBureauEtudeIban as ReturnType<typeof vi.fn>).mockResolvedValue(updated);

    const { result } = renderHook(() => useBureauEtudeIban());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let promise: Promise<any>;
    act(() => {
      promise = result.current.saveIban('FR7612345678901234567890123');
    });
    expect(result.current.isSavingIban).toBe(true);

    await act(async () => {
      await promise!;
    });

    expect(updateBureauEtudeIban).toHaveBeenCalledWith('FR7612345678901234567890123');
    expect(result.current.bureau).toEqual(updated);
    expect(result.current.isSavingIban).toBe(false);
  });

  it('saveMotDePasse appelle l API BE et gère isSavingMotDePasse', async () => {
    (getCurrentBureauEtude as ReturnType<typeof vi.fn>).mockResolvedValue(fakeBureau);
    let resolveSave!: () => void;
    (updateBureauEtudeMotDePasse as ReturnType<typeof vi.fn>).mockReturnValue(new Promise<void>((resolve) => {
      resolveSave = resolve;
    }));

    const { result } = renderHook(() => useBureauEtudeIban());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      void result.current.saveMotDePasse({ ancienMotDePasse: 'ancien1234', nouveauMotDePasse: 'Nouveau123!' });
    });
    expect(result.current.isSavingMotDePasse).toBe(true);

    await act(async () => {
      resolveSave();
    });

    expect(updateBureauEtudeMotDePasse).toHaveBeenCalledWith({ ancienMotDePasse: 'ancien1234', nouveauMotDePasse: 'Nouveau123!' });
    expect(result.current.isSavingMotDePasse).toBe(false);
  });
});


