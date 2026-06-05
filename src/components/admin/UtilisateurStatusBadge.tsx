import React from 'react';

interface UtilisateurStatusBadgeProps {
  enabled: boolean;
}

export function UtilisateurStatusBadge({ enabled }: Readonly<UtilisateurStatusBadgeProps>) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        enabled
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-slate-300 bg-slate-100 text-slate-600'
      }`}
    >
      {enabled ? 'Actif' : 'Desactive'}
    </span>
  );
}

