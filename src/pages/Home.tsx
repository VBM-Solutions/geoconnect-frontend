import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowRight,
  Briefcase,
  Mail,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { registerClientCall } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { CadastralReferencesField } from '../components/ui/CadastralReferencesField';
import { PasswordRequirementsHint } from '../components/ui/PasswordRequirementsHint';
import { FileUploader } from '../components/shared/FileUploader';
import { AddressAutocompleteField } from '../components/shared/AddressAutocompleteField';
import { ProjectMetricsInputs } from '../components/shared/ProjectMetricsInputs';
import { TypeEtudeSelect } from '../components/project/TypeEtudeSelect';
import { useTypesEtude } from '../hooks/useTypesEtude';
import { buildDemandePayload, mapFormFieldsToPayloadBase } from '../lib/demandePayload';
import { codePostalRules, createConfirmPasswordRules, passwordRules, phoneRules } from '../lib/validators';
import { getFieldMessage } from '../lib/formErrors';
import { AddressSuggestionDTO } from '../types';
import { getPublicApiError } from '../lib/utils';
import { PublicHomeSeo } from '../components/seo/PublicHomeSeo';
import { LandingSections } from '../components/home/LandingSections';

type StudyPreset = {
  code?: string;
  label: string;
  postalCode?: string;
};

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [selectedPreset, setSelectedPreset] = useState<StudyPreset | null>(null);
  const formSectionRef = useRef<HTMLElement | null>(null);

  if (isAuthenticated) {
    if (user?.role === 'ADMIN') return <Navigate to="/admin/utilisateurs" replace />;
    if (user?.role === 'CLIENT') return <Navigate to="/client/dashboard" replace />;
    if (user?.role === 'BUREAU_ETUDE') return <Navigate to="/be/dashboard" replace />;
  }

  const openTunnel = (preset?: StudyPreset) => {
    setSelectedPreset(preset ?? { label: 'Demande libre' });
    globalThis.setTimeout(() => {
      formSectionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  return (
    <div className="gc-landing mx-auto flex w-full max-w-7xl flex-col px-4 pb-6 sm:px-6 lg:px-8">
      <PublicHomeSeo />
      <LandingSections onQuoteRequest={(studyCode) => openTunnel(
        studyCode ? { code: studyCode, label: studyCode } : undefined,
      )} />

      {selectedPreset && (
        <section
          key={`${selectedPreset.label}-${selectedPreset.code ?? 'libre'}`}
          id="demande"
          ref={formSectionRef}
          className="mx-auto my-12 w-full max-w-2xl scroll-mt-20"
        >
          <QuoteTunnel
            initialType={selectedPreset.code}
            initialPostalCode={selectedPreset.postalCode}
            presetLabel={selectedPreset.label}
          />
        </section>
      )}
    </div>
  );
}

function QuoteTunnel({
  initialType,
  initialPostalCode,
  presetLabel,
}: Readonly<{ initialType?: string; initialPostalCode?: string; presetLabel?: string }>) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [referencesCadastrales, setReferencesCadastrales] = useState<string[]>(['']);
  const { typesEtude, loading: loadingTypes } = useTypesEtude();
  const navigate = useNavigate();

  const { register: formRegister, handleSubmit, getValues, setValue, watch, formState: { errors } } = useForm<Record<string, unknown>>({
    defaultValues: {
      type: initialType ?? '',
      codePostalProjet: initialPostalCode ?? '',
    },
  });
  const passwordValue = String(watch('password', '') ?? '');
  const cgvAcceptees = watch('cgvAcceptees') === true;

  useEffect(() => {
    if (initialType && typesEtude.some(({ code }) => code === initialType)) {
      setValue('type', initialType);
    }
  }, [initialType, setValue, typesEtude]);

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
      const pendingPayload = buildDemandePayload({
        ...mapFormFieldsToPayloadBase(data),
        referencesCadastrales,
        rueProjet: data.rueProjet as string,
        codePostalProjet: (data.codePostalProjet || data.codePostal) as string,
        villeProjet: (data.villeProjet || data.ville) as string,
      });
      const authRes = await registerClientCall({
        login: data.login as string,
        password: data.password as string,
        civilite: data.civilite as 'MR' | 'MME' | 'AUTRE',
        nom: data.nom as string,
        prenom: data.prenom as string,
        telContact: data.telContact as string,
        adresseFacturation: {
          rue: data.rue as string,
          ville: data.ville as string,
          codePostal: data.codePostal as string,
        },
        cgvAcceptees: data.cgvAcceptees === true,
        demande: {
          delaiMaxSouhaite: pendingPayload.delaiMaxSouhaite,
          adresseProjet: pendingPayload.adresseProjet,
          type: pendingPayload.type,
          nombreLot: pendingPayload.nombreLot,
          referencesCadastrales: pendingPayload.referencesCadastrales,
          superficie: pendingPayload.superficie,
          description: pendingPayload.description,
        },
      }, docFiles);

      sessionStorage.setItem('geoconnect.verification-email', authRes.login);
      navigate('/verification-email-envoyee', { state: { email: authRes.login } });
    } catch (err: unknown) {
      setError(getPublicApiError(err,
        "Nous n'avons pas pu créer votre compte. Veuillez réessayer dans quelques instants.").message);
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, label: 'Projet' },
    { number: 2, label: 'Détails' },
    { number: 3, label: 'Coordonnées' },
  ];

  return (
    <div className="w-full">
      <div className="mb-4 rounded-lg border border-slate-200 bg-white/75 p-3 shadow-sm">
        <div className="grid grid-cols-3 gap-2">
          {steps.map(({ number, label }) => (
            <div
              key={number}
              className={`rounded-md px-3 py-2 text-center ${
                number <= step ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <div className="text-[10px] font-black uppercase tracking-wider">Étape {number}</div>
              <div className="mt-0.5 text-xs font-bold">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <Card className="border-slate-200/90 bg-white/95 shadow-xl shadow-slate-900/5">
        {step === 1 && (
          <form onSubmit={handleSubmit(handleNext)}>
            <CardHeader className="gap-1 bg-white px-5 py-4">
              <CardTitle className="flex items-center text-base">
                <Briefcase className="mr-2 h-5 w-5 text-blue-600" /> Quel est votre besoin ?
              </CardTitle>
              <CardDescription className="text-xs">Commencez par situer le terrain et choisir l'option qui ressemble le plus à votre projet.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {presetLabel && (
                <div className="rounded-md border border-blue-100 bg-blue-50/80 p-3 text-xs leading-5 text-blue-900">
                  Point de départ choisi : <span className="font-bold">{presetLabel}</span>. Vous pouvez modifier le type de mission si besoin.
                </div>
              )}
              <div className="rounded-md border border-emerald-100 bg-emerald-50/80 p-3 text-xs leading-5 text-emerald-900">
                Vous hésitez entre plusieurs types de mission ? Sélectionnez la plus proche, puis expliquez votre situation ensuite.
              </div>
              <TypeEtudeSelect
                id="type-step1"
                register={formRegister}
                types={typesEtude}
                loading={loadingTypes}
                error={errors.type ? 'Requis' : undefined}
                label="Type de mission *"
                labelClassName="block text-sm font-medium text-slate-700"
                selectClassName="w-full flex h-10 rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                placeholder="Sélectionnez un type"
              />

              <AddressAutocompleteField
                id="adresse-projet-autocomplete"
                label="Rechercher l'adresse du projet"
                placeholder="Tapez une adresse pour remplir les champs"
                onSelect={(suggestion: AddressSuggestionDTO) => {
                  setValue('rueProjet', suggestion.rue ?? suggestion.label, { shouldValidate: true });
                  setValue('codePostalProjet', suggestion.codePostal ?? '', { shouldValidate: true });
                  setValue('villeProjet', suggestion.ville ?? '', { shouldValidate: true });
                }}
              />
              <Input
                label="Rue du projet *"
                placeholder="Ex : 15 Avenue des Champs-Élysées"
                {...formRegister('rueProjet', { required: true })}
                error={errors.rueProjet ? 'Requis' : undefined}
                className="h-10 text-sm"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Code Postal *"
                  placeholder="Ex : 75001"
                  {...formRegister('codePostalProjet', codePostalRules)}
                  error={getFieldMessage(errors.codePostalProjet)}
                  className="h-10 text-sm"
                />
                <Input
                  label="Ville *"
                  {...formRegister('villeProjet', { required: true })}
                  error={errors.villeProjet ? 'Requis' : undefined}
                  className="h-10 text-sm"
                />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/80 px-5 py-4">
              <Button type="submit" size="lg" className="w-full gap-2">
                Continuer ma demande
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit(handleNext)}>
            <CardHeader className="gap-1 bg-white px-5 py-4">
              <CardTitle className="flex items-center text-base">
                <MapPin className="mr-2 h-5 w-5 text-blue-600" /> Détails du projet
              </CardTitle>
              <CardDescription className="text-xs">Quelques phrases suffisent pour aider les spécialistes à comprendre votre situation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-1">
                <label htmlFor="description-step2" className="block text-sm font-medium text-slate-700">Description du projet *</label>
                <textarea
                  id="description-step2"
                  maxLength={2000}
                  {...formRegister('description', { required: true, maxLength: { value: 2000, message: 'La description ne doit pas dépasser 2000 caractères' } })}
                  className="min-h-[112px] w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex : Je construis une maison individuelle, mon constructeur me demande une G2 AVP, le terrain est en pente légère..."
                />
                {errors.description && <span className="text-xs text-red-500">{getFieldMessage(errors.description) ?? 'Requis'}</span>}
              </div>
              <CadastralReferencesField
                value={referencesCadastrales}
                onChange={setReferencesCadastrales}
              />
              <div className="grid grid-cols-2 gap-4">
                <ProjectMetricsInputs register={formRegister} errors={errors} />
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
            <CardFooter className="flex justify-between bg-slate-50/80 px-5 py-4">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Retour
              </Button>
              <Button type="submit" className="gap-2">
                Suivant
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit(handleNext)}>
            <CardHeader className="gap-1 bg-white px-5 py-4">
              <CardTitle className="flex items-center text-base">
                <Mail className="mr-2 h-5 w-5 text-blue-600" /> Vos coordonnées
              </CardTitle>
              <CardDescription className="text-xs">Votre compte est créé maintenant pour recevoir les réponses et retrouver votre demande.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}
              <div className="space-y-1">
                <label htmlFor="civilite" className="block text-sm font-medium text-slate-700">Civilité *</label>
                <select
                  id="civilite"
                  {...formRegister('civilite', { required: true })}
                  className="flex h-10 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">—</option>
                  <option value="MR">M.</option>
                  <option value="MME">Mme</option>
                  <option value="AUTRE">Autre</option>
                </select>
                {errors.civilite && <span className="text-xs text-red-500">Requis</span>}
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
              <AddressAutocompleteField
                id="adresse-facturation-autocomplete"
                label="Rechercher l'adresse de facturation"
                placeholder="Tapez une adresse pour remplir les champs"
                onSelect={(suggestion: AddressSuggestionDTO) => {
                  setValue('rue', suggestion.rue ?? suggestion.label, { shouldValidate: true });
                  setValue('codePostal', suggestion.codePostal ?? '', { shouldValidate: true });
                  setValue('ville', suggestion.ville ?? '', { shouldValidate: true });
                }}
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
                {...formRegister(
                  'confirmPassword',
                  createConfirmPasswordRules(() => String(getValues('password') ?? '')),
                )}
                error={getFieldMessage(errors.confirmPassword)}
                showPasswordToggle
              />
              <div className="space-y-1">
                <div className="flex items-start gap-2">
                  <input
                    id="cgvAcceptees"
                    type="checkbox"
                    {...formRegister('cgvAcceptees', {
                      required: 'Vous devez accepter les CGV pour publier votre demande',
                    })}
                    aria-invalid={errors.cgvAcceptees ? 'true' : 'false'}
                    aria-describedby={errors.cgvAcceptees ? 'cgvAcceptees-error' : undefined}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="cgvAcceptees" className="text-sm leading-5 text-slate-700">
                    Je reconnais avoir pris connaissance et accepté les{' '}
                    <a
                      href="/conditions-generales-de-vente"
                      className="font-medium text-blue-700 underline underline-offset-2 hover:text-blue-800"
                    >
                      CGV
                    </a>{' '}
                    de mon-etude-de-sol.fr *
                  </label>
                </div>
                {errors.cgvAcceptees && (
                  <p id="cgvAcceptees-error" role="alert" className="text-xs text-red-500">
                    {getFieldMessage(errors.cgvAcceptees)}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between bg-slate-50/80 px-5 py-4">
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Retour
              </Button>
              <Button type="submit" isLoading={isLoading} disabled={!cgvAcceptees}>
                Publier ma demande
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
