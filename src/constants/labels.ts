import { EtatEtude, StatutProposition, TypeDemandeDevis } from '../types';

export const ETAT_LABELS: Record<EtatEtude, { label: string; color: string }> = {
  DEVIS_VALIDE:               { label: 'Devis validé',           color: 'bg-slate-100 text-slate-600' },
  DEVIS_SIGNE:                { label: 'Devis signé',            color: 'bg-emerald-100 text-emerald-700' },
  DATE_INTERVENTION_PROPOSEE: { label: 'Date proposée',          color: 'bg-yellow-100 text-yellow-700' },
  DATE_INTERVENTION_FIXEE:    { label: 'Date fixée',             color: 'bg-blue-100 text-blue-700' },
  INTERVENTION_EFFECTUEE:     { label: 'Intervention effectuée', color: 'bg-indigo-100 text-indigo-700' },
  RAPPORT_TERMINE:            { label: 'Rapport terminé',        color: 'bg-teal-100 text-teal-700' },
  PAIEMENT_EFFECTUE:          { label: 'Clôturée',               color: 'bg-green-100 text-green-700' },
};

export const STATUT_LABELS: Record<StatutProposition, string> = {
  EN_ATTENTE: 'En attente',
  ACCEPTEE:   'Acceptée',
  REFUSEE:    'Refusée',
};

export const TYPE_LABELS: Record<TypeDemandeDevis, string> = {
  ASSAINISSEMENT: 'Etude d\'assainissement',
  G0:             'G0 — Sondage',
  G1_ES_PGC:      'G1 ES PGC — Étude de site',
  G1_ELAN:        'G1 ÉLAN — Étude de site',
  G2_AVP:         'G2 AVP — Avant-projet',
  G2_PRO:         'G2 PRO — Projet',
  G5:             'G5 — Diagnostic',
};

