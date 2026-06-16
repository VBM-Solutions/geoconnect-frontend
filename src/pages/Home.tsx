import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { registerCall } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { CadastralReferencesField } from '../components/ui/CadastralReferencesField';
import { PasswordRequirementsHint } from '../components/ui/PasswordRequirementsHint';
import { FileUploader } from '../components/shared/FileUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { useForm } from 'react-hook-form';
import { createClient, getClientByUserId } from '../api/client';
import { useTypesEtude } from '../hooks/useTypesEtude';
import { useDemandeSubmission } from '../hooks/useDemandeSubmission';
import { TypeEtudeSelect } from '../components/project/TypeEtudeSelect';
import { MapPin, Briefcase, Mail } from 'lucide-react';
import { buildDemandePayload, mapFormFieldsToPayloadBase } from '../lib/demandePayload';
import { codePostalRules, createConfirmPasswordRules, passwordRules, phoneRules } from '../lib/validators';
import { getFieldMessage } from '../lib/formErrors';

export default function Home() {
  const [step, setStep] = useState(0);
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    if (user?.role === 'ADMIN') return <Navigate to="/admin/utilisateurs" replace />;
    if (user?.role === 'CLIENT') return <Navigate to="/client/dashboard" replace />;
    if (user?.role === 'BUREAU_ETUDE') return <Navigate to="/be/dashboard" replace />;
  }

  if (step === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center mt-12 max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white text-4xl italic mb-2">
          G
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 leading-tight">
          CONNECTEZ-VOUS AUX EXPERTS GEOTECHNIQUES
        </h1>
        <p className="text-sm text-slate-500 max-w-lg leading-relaxed">
          Un portail simple et sécurisé pour débloquer l'accès à un réseau qualifié de bureaux d'études.
        </p>
        <Button size="lg" onClick={() => setStep(1)} className="mt-4">
          DÉMARRER LE TUNNEL
        </Button>
      </div>
    );
  }

  return <QuoteTunnel />;
}

