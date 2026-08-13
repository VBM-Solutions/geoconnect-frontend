import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ConfirmModal } from '../ui/ConfirmModal';
import { useSessionTimeout } from '../../hooks/useSessionTimeout';
import { getSessionConfigCall } from '../../api/auth';
import { SessionPolicy } from '../../lib/sessionPolicy';

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function SessionTimeoutGuard() {
  const { isAuthenticated } = useAuth();
  const [serverPolicy, setServerPolicy] = useState<Partial<SessionPolicy>>();
  const { showWarning, secondsRemaining, stayConnected, logoutNow } = useSessionTimeout({ policy: serverPolicy });

  useEffect(() => {
    let active = true;

    getSessionConfigCall()
      .then(config => {
        if (active) {
          setServerPolicy(config);
        }
      })
      .catch(() => {
        // Les valeurs locales restent un repli sûr si la configuration est indisponible.
      });

    return () => {
      active = false;
    };
  }, []);

  const countdown = useMemo(() => formatCountdown(secondsRemaining), [secondsRemaining]);

  if (!isAuthenticated || !showWarning) {
    return null;
  }

  return (
    <ConfirmModal
      dismissible={false}
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

