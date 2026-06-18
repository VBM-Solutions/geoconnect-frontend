import React from 'react';
import { EtatEtude } from '../../types';
import { ETAT_LABELS } from '../../constants/labels';

interface EtudeStatusBadgeProps {
  etat?: EtatEtude;
  className?: string;
}

/**
 * Badge coloré représentant l'état courant d'une étude.
 * Réutilisable dans les dashboards et les pages de détail.
 */
export const EtudeStatusBadge: React.FC<EtudeStatusBadgeProps> = ({ etat, className = '' }) => {
  if (!etat) return null;
  const config = ETAT_LABELS[etat];
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
  return ETAT_LABELS[etat]?.label ?? etat;
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

