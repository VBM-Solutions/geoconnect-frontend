import { useCallback, useState } from 'react';
import { AdresseDTO, ClientDTO } from '../types';
import {
  ClientMotDePassePayload,
  getClientProfil,
  updateClientAdresseFacturation,
  updateClientMotDePasse,
  updateClientTelephone,
} from '../api/parametres';
import { useProfilParametres } from './useProfilParametres';

export interface UseClientParametresReturn {
  client: ClientDTO | null;
  isLoading: boolean;
  loadError: string | null;
  isSavingTelephone: boolean;
  isSavingAdresse: boolean;
  isSavingMotDePasse: boolean;
  saveTelephone: (telephone: string) => Promise<ClientDTO>;
  saveAdresseFacturation: (adresse: Pick<AdresseDTO, 'rue' | 'codePostal' | 'ville'>) => Promise<ClientDTO>;
  saveMotDePasse: (payload: ClientMotDePassePayload) => Promise<void>;
}

export function useClientParametres(): UseClientParametresReturn {
  const {
    profil: client,
    setProfil: setClient,
    isLoading,
    loadError,
    isMounted,
  } = useProfilParametres<ClientDTO>({
    loadProfil: getClientProfil,
  });
  const [isSavingTelephone, setIsSavingTelephone] = useState(false);
  const [isSavingAdresse, setIsSavingAdresse] = useState(false);
  const [isSavingMotDePasse, setIsSavingMotDePasse] = useState(false);

  const saveTelephone = useCallback(async (telephone: string): Promise<ClientDTO> => {
    setIsSavingTelephone(true);
    try {
      const updated = await updateClientTelephone(telephone);
      if (isMounted.current) {
        setClient(updated);
      }
      return updated;
    } finally {
      if (isMounted.current) {
        setIsSavingTelephone(false);
      }
    }
  }, []);

  const saveAdresseFacturation = useCallback(
    async (adresse: Pick<AdresseDTO, 'rue' | 'codePostal' | 'ville'>): Promise<ClientDTO> => {
      setIsSavingAdresse(true);
      try {
        const updated = await updateClientAdresseFacturation(adresse);
        if (isMounted.current) {
          setClient(updated);
        }
        return updated;
      } finally {
        if (isMounted.current) {
          setIsSavingAdresse(false);
        }
      }
    },
    [],
  );

  const saveMotDePasse = useCallback(async (payload: ClientMotDePassePayload): Promise<void> => {
    setIsSavingMotDePasse(true);
    try {
      await updateClientMotDePasse(payload);
    } finally {
      if (isMounted.current) {
        setIsSavingMotDePasse(false);
      }
    }
  }, []);

  return {
    client,
    isLoading,
    loadError,
    isSavingTelephone,
    isSavingAdresse,
    isSavingMotDePasse,
    saveTelephone,
    saveAdresseFacturation,
    saveMotDePasse,
  };
}

