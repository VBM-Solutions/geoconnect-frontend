import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  ensureSessionMetadata,
  parseSessionSyncEvent,
  publishSessionSyncEvent,
  readLastActivityAt,
  readSessionStartedAt,
  SESSION_SYNC_EVENT_KEY,
  touchLastActivity,
} from '../lib/authSessionStorage';
import { ExpirationReason, evaluateSessionState, resolveSessionPolicy, SessionPolicy } from '../lib/sessionPolicy';

interface UseSessionTimeoutOptions {
  policy?: Partial<SessionPolicy>;
}

interface SessionTimeoutState {
  showWarning: boolean;
  secondsRemaining: number;
  stayConnected: () => void;
  logoutNow: () => void;
}

export function useSessionTimeout(options?: UseSessionTimeoutOptions): SessionTimeoutState {
  const navigate = useNavigate();
  const { toastInfo } = useToast();
  const { isAuthenticated, logout } = useAuth();

  const policy = useMemo(() => resolveSessionPolicy(options?.policy), [options?.policy]);

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const lastBroadcastAtRef = useRef(0);
  const hasLoggedOutRef = useRef(false);
  const isWarningVisibleRef = useRef(false);

  const performLogout = useCallback((reason: ExpirationReason, broadcast: boolean = true) => {
    if (hasLoggedOutRef.current) {
      return;
    }

    hasLoggedOutRef.current = true;
    if (broadcast) {
      publishSessionSyncEvent({ type: 'logout', at: Date.now() });
    }

    logout();
    isWarningVisibleRef.current = false;
    setShowWarning(false);
    setSecondsRemaining(0);
    toastInfo(
      reason === 'absolute'
        ? 'Votre session est arrivée à son terme. Veuillez vous reconnecter.'
        : 'Vous avez été déconnecté après une période d\'inactivité.',
    );
    navigate('/login', { replace: true });
  }, [logout, navigate, toastInfo]);

  const evaluate = useCallback(() => {
    if (!isAuthenticated) {
      hasLoggedOutRef.current = false;
      isWarningVisibleRef.current = false;
      setShowWarning(false);
      setSecondsRemaining(0);
      return;
    }

    const now = Date.now();
    ensureSessionMetadata(now);

    const sessionStartedAt = readSessionStartedAt() ?? now;
    const lastActivityAt = readLastActivityAt() ?? now;

    const sessionState = evaluateSessionState(now, sessionStartedAt, lastActivityAt, policy);

    if (sessionState.isExpired) {
      performLogout(sessionState.reason);
      return;
    }

    isWarningVisibleRef.current = sessionState.shouldWarn;
    setShowWarning(sessionState.shouldWarn);
    setSecondsRemaining(Math.ceil(sessionState.remainingMs / 1000));
  }, [isAuthenticated, performLogout, policy]);

  const broadcastActivity = useCallback((at: number) => {
    if (at - lastBroadcastAtRef.current < policy.activityThrottleMs) {
      return;
    }

    lastBroadcastAtRef.current = at;
    publishSessionSyncEvent({ type: 'activity', at });
  }, [policy.activityThrottleMs]);

  const registerActivity = useCallback((force: boolean) => {
    if (!isAuthenticated) {
      return;
    }

    // Pendant la pré-alerte, seule une action explicite doit prolonger la session.
    if (!force && isWarningVisibleRef.current) {
      return;
    }

    const now = Date.now();
    touchLastActivity(now);
    broadcastActivity(now);
    evaluate();
  }, [broadcastActivity, evaluate, isAuthenticated]);

  const onPassiveActivity = useCallback(() => {
    registerActivity(false);
  }, [registerActivity]);

  const stayConnected = useCallback(() => {
    registerActivity(true);
  }, [registerActivity]);

  const logoutNow = useCallback(() => {
    performLogout('idle');
  }, [performLogout]);

  useEffect(() => {
    evaluate();

    const intervalId = window.setInterval(evaluate, 1000);

    const activityEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'keydown',
      'scroll',
      'touchstart',
      'mousemove',
    ];

    for (const eventName of activityEvents) {
      window.addEventListener(eventName, onPassiveActivity, { passive: true });
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        evaluate();
      }
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key !== SESSION_SYNC_EVENT_KEY) {
        return;
      }

      const syncEvent = parseSessionSyncEvent(event.newValue);
      if (!syncEvent) {
        return;
      }

      if (syncEvent.type === 'logout') {
        performLogout('idle', false);
        return;
      }

      evaluate();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('storage', onStorage);

    return () => {
      window.clearInterval(intervalId);
      for (const eventName of activityEvents) {
        window.removeEventListener(eventName, onPassiveActivity);
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('storage', onStorage);
    };
  }, [evaluate, onPassiveActivity, performLogout]);

  return {
    showWarning,
    secondsRemaining,
    stayConnected,
    logoutNow,
  };
}

