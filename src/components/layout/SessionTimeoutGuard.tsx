import React, { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function SessionTimeoutGuard() {
  const { isAuthenticated } = useAuth();
  const { showWarning, secondsRemaining, stayConnected, logoutNow } = useSessionTimeout();

  const countdown = useMemo(() => formatCountdown(secondsRemaining), [secondsRemaining]);

  if (!isAuthenticated || !showWarning) {
    return null;
  }

  return (
    <ConfirmModal
      variant="warning"
      title="Session bientôt expirée"
      message="Aucune activité détectée. Pour des raisons de sécurité, vous allez être déconnecté automatiquement."
      confirmLabel="Rester connecté"
      cancelLabel="Se déconnecter"
      onConfirm={stayConnected}
      onCancel={logoutNow}
      extra={(
        <div className="rounded border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800">
          Déconnexion automatique dans {countdown}
        </div>
      )}
    />
  );
}

