import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useFicheBureauEtude } from './useFicheBureauEtude';

vi.mock('../api/profilBureauEtude', () => ({
  getMaFicheBureauEtude: vi.fn(),
  updateMonProfilPublic: vi.fn(),
  publierMonProfilPublic: vi.fn(),
  depublierMonProfilPublic: vi.fn(),
}));

import {
  depublierMonProfilPublic,
  getMaFicheBureauEtude,
  publierMonProfilPublic,
  updateMonProfilPublic,
} from '../api/profilBureauEtude';

const profile = {
  slug: 'geo-44',
  statut: 'BROUILLON' as const,
  raisonSociale: 'Geo 44',
  afficherAdresseComplete: false,
  typesEtude: ['G2_AVP' as const],
  zonesIntervention: ['44'],
};
const fiche = {
  profilPublic: profile,
  activite: {
    nombreDemandesRepondues: 1,
    nombrePropositionsEnvoyees: 1,
    nombrePropositionsAcceptees: 0,
    tauxAcceptation: 0,
    nombreRapportsRendus: 0,
    nombreRapportsRendusMoisCourant: 0,
  },
};
const payload = {
  descriptionCourte: 'Bureau spécialisé dans les études géotechniques pour vos projets.',
  afficherAdresseComplete: false,
  typesEtude: ['G2_AVP' as const],
  zonesIntervention: ['44'],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('useFicheBureauEtude', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getMaFicheBureauEtude as ReturnType<typeof vi.fn>).mockResolvedValue(fiche);
  });

  it('charge la fiche au montage', async () => {
    const { result } = renderHook(() => useFicheBureauEtude());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.fiche).toEqual(fiche);
  });

  it('expose une erreur lorsque le chargement échoue', async () => {
    (getMaFicheBureauEtude as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Service indisponible'),
    );
    const { result } = renderHook(() => useFicheBureauEtude());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.loadError).toBe('Service indisponible');
    expect(result.current.fiche).toBeNull();
  });

  it('ignore le résultat du chargement après démontage', async () => {
    const request = deferred<typeof fiche>();
    (getMaFicheBureauEtude as ReturnType<typeof vi.fn>).mockReturnValue(request.promise);
    const { unmount } = renderHook(() => useFicheBureauEtude());

    unmount();
    await act(async () => request.resolve(fiche));

    expect(getMaFicheBureauEtude).toHaveBeenCalledOnce();
  });

  it('ignore également une erreur de chargement après démontage', async () => {
    const request = deferred<typeof fiche>();
    (getMaFicheBureauEtude as ReturnType<typeof vi.fn>).mockReturnValue(request.promise);
    const { unmount } = renderHook(() => useFicheBureauEtude());

    unmount();
    await act(async () => request.reject(new Error('Service indisponible')));

    expect(getMaFicheBureauEtude).toHaveBeenCalledOnce();
  });

  it('sauvegarde le brouillon et remplace le profil sans perdre les statistiques', async () => {
    const updated = { ...profile, descriptionCourte: payload.descriptionCourte };
    (updateMonProfilPublic as ReturnType<typeof vi.fn>).mockResolvedValue(updated);
    const { result } = renderHook(() => useFicheBureauEtude());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => result.current.save(payload));

    expect(result.current.fiche?.profilPublic).toEqual(updated);
    expect(result.current.fiche?.activite).toEqual(fiche.activite);
  });

  it('conserve une fiche absente lorsqu’une sauvegarde précède le chargement', async () => {
    const loadRequest = deferred<typeof fiche>();
    (getMaFicheBureauEtude as ReturnType<typeof vi.fn>).mockReturnValue(loadRequest.promise);
    (updateMonProfilPublic as ReturnType<typeof vi.fn>).mockResolvedValue(profile);
    const { result, unmount } = renderHook(() => useFicheBureauEtude());

    await act(() => result.current.save(payload));

    expect(result.current.fiche).toBeNull();
    unmount();
  });

  it('ignore la fin d’une action après démontage', async () => {
    const updateRequest = deferred<typeof profile>();
    (updateMonProfilPublic as ReturnType<typeof vi.fn>).mockReturnValue(updateRequest.promise);
    const { result, unmount } = renderHook(() => useFicheBureauEtude());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const saving = result.current.save(payload);
    unmount();
    await act(async () => updateRequest.resolve(profile));
    await saving;

    expect(updateMonProfilPublic).toHaveBeenCalledWith(payload);
  });

  it('sauvegarde avant de publier', async () => {
    const published = { ...profile, statut: 'PUBLIE' as const };
    (updateMonProfilPublic as ReturnType<typeof vi.fn>).mockResolvedValue(profile);
    (publierMonProfilPublic as ReturnType<typeof vi.fn>).mockResolvedValue(published);
    const { result } = renderHook(() => useFicheBureauEtude());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => result.current.publish(payload));

    expect(updateMonProfilPublic).toHaveBeenCalledWith(payload);
    expect(publierMonProfilPublic).toHaveBeenCalledOnce();
    expect(
      (updateMonProfilPublic as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0],
    ).toBeLessThan(
      (publierMonProfilPublic as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0],
    );
    expect(result.current.fiche?.profilPublic.statut).toBe('PUBLIE');
  });

  it('dépublie le profil courant', async () => {
    (updateMonProfilPublic as ReturnType<typeof vi.fn>).mockResolvedValue(profile);
    (depublierMonProfilPublic as ReturnType<typeof vi.fn>).mockResolvedValue(profile);
    const { result } = renderHook(() => useFicheBureauEtude());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(() => result.current.unpublish(payload));

    expect(updateMonProfilPublic).toHaveBeenCalledWith(payload);
    expect(depublierMonProfilPublic).toHaveBeenCalledOnce();
  });
});
