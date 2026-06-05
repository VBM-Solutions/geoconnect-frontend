import React from 'react';
import { ConfirmModal } from '../ui/ConfirmModal';

interface ConfirmDesactiverModalProps {
  login: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDesactiverModal({
  login,
  isLoading,
  onConfirm,
  onCancel,
}: Readonly<ConfirmDesactiverModalProps>) {
  return (
    <ConfirmModal
      title="Desactiver le compte"
      message={`Le compte ${login} ne pourra plus se connecter.`}
      extra={(
        <p className="rounded-md border border-orange-200 bg-orange-50 p-2 text-[11px] text-orange-700">
          Les sessions deja ouvertes expirent dans les 15 minutes maximum.
        </p>
      )}
      variant="warning"
      confirmLabel="Desactiver"
      cancelLabel="Annuler"
      isLoading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}

