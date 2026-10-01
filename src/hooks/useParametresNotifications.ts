import { useState, useCallback, useEffect, useRef } from 'react';
import { DepartementDTO, NotificationPreferencesDTO } from '../types';
import { getDepartements } from '../api/referentiel';
import { getNotificationPreferences, updateNotificationPreferences } from '../api/parametres';

// ─── Types publics ────────────────────────────────────────────────────────────

export interface UseParametresNotificationsReturn {
  /** Liste complète des 101 départements (référentiel). */
  departements: DepartementDTO[];
  /** Préférences courantes (null tant que non chargées). */
  preferences: NotificationPreferencesDTO | null;
  /** Chargement initial (departements + préférences). */
  isLoading: boolean;
  /** Enregistrement en cours (appel PUT). */
  isSaving: boolean;
  /** Message d'erreur au chargement initial. */
  loadError: string | null;
  /** Met à jour les préférences et appelle PUT. Retourne true si succès. */
  savePreferences: (prefs: NotificationPreferencesDTO) => Promise<boolean>;
}

// Cache module-level pour les départements (données statiques)
let departementsCache: DepartementDTO[] | null = null;

/**
 * Hook encapsulant la logique métier de l'onglet "Notifications" des paramètres.
 *
 * - Charge les départements une seule fois (cache module-level).
 * - Charge les préférences au montage.
 * - Expose `savePreferences` pour le formulaire.
 */
export function useParametresNotifications(): UseParametresNotificationsReturn {
  const [departements, setDepartements] = useState<DepartementDTO[]>(departementsCache ?? []);
  const [preferences, setPreferences] = useState<NotificationPreferencesDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ── Chargement initial ───────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);

      try {
        // Départements : servis depuis le cache si déjà chargés
        if (departementsCache === null) {
          departementsCache = await getDepartements();
        }
        const depts = departementsCache;

        const prefs = await getNotificationPreferences();

        if (!cancelled && isMounted.current) {
          setDepartements(depts);
          setPreferences(prefs);
        }
      } catch {
        if (!cancelled && isMounted.current) {
          setLoadError('Impossible de charger les paramètres. Veuillez réessayer.');
        }
      } finally {
        if (!cancelled && isMounted.current) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Sauvegarde ───────────────────────────────────────────────────────────────

  const savePreferences = useCallback(async (prefs: NotificationPreferencesDTO): Promise<boolean> => {
    setIsSaving(true);
    try {
      const saved = await updateNotificationPreferences(prefs);
      if (isMounted.current) setPreferences(saved);
      return true;
    } catch {
      return false;
    } finally {
      if (isMounted.current) setIsSaving(false);
    }
  }, []);

  return {
    departements,
    preferences,
    isLoading,
    isSaving,
    loadError,
    savePreferences,
  };
}

/** Réinitialise le cache des départements (utile pour les tests unitaires). */
export function _resetDepartementsCache() {
  departementsCache = null;
}

