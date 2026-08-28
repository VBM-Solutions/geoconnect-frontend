import type { TypeDemandeDevis } from '../types';

export type DocumentCategory =
  | 'EXTRAIT_CADASTRAL' | 'PLAN_SITUATION' | 'PLAN_TOPOGRAPHIQUE'
  | 'PHOTO_ACCES' | 'PLAN_RESEAUX_PRIVES' | 'AUTORISATION_ACCES_SITE'
  | 'PLAN_ARCHITECTURAL' | 'PLAN_BET_DDC' | 'ETUDES_G2_AVP_PRO'
  | 'RAPPORT_ASSURANCE' | 'AUTRE';

export interface TypedDocumentDraft {
  key: string;
  file: File;
  categorie: DocumentCategory;
  precision?: string;
}

const UNIVERSAL: DocumentCategory[] = [
  'EXTRAIT_CADASTRAL', 'PLAN_SITUATION', 'PLAN_TOPOGRAPHIQUE', 'PHOTO_ACCES',
  'PLAN_RESEAUX_PRIVES', 'AUTORISATION_ACCES_SITE', 'AUTRE',
];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  EXTRAIT_CADASTRAL: 'Extrait cadastral (toute étude)',
  PLAN_SITUATION: 'Plan de situation (toute étude)',
  PLAN_TOPOGRAPHIQUE: 'Plan topographique (toute étude)',
  PHOTO_ACCES: 'Photo des accès (toute étude)',
  PLAN_RESEAUX_PRIVES: 'Plan de réseaux privés (toute étude)',
  AUTORISATION_ACCES_SITE: "Autorisation d’accès sur site (toute étude)",
  PLAN_ARCHITECTURAL: 'Plan architectural (G1 ELAN, G1 ES PGC, G2 AVP, G2 PRO)',
  PLAN_BET_DDC: 'Plan BET de DDC (G2 PRO)',
  ETUDES_G2_AVP_PRO: 'Études G2 AVP et PRO (G3)',
  RAPPORT_ASSURANCE: "Rapport d’assurance (G5)",
  AUTRE: 'Autre — précisez (toute étude)',
};

export function categoriesForStudy(type?: TypeDemandeDevis): DocumentCategory[] {
  const categories = [...UNIVERSAL];
  if (type && ['G1_ELAN', 'G1_ES_PGC', 'G2_AVP', 'G2_PRO'].includes(type)) categories.splice(-1, 0, 'PLAN_ARCHITECTURAL');
  if (type === 'G2_PRO') categories.splice(-1, 0, 'PLAN_BET_DDC');
  if (type === 'G5') categories.splice(-1, 0, 'RAPPORT_ASSURANCE');
  return categories;
}

export function categoryShortLabel(category: DocumentCategory): string {
  if (category === 'AUTRE') return 'Autre';
  return DOCUMENT_CATEGORY_LABELS[category].replace(/ \([^)]*\)$/, '');
}
