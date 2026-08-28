import { useState } from 'react';
import { createDemandeDevis } from '../api/demandeDevis';
import { uploadDocuments } from '../api/document';
import { DemandeDevisDTO } from '../types';
import { isAxiosError } from 'axios';
import { TypedDocumentDraft } from '../constants/documentCategories';

interface UseDemandeSubmissionOptions {
  onSuccess: () => void;
  onError: (message: string) => void;
}

interface UseDemandeSubmissionReturn {
  submit: (payload: DemandeDevisDTO, documents: TypedDocumentDraft[]) => Promise<void>;
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

  const submit = async (payload: DemandeDevisDTO, documents: TypedDocumentDraft[]) => {
    setIsSubmitting(true);
    try {
      const docsDevisIds = await uploadDocuments(documents.map(document => document.file));
      await createDemandeDevis({
        ...payload,
        docsDevisIds,
        documentsDemande: documents.map((document, index) => ({
          documentId: docsDevisIds[index],
          categorie: document.categorie,
          precision: document.precision,
        })),
      });
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
