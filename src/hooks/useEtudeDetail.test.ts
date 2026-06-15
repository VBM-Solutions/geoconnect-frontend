import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { useEtudeDetail } from './useEtudeDetail';
import { ToastProvider } from '../contexts/ToastContext';
import { EtudeDocumentsDTO } from '../types';

vi.mock('../api/etude', () => ({
  getEtudeDetailById: vi.fn(),
  getEtudeDocuments: vi.fn(),
}));

import { getEtudeDetailById, getEtudeDocuments } from '../api/etude';

const fakeEtude = {
  id: 42,
  etat: 'EN_COURS',
  bureauEtude: { id: 10, raisonSociale: 'Bureau Test' },
  demandeDevis: { id: 1, description: 'Travaux' },
};

const fakeDocuments: EtudeDocumentsDTO = {
  documentsDemandeDevis: [],
};

// Le hook utilise useToast → on enveloppe dans ToastProvider
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(ToastProvider, null, children);

describe('useEtudeDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getEtudeDocuments as any).mockResolvedValue(fakeDocuments);
  });

  it('ne charge pas si id est undefined', async () => {
    const { result } = renderHook(() => useEtudeDetail(undefined), { wrapper });
    // isLoading reste true mais etude reste null
    expect(result.current.etude).toBeNull();
  });

  it('charge l\'étude en cas nominal', async () => {
    (getEtudeDetailById as any).mockResolvedValue(fakeEtude);

    const { result } = renderHook(() => useEtudeDetail('42'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getEtudeDetailById).toHaveBeenCalledWith(42);
    expect(result.current.etude).toEqual(fakeEtude);
    expect(result.current.error).toBeNull();
  });

  it('positionne error si getEtudeDetailById échoue', async () => {
    (getEtudeDetailById as any).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useEtudeDetail('99'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.etude).toBeNull();
    expect(result.current.error).toBe("Impossible de charger les données de l'étude.");
  });

  it('withAction exécute la fonction puis re-fetche le détail', async () => {
    (getEtudeDetailById as any)
      .mockResolvedValueOnce(fakeEtude)               // chargement initial
      .mockResolvedValueOnce({ ...fakeEtude, etat: 'TERMINE' }); // après action

    const { result } = renderHook(() => useEtudeDetail('42'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const action = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      await result.current.withAction(action);
    });

    expect(action).toHaveBeenCalledOnce();
    expect(result.current.etude).toEqual({ ...fakeEtude, etat: 'TERMINE' });
    expect(result.current.actionLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('withAction positionne error si l\'action échoue', async () => {
    (getEtudeDetailById as any).mockResolvedValueOnce(fakeEtude);

    const { result } = renderHook(() => useEtudeDetail('42'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const action = vi.fn().mockRejectedValue({ message: 'Action impossible' });

    await act(async () => {
      await result.current.withAction(action);
    });

    expect(result.current.error).toBe('Action impossible');
    expect(result.current.actionLoading).toBe(false);
  });

  it('withAction utilise response.data.message si disponible', async () => {
    (getEtudeDetailById as any).mockResolvedValueOnce(fakeEtude);

    const { result } = renderHook(() => useEtudeDetail('42'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const action = vi.fn().mockRejectedValue({
      response: { data: { message: 'Erreur métier backend' } },
    });

    await act(async () => {
      await result.current.withAction(action);
    });

    expect(result.current.error).toBe('Erreur métier backend');
  });

  it('withAction retourne le fallback si aucun message', async () => {
    (getEtudeDetailById as any).mockResolvedValueOnce(fakeEtude);

    const { result } = renderHook(() => useEtudeDetail('42'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const action = vi.fn().mockRejectedValue({});

    await act(async () => {
      await result.current.withAction(action);
    });

    expect(result.current.error).toBe('Une erreur est survenue.');
  });
});

// ─── actionKey — isolation des loaders ───────────────────────────────────────

describe('useEtudeDetail — actionKey', () => {
  beforeEach(() => vi.clearAllMocks());

  it('actionKey vaut null au repos', async () => {
    (getEtudeDetailById as any).mockResolvedValue(fakeEtude);
    const { result } = renderHook(() => useEtudeDetail('42'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.actionKey).toBeNull();
  });

  it('actionKey prend la valeur de la clé pendant l\'exécution de withAction', async () => {
    (getEtudeDetailById as any).mockResolvedValue(fakeEtude);
    const { result } = renderHook(() => useEtudeDetail('42'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Promesse bloquante : permet de vérifier l'état pendant que l'action tourne
    let resolveAction!: () => void;
    const action = vi.fn().mockReturnValue(
      new Promise<void>(resolve => { resolveAction = resolve; }),
    );

    // Déclencher sans awaiter
    act(() => { result.current.withAction(action, 'devisSigne'); });

    // Après le 1er setState, React a re-rendu → actionKey doit être 'devisSigne'
    await waitFor(() => expect(result.current.actionKey).toBe('devisSigne'));

    // Débloquer l'action pour que le hook se termine proprement
    resolveAction();
    await waitFor(() => expect(result.current.actionKey).toBeNull());
  });

  it('actionKey est remis à null après la fin de withAction', async () => {
    (getEtudeDetailById as any).mockResolvedValue(fakeEtude);
    const { result } = renderHook(() => useEtudeDetail('42'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.withAction(vi.fn().mockResolvedValue(undefined), 'devisSigne');
    });

    expect(result.current.actionKey).toBeNull();
    expect(result.current.actionLoading).toBe(false);
  });

  it('actionKey reste null quand withAction est appelé sans clé', async () => {
    (getEtudeDetailById as any).mockResolvedValue(fakeEtude);
    const { result } = renderHook(() => useEtudeDetail('42'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let keyDuringAction: string | null = '__not_set__';

    await act(async () => {
      await result.current.withAction(vi.fn().mockImplementation(async () => {
        keyDuringAction = result.current.actionKey;
      }));
    });

    expect(keyDuringAction).toBeNull();
  });

  it('deux withAction avec des clés différentes positionnent actionKey distinctement', async () => {
    (getEtudeDetailById as any).mockResolvedValue(fakeEtude);
    const { result } = renderHook(() => useEtudeDetail('42'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Première action : clé 'devisSigne'
    let resolve1!: () => void;
    act(() => {
      result.current.withAction(
        vi.fn().mockReturnValue(new Promise<void>(r => { resolve1 = r; })),
        'devisSigne',
      );
    });
    await waitFor(() => expect(result.current.actionKey).toBe('devisSigne'));
    resolve1();
    await waitFor(() => expect(result.current.actionKey).toBeNull());

    // Deuxième action : clé 'validerDate'
    let resolve2!: () => void;
    act(() => {
      result.current.withAction(
        vi.fn().mockReturnValue(new Promise<void>(r => { resolve2 = r; })),
        'validerDate',
      );
    });
    await waitFor(() => expect(result.current.actionKey).toBe('validerDate'));
    resolve2();
    await waitFor(() => expect(result.current.actionKey).toBeNull());
  });

  it('actionKey est remis à null même si l\'action échoue', async () => {
    (getEtudeDetailById as any).mockResolvedValueOnce(fakeEtude);
    const { result } = renderHook(() => useEtudeDetail('42'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.withAction(
        vi.fn().mockRejectedValue(new Error('échec')),
        'devisSigne',
      );
    });

    expect(result.current.actionKey).toBeNull();
    expect(result.current.actionLoading).toBe(false);
  });
});

