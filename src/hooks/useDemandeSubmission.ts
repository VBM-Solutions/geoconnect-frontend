import { useState } from 'react';
import { createDemandeDevis } from '../api/demandeDevis';
import { uploadDocuments } from '../api/document';
import { DemandeDevisDTO } from '../types';
import { isAxiosError } from 'axios';

interface UseDemandeSubmissionOptions {
  onSuccess: () => void;
  onError: (message: string) => void;
}

interface UseDemandeSubmissionReturn {
  submit: (payload: DemandeDevisDTO, docFiles: File[]) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Hook centralisant la soumission d'une demande de devis :
 * upload des documents puis création de la demande.
 */
export function useDemandeSubmission(
  options: UseDemandeSubmissionOptions
): UseDemandeSubmissionReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (payload: DemandeDevisDTO, docFiles: File[]) => {
    setIsSubmitting(true);
    try {
      const docsDevisIds = await uploadDocuments(docFiles);
      await createDemandeDevis({ ...payload, docsDevisIds });
      options.onSuccess();
    } catch (err: unknown) {
      let msg = 'Une erreur est survenue.';
      if (isAxiosError(err) && err.response?.data?.message) {
        msg = String(err.response.data.message);
      } else if (err instanceof Error) {
        msg = err.message;
      }
      options.onError(msg);
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting };
}
