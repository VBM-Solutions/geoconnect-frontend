import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { NotificationDTO } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { resolveNotificationPath } from '../../lib/notificationTarget';

interface NotificationItemProps {
  readonly notification: NotificationDTO;
  readonly onMarkAsRead: (id: number) => Promise<void>;
  readonly onClose: () => void;
}

export function NotificationItem({ notification, onMarkAsRead, onClose }: NotificationItemProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClick = async () => {
    if (!notification.lue) {
      await onMarkAsRead(notification.id);
    }
    onClose();
    const target = resolveNotificationPath(notification, user?.role);
    if (target) {
      navigate(target);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.occurredAt ?? notification.createdAt), {
    addSuffix: true,
    locale: fr,
  });

  const isUnread = !notification.lue;

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${
        isUnread ? 'bg-blue-50' : 'bg-white'
      }`}
      aria-label={`Notification : ${notification.message}`}
    >
      {/* Indicator non-lu */}
      <span
        className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${
          isUnread ? 'bg-blue-500' : 'bg-transparent'
        }`}
        aria-hidden="true"
      />

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm leading-snug text-slate-800 ${
            isUnread ? 'font-semibold' : 'font-normal'
          }`}
        >
          {notification.message}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo}</p>
      </div>
    </button>
  );
}


