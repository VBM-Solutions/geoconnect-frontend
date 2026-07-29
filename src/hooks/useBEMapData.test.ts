import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getBEMapData } from '../api/beMap';
import { BEMapMarkerKind } from '../types';
import { useBEMapData } from './useBEMapData';

vi.mock('../api/beMap', () => ({
  getBEMapData: vi.fn(),
}));

const fakeMapData = {
  bureau: { id: 1, raisonSociale: 'BE Test', latitude: 48.8566, longitude: 2.3522 },
  demandes: [],
  etudes: [],
};

beforeEach(() => vi.clearAllMocks());

describe('useBEMapData', () => {
  it('charge les donnees de carte avec les filtres fournis', async () => {
    const filters = { kind: 'ETUDE_EN_COURS' as const };
    (getBEMapData as ReturnType<typeof vi.fn>).mockResolvedValueOnce(fakeMapData);

    const { result } = renderHook(() => useBEMapData(filters));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getBEMapData).toHaveBeenCalledWith(filters);
    expect(result.current.data).toEqual(fakeMapData);
    expect(result.current.error).toBeNull();
  });

  it('expose un message d erreur quand le chargement echoue', async () => {
    (getBEMapData as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Carte indisponible'));

    const { result } = renderHook(() => useBEMapData());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Carte indisponible');
  });

  it('recharge les donnees quand les filtres changent', async () => {
    (getBEMapData as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(fakeMapData)
      .mockResolvedValueOnce({ ...fakeMapData, demandes: [{ id: 10 }] });

    const { rerender, result } = renderHook(
      ({ kind }: { kind: BEMapMarkerKind }) => useBEMapData({ kind }),
      { initialProps: { kind: 'DEMANDE_DISPONIBLE' as BEMapMarkerKind } },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    rerender({ kind: 'ETUDE_EN_COURS' as const });

    await waitFor(() => expect(getBEMapData).toHaveBeenCalledTimes(2));

    expect(getBEMapData).toHaveBeenLastCalledWith({ kind: 'ETUDE_EN_COURS' });
  });

  it('refetch redeclenche le chargement avec les memes filtres', async () => {
    (getBEMapData as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce(fakeMapData)
      .mockResolvedValueOnce({ ...fakeMapData, etudes: [{ id: 20 }] });

    const filters = { type: 'G2_AVP' as const };
    const { result } = renderHook(() => useBEMapData(filters));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(getBEMapData).toHaveBeenCalledTimes(2));

    expect(getBEMapData).toHaveBeenLastCalledWith(filters);
  });

  it('ignore le resultat si le composant est demonte avant la fin du chargement', async () => {
    let resolveRequest: (value: typeof fakeMapData) => void = () => {};
    (getBEMapData as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const { result, unmount } = renderHook(() => useBEMapData({ kind: 'ETUDE_EN_COURS' }));

    expect(result.current.isLoading).toBe(true);
    unmount();

    await act(async () => {
      resolveRequest(fakeMapData);
    });

    expect(getBEMapData).toHaveBeenCalledWith({ kind: 'ETUDE_EN_COURS' });
  });

  it('ignore l erreur si le composant est demonte avant la fin du chargement', async () => {
    let rejectRequest: (reason: Error) => void = () => {};
    (getBEMapData as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectRequest = reject;
      }),
    );

    const { result, unmount } = renderHook(() => useBEMapData({ kind: 'ETUDE_EN_COURS' }));

    expect(result.current.isLoading).toBe(true);
    unmount();

    await act(async () => {
      rejectRequest(new Error('KO'));
    });

    expect(getBEMapData).toHaveBeenCalledWith({ kind: 'ETUDE_EN_COURS' });
  });
});
