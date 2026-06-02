import React from 'react';
import { AlertCircle, Loader2, Save } from 'lucide-react';

export function ParametresLoadingState() {
  return (
    <div className="flex items-center gap-3 py-10 text-slate-500">
      <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
      <span className="text-sm">Chargement des paramètres…</span>
    </div>
  );
}

interface ParametresLoadErrorStateProps {
  message: string;
}

export function ParametresLoadErrorState({ message }: Readonly<ParametresLoadErrorStateProps>) {
  return (
    <div className="flex items-center gap-2 py-6 text-red-600">
      <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

interface ParametresInlineFieldErrorProps {
  id: string;
  message: string;
}

export function ParametresInlineFieldError({ id, message }: Readonly<ParametresInlineFieldErrorProps>) {
  return (
    <p id={id} className="text-xs text-red-600 flex items-center gap-1.5" role="alert">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

interface ParametresSubmitButtonProps {
  isSaving: boolean;
  idleLabel?: string;
  savingLabel?: string;
}

export function ParametresSubmitButton({
  isSaving,
  idleLabel = 'Enregistrer',
  savingLabel = 'Enregistrement…',
}: Readonly<ParametresSubmitButtonProps>) {
  return (
    <button
      type="submit"
      disabled={isSaving}
      className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      {isSaving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          {savingLabel}
        </>
      ) : (
        <>
          <Save className="w-4 h-4" aria-hidden="true" />
          {idleLabel}
        </>
      )}
    </button>
  );
}

