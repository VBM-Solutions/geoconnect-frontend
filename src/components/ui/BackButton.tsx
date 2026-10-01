import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BackButtonProps {
  /** URL cible (tableau de bord avec onglet encodé, ex : "/client/dashboard?tab=ETUDES") */
  readonly to: string;
  /** Libellé affiché (défaut : "Retour") */
  readonly label?: string;
  readonly className?: string;
}

/**
 * Bouton de retour vers une section parente identifiée.
 * Navigue toujours vers `to` — l'onglet est encodé dans l'URL,
 * donc le dashboard s'ouvre directement sur le bon onglet.
 */
export function BackButton({ to, label = 'Retour', className }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className={cn(
        'inline-flex items-center text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider',
        className,
      )}
    >
      <ChevronLeft className="w-3 h-3 mr-1" />
      {label}
    </button>
  );
}


