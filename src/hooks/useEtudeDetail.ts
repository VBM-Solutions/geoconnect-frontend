import { useState, useCallback, useEffect } from 'react';
import { getEtudeDetailById, getEtudeDocuments } from '../api/etude';
import { EtudeDetailDTO, EtudeDocumentsDTO } from '../types';
import { useToast } from '../contexts/ToastContext';

/**
 * Hook partagé pour les pages de détail d'étude (CLIENT & BE).
 * Gère le chargement initial, le re-fetch après action, et les états dérivés.
 */
export function useEtudeDetail(id: string | undefined) {
  const { toastError } = useToast();
  const [etude, setEtude] = useState<EtudeDetailDTO | null>(null);
  const [documents, setDocuments] = useState<EtudeDocumentsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (error) toastError(error); }, [error, toastError]);

  const fetchEtude = useCallback(async () => {
    if (!id) return;
    try {
      const [etudeData, docsData] = await Promise.all([
        getEtudeDetailById(Number(id)),
        getEtudeDocuments(Number(id)),
      ]);
      setEtude(etudeData);
      setDocuments(docsData);
    } catch {
      setError("Impossible de charger les données de l'étude.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchEtude(); }, [fetchEtude]);

  /**
   * Exécute une action PATCH puis re-fetche le détail complet.
   * On ne se fie pas à la réponse du PATCH (DTO partiel sans relations) pour
   * éviter les écrans vides après transition d'état.
   */
  const withAction = useCallback(async (fn: () => Promise<unknown>, key?: string) => {
    setActionLoading(true);
    setActionKey(key ?? null);
    setError(null);
    try {
      await fn();
      const [refreshed, refreshedDocs] = await Promise.all([
        getEtudeDetailById(Number(id)),
        getEtudeDocuments(Number(id)),
      ]);
      setEtude(refreshed);
      setDocuments(refreshedDocs);
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Une erreur est survenue.';
      setError(msg);
    } finally {
      setActionLoading(false);
      setActionKey(null);
    }
  }, [id]);

  return { etude, documents, isLoading, actionLoading, actionKey, error, withAction };
}

