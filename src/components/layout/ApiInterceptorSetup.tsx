import { useEffect, useRef } from 'react';
import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';
import { refreshCall } from '../../api/auth';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retryAfterRefresh?: boolean;
}

const AUTH_ENDPOINTS_WITHOUT_REFRESH = [
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
  '/auth/session-config',
  '/auth/register',
  '/auth/email-verifications',
];

let refreshInFlight: Promise<void> | null = null;

function refreshOnce(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = refreshCall().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function canRefresh(config: RetryableRequestConfig | undefined): config is RetryableRequestConfig {
  if (!config || config._retryAfterRefresh) {
    return false;
  }
  return !AUTH_ENDPOINTS_WITHOUT_REFRESH.some(endpoint => config.url?.includes(endpoint));
}

function isAuthenticationEndpoint(config: RetryableRequestConfig | undefined): boolean {
  return AUTH_ENDPOINTS_WITHOUT_REFRESH.some(endpoint => config?.url?.includes(endpoint));
}

/**
 * Composant sans rendu monté une fois dans le Router.
 * Il enregistre les intercepteurs Axios globaux :
 *  - 401 authentifié → déconnexion + redirection vers /login (token expiré/absent)
 *  - 401 anonyme → l'appelant gère l'erreur sans quitter la page publique
 *  - 403 → toast d'erreur (utilisateur authentifié mais droits insuffisants ou appartenance invalide)
 *
 * Distinction importante : 401 ≠ 403
 *  - 401 avec session locale : la session a expiré → déconnexion et redirection
 *  - 401 sans session locale : la page publique reste affichée et gère l'erreur localement
 *  - 403 : l'utilisateur EST identifié mais n'a pas le droit d'accéder à la ressource
 *           → on affiche un message, sans le déconnecter
 */
export function ApiInterceptorSetup() {
  const navigate = useNavigate();
  const { toastError } = useToast();
  const { logout, isAuthenticated } = useAuth();
  const authFailureHandledRef = useRef(false);

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<{ message?: string }>) => {
        const status = error?.response?.status;

        if (status === 401 && isAuthenticated) {
          const originalRequest = error.config as RetryableRequestConfig | undefined;

          // Ces appels pilotent eux-mêmes leur erreur (login, refresh explicite, logout...).
          if (isAuthenticationEndpoint(originalRequest)) {
            throw error;
          }

          if (canRefresh(originalRequest)) {
            originalRequest._retryAfterRefresh = true;
            try {
              await refreshOnce();
              authFailureHandledRef.current = false;
              return api.request(originalRequest);
            } catch {
              // Le refresh a échoué : la session n'est plus renouvelable.
            }
          }

          if (!authFailureHandledRef.current) {
            authFailureHandledRef.current = true;
            logout();
            navigate('/login', { replace: true });
          }
        } else if (status === 403) {
          const message =
            error?.response?.data?.message ??
            "Accès refusé : vous n'êtes pas autorisé à effectuer cette action.";
          toastError(message);
        }

        throw error;
      },
    );

    return () => {
      api.interceptors.response.eject(interceptorId);
    };
  }, [navigate, toastError, logout, isAuthenticated]);

  return null;
}

