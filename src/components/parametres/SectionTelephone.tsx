import React, { useEffect, useState } from 'react';
import { Phone } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { UseClientParametresReturn } from '../../hooks/useClientParametres';
import { ParametresSectionCard } from './ParametresSectionCard';
import {
  ParametresInlineFieldError,
  ParametresLoadErrorState,
  ParametresLoadingState,
  ParametresSubmitButton,
} from './ParametresCommonUI';
import {
  getBackendErrorMessage,
  getBackendFieldError,
  isValidTelephone,
} from './parametresUtils';

interface SectionTelephoneProps
  extends Pick<UseClientParametresReturn, 'client' | 'isLoading' | 'isSavingTelephone' | 'loadError' | 'saveTelephone'> {}

export function SectionTelephone({
  client,
  isLoading,
  isSavingTelephone,
  loadError,
  saveTelephone,
}: Readonly<SectionTelephoneProps>) {
  const { toastSuccess, toastError } = useToast();
  const [telephone, setTelephone] = useState('');
  const [telephoneError, setTelephoneError] = useState<string | null>(null);

  useEffect(() => {
    setTelephone(client?.telContact ?? '');
    setTelephoneError(null);
  }, [client?.telContact]);

  const currentTelephone = (client?.telContact ?? '').trim();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTelephoneError(null);

    const nextTelephone = telephone.trim();
    if (nextTelephone === currentTelephone) {
      return;
    }

    if (!nextTelephone || !isValidTelephone(nextTelephone)) {
      setTelephoneError('Numéro de téléphone invalide.');
      return;
    }

    try {
      await saveTelephone(nextTelephone);
      toastSuccess('Téléphone enregistré ✓');
    } catch (error) {
      setTelephoneError(getBackendFieldError(error, 'telephone'));
      if (!getBackendFieldError(error, 'telephone')) {
        toastError(getBackendErrorMessage(error, 'Impossible d\'enregistrer le téléphone. Veuillez réessayer.'));
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
      icon={Phone}
      title="Téléphone"
      description="Modifiez votre numéro de contact principal."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="client-telephone" className="block text-sm font-medium text-slate-700">
            Téléphone
          </label>
          <input
            id="client-telephone"
            type="tel"
            value={telephone}
            onChange={(event) => setTelephone(event.target.value)}
            placeholder="0612345678"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              telephoneError ? 'border-red-300' : 'border-slate-300'
            }`}
            aria-invalid={Boolean(telephoneError)}
            aria-describedby={telephoneError ? 'client-telephone-error' : undefined}
          />
          <p className="text-xs text-slate-500">Chiffres, espaces, +, - et parenthèses autorisés.</p>
          {telephoneError && (
            <ParametresInlineFieldError id="client-telephone-error" message={telephoneError} />
          )}
        </div>

        <div className="flex justify-end">
          <ParametresSubmitButton isSaving={isSavingTelephone} />
        </div>
      </form>
    </ParametresSectionCard>
  );
}

