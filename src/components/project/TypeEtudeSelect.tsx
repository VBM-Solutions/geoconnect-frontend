import { UseFormRegister } from 'react-hook-form';
import { EnumValueDTO } from '../../types';

interface TypeEtudeSelectProps {
  id: string;
  register: UseFormRegister<Record<string, unknown>>;
  disabled?: boolean;
  types: EnumValueDTO[];
  loading?: boolean;
  error?: string;
  label?: string;
  labelClassName?: string;
  selectClassName?: string;
  placeholder?: string;
}

/**
 * Select de type d'étude partagé entre le tunnel (Home) et le formulaire client (NewRequest).
 * Élimine la duplication du markup select + options + loading state.
 */
export function TypeEtudeSelect({
  id,
  register,
  disabled,
  types,
  loading,
  error,
  label = 'Type de mission *',
  labelClassName = 'block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2',
  selectClassName = 'w-full h-11 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 transition-colors disabled:opacity-50',
  placeholder = 'Sélectionner…',
}: Readonly<TypeEtudeSelectProps>) {
  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <select
        id={id}
        className={selectClassName}
        disabled={disabled || loading}
        {...register('type', { required: true })}
      >
        <option value="">{loading ? 'Chargement…' : placeholder}</option>
        {types.map((t) => (
          <option key={t.code} value={t.code}>
            {t.libelle}
          </option>
        ))}
      </select>
      {error && <span className="text-red-500 text-xs mt-1 block">{error}</span>}
    </div>
  );
}
