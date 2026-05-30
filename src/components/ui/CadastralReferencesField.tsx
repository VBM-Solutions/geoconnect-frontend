import { Plus, Trash2 } from 'lucide-react';
import { CADASTRAL_REFERENCE_PLACEHOLDER, EMPTY_CADASTRAL_REFERENCE } from '../../lib/cadastralReferences';

interface CadastralReferencesFieldProps {
  value: string[];
  onChange: (nextValue: string[]) => void;
  label?: string;
  addButtonLabel?: string;
  placeholder?: string;
}

export function CadastralReferencesField({
  value,
  onChange,
  label = 'Références cadastrales',
  addButtonLabel = 'Ajouter une référence',
  placeholder = CADASTRAL_REFERENCE_PLACEHOLDER,
}: Readonly<CadastralReferencesFieldProps>) {
  const referencesCadastrales = value.length > 0 ? value : [EMPTY_CADASTRAL_REFERENCE];

  const updateReference = (index: number, nextReference: string) => {
    onChange(
      referencesCadastrales.map((reference, currentIndex) =>
        currentIndex === index ? nextReference : reference
      )
    );
  };

  const addReference = () => {
    onChange([...referencesCadastrales, EMPTY_CADASTRAL_REFERENCE]);
  };

  const removeReference = (index: number) => {
    const nextReferences = referencesCadastrales.filter((_, currentIndex) => currentIndex !== index);
    onChange(nextReferences.length > 0 ? nextReferences : [EMPTY_CADASTRAL_REFERENCE]);
  };

  return (
    <div className="sm:col-span-2">
      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="space-y-2">
        {referencesCadastrales.map((reference, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={reference}
              onChange={(event) => updateReference(index, event.target.value)}
              placeholder={placeholder}
              aria-label={`Référence cadastrale ${index + 1}`}
              className="flex-1 h-11 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 transition-colors"
            />
            {referencesCadastrales.length > 1 && (
              <button
                type="button"
                onClick={() => removeReference(index)}
                className="p-2 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Supprimer"
                aria-label={`Supprimer la référence cadastrale ${index + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addReference}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-md transition-colors border border-dashed border-slate-300"
        >
          <Plus className="w-3.5 h-3.5" />
          {addButtonLabel}
        </button>
      </div>
    </div>
  );
}

