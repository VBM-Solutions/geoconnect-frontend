import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LAST_ACTIVITY_AT_KEY,
  seedSessionMetadata,
  SESSION_SYNC_EVENT_KEY,
} from '../lib/authSessionStorage';
import { useSessionTimeout } from './useSessionTimeout';

const mockNavigate = vi.fn();
const mockLogout = vi.fn();
const mockToastInfo = vi.fn();

const authState = {
  isAuthenticated: true,
  logout: mockLogout,
};

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ toastInfo: mockToastInfo }),
}));

describe('useSessionTimeout', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
    authState.isAuthenticated = true;
    seedSessionMetadata(1_000);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function flushEffects() {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
  }

  it('n\'affiche pas le warning tant que la session est en dehors de la fenêtre de pré-expiration', async () => {
    vi.setSystemTime(2_000);

    const { result } = renderHook(() =>
      useSessionTimeout({
        policy: {
          idleTimeoutMs: 10_000,
          warningDurationMs: 2_000,
          absoluteTimeoutMs: 60_000,
          activityThrottleMs: 1,
        },
      }),
    );

    await flushEffects();

    expect(result.current.showWarning).toBe(false);
    expect(result.current.secondsRemaining).toBe(9);
  });

  it('affiche le warning pendant la fenêtre de pré-expiration', async () => {
    vi.setSystemTime(9_500);

    const { result } = renderHook(() =>
      useSessionTimeout({
        policy: {
          idleTimeoutMs: 10_000,
          warningDurationMs: 2_000,
          absoluteTimeoutMs: 60_000,
          activityThrottleMs: 1,
        },
      }),
    );

    await flushEffects();

    expect(result.current.showWarning).toBe(true);
    expect(result.current.secondsRemaining).toBe(2);
  });

  it('déconnecte automatiquement quand la session est expirée', async () => {
    vi.setSystemTime(11_001);

    renderHook(() =>
      useSessionTimeout({
        policy: {
          idleTimeoutMs: 10_000,
          warningDurationMs: 2_000,
          absoluteTimeoutMs: 60_000,
          activityThrottleMs: 1,
        },
      }),
    );

    await flushEffects();

    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    expect(mockToastInfo).toHaveBeenCalledWith('Vous avez été déconnecté après une période d\'inactivité.');
  });

  it('stayConnected prolonge la session en mettant à jour la dernière activité', async () => {
    vi.setSystemTime(9_500);

    const { result } = renderHook(() =>
      useSessionTimeout({
        policy: {
          idleTimeoutMs: 10_000,
          warningDurationMs: 2_000,
          absoluteTimeoutMs: 60_000,
          activityThrottleMs: 1,
        },
      }),
    );

    await flushEffects();
    expect(result.current.showWarning).toBe(true);

    vi.setSystemTime(9_700);
    act(() => {
      result.current.stayConnected();
    });

    expect(Number(localStorage.getItem(LAST_ACTIVITY_AT_KEY))).toBe(9_700);
    await flushEffects();
    expect(result.current.showWarning).toBe(false);
    expect(result.current.secondsRemaining).toBe(10);
  });

  it('ignore l\'activité passive pendant le warning et conserve la modale', async () => {
    vi.setSystemTime(9_500);

    const { result } = renderHook(() =>
      useSessionTimeout({
        policy: {
          idleTimeoutMs: 10_000,
          warningDurationMs: 2_000,
          absoluteTimeoutMs: 60_000,
          activityThrottleMs: 1,
        },
      }),
    );

    await flushEffects();
    expect(result.current.showWarning).toBe(true);

    vi.setSystemTime(9_700);
    await act(async () => {
      window.dispatchEvent(new MouseEvent('mousemove'));
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.showWarning).toBe(true);
    expect(Number(localStorage.getItem(LAST_ACTIVITY_AT_KEY))).toBe(1_000);
  });

  it('réagit à un événement storage de logout propagé par un autre onglet', async () => {
    vi.setSystemTime(1_000);

    renderHook(() =>
      useSessionTimeout({
        policy: {
          idleTimeoutMs: 10_000,
          warningDurationMs: 2_000,
          absoluteTimeoutMs: 60_000,
          activityThrottleMs: 1,
        },
      }),
    );

    await flushEffects();

    await act(async () => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: SESSION_SYNC_EVENT_KEY,
          newValue: JSON.stringify({ type: 'logout', at: 999 }),
        }),
      );
    });

    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('n\'exécute aucune logique quand l\'utilisateur n\'est pas authentifié', async () => {
    authState.isAuthenticated = false;
    vi.setSystemTime(50_000);

    const { result } = renderHook(() =>
      useSessionTimeout({
        policy: {
          idleTimeoutMs: 10_000,
          warningDurationMs: 2_000,
          absoluteTimeoutMs: 60_000,
          activityThrottleMs: 1,
        },
      }),
    );

    await flushEffects();

    expect(result.current.showWarning).toBe(false);
    expect(result.current.secondsRemaining).toBe(0);

    act(() => window.dispatchEvent(new MouseEvent('mousemove')));

    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('ne deconnecte qu\'une fois lors de demandes repetees', async () => {
    vi.setSystemTime(2_000);
    const { result } = renderHook(() => useSessionTimeout());
    await flushEffects();
    act(() => {
      result.current.logoutNow();
      result.current.logoutNow();
    });
    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it('ignore une activite diffusee pendant la fenetre de throttling', async () => {
    vi.setSystemTime(2_000);
    renderHook(() => useSessionTimeout({ policy: { activityThrottleMs: 10_000 } }));
    await flushEffects();
    act(() => window.dispatchEvent(new MouseEvent('mousemove')));
    act(() => window.dispatchEvent(new MouseEvent('mousemove')));
    expect(Number(localStorage.getItem(LAST_ACTIVITY_AT_KEY))).toBe(2_000);
  });

  it('filtre les evenements inter-onglets invalides et reevalue une activite valide', async () => {
    vi.setSystemTime(2_000);
    const { result } = renderHook(() => useSessionTimeout());
    await flushEffects();
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'autre', newValue: '{}' })));
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: SESSION_SYNC_EVENT_KEY, newValue: '{}' })));
    act(() => window.dispatchEvent(new StorageEvent('storage', {
      key: SESSION_SYNC_EVENT_KEY,
      newValue: JSON.stringify({ type: 'activity', at: 2_000 }),
    })));
    expect(result.current.showWarning).toBe(false);
  });

  it('reevalue la session lorsque l\'onglet redevient visible', async () => {
    vi.setSystemTime(2_000);
    const visibility = Object.getOwnPropertyDescriptor(document, 'visibilityState');
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    const { result } = renderHook(() => useSessionTimeout());
    await flushEffects();
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(result.current.showWarning).toBe(false);
    if (visibility) Object.defineProperty(document, 'visibilityState', visibility);
  });
});




