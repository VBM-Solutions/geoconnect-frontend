import React from 'react';

interface UtilisateurStatusBadgeProps {
  enabled: boolean;
  activationStatus?: 'INVITED' | 'ACTIVATED';
}

export function UtilisateurStatusBadge({ enabled, activationStatus = 'ACTIVATED' }: Readonly<UtilisateurStatusBadgeProps>) {
  const invited = activationStatus === 'INVITED';
  let label = 'Desactive';
  if (invited) {
    label = 'Invitation en attente';
  } else if (enabled) {
    label = 'Actif';
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        enabled && !invited
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-slate-300 bg-slate-100 text-slate-600'
      }`}
    >
      {label}
    </span>
  );
}

