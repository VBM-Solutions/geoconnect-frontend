import { NotificationDTO, Role } from '../types';

/** Construit la route depuis la cible métier, sans dépendre d'une URL persistée. */
export function resolveNotificationPath(notification: NotificationDTO, role?: Role): string | undefined {
  if (!notification.cibleType || notification.cibleId == null || !role) {
    return notification.lienAction;
  }

  let prefix: string | undefined;
  if (role === 'CLIENT') prefix = '/client';
  if (role === 'BUREAU_ETUDE') prefix = '/be';
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
  const querySuffix = query ? `?${query}` : '';
  return `${prefix}/${resource}/${notification.cibleId}${querySuffix}`;
}
