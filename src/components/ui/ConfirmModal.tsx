import React from 'react';
import { Button } from './Button';

/** Variante visuelle de la modale :
 * - `default` : style neutre standard
 * - `warning` : encadré orange pour signaler un avertissement non bloquant
 */
export type ConfirmModalVariant = 'default' | 'warning';

interface ConfirmModalProps {
  title: string;
  message: string;
  /** Contenu additionnel affiché entre le message et les boutons (bandeau d'avertissement, etc.) */
  extra?: React.ReactNode;
  /** Variante visuelle. Par défaut : `'default'`. */
  variant?: ConfirmModalVariant;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  /** Autorise la fermeture par clic sur le fond. Par défaut : `true`. */
  dismissible?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  extra,
  variant = 'default',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  isLoading = false,
  dismissible = true,
  onConfirm,
  onCancel,
}: Readonly<ConfirmModalProps>) {
  const borderClass =
    variant === 'warning' ? 'border-orange-300' : 'border-slate-200';
  const headerClass =
    variant === 'warning' ? 'text-orange-700' : 'text-slate-800';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Fond flouté */}
      <div
        className="absolute inset-0 backdrop-blur-sm bg-white/20"
        data-testid="confirm-modal-backdrop"
        onClick={dismissible ? onCancel : undefined}
      />
      {/* Contenu */}
      <div className={`relative bg-white rounded-lg shadow-2xl border ${borderClass} max-w-md w-full mx-4 p-6 z-10`}>
        <h3 className={`text-base font-bold mb-3 ${headerClass}`}>{title}</h3>
        <p className="text-sm text-slate-600 mb-4">{message}</p>
        {extra && <div className="mb-5">{extra}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

