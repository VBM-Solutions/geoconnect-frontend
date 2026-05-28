import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DocumentRef, EtudeDetailDTO } from '../types';

/**
 * Construit la liste des documents disponibles pour une étude donnée,
 * à partir des IDs présents dans l'EtudeDetailDTO.
 */
export function buildEtudeDocuments(etude: EtudeDetailDTO): DocumentRef[] {
  const docs: DocumentRef[] = [];

  const devisPdfId = etude.propositionDevis?.devisPdfId;
  if (devisPdfId != null) {
    docs.push({ id: devisPdfId, label: 'Devis (proposition)' });
  }

  const docsDevisId = etude.propositionDevis?.demandeDevis?.docsDevisId;
  if (docsDevisId != null) {
    docs.push({ id: docsDevisId, label: 'Documents de la demande' });
  }

  if (etude.devisSigneId != null) {
    docs.push({ id: etude.devisSigneId, label: 'Devis signé' });
  }

  if (etude.rapportId != null) {
    docs.push({ id: etude.rapportId, label: 'Rapport final' });
  }

  return docs;
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

