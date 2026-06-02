import { type Dispatch, type MutableRefObject, type SetStateAction, useEffect, useRef, useState } from 'react';

interface UseProfilParametresOptions<T> {
  loadProfil: () => Promise<T | null>;
  loadErrorMessage?: string;
}

interface UseProfilParametresReturn<T> {
  profil: T | null;
  setProfil: Dispatch<SetStateAction<T | null>>;
  isLoading: boolean;
  loadError: string | null;
  isMounted: MutableRefObject<boolean>;
}

const DEFAULT_LOAD_ERROR = 'Impossible de charger les paramètres. Veuillez réessayer.';

export function useProfilParametres<T>({
  loadProfil,
  loadErrorMessage = DEFAULT_LOAD_ERROR,
}: Readonly<UseProfilParametresOptions<T>>): UseProfilParametresReturn<T> {
  const [profil, setProfil] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const nextProfil = await loadProfil();
        if (!cancelled && isMounted.current) {
          setProfil(nextProfil);
        }
      } catch {
        if (!cancelled && isMounted.current) {
          setLoadError(loadErrorMessage);
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
  }, [loadErrorMessage, loadProfil]);

  return {
    profil,
    setProfil,
    isLoading,
    loadError,
    isMounted,
  };
}


