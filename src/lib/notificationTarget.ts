import { NotificationDTO, Role } from '../types';

/** Construit la route depuis la cible métier, sans dépendre d'une URL persistée. */
export function resolveNotificationPath(notification: NotificationDTO, role?: Role): string | undefined {
  if (!notification.cibleType || notification.cibleId == null || !role) {
    return notification.lienAction;
  }

  const prefix = role === 'CLIENT' ? '/client' : role === 'BUREAU_ETUDE' ? '/be' : undefined;
  if (!prefix) return notification.lienAction;

  const resource = notification.cibleType === 'DEMANDE' ? 'demande' : 'etude';
  const params = new URLSearchParams();
  if (notification.cibleVue && notification.cibleVue !== 'DETAILS') {
    params.set('section', notification.cibleVue.toLowerCase());
  }
  if (notification.cibleReferenceId != null) {
    params.set('proposition', String(notification.cibleReferenceId));
  }
  const query = params.toString();
  return `${prefix}/${resource}/${notification.cibleId}${query ? `?${query}` : ''}`;
}
