import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import { UseNotificationsReturn } from '../../hooks/useNotifications';

interface NotificationBellProps
  extends Pick<
    UseNotificationsReturn,
    | 'unreadCount'
    | 'notifications'
    | 'isLoadingList'
    | 'listError'
    | 'loadNotifications'
    | 'markAsRead'
    | 'markAllAsRead'
  > {}

export function NotificationBell({
  unreadCount,
  notifications,
  isLoadingList,
  listError,
  loadNotifications,
  markAsRead,
  markAllAsRead,
}: Readonly<NotificationBellProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ferme le panneau si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Ferme le panneau sur Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleToggle = useCallback(async () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening) {
      await loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  const handleClose = useCallback(() => setIsOpen(false), []);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleToggle}
        className="relative w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-label={notificationButtonLabel(unreadCount)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4 text-slate-300" />

        {/* Badge iOS-style */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationPanel
          notifications={notifications}
          isLoading={isLoadingList}
          error={listError}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClose={handleClose}
        />
      )}
    </div>
  );
}



function notificationButtonLabel(unreadCount: number): string {
  if (unreadCount === 0) return 'Notifications';
  const suffix = unreadCount > 1 ? 's' : '';
  return `Notifications — ${unreadCount} non lue${suffix}`;
}

