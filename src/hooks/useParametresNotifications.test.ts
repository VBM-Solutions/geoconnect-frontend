import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useParametresNotifications, _resetDepartementsCache } from './useParametresNotifications';

vi.mock('../api/referentiel', () => ({
  getDepartements: vi.fn(),
}));

vi.mock('../api/parametres', () => ({
  getNotificationPreferences: vi.fn(),
  updateNotificationPreferences: vi.fn(),
}));

import { getDepartements } from '../api/referentiel';
import { getNotificationPreferences, updateNotificationPreferences } from '../api/parametres';

const fakeDepts = [
  { code: '75', libelle: 'Paris' },
  { code: '92', libelle: 'Hauts-de-Seine' },
  { code: '2A', libelle: 'Corse-du-Sud' },
];

const fakePrefs = {
  notifierTousDepartements: false,
  departementsSuivis: ['75', '92'],
};

describe('useParametresNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetDepartementsCache(); // repart d'un cache vide entre chaque test
  });

  // ── État initial ─────────────────────────────────────────────────────────────

  it('initialise avec isLoading=true et données nulles/vides', () => {
    (getDepartements as ReturnType<typeof vi.fn>).mockResolvedValue(fakeDepts);
    (getNotificationPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(fakePrefs);

    const { result } = renderHook(() => useParametresNotifications());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.preferences).toBeNull();
    expect(result.current.departements).toEqual([]);
    expect(result.current.loadError).toBeNull();
  });

  // ── Chargement réussi ─────────────────────────────────────────────────────────

  it('charge les départements et les préférences au montage', async () => {
    (getDepartements as ReturnType<typeof vi.fn>).mockResolvedValue(fakeDepts);
    (getNotificationPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(fakePrefs);

    const { result } = renderHook(() => useParametresNotifications());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.departements).toEqual(fakeDepts);
    expect(result.current.preferences).toEqual(fakePrefs);
    expect(result.current.loadError).toBeNull();
  });

  it('appelle getDepartements et getNotificationPreferences une seule fois au montage', async () => {
    (getDepartements as ReturnType<typeof vi.fn>).mockResolvedValue(fakeDepts);
    (getNotificationPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(fakePrefs);

    renderHook(() => useParametresNotifications());
    await waitFor(() =>
      expect(getDepartements).toHaveBeenCalledTimes(1),
    );
    expect(getNotificationPreferences).toHaveBeenCalledTimes(1);
  });

  // ── Cache des départements ────────────────────────────────────────────────────

  it('ne rappelle pas getDepartements si le cache est déjà rempli', async () => {
    (getDepartements as ReturnType<typeof vi.fn>).mockResolvedValue(fakeDepts);
    (getNotificationPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(fakePrefs);

    // Premier montage — remplit le cache
    const first = renderHook(() => useParametresNotifications());
    await waitFor(() => expect(first.result.current.isLoading).toBe(false));
    const { unmount } = first;
    unmount();

    // Deuxième montage — doit utiliser le cache
    const { result } = renderHook(() => useParametresNotifications());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getDepartements).toHaveBeenCalledTimes(1); // toujours 1 seul appel
    expect(result.current.departements).toEqual(fakeDepts);
  });

  // ── Gestion des erreurs ───────────────────────────────────────────────────────

  it('positionne loadError si getDepartements échoue', async () => {
    (getDepartements as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network Error'));
    (getNotificationPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(fakePrefs);

    const { result } = renderHook(() => useParametresNotifications());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.loadError).toBeTruthy();
    expect(result.current.preferences).toBeNull();
  });

  it('positionne loadError si getNotificationPreferences échoue', async () => {
    (getDepartements as ReturnType<typeof vi.fn>).mockResolvedValue(fakeDepts);
    (getNotificationPreferences as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('403'));

    const { result } = renderHook(() => useParametresNotifications());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.loadError).toBeTruthy();
  });

  // ── savePreferences ───────────────────────────────────────────────────────────

  it('savePreferences appelle updateNotificationPreferences et met à jour l\'état', async () => {
    (getDepartements as ReturnType<typeof vi.fn>).mockResolvedValue(fakeDepts);
    (getNotificationPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(fakePrefs);
    const updatedPrefs = { notifierTousDepartements: true, departementsSuivis: [] };
    (updateNotificationPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(updatedPrefs);

    const { result } = renderHook(() => useParametresNotifications());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let success: boolean;
    await act(async () => {
      success = await result.current.savePreferences(updatedPrefs);
    });

    expect(success!).toBe(true);
    expect(updateNotificationPreferences).toHaveBeenCalledWith(updatedPrefs);
    expect(result.current.preferences).toEqual(updatedPrefs);
    expect(result.current.isSaving).toBe(false);
  });

  it('savePreferences retourne false et ne met pas à jour l\'état si l\'API échoue', async () => {
    (getDepartements as ReturnType<typeof vi.fn>).mockResolvedValue(fakeDepts);
    (getNotificationPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(fakePrefs);
    (updateNotificationPreferences as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('400'));

    const { result } = renderHook(() => useParametresNotifications());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const initialPrefs = result.current.preferences;

    let success: boolean;
    await act(async () => {
      success = await result.current.savePreferences({ notifierTousDepartements: false, departementsSuivis: ['75'] });
    });

    expect(success!).toBe(false);
    expect(result.current.preferences).toEqual(initialPrefs); // inchangées
    expect(result.current.isSaving).toBe(false);
  });

  it('isSaving passe à true pendant la sauvegarde', async () => {
    (getDepartements as ReturnType<typeof vi.fn>).mockResolvedValue(fakeDepts);
    (getNotificationPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(fakePrefs);

    let resolveSave!: (v: typeof fakePrefs) => void;
    const savePromise = new Promise<typeof fakePrefs>((resolve) => {
      resolveSave = resolve;
    });
    (updateNotificationPreferences as ReturnType<typeof vi.fn>).mockReturnValue(savePromise);

    const { result } = renderHook(() => useParametresNotifications());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Démarrer la sauvegarde sans l'attendre
    act(() => {
      void result.current.savePreferences(fakePrefs);
    });

    expect(result.current.isSaving).toBe(true);

    // Résoudre la promesse
    await act(async () => {
      resolveSave(fakePrefs);
    });

    expect(result.current.isSaving).toBe(false);
  });

  // ── Cas limites ───────────────────────────────────────────────────────────────

  it('savePreferences avec notifierTousDepartements=true et liste vide est valide', async () => {
    (getDepartements as ReturnType<typeof vi.fn>).mockResolvedValue(fakeDepts);
    (getNotificationPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(fakePrefs);
    const allDepts = { notifierTousDepartements: true, departementsSuivis: [] };
    (updateNotificationPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(allDepts);

    const { result } = renderHook(() => useParametresNotifications());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let success: boolean;
    await act(async () => {
      success = await result.current.savePreferences(allDepts);
    });

    expect(success!).toBe(true);
    expect(result.current.preferences?.notifierTousDepartements).toBe(true);
  });

  // ── Branches "composant démonté" (conditions cancelled / isMounted) ───────────

  it('annule les mises à jour d\'état si le composant est démonté pendant le chargement (cancelled=true)', async () => {
    // On contrôle manuellement la résolution de la promesse pour simuler
    // un unmount AVANT que les données reviennent du réseau
    let resolveDepts!: (v: typeof fakeDepts) => void;
    const deptsPromise = new Promise<typeof fakeDepts>(r => { resolveDepts = r; });
    (getDepartements as ReturnType<typeof vi.fn>).mockReturnValue(deptsPromise);
    (getNotificationPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(fakePrefs);

    const { result, unmount } = renderHook(() => useParametresNotifications());

    // Démontage avant que la promesse se résolve → cancelled = true
    unmount();

    // On résout maintenant — le hook ne doit PAS appeler setDepartements / setPreferences
    await act(async () => { resolveDepts(fakeDepts); });

    // Le state ne doit pas avoir changé (isLoading reste true car le finally a aussi été court-circuité)
    // Ce test valide simplement qu'aucune erreur n'est levée (pas de "Can't update unmounted component")
    expect(result.current.departements).toEqual([]);
    expect(result.current.preferences).toBeNull();
  });

  it('annule la mise à jour d\'état si le composant est démonté pendant le chargement en erreur (cancelled catch)', async () => {
    let rejectDepts!: (e: Error) => void;
    const deptsPromise = new Promise<typeof fakeDepts>((_, r) => { rejectDepts = r; });
    (getDepartements as ReturnType<typeof vi.fn>).mockReturnValue(deptsPromise);
    (getNotificationPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(fakePrefs);

    const { result, unmount } = renderHook(() => useParametresNotifications());

    unmount(); // cancelled = true

    await act(async () => { rejectDepts(new Error('Network')); });

    // loadError ne doit pas être mis à jour
    expect(result.current.loadError).toBeNull();
  });

  it('ne met pas à jour l\'état dans savePreferences si le composant est démonté avant la résolution', async () => {
    (getDepartements as ReturnType<typeof vi.fn>).mockResolvedValue(fakeDepts);
    (getNotificationPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(fakePrefs);

    let resolveSave!: (v: typeof fakePrefs) => void;
    const savePromise = new Promise<typeof fakePrefs>(r => { resolveSave = r; });
    (updateNotificationPreferences as ReturnType<typeof vi.fn>).mockReturnValue(savePromise);

    const { result, unmount } = renderHook(() => useParametresNotifications());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Lance savePreferences sans attendre
    act(() => { void result.current.savePreferences(fakePrefs); });
    expect(result.current.isSaving).toBe(true);

    // Démonte AVANT la résolution → isMounted.current = false
    unmount();

    // Résout après le démontage — aucune erreur ne doit être levée, et le state n'est pas mis à jour
    await act(async () => { resolveSave(fakePrefs); });

    // Le composant est démonté, on vérifie juste l'absence d'erreur
    // (isSaving reste "true" côté snapshot car setState est bloqué)
    expect(result.current.preferences).toEqual(fakePrefs); // état du GET initial, pas du PUT
  });

  it('initialise departements depuis le cache si celui-ci est déjà peuplé avant le premier rendu', async () => {
    // Pré-remplir le cache via un premier montage complet
    (getDepartements as ReturnType<typeof vi.fn>).mockResolvedValue(fakeDepts);
    (getNotificationPreferences as ReturnType<typeof vi.fn>).mockResolvedValue(fakePrefs);

    const { unmount } = renderHook(() => useParametresNotifications());
    await waitFor(() => expect(getDepartements).toHaveBeenCalledTimes(1));
    unmount();

    // Deuxième montage : useState(departementsCache ?? []) → doit utiliser le cache directement
    const { result } = renderHook(() => useParametresNotifications());

    // Au premier rendu synchrone, departements doit déjà contenir les données du cache
    expect(result.current.departements).toEqual(fakeDepts);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getDepartements).toHaveBeenCalledTimes(1);
  });
});

