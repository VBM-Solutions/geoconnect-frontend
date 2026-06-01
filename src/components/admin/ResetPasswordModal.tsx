import React, { useMemo, useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { PASSWORD_MIN_LENGTH } from '../../lib/validators';

interface ResetPasswordModalProps {
  login: string;
  isLoading: boolean;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}

export function ResetPasswordModal({
  login,
  isLoading,
  onConfirm,
  onCancel,
}: Readonly<ResetPasswordModalProps>) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [touched, setTouched] = useState(false);

  const error = useMemo(() => {
    if (!touched) return null;
    if (!password) return 'Le mot de passe est requis';
    if (password.length < PASSWORD_MIN_LENGTH) return `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caracteres`;
    if (password !== confirmPassword) return 'Les mots de passe ne correspondent pas';
    return null;
  }, [password, confirmPassword, touched]);

  const handleConfirm = () => {
    setTouched(true);
    if (!password || password.length < PASSWORD_MIN_LENGTH || password !== confirmPassword) return;
    onConfirm(password);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 backdrop-blur-sm bg-white/20"
        aria-label="Fermer la modale"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-lg shadow-2xl border border-slate-200 max-w-md w-full mx-4 p-6 z-10 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">Reinitialiser le mot de passe</h3>
          <p className="text-xs text-slate-500 mt-1">Compte cible : {login}</p>
        </div>

        <Input
          id="reset-password-new"
          name="reset-password-new"
          label="Nouveau mot de passe"
          type="password"
          showPasswordToggle
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={touched && !password ? 'Requis' : undefined}
        />

        <Input
          id="reset-password-confirm"
          name="reset-password-confirm"
          label="Confirmer le mot de passe"
          type="password"
          showPasswordToggle
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={touched && password !== confirmPassword ? 'Les mots de passe ne correspondent pas' : undefined}
        />

        {error && <p className="text-[11px] text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} isLoading={isLoading}>
            Reinitialiser
          </Button>
        </div>
      </div>
    </div>
  );
}



