import React, { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { UseBureauEtudeIbanReturn } from '../../hooks/useBureauEtudeIban';
import { ParametresSectionCard } from './ParametresSectionCard';
import {
  ParametresInlineFieldError,
  ParametresLoadErrorState,
  ParametresLoadingState,
  ParametresSubmitButton,
} from './ParametresCommonUI';
import {
  formatIban,
  getBackendErrorMessage,
  getBackendFieldError,
  IBAN_REGEX,
  normalizeIban,
} from './parametresUtils';

interface SectionIbanProps
  extends Pick<UseBureauEtudeIbanReturn, 'bureau' | 'isLoading' | 'isSavingIban' | 'loadError' | 'saveIban'> {}

export function SectionIban({ bureau, isLoading, isSavingIban, loadError, saveIban }: Readonly<SectionIbanProps>) {
  const { toastSuccess, toastError } = useToast();
  const [iban, setIban] = useState('');
  const [ibanError, setIbanError] = useState<string | null>(null);

  useEffect(() => {
    setIban(bureau?.iban ?? '');
    setIbanError(null);
  }, [bureau?.iban]);

  const currentIban = normalizeIban(bureau?.iban ?? '');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIbanError(null);

    const normalized = normalizeIban(iban);
    if (normalized === currentIban) {
      return;
    }

    if (!normalized || !IBAN_REGEX.test(normalized)) {
      setIbanError('IBAN invalide.');
      return;
    }

    try {
      await saveIban(normalized);
      toastSuccess('IBAN enregistré ✓');
    } catch (error) {
      setIbanError(getBackendFieldError(error, 'iban'));
      if (!getBackendFieldError(error, 'iban')) {
        toastError(getBackendErrorMessage(error, 'Impossible d\'enregistrer l\'IBAN. Veuillez réessayer.'));
      }
    }
  };

  if (isLoading) {
    return <ParametresLoadingState />;
  }

  if (loadError) {
    return <ParametresLoadErrorState message={loadError} />;
  }

  return (
    <ParametresSectionCard
      icon={Building2}
      title="IBAN"
      description="Renseignez l'IBAN utilisé pour vos paramètres bureau d'études."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="iban" className="block text-sm font-medium text-slate-700">
            IBAN
          </label>
          <input
            id="iban"
            type="text"
            value={formatIban(iban)}
            onChange={(event) => setIban(normalizeIban(event.target.value))}
            placeholder="FR76 3000 6000 0112 3456 7890 189"
            className={`w-full rounded-lg border px-3 py-2 text-sm font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              ibanError ? 'border-red-300' : 'border-slate-300'
            }`}
            aria-invalid={Boolean(ibanError)}
            aria-describedby={ibanError ? 'iban-error' : undefined}
          />
          <p className="text-xs text-slate-500">Les espaces saisis sont supprimés avant l'envoi.</p>
          {ibanError && (
            <ParametresInlineFieldError id="iban-error" message={ibanError} />
          )}
        </div>

        <div className="flex justify-end">
          <ParametresSubmitButton isSaving={isSavingIban} />
        </div>
      </form>
    </ParametresSectionCard>
  );
}

