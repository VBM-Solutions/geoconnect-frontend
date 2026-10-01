 import React from 'react';
import { Landmark } from 'lucide-react';
import { EtatEtude, DemandeDevisDetail } from '../../types';
import { ETAT_LABELS, TYPE_LABELS } from '../../constants/labels';
import { CardTitle } from '../ui/Card';
import { EtudeTypeIcon } from './EtudeTypeIcon';

interface EtudeCardHeaderProps {
  readonly demande?: DemandeDevisDetail;
  readonly etat?: EtatEtude;
}

/**
 * En-tête partagée entre les cartes étude du dashboard client et BE :
 * icône de type + adresse + parcelles cadastrales + badges (type & état).
 */
export function EtudeCardHeader({ demande, etat }: EtudeCardHeaderProps) {
  const etatInfo  = etat ? ETAT_LABELS[etat] : null;
  const parcelles: string[] = demande?.referencesCadastrales ?? [];

  return (
    <div className="flex justify-between items-start">
      <div className="space-y-0.5">
        <CardTitle className="flex items-center flex-wrap gap-x-1.5 text-slate-800">
          <EtudeTypeIcon type={demande?.type} className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{demande?.adresseProjet?.rue || demande?.adresseProjet?.ville || 'Projet géotechnique'}</span>
          {(demande?.adresseProjet?.ville || demande?.adresseProjet?.codePostal) && (
            <span className="text-slate-400 font-normal text-xs">
              {[demande.adresseProjet.ville, demande.adresseProjet.codePostal].filter(Boolean).join(' ')}
            </span>
          )}
        </CardTitle>
        {parcelles.length > 0 && (
          <p className="flex items-center flex-wrap gap-x-1.5 text-[10px] text-slate-400 mt-0.5">
            <Landmark className="w-2.5 h-2.5 shrink-0" />
            {parcelles.join(' · ')}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
        {demande?.type && (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-semibold text-right">
            {TYPE_LABELS[demande.type] ?? demande.type}
          </span>
        )}
        {etatInfo && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${etatInfo.color}`}>
            {etatInfo.label}
          </span>
        )}
      </div>
    </div>
  );
}

