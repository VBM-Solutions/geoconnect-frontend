import { useCallback, useEffect, useRef, useState } from 'react';
import {
  depublierMonProfilPublic,
  getMaFicheBureauEtude,
  publierMonProfilPublic,
  updateMonProfilPublic,
} from '../api/profilBureauEtude';
import {
  FicheBureauEtudeDTO,
  ProfilPublicBureauEtudeDTO,
  UpdateProfilPublicBureauEtudePayload,
} from '../types';
import { extractErrorMessage } from '../lib/utils';

type ProfileAction = 'save' | 'publish' | 'unpublish' | null;

export interface UseFicheBureauEtudeReturn {
  fiche: FicheBureauEtudeDTO | null;
  isLoading: boolean;
  loadError: string | null;
  action: ProfileAction;
  reload: () => Promise<void>;
  save: (payload: UpdateProfilPublicBureauEtudePayload) => Promise<ProfilPublicBureauEtudeDTO>;
  publish: (payload: UpdateProfilPublicBureauEtudePayload) => Promise<ProfilPublicBureauEtudeDTO>;
  unpublish: (payload: UpdateProfilPublicBureauEtudePayload) => Promise<ProfilPublicBureauEtudeDTO>;
}

export function useFicheBureauEtude(): UseFicheBureauEtudeReturn {
  const [fiche, setFiche] = useState<FicheBureauEtudeDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [action, setAction] = useState<ProfileAction>(null);
  const mounted = useRef(true);

  const replaceProfile = useCallback((profilPublic: ProfilPublicBureauEtudeDTO) => {
    if (!mounted.current) return;
    setFiche(current => current ? { ...current, profilPublic } : current);
  }, []);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const result = await getMaFicheBureauEtude();
      if (mounted.current) setFiche(result);
    } catch (error) {
      if (mounted.current) {
        setLoadError(extractErrorMessage(error, 'Impossible de charger votre fiche.'));
      }
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void reload();
    return () => {
      mounted.current = false;
    };
  }, [reload]);

  const runAction = useCallback(async (
    currentAction: Exclude<ProfileAction, null>,
    operation: () => Promise<ProfilPublicBureauEtudeDTO>,
  ) => {
    setAction(currentAction);
    try {
      const profile = await operation();
      replaceProfile(profile);
      return profile;
    } finally {
      if (mounted.current) setAction(null);
    }
  }, [replaceProfile]);

  const save = useCallback(
    (payload: UpdateProfilPublicBureauEtudePayload) =>
      runAction('save', () => updateMonProfilPublic(payload)),
    [runAction],
  );

  const publish = useCallback(
    (payload: UpdateProfilPublicBureauEtudePayload) =>
      runAction('publish', async () => {
        const updated = await updateMonProfilPublic(payload);
        replaceProfile(updated);
        return publierMonProfilPublic();
      }),
    [replaceProfile, runAction],
  );

  const unpublish = useCallback(
    (payload: UpdateProfilPublicBureauEtudePayload) =>
      runAction('unpublish', async () => {
        const updated = await updateMonProfilPublic(payload);
        replaceProfile(updated);
        return depublierMonProfilPublic();
      }),
    [replaceProfile, runAction],
  );

  return { fiche, isLoading, loadError, action, reload, save, publish, unpublish };
}
