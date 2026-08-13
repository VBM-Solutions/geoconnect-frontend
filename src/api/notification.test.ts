import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './notification';

vi.mock('./index', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from './index';

const fakeNotification = {
  id: 1,
  type: 'NOUVELLE_DEMANDE_DEVIS',
  message: 'Nouvelle demande reçue',
  lienAction: '/client/dashboard',
  lue: false,
  createdAt: '2026-05-20T10:00:00',
};

describe('getNotifications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne la liste des notifications', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { items: [fakeNotification], page: 0, size: 50, totalItems: 1, totalPages: 1, hasNext: false },
    });

    const result = await getNotifications();

    expect(api.get).toHaveBeenCalledWith('/notifications/paged', {
      params: { page: 0, size: 50 },
    });
    expect(result).toEqual([fakeNotification]);
  });

  it('propage l\'erreur si le serveur répond KO', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    await expect(getNotifications()).rejects.toThrow('Network error');
  });
});

describe('getUnreadCount', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne le count de notifications non lues', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { count: 5 } });

    const result = await getUnreadCount();

    expect(api.get).toHaveBeenCalledWith('/notifications/non-lues/count');
    expect(result).toBe(5);
  });

  it('retourne 0 si count = 0', async () => {
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { count: 0 } });

    const result = await getUnreadCount();
    expect(result).toBe(0);
  });
});

describe('markNotificationAsRead', () => {
  beforeEach(() => vi.clearAllMocks());

  it('appelle PATCH /notifications/{id}/lire', async () => {
    (api.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

    await markNotificationAsRead(42);

    expect(api.patch).toHaveBeenCalledWith('/notifications/42/lire');
  });
});

describe('markAllNotificationsAsRead', () => {
  beforeEach(() => vi.clearAllMocks());

  it('appelle PATCH /notifications/lire-tout', async () => {
    (api.patch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

    await markAllNotificationsAsRead();

    expect(api.patch).toHaveBeenCalledWith('/notifications/lire-tout');
  });
});

