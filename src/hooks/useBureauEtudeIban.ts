import { useCallback, useState } from 'react';
import { BureauEtudesDTO } from '../types';
import { getCurrentBureauEtude } from '../api/bureauEtude';
import { MotDePassePayload, updateBureauEtudeIban, updateBureauEtudeMotDePasse } from '../api/parametres';
import { useProfilParametres } from './useProfilParametres';

export interface UseBureauEtudeIbanReturn {
  bureau: BureauEtudesDTO | null;
  isLoading: boolean;
  loadError: string | null;
  isSavingIban: boolean;
  isSavingMotDePasse: boolean;
  saveIban: (iban: string) => Promise<BureauEtudesDTO>;
  saveMotDePasse: (payload: MotDePassePayload) => Promise<void>;
}

export function useBureauEtudeIban(): UseBureauEtudeIbanReturn {
  const {
    profil: bureau,
    setProfil: setBureau,
    isLoading,
    loadError,
    isMounted,
  } = useProfilParametres<BureauEtudesDTO>({
    loadProfil: getCurrentBureauEtude,
  });
  const [isSavingIban, setIsSavingIban] = useState(false);
  const [isSavingMotDePasse, setIsSavingMotDePasse] = useState(false);

  const saveIban = useCallback(async (iban: string): Promise<BureauEtudesDTO> => {
    setIsSavingIban(true);
    try {
      const updated = await updateBureauEtudeIban(iban);
      if (isMounted.current) {
        setBureau(updated);
      }
      return updated;
    } finally {
      if (isMounted.current) {
        setIsSavingIban(false);
      }
    }
  }, []);

  const saveMotDePasse = useCallback(async (payload: MotDePassePayload): Promise<void> => {
    setIsSavingMotDePasse(true);
    try {
      await updateBureauEtudeMotDePasse(payload);
    } finally {
      if (isMounted.current) {
        setIsSavingMotDePasse(false);
      }
    }
  }, []);

  return {
    bureau,
    isLoading,
    loadError,
    isSavingIban,
    isSavingMotDePasse,
    saveIban,
    saveMotDePasse,
  };
}


