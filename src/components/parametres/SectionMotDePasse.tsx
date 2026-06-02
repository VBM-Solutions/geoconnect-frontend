import React, { useState } from 'react';
import { Lock, AlertCircle, Loader2, Save } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { PasswordRequirementsHint } from '../ui/PasswordRequirementsHint';
import { MotDePassePayload } from '../../api/parametres';
import { ParametresSectionCard } from './ParametresSectionCard';
import { getBackendErrorMessage, getBackendFieldError } from './parametresUtils';
import { validatePasswordStrength } from '../../lib/validators';

interface SectionMotDePasseProps {
  isSavingMotDePasse: boolean;
  saveMotDePasse: (payload: MotDePassePayload) => Promise<void>;
}

interface PasswordErrors {
  ancienMotDePasse?: string;
  nouveauMotDePasse?: string;
  confirmationMotDePasse?: string;
}

export function SectionMotDePasse({ isSavingMotDePasse, saveMotDePasse }: Readonly<SectionMotDePasseProps>) {
  const { toastSuccess, toastError } = useToast();
  const [ancienMotDePasse, setAncienMotDePasse] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState('');
  const [errors, setErrors] = useState<PasswordErrors>({});

  const clearErrors = () => setErrors({});

  const validate = () => {
    const nextErrors: PasswordErrors = {};

    if (!ancienMotDePasse) nextErrors.ancienMotDePasse = 'Le mot de passe actuel est obligatoire.';
    if (nouveauMotDePasse) {
      const passwordValidation = validatePasswordStrength(nouveauMotDePasse);
      if (passwordValidation !== true) {
        nextErrors.nouveauMotDePasse = passwordValidation;
      }
    } else {
      nextErrors.nouveauMotDePasse = 'Le nouveau mot de passe est obligatoire.';
    }
    if (confirmationMotDePasse !== nouveauMotDePasse) nextErrors.confirmationMotDePasse = 'Les mots de passe ne correspondent pas.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setAncienMotDePasse('');
    setNouveauMotDePasse('');
    setConfirmationMotDePasse('');
    clearErrors();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearErrors();

    if (!validate()) {
      return;
    }

    try {
      await saveMotDePasse({ ancienMotDePasse, nouveauMotDePasse });
      resetForm();
      toastSuccess('Mot de passe modifié ✓');
    } catch (error) {
      const ancien = getBackendFieldError(error, 'ancienMotDePasse');
      const nouveau = getBackendFieldError(error, 'nouveauMotDePasse');
      const confirmation = getBackendFieldError(error, 'confirmationMotDePasse');
      setErrors({
        ancienMotDePasse: ancien ?? undefined,
        nouveauMotDePasse: nouveau ?? undefined,
        confirmationMotDePasse: confirmation ?? undefined,
      });
      if (!ancien && !nouveau && !confirmation) {
        toastError(getBackendErrorMessage(error, 'Impossible de modifier le mot de passe. Veuillez réessayer.'));
      }
    }
  };

  return (
    <ParametresSectionCard
      icon={Lock}
      title="Mot de passe"
      description="Conservez une section dédiée pour la modification du mot de passe."
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="ancien-mot-de-passe" className="block text-sm font-medium text-slate-700">
            Ancien mot de passe
          </label>
          <input
            id="ancien-mot-de-passe"
            type="password"
            autoComplete="current-password"
            value={ancienMotDePasse}
            onChange={(event) => {
              setAncienMotDePasse(event.target.value);
              setErrors((current) => ({ ...current, ancienMotDePasse: undefined }));
            }}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.ancienMotDePasse ? 'border-red-300' : 'border-slate-300'
            }`}
            aria-invalid={Boolean(errors.ancienMotDePasse)}
            aria-describedby={errors.ancienMotDePasse ? 'ancien-mot-de-passe-error' : undefined}
          />
          {errors.ancienMotDePasse && (
            <p id="ancien-mot-de-passe-error" className="text-xs text-red-600 flex items-center gap-1.5" role="alert">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              {errors.ancienMotDePasse}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="nouveau-mot-de-passe" className="block text-sm font-medium text-slate-700">
              Nouveau mot de passe
            </label>
            <input
              id="nouveau-mot-de-passe"
              type="password"
              autoComplete="new-password"
              value={nouveauMotDePasse}
              onChange={(event) => {
                setNouveauMotDePasse(event.target.value);
                setErrors((current) => ({ ...current, nouveauMotDePasse: undefined }));
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.nouveauMotDePasse ? 'border-red-300' : 'border-slate-300'
              }`}
              aria-invalid={Boolean(errors.nouveauMotDePasse)}
              aria-describedby={errors.nouveauMotDePasse ? 'nouveau-mot-de-passe-error' : undefined}
            />
            {errors.nouveauMotDePasse && (
              <p id="nouveau-mot-de-passe-error" className="text-xs text-red-600 flex items-center gap-1.5" role="alert">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                {errors.nouveauMotDePasse}
              </p>
            )}
            <PasswordRequirementsHint password={nouveauMotDePasse} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmation-mot-de-passe" className="block text-sm font-medium text-slate-700">
              Confirmation
            </label>
            <input
              id="confirmation-mot-de-passe"
              type="password"
              autoComplete="new-password"
              value={confirmationMotDePasse}
              onChange={(event) => {
                setConfirmationMotDePasse(event.target.value);
                setErrors((current) => ({ ...current, confirmationMotDePasse: undefined }));
              }}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.confirmationMotDePasse ? 'border-red-300' : 'border-slate-300'
              }`}
              aria-invalid={Boolean(errors.confirmationMotDePasse)}
              aria-describedby={errors.confirmationMotDePasse ? 'confirmation-mot-de-passe-error' : undefined}
            />
            {errors.confirmationMotDePasse && (
              <p id="confirmation-mot-de-passe-error" className="text-xs text-red-600 flex items-center gap-1.5" role="alert">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                {errors.confirmationMotDePasse}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSavingMotDePasse}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {isSavingMotDePasse ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Enregistrement…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" aria-hidden="true" />
                Changer
              </>
            )}
          </button>
        </div>
      </form>
    </ParametresSectionCard>
  );
}



