import React from 'react';
import { EtatEtude } from '../../types';

interface EtudeStatusBadgeProps {
  etat?: EtatEtude;
  className?: string;
}

const ETAT_CONFIG: Record<EtatEtude, { label: string; color: string }> = {
  DEVIS_VALIDE:               { label: 'Devis validé',           color: 'bg-slate-100 text-slate-600' },
  DEVIS_SIGNE:                { label: 'Devis signé',            color: 'bg-emerald-100 text-emerald-700' },
  DATE_INTERVENTION_PROPOSEE: { label: 'Date proposée',          color: 'bg-yellow-100 text-yellow-700' },
  DATE_INTERVENTION_FIXEE:    { label: 'Date fixée',             color: 'bg-blue-100 text-blue-700' },
  INTERVENTION_EFFECTUEE:     { label: 'Intervention effectuée', color: 'bg-indigo-100 text-indigo-700' },
  RAPPORT_TERMINE:            { label: 'Rapport terminé',        color: 'bg-teal-100 text-teal-700' },
  PAIEMENT_EFFECTUE:          { label: 'Clôturée',               color: 'bg-green-100 text-green-700' },
};

/**
 * Badge coloré représentant l'état courant d'une étude.
 * Réutilisable dans les dashboards et les pages de détail.
 */
export const EtudeStatusBadge: React.FC<EtudeStatusBadgeProps> = ({ etat, className = '' }) => {
  if (!etat) return null;
  const config = ETAT_CONFIG[etat];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.color} ${className}`}
    >
      {config.label}
    </span>
  );
};

/** Retourne le libellé lisible d'un état d'étude. */
export const getEtatLabel = (etat?: EtatEtude): string => {
  if (!etat) return '—';
  return ETAT_CONFIG[etat]?.label ?? etat;
};

/** Indique si l'état courant nécessite une action du CLIENT. */
export const clientMustAct = (etat?: EtatEtude): boolean =>
  etat === 'DATE_INTERVENTION_PROPOSEE' || etat === 'RAPPORT_TERMINE';

/** Indique si l'état courant nécessite une action du BUREAU_ETUDE. */
export const beMustAct = (etat?: EtatEtude): boolean =>
  etat === 'DEVIS_SIGNE' ||
  etat === 'DATE_INTERVENTION_PROPOSEE' ||
  etat === 'DATE_INTERVENTION_FIXEE' ||
  etat === 'INTERVENTION_EFFECTUEE';