function QuoteTunnel() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [referencesCadastrales, setReferencesCadastrales] = useState<string[]>(['']);
  const { typesEtude, loading: loadingTypes } = useTypesEtude();
  const navigate = useNavigate();
  const { login } = useAuth();

  const { register: formRegister, handleSubmit, getValues, watch, formState: { errors } } = useForm();
  const passwordValue = watch('password', '');

  const { submit } = useDemandeSubmission({
    onSuccess: () => navigate('/success'),
    onError: (msg) => { setError(msg); setIsLoading(false); },
  });

  const handleNext = (data: Record<string, unknown>) => {
    setFormData({ ...formData, ...data });
    if (step < 3) {
      setStep(step + 1);
    } else {
      submitTunnel({ ...formData, ...data });
    }
  };

  const submitTunnel = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);
    try {
      const authRes = await registerCall({
        login: data.login as string,
        password: data.password as string,
        role: 'CLIENT',
      });

      login(authRes);

      let client = await createClient({
        civilite: data.civilite as 'MR' | 'MME' | 'AUTRE',
        nom: data.nom as string,
        prenom: data.prenom as string,
        emailContact: data.login as string,
        telContact: data.telContact as string,
        utilisateurId: authRes.userId,
        adresseFacturation: {
          rue: data.rue as string,
          ville: data.ville as string,
          codePostal: data.codePostal as string,
        },
      });

      let clientId = client?.id;

      if (!clientId) {
        const myClient = await getClientByUserId(authRes.userId);
        if (myClient?.id) {
          clientId = myClient.id;
        } else {
          throw new Error('Client créé mais introuvable sur le serveur.');
        }
      }

      const payload = buildDemandePayload({
        clientId,
        ...mapFormFieldsToPayloadBase(data),
        referencesCadastrales,
        rueProjet: data.rueProjet as string,
        codePostalProjet: (data.codePostalProjet || data.codePostal) as string,
        villeProjet: (data.villeProjet || data.ville) as string,
      });

      await submit(payload, docFiles);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  s <= step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`h-1 w-16 sm:w-32 mx-2 rounded ${
                    s < step ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        {step === 1 && (
          <form onSubmit={handleSubmit(handleNext)}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="w-5 h-5 mr-2 text-blue-600" /> Quel est votre besoin ?
              </CardTitle>
              <CardDescription>Qualifions rapidement votre projet géotechnique.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TypeEtudeSelect
                id="type-step1"
                register={formRegister}
                types={typesEtude}
                loading={loadingTypes}
                error={errors.type ? 'Requis' : undefined}
                label="Type de mission *"
                labelClassName="block text-sm font-medium text-slate-700"
                selectClassName="w-full flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Sélectionnez un type"
              />

              <Input
                label="Rue du projet *"
                placeholder="Ex : 15 Avenue des Champs-Élysées"
                {...formRegister('rueProjet', { required: true })}
                error={errors.rueProjet ? 'Requis' : undefined}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Code Postal *"
                  placeholder="Ex : 75001"
                  {...formRegister('codePostalProjet', codePostalRules)}
                  error={getFieldMessage(errors.codePostalProjet)}
                />
                <Input
                  label="Ville *"
                  {...formRegister('villeProjet', { required: true })}
                  error={errors.villeProjet ? 'Requis' : undefined}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full">
                Suivant
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit(handleNext)}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-600" /> Détails du projet
              </CardTitle>
              <CardDescription>Donnez plus de contexte à votre demande.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="description-step2" className="block text-sm font-medium text-slate-700">Description du projet *</label>
                <textarea
                  id="description-step2"
                  maxLength={2000}
                  {...formRegister('description', { required: true, maxLength: { value: 2000, message: 'La description ne doit pas dépasser 2000 caractères' } })}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Décrivez votre besoin, contraintes particulières..."
                />
                {errors.description && <span className="text-red-500 text-xs">{getFieldMessage(errors.description) ?? 'Requis'}</span>}
              </div>
              <CadastralReferencesField
                value={referencesCadastrales}
                onChange={setReferencesCadastrales}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Superficie (m²)"
                  type="number"
                  placeholder="Ex : 500"
                  min={0}
                  {...formRegister('superficie', { min: { value: 0, message: 'La superficie doit être positive' } })}
                  error={getFieldMessage(errors.superficie)}
                />
                <Input
                  label="Nombre de lots"
                  type="number"
                  placeholder="Ex : 1"
                  min={0}
                  {...formRegister('nombreLot', { min: { value: 0, message: 'Le nombre de lots doit être positif' } })}
                  error={getFieldMessage(errors.nombreLot)}
                />
              </div>
              <Input
                type="number"
                label="Délai maximum souhaité (semaines, facultatif)"
                placeholder="Ex : 8"
                min={1}
                {...formRegister('delaiMaxSouhaite')}
              />

              <FileUploader
                id="docFile-step2"
                docFiles={docFiles}
                setDocFiles={setDocFiles}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Retour
              </Button>
              <Button type="submit">Suivant</Button>
            </CardFooter>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit(handleNext)}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-600" /> Vos coordonnées
              </CardTitle>
              <CardDescription>Créez votre compte pour recevoir vos devis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>
              )}
              <div className="space-y-1">
                <label htmlFor="civilite" className="block text-sm font-medium text-slate-700">Civilité *</label>
                <select
                  id="civilite"
                  {...formRegister('civilite', { required: true })}
                  className="w-full flex h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">—</option>
                  <option value="MR">M.</option>
                  <option value="MME">Mme</option>
                  <option value="AUTRE">Autre</option>
                </select>
                {errors.civilite && <span className="text-red-500 text-xs">Requis</span>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Prénom *"
                  {...formRegister('prenom', { required: true })}
                  error={errors.prenom ? 'Requis' : undefined}
                />
                <Input
                  label="Nom *"
                  {...formRegister('nom', { required: true })}
                  error={errors.nom ? 'Requis' : undefined}
                />
              </div>
              <Input
                label="Téléphone *"
                type="tel"
                placeholder="06 00 00 00 00"
                {...formRegister('telContact', phoneRules)}
                error={getFieldMessage(errors.telContact) ?? undefined}
              />
              <Input
                label="Rue (adresse de facturation) *"
                placeholder="12 rue de la République"
                {...formRegister('rue', { required: true })}
                error={errors.rue ? 'Requis' : undefined}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Code Postal *"
                  {...formRegister('codePostal', codePostalRules)}
                  error={getFieldMessage(errors.codePostal)}
                />
                <Input
                  label="Ville *"
                  {...formRegister('ville', { required: true })}
                  error={errors.ville ? 'Requis' : undefined}
                />
              </div>
              <Input
                type="email"
                label="Email (identifiant de connexion) *"
                placeholder="votre@email.com"
                {...formRegister('login', { required: true })}
                error={errors.login ? 'Requis' : undefined}
              />
              <div>
                <Input
                  type="password"
                  label="Mot de passe *"
                  {...formRegister('password', passwordRules)}
                  error={getFieldMessage(errors.password)}
                  showPasswordToggle
                />
                <PasswordRequirementsHint password={passwordValue} />
              </div>
              <Input
                type="password"
                label="Confirmation du mot de passe *"
                {...formRegister('confirmPassword', createConfirmPasswordRules(() => getValues('password')))}
                error={getFieldMessage(errors.confirmPassword)}
                showPasswordToggle
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Retour
              </Button>
              <Button type="submit" isLoading={isLoading}>
                Publier ma demande
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
