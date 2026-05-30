import { getPasswordRequirementStatuses } from '../../lib/validators';

interface PasswordRequirementsHintProps {
  password?: string;
}

export function PasswordRequirementsHint({ password = '' }: Readonly<PasswordRequirementsHintProps>) {
  const hasStartedTyping = password.length > 0;
  const requirementStatuses = getPasswordRequirementStatuses(password);

  return (
    <div
      aria-live="polite"
      className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
        Le mot de passe doit contenir :
      </p>
      <ul className="mt-2 space-y-1">
        {requirementStatuses.map((requirement) => {
          let textColor = 'text-slate-500';
          if (requirement.isMet) {
            textColor = 'text-emerald-700';
          } else if (hasStartedTyping) {
            textColor = 'text-amber-700';
          }

          return (
            <li
              key={requirement.key}
              aria-label={`${requirement.isMet ? 'Critère rempli' : 'Critère manquant'} : ${requirement.label}`}
              className={`flex items-center gap-2 text-xs ${textColor}`}
            >
              <span aria-hidden="true" className="font-semibold">
                {requirement.isMet ? '✓' : '○'}
              </span>
              <span>{requirement.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}


