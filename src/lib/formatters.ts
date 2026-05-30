import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DemandeDevisDTO, DemandeDevisDetail, DocumentRef, EtudeDetailDTO } from '../types';

type DemandeWithDocuments = Pick<DemandeDevisDTO | DemandeDevisDetail, 'docsDevisIds'>;

/**
 * Construit la liste des documents joints à une demande de devis.
 */
export function buildDemandeDocuments(demande?: DemandeWithDocuments | null): DocumentRef[] {
  return (demande?.docsDevisIds ?? [])
    .filter((docId): docId is number => docId != null)
    .map((docId, index) => ({
      id: docId,
      label: `Document de la demande #${index + 1}`,
    }));
}

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

  docs.push(...buildDemandeDocuments(etude.propositionDevis?.demandeDevis));

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

