import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DemandeDevisDTO, DemandeDevisDetail, DocumentDTO } from '../types';

type DemandeWithDocuments = Pick<DemandeDevisDTO | DemandeDevisDetail, 'documentsDevis'>;

/**
 * Construit la liste des documents joints à une demande de devis.
 */
export function buildDemandeDocuments(demande?: DemandeWithDocuments | null): DocumentDTO[] {
  return demande?.documentsDevis ?? [];
}

/**
 * Formate une date ISO en "dd/MM/yyyy". Retourne '—' si absente ou invalide.
 */
export const formatDateShort = (value?: string): string => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '—' : format(parsed, 'dd/MM/yyyy');
};

/**
 * Formate une date ISO en "dd MMMM yyyy" (français). Retourne null si absente ou invalide.
 */
export const formatDateLong = (value?: string): string | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : format(parsed, 'dd MMMM yyyy', { locale: fr });
};

