import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { createConfirmPasswordRules, emailRules, passwordRules } from '../../lib/validators';
import { creerUtilisateur } from '../../api/admin';
import { useToast } from '../../contexts/ToastContext';
import { getApiMessage } from '../../lib/adminUsers';

interface CreateUserForm {
  login: string;
  motDePasse: string;
  confirmMotDePasse: string;
}

export default function CreerUtilisateurPage() {
  const navigate = useNavigate();
  const { toastSuccess, toastError } = useToast();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserForm>();

  const onSubmit = async (values: CreateUserForm) => {
    setServerError(null);

    try {
      const createdUser = await creerUtilisateur({
        login: values.login,
        motDePasse: values.motDePasse,
        role: 'ADMIN',
      });

      toastSuccess('Compte cree avec succes');
      navigate(`/admin/utilisateurs/${createdUser.id}`);
    } catch (error: any) {
      if (error?.response?.status === 409) {
        setError('login', { type: 'server', message: 'Cette adresse e-mail est deja utilisee' });
        return;
      }

      setServerError(getApiMessage(error, 'Une erreur est survenue lors de la creation du compte'));
      toastError(getApiMessage(error, 'Une erreur est survenue lors de la creation du compte'));
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <Link to="/admin/utilisateurs" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Retour a la liste
      </Link>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-slate-500" />
          <h1 className="text-lg font-bold text-slate-900">Nouveau compte admin</h1>
        </div>

        {serverError && (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">{serverError}</p>
        )}

        <Input
          label="Login (email)"
          type="email"
          placeholder="utilisateur@domaine.fr"
          {...register('login', emailRules)}
          error={errors.login?.message}
        />

        <Input
          label="Mot de passe"
          type="password"
          showPasswordToggle
          {...register('motDePasse', passwordRules)}
          error={errors.motDePasse?.message}
        />

        <Input
          label="Confirmation du mot de passe"
          type="password"
          showPasswordToggle
          {...register('confirmMotDePasse', createConfirmPasswordRules(() => getValues('motDePasse')))}
          error={errors.confirmMotDePasse?.message}
        />


        <div className="pt-2">
          <Button type="submit" isLoading={isSubmitting}>
            Creer le compte
          </Button>
        </div>
      </form>
    </div>
  );
}



