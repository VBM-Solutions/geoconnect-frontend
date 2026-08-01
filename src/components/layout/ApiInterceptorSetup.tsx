import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';

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

  useEffect(() => {
    const interceptorId = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;

        if (status === 401 && isAuthenticated) {
          logout();
          navigate('/login', { replace: true });
        } else if (status === 403) {
          const message =
            error?.response?.data?.message ??
            "Accès refusé : vous n'êtes pas autorisé à effectuer cette action.";
          toastError(message);
        }

        return Promise.reject(error);
      },
    );

    return () => {
      api.interceptors.response.eject(interceptorId);
    };
  }, [navigate, toastError, logout, isAuthenticated]);

  return null;
}

