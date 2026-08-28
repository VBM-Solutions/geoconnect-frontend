import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { TerrainAnswer } from '../../types';

const ANSWERS: ReadonlyArray<{ value: TerrainAnswer; label: string }> = [
  { value: 'OUI', label: 'Oui' },
  { value: 'NON', label: 'Non' },
  { value: 'NE_SAIS_PAS', label: 'Ne sais pas' },
];

interface TerrainAccessQuestionsProps {
  register: UseFormRegister<Record<string, unknown>>;
  errors: FieldErrors<Record<string, unknown>>;
}

/** Questions logistiques nécessaires à l'évaluation d'une intervention terrain. */
export function TerrainAccessQuestions({ register, errors }: Readonly<TerrainAccessQuestionsProps>) {
  return (
    <fieldset className="space-y-5" aria-describedby="terrain-questions-help">
      <legend className="text-sm font-medium text-slate-700">Conditions d'intervention</legend>
      <p id="terrain-questions-help" className="-mt-3 text-xs text-slate-500">
        Ces informations permettent aux bureaux d'études de préparer leur intervention.
      </p>
      <TerrainQuestion
        name="presenceReseaux"
        label="Présence de réseaux sur la parcelle ?"
        error={errors.presenceReseaux?.message}
        register={register}
      />
      <TerrainQuestion
        name="accessibiliteMachines"
        label="Accessibilité du terrain pour des machines ?"
        error={errors.accessibiliteMachines?.message}
        register={register}
      />
    </fieldset>
  );
}

function TerrainQuestion({
  name,
  label,
  error,
  register,
}: Readonly<{
  name: 'presenceReseaux' | 'accessibiliteMachines';
  label: string;
  error?: string;
  register: UseFormRegister<Record<string, unknown>>;
}>) {
  const errorId = `${name}-error`;
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700">{label} *</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-describedby={error ? errorId : undefined}>
        {ANSWERS.map(({ value, label: answerLabel }) => (
          <label key={value} className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:border-blue-400">
            <input
              type="radio"
              value={value}
              {...register(name, { required: 'Veuillez sélectionner une réponse' })}
              className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            {answerLabel}
          </label>
        ))}
      </div>
      {error && <p id={errorId} role="alert" className="mt-1 text-xs text-red-500">{String(error)}</p>}
    </div>
  );
}
