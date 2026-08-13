import api from './index';
import { NotificationDTO, PageResponse } from '../types';

/**
 * Récupère toutes les notifications de l'utilisateur connecté.
 * À appeler au clic sur l'icône, pas en continu.
 */
export const getNotifications = async (): Promise<NotificationDTO[]> => {
  const { data } = await api.get<PageResponse<NotificationDTO>>('/notifications/paged', {
    params: { page: 0, size: 50 },
  });
  return data.items;
};

/**
 * Retourne le nombre de notifications non lues.
 * Utilisé pour le badge — polling toutes les 30 s.
 */
export const getUnreadCount = async (): Promise<number> => {
  const { data } = await api.get<{ count: number }>('/notifications/non-lues/count');
  return data.count;
};

/**
 * Marque une notification individuelle comme lue.
 */
export const markNotificationAsRead = async (id: number): Promise<void> => {
  await api.patch(`/notifications/${id}/lire`);
};

/**
 * Marque toutes les notifications comme lues.
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.patch('/notifications/lire-tout');
};

