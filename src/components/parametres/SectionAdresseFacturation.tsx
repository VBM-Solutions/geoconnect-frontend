import React, { useEffect, useState } from 'react';
import { Home } from 'lucide-react';
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
  isNonEmpty,
  isValidCodePostal,
} from './parametresUtils';

interface SectionAdresseFacturationProps
  extends Pick<UseClientParametresReturn, 'client' | 'isLoading' | 'isSavingAdresse' | 'loadError' | 'saveAdresseFacturation'> {}

interface AdresseFormState {
  rue: string;
  codePostal: string;
  ville: string;
}

const EMPTY_ADRESSE: AdresseFormState = { rue: '', codePostal: '', ville: '' };

export function SectionAdresseFacturation({
  client,
  isLoading,
  isSavingAdresse,
  loadError,
  saveAdresseFacturation,
}: Readonly<SectionAdresseFacturationProps>) {
  const { toastSuccess, toastError } = useToast();
  const [adresse, setAdresse] = useState<AdresseFormState>(EMPTY_ADRESSE);
  const [errors, setErrors] = useState<Partial<Record<keyof AdresseFormState, string>>>({});

  useEffect(() => {
    setAdresse({
      rue: client?.adresseFacturation?.rue ?? '',
      codePostal: client?.adresseFacturation?.codePostal ?? '',
      ville: client?.adresseFacturation?.ville ?? '',
    });
    setErrors({});
  }, [client?.adresseFacturation?.rue, client?.adresseFacturation?.codePostal, client?.adresseFacturation?.ville]);

  const currentAdresse = {
    rue: client?.adresseFacturation?.rue ?? '',
    codePostal: client?.adresseFacturation?.codePostal ?? '',
    ville: client?.adresseFacturation?.ville ?? '',
  };

  const handleChange = (field: keyof AdresseFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setAdresse((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof AdresseFormState, string>> = {};

    if (!isNonEmpty(adresse.rue)) nextErrors.rue = 'La rue est obligatoire.';
    if (!isValidCodePostal(adresse.codePostal)) nextErrors.codePostal = 'Code postal invalide.';
    if (!isNonEmpty(adresse.ville)) nextErrors.ville = 'La ville est obligatoire.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      adresse.rue.trim() === currentAdresse.rue.trim() &&
      adresse.codePostal.trim() === currentAdresse.codePostal.trim() &&
      adresse.ville.trim() === currentAdresse.ville.trim()
    ) {
      return;
    }

    if (!validate()) {
      return;
    }

    try {
      await saveAdresseFacturation({
        rue: adresse.rue.trim(),
        codePostal: adresse.codePostal.trim(),
        ville: adresse.ville.trim(),
      });
      toastSuccess('Adresse de facturation enregistrée ✓');
    } catch (error) {
      const nextErrors: Partial<Record<keyof AdresseFormState, string>> = {
        rue: getBackendFieldError(error, 'rue') ?? undefined,
        codePostal: getBackendFieldError(error, 'codePostal') ?? undefined,
        ville: getBackendFieldError(error, 'ville') ?? undefined,
      };
      setErrors(nextErrors);
      if (!nextErrors.rue && !nextErrors.codePostal && !nextErrors.ville) {
        toastError(getBackendErrorMessage(error, 'Impossible d\'enregistrer l\'adresse de facturation. Veuillez réessayer.'));
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
      icon={Home}
      title="Adresse de facturation"
      description="Renseignez l'adresse utilisée pour la facturation."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="adresse-rue" className="block text-sm font-medium text-slate-700">
            Rue
          </label>
          <input
            id="adresse-rue"
            type="text"
            value={adresse.rue}
            onChange={handleChange('rue')}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.rue ? 'border-red-300' : 'border-slate-300'
            }`}
            aria-invalid={Boolean(errors.rue)}
            aria-describedby={errors.rue ? 'adresse-rue-error' : undefined}
          />
          {errors.rue && (
            <ParametresInlineFieldError id="adresse-rue-error" message={errors.rue} />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
          <div className="space-y-1.5">
            <label htmlFor="adresse-code-postal" className="block text-sm font-medium text-slate-700">
              Code postal
            </label>
            <input
              id="adresse-code-postal"
              type="text"
              inputMode="numeric"
              value={adresse.codePostal}
              onChange={handleChange('codePostal')}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.codePostal ? 'border-red-300' : 'border-slate-300'
              }`}
              aria-invalid={Boolean(errors.codePostal)}
              aria-describedby={errors.codePostal ? 'adresse-code-postal-error' : undefined}
            />
            {errors.codePostal && (
              <ParametresInlineFieldError id="adresse-code-postal-error" message={errors.codePostal} />
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="adresse-ville" className="block text-sm font-medium text-slate-700">
              Ville
            </label>
            <input
              id="adresse-ville"
              type="text"
              value={adresse.ville}
              onChange={handleChange('ville')}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.ville ? 'border-red-300' : 'border-slate-300'
              }`}
              aria-invalid={Boolean(errors.ville)}
              aria-describedby={errors.ville ? 'adresse-ville-error' : undefined}
            />
            {errors.ville && (
              <ParametresInlineFieldError id="adresse-ville-error" message={errors.ville} />
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <ParametresSubmitButton isSaving={isSavingAdresse} />
        </div>
      </form>
    </ParametresSectionCard>
  );
}

