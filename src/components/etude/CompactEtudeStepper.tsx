import { AlertCircle, Check } from 'lucide-react';
import { EtatEtude } from '../../types';
import { clientMustAct } from './EtudeStatusBadge';
import { ETUDE_STEPS, getActiveStepIndex } from './EtudeStepper';

interface CompactEtudeStepperProps {
  etat?: EtatEtude;
}

export function CompactEtudeStepper({ etat }: Readonly<CompactEtudeStepperProps>) {
  if (!etat) return null;

  const currentIndex = getActiveStepIndex(etat);
  const currentStep = ETUDE_STEPS[currentIndex];
  const actionRequired = clientMustAct(etat);

  return (
    <div className="space-y-2" aria-label="Progression de l’étude">
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="font-semibold text-slate-700">{currentStep.label}</span>
        {actionRequired && (
          <span className="inline-flex items-center gap-1 font-semibold text-orange-700">
            <AlertCircle className="h-3.5 w-3.5" />
            {currentStep.descriptionClient}
          </span>
        )}
      </div>
      <ol className="flex items-center" aria-label={`${currentIndex + 1} étapes sur ${ETUDE_STEPS.length} atteintes`}>
        {ETUDE_STEPS.map((step, index) => {
          const completed = index < currentIndex || (index === currentIndex && index === ETUDE_STEPS.length - 1);
          return (
            <li key={step.etat} className="flex flex-1 items-center last:flex-none">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${completed ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 bg-slate-100 text-slate-400'}`}
                aria-label={`${step.label} : ${completed ? 'validée' : 'à valider'}`}
              >
                {completed ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </span>
              {index < ETUDE_STEPS.length - 1 && (
                <span className={`h-0.5 flex-1 ${index < currentIndex ? 'bg-green-500' : 'bg-slate-200'}`} />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
