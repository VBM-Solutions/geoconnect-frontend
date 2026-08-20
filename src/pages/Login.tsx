import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { loginCall } from '../api/auth';
import { getPublicApiError } from '../lib/utils';

function isRoleCompatibleReturnTo(requestedPath: unknown, role: string): requestedPath is string {
  if (typeof requestedPath !== 'string' || !requestedPath.startsWith('/') || requestedPath.startsWith('//')) {
    return false;
  }

  const rolePrefix: Record<string, string> = {
    ADMIN: '/admin/',
    BUREAU_ETUDE: '/be/',
    CLIENT: '/client/',
  };
  return requestedPath.startsWith(rolePrefix[role] ?? '/__unsupported_role__/');
}

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const authRes = await loginCall({
        login: data.login,
        password: data.password
      });
      login(authRes);

      const requestedPath = (location.state as { returnTo?: unknown } | null)?.returnTo;
      if (isRoleCompatibleReturnTo(requestedPath, authRes.role)) {
        navigate(requestedPath, { replace: true, state: null });
      } else if (authRes.role === 'ADMIN') {
        navigate('/admin/utilisateurs');
      } else if (authRes.role === 'BUREAU_ETUDE') {
        navigate('/be/dashboard');
      } else if (authRes.onboardingFinalized) {
        navigate('/success');
      } else {
        navigate('/client/dashboard');
      }
    } catch (err: any) {
      setError(getPublicApiError(err, 'Adresse email ou mot de passe incorrect.').message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center font-bold text-white text-2xl italic">
              G
            </div>
          </div>
          <CardTitle className="text-xl">MON ÉTUDE DE SOL</CardTitle>
          <CardDescription>Portail Professionnel & Particulier</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 pt-4">
            {error && (
              <div className="p-2 bg-red-50 border border-red-200 text-red-600 text-[11px] rounded font-bold text-center">
                {error}
              </div>
            )}
            <Input
              label="Identifiant (email)"
              type="email"
              placeholder="votre@email.com"
              {...register('login', { required: true })}
              error={errors.login ? "Requis" : undefined}
            />
            <Input
              label="Mot de Passe"
              type="password"
              {...register('password', { required: true })}
              error={errors.password ? "Requis" : undefined}
            />
            <div className="flex justify-end">
              <a href="#" className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider">Mot de passe oublié ?</a>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-stretch">
            <Button type="submit" className="w-full" isLoading={isLoading}>
              CONNEXION SECURISEE
            </Button>

            <div className="mt-6 text-center border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500 mb-2">Vous êtes un Bureau d'Étude Géotechnique ?</p>
              <Button type="button" variant="outline" className="w-full text-xs" onClick={() => navigate('/bureau-etudes/inscription')}>
                Créer un compte professionnel
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
