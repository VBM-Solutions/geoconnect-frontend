import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { registerCall } from '../../api/auth';
import { createBureauEtude } from '../../api/bureauEtude';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, FileText, Upload } from 'lucide-react';
import { codePostalRules, createConfirmPasswordRules, passwordRules, phoneRules } from '../../lib/validators';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PasswordRequirementsHint } from '../../components/ui/PasswordRequirementsHint';

export default function BERegister() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { register, handleSubmit, getValues, watch, formState: { errors } } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  const [success, setSuccess] = useState(false);
  const passwordValue = watch('password', '');

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setErrorDetails('');
    try {
      // 1. Register User (Role: BUREAU_ETUDE)
      const authRes = await registerCall({
        login: data.email,
        password: data.password,
        role: 'BUREAU_ETUDE'
      });

      // Persist the token via AuthContext (gère sessionStorage + état global)
      login(authRes);

      // 2. Create Bureau d'Etude Profile
      await createBureauEtude({
        raisonSociale: data.raisonSociale,
        emailContact: data.email,
        telContact: data.telContact,
        utilisateurId: authRes.userId,
        adresse: {
          rue: data.rue,
          codePostal: data.codePostal,
          ville: data.ville,
        }
      });
      
      // Usually, it requires admin validation, so let's show a success message
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorDetails(err?.response?.data?.message || err?.message || 'Une erreur est survenue lors de l\'inscription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 sm:px-6">
        <Card className="text-center shadow-lg border-blue-200 bg-blue-50/50">
          <CardHeader>
             <div className="mx-auto w-16 h-16 bg-blue-100 flex items-center justify-center rounded-full mb-4">
               <FileText className="w-8 h-8 text-blue-600" />
             </div>
             <CardTitle className="text-xl text-slate-800">Votre demande est enregistrée</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-6">
              Votre compte professionnel a bien été créé. Notre équipe va valider vos informations et vos documents. 
              Vous recevrez un email de confirmation dès que votre compte sera activé.
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-8 text-center">
         <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Rejoindre le réseau pro</h1>
         <p className="text-slate-500">Inscrivez votre Bureau d'Étude Géotechnique</p>
      </div>

      {errorDetails && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm">
          {errorDetails}
        </div>
      )}

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center text-slate-800">
                <Building2 className="w-5 h-5 mr-2 text-slate-400" />
                Informations de votre entreprise
              </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                  <Input
                    label="Raison Sociale *"
                    placeholder="Ex: GeoExpert SAS"
                    {...register('raisonSociale', { required: true })}
                    error={errors.raisonSociale ? "Requis" : undefined}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Email professionnel *"
                        type="email"
                        placeholder="contact@entreprise.fr"
                        {...register('email', { required: true })}
                        error={errors.email ? "Requis" : undefined}
                      />
                      <Input
                        label="Téléphone *"
                        type="tel"
                        placeholder="01 23 45 67 89"
                        {...register('telContact', phoneRules)}
                        error={errors.telContact ? (errors.telContact.message as string ?? 'Requis') : undefined}
                      />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Input
                          label="Mot de passe *"
                          type="password"
                          {...register('password', passwordRules)}
                          error={errors.password ? (errors.password.message as string) : undefined}
                          showPasswordToggle
                        />
                        <PasswordRequirementsHint password={passwordValue} />
                      </div>
                      <Input
                        label="Confirmation du mot de passe *"
                        type="password"
                        {...register('confirmPassword', createConfirmPasswordRules(() => getValues('password')))}
                        error={errors.confirmPassword ? (errors.confirmPassword.message as string) : undefined}
                        showPasswordToggle
                      />
                  </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-800">Adresse de l'entreprise</h4>
                <Input
                  label="Rue *"
                  placeholder="10 rue de la Géologie"
                  {...register('rue', { required: true })}
                  error={errors.rue ? "Requis" : undefined}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Code Postal *"
                    placeholder="Ex : 75001"
                    {...register('codePostal', codePostalRules)}
                    error={errors.codePostal ? (errors.codePostal.message as string) : undefined}
                  />
                  <Input
                    label="Ville *"
                    {...register('ville', { required: true })}
                    error={errors.ville ? "Requis" : undefined}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-800">Documents justificatifs (Kbis, Assurances)</h4>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-medium font-sans">Glissez-déposez vos fichiers ici</p>
                  <p className="text-xs text-slate-400 mt-1">PDF, JPG jusqu'à 10MB</p>
                </div>
              </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100 py-4">
            <Button
              type="submit"
              className="w-full"
              isLoading={isSubmitting}
            >
              Soumettre ma candidature
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
