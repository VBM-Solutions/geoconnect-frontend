import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotifications } from './useNotifications';

vi.mock('../api/notification', () => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
}));

import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../api/notification';

const fakeNotifications = [
  { id: 1, type: 'NOUVELLE_DEMANDE_DEVIS', message: 'Msg 1', lue: false, createdAt: '2026-05-20T10:00:00' },
  { id: 2, type: 'RAPPORT_DISPONIBLE', message: 'Msg 2', lue: true, createdAt: '2026-05-19T08:00:00' },
];

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initialise avec unreadCount=0 et liste vide', () => {
    (getUnreadCount as ReturnType<typeof vi.fn>).mockResolvedValue(0);

    const { result } = renderHook(() => useNotifications(true));

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.notifications).toEqual([]);
  });

  it('charge le badge au montage si authentifié', async () => {
    (getUnreadCount as ReturnType<typeof vi.fn>).mockResolvedValue(3);

    const { result } = renderHook(() => useNotifications(true));

    // Flush uniquement les microtâches (Promise), sans déclencher l'intervalle
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.unreadCount).toBe(3);
    expect(getUnreadCount).toHaveBeenCalledTimes(1);
  });

  it('ne poll pas si non authentifié', async () => {
    const { result } = renderHook(() => useNotifications(false));

    await act(async () => {
      vi.advanceTimersByTime(60_000);
      await vi.runAllTimersAsync();
    });

    expect(getUnreadCount).not.toHaveBeenCalled();
    expect(result.current.unreadCount).toBe(0);
  });

  it('poll toutes les 30s', async () => {
    (getUnreadCount as ReturnType<typeof vi.fn>).mockResolvedValue(1);

    renderHook(() => useNotifications(true));

    // Appel immédiat au montage — flush uniquement les microtâches
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(getUnreadCount).toHaveBeenCalledTimes(1);

    // Avance de 30s (déclenche le 1er tick d'intervalle)
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(getUnreadCount).toHaveBeenCalledTimes(2);

    // Avance de 30s supplémentaires (2e tick)
    await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
    expect(getUnreadCount).toHaveBeenCalledTimes(3);
  });

  it('loadNotifications charge la liste depuis l\'API', async () => {
    (getUnreadCount as ReturnType<typeof vi.fn>).mockResolvedValue(1);
    (getNotifications as ReturnType<typeof vi.fn>).mockResolvedValue(fakeNotifications);

    const { result } = renderHook(() => useNotifications(true));

    await act(async () => {
      await result.current.loadNotifications();
    });

    expect(result.current.notifications).toEqual(fakeNotifications);
    expect(result.current.isLoadingList).toBe(false);
    expect(result.current.listError).toBeNull();
  });

  it('loadNotifications positionne listError en cas d\'échec', async () => {
    (getUnreadCount as ReturnType<typeof vi.fn>).mockResolvedValue(0);
    (getNotifications as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('KO'));

    const { result } = renderHook(() => useNotifications(true));

    await act(async () => {
      await result.current.loadNotifications();
    });

    expect(result.current.listError).toBeTruthy();
    expect(result.current.notifications).toEqual([]);
  });

  it('markAsRead effectue une mise à jour optimiste et appelle l\'API', async () => {
    (getUnreadCount as ReturnType<typeof vi.fn>).mockResolvedValue(2);
    (getNotifications as ReturnType<typeof vi.fn>).mockResolvedValue(fakeNotifications);
    (markNotificationAsRead as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const { result } = renderHook(() => useNotifications(true));

    // Charger la liste et attendre le badge initial (flush microtâches seulement)
    await act(async () => {
      await result.current.loadNotifications();
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.unreadCount).toBe(2);

    await act(async () => {
      await result.current.markAsRead(1);
    });

    // La notif 1 doit être marquée lue
    expect(result.current.notifications.find(n => n.id === 1)?.lue).toBe(true);
    // Le badge doit être décrémenté
    expect(result.current.unreadCount).toBe(1);
    expect(markNotificationAsRead).toHaveBeenCalledWith(1);
  });

  it('markAllAsRead effectue une mise à jour optimiste et appelle l\'API', async () => {
    (getUnreadCount as ReturnType<typeof vi.fn>).mockResolvedValue(2);
    (getNotifications as ReturnType<typeof vi.fn>).mockResolvedValue(fakeNotifications);
    (markAllNotificationsAsRead as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const { result } = renderHook(() => useNotifications(true));

    await act(async () => {
      await result.current.loadNotifications();
    });

    await act(async () => {
      await result.current.markAllAsRead();
    });

    expect(result.current.notifications.every(n => n.lue)).toBe(true);
    expect(result.current.unreadCount).toBe(0);
    expect(markAllNotificationsAsRead).toHaveBeenCalled();
  });

  it('resynchronise le badge si le marquage individuel echoue', async () => {
    (getUnreadCount as ReturnType<typeof vi.fn>).mockResolvedValueOnce(2).mockResolvedValueOnce(4);
    (markNotificationAsRead as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('KO'));
    const { result } = renderHook(() => useNotifications(true));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    await act(async () => { await result.current.markAsRead(1); });
    expect(result.current.unreadCount).toBe(4);
  });

  it('resynchronise le badge si le marquage global echoue', async () => {
    (getUnreadCount as ReturnType<typeof vi.fn>).mockResolvedValueOnce(2).mockResolvedValueOnce(3);
    (markAllNotificationsAsRead as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('KO'));
    const { result } = renderHook(() => useNotifications(true));
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    await act(async () => { await result.current.markAllAsRead(); });
    expect(result.current.unreadCount).toBe(3);
  });
});





