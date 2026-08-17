import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { acceptAccountInvitation, validateAccountInvitation } from '../api/contactsBureauEtude';
import { Button } from '../components/ui/Button'; import { Input } from '../components/ui/Input';
import { passwordRules, createConfirmPasswordRules } from '../lib/validators';

type Form = { password: string; confirm: string };

export default function ActivateAccount() {
  const token = new URLSearchParams(location.hash.slice(1)).get('token') ?? '';
  const [valid, setValid] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<Form>();

  useEffect(() => {
    validateAccountInvitation(token)
      .then(() => setValid(true))
      .catch(() => setValid(false));
  }, [token]);

  if (valid === null) {
    return <p>Vérification du lien…</p>;
  }

  if (!valid) {
    return <p className="mx-auto mt-20 max-w-md rounded bg-red-50 p-6">Ce lien est invalide ou a expiré.</p>;
  }

  const activateAccount = async ({ password }: Form) => {
    await acceptAccountInvitation(token, password);
    navigate('/login');
  };

  return (
    <form className="mx-auto mt-20 max-w-md space-y-4 rounded-xl bg-white p-6" onSubmit={handleSubmit(activateAccount)}>
      <h1 className="text-xl font-bold">Créer mon mot de passe</h1>
      <Input type="password" label="Mot de passe" showPasswordToggle {...register('password', passwordRules)} error={errors.password?.message} />
      <Input type="password" label="Confirmation" showPasswordToggle {...register('confirm', createConfirmPasswordRules(() => getValues('password')))} error={errors.confirm?.message} />
      <Button type="submit" isLoading={isSubmitting}>Activer mon compte</Button>
    </form>
  );
}
