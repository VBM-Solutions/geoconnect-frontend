import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  FileText,
  Home as HomeIcon,
  KeyRound,
  Mail,
  MessageSquareText,
  MapPin,
  SearchCheck,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { registerCall } from '../api/auth';
import { createClient, getClientByUserId } from '../api/client';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { CadastralReferencesField } from '../components/ui/CadastralReferencesField';
import { PasswordRequirementsHint } from '../components/ui/PasswordRequirementsHint';
import { FileUploader } from '../components/shared/FileUploader';
import { TypeEtudeSelect } from '../components/project/TypeEtudeSelect';
import { useTypesEtude } from '../hooks/useTypesEtude';
import { useDemandeSubmission } from '../hooks/useDemandeSubmission';
import { buildDemandePayload, mapFormFieldsToPayloadBase } from '../lib/demandePayload';
import { codePostalRules, createConfirmPasswordRules, passwordRules, phoneRules } from '../lib/validators';
import { getFieldMessage } from '../lib/formErrors';

type StudyPreset = {
  code?: string;
  label: string;
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
    window.setTimeout(() => {
      formSectionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const situationCards = [
    {
      icon: HomeIcon,
      title: 'Je construis une maison',
      text: 'Pour un permis, un constructeur ou une assurance.',
      preset: { code: 'G2_AVP', label: 'Construction de maison' },
    },
    {
      icon: MapPin,
      title: 'Je vends un terrain',
      text: "Pour rassurer l'acheteur ou répondre à une obligation.",
      preset: { code: 'G1', label: 'Vente de terrain' },
    },
    {
      icon: ClipboardList,
      title: "J'agrandis ou je rénove",
      text: 'Pour vérifier le sol avant des travaux importants.',
      preset: { code: 'G5', label: 'Travaux ou rénovation' },
    },
    {
      icon: FileText,
      title: 'On me demande une étude',
      text: 'Notaire, constructeur, banque : vous pouvez déposer la demande ici.',
      preset: { label: 'Étude demandée par un tiers' },
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
      <section className="space-y-8">
        <div className="pt-4 lg:pt-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-2xl font-black italic text-white shadow-sm">
              G
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">GeoConnect</p>
              <p className="text-xs font-medium text-slate-500">Votre étude de sol, plus simple</p>
            </div>
          </div>

          <div className="max-w-4xl space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Demande gratuite et sans engagement
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Besoin d'une étude de sol pour votre maison ou votre terrain ?
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-600">
              Décrivez votre projet avec vos mots. GeoConnect vous aide à préparer une demande claire, l'envoie à des bureaux d'études adaptés, puis vous laisse comparer les réponses tranquillement.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button type="button" size="lg" className="gap-2" onClick={() => openTunnel()}>
                Faire ma demande
                <ArrowRight className="h-4 w-4" />
              </Button>
              <a
                href="#situations"
                className="gc-motion-fast inline-flex h-11 items-center justify-center rounded border border-slate-300 bg-white px-6 text-sm font-bold tracking-wide text-slate-700 shadow-sm transition-[color,background-color,border-color,box-shadow,transform] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                Voir les cas fréquents
              </a>
            </div>
          </div>

          <div className="mt-7 max-w-4xl rounded-lg border border-blue-100 bg-blue-50/70 p-4 shadow-sm">
            <div className="flex gap-3">
              <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
              <div>
                <h2 className="text-sm font-black text-slate-950">Pas sûr de savoir quelle étude choisir ?</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Ce n'est pas grave. Choisissez l'option la plus proche ou expliquez votre situation à l'étape suivante : les spécialistes pourront vous orienter.
                </p>
              </div>
            </div>
          </div>

          <div id="situations" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {situationCards.map(({ icon: Icon, title, text, preset }) => (
              <button
                key={title}
                type="button"
                onClick={() => openTunnel(preset)}
                className="group rounded-lg border border-slate-200 bg-white/80 p-4 text-left shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2"
              >
                <Icon className="mb-3 h-5 w-5 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">{title}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-semibold text-slate-600">
            {['Vous gardez le choix du devis', 'Compte créé seulement à la fin', 'Documents au même endroit', 'Aucun jargon obligatoire'].map((item) => (
              <span key={item} className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {item}
              </span>
            ))}
          </div>
        </div>

        <aside className="grid gap-5 rounded-lg border border-slate-200 bg-white/86 p-5 shadow-xl shadow-slate-900/5 lg:grid-cols-[1fr_1.7fr_auto] lg:items-center">
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-blue-700">Comment ça se passe ?</p>
            <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
              Vous commencez quand vous êtes prêt.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              La page vous aide à choisir une situation. Le formulaire s'ouvre ensuite avec le bon contexte, sans compte à créer avant la fin.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              'Vous pouvez expliquer votre projet simplement',
              'Vous comparez les propositions reçues',
              'Vous choisissez librement le devis qui vous convient',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {item}
              </div>
            ))}
          </div>
          <Button type="button" size="lg" className="w-full gap-2 lg:w-auto" onClick={() => openTunnel()}>
            Ouvrir le formulaire
            <ArrowRight className="h-4 w-4" />
          </Button>
        </aside>
      </section>

      {selectedPreset && (
        <section id="demande" ref={formSectionRef} className="mx-auto w-full max-w-2xl scroll-mt-6">
          <QuoteTunnel key={`${selectedPreset.label}-${selectedPreset.code ?? 'libre'}`} initialType={selectedPreset.code} presetLabel={selectedPreset.label} />
        </section>
      )}

      <section className="grid gap-4 border-y border-slate-200 py-6 md:grid-cols-5 md:items-center">
        {[
          { icon: MessageSquareText, label: 'Vous décrivez le projet' },
          { icon: SearchCheck, label: 'Des spécialistes répondent' },
          { icon: FileText, label: 'Vous comparez les devis' },
          { icon: CalendarDays, label: "L'étude est planifiée" },
          { icon: KeyRound, label: 'Vous recevez le rapport' },
        ].map(({ icon: Icon, label }, index) => (
          <div key={label} className="flex items-center gap-3 text-sm font-bold text-slate-700">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
              <Icon className="h-4 w-4" />
            </span>
            <span>{label}</span>
            {index < 4 && <ArrowRight className="ml-auto hidden h-4 w-4 text-slate-300 md:block" />}
          </div>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            question: 'Une étude de sol est-elle obligatoire ?',
            answer: "Cela dépend du terrain, de la zone et du projet. Si un notaire, un constructeur ou une mairie vous la demande, vous pouvez lancer la recherche ici.",
          },
          {
            question: "Et si je ne connais pas le type G1 ou G2 ?",
            answer: "Vous pouvez quand même continuer. Le formulaire sert à donner le contexte, et les bureaux d'études pourront préciser le type d'étude nécessaire.",
          },
          {
            question: 'Suis-je engagé en déposant une demande ?',
            answer: "Non. Vous recevez des propositions, puis vous choisissez librement celle qui vous convient.",
          },
        ].map(({ question, answer }) => (
          <div key={question} className="rounded-lg border border-slate-200 bg-white/82 p-5 shadow-sm">
            <h2 className="text-sm font-black text-slate-950">{question}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 pb-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-950">Vous représentez un bureau d'études ?</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Rejoignez le réseau GeoConnect pour consulter les demandes disponibles, proposer vos devis et piloter vos études depuis un espace dédié.
          </p>
        </div>
        <Link
          to="/bureau-etudes/inscription"
          className="gc-motion-fast inline-flex h-11 w-full items-center justify-center rounded border border-slate-300 bg-white px-6 text-sm font-bold tracking-wide text-slate-700 shadow-sm transition-[color,background-color,border-color,box-shadow,transform] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:w-auto"
        >
          Rejoindre le réseau
        </Link>
      </section>
    </div>
  );
}

function QuoteTunnel({ initialType, presetLabel }: Readonly<{ initialType?: string; presetLabel?: string }>) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [referencesCadastrales, setReferencesCadastrales] = useState<string[]>(['']);
  const { typesEtude, loading: loadingTypes } = useTypesEtude();
  const navigate = useNavigate();
  const { login } = useAuth();

  const { register: formRegister, handleSubmit, getValues, watch, formState: { errors } } = useForm<Record<string, unknown>>({
    defaultValues: {
      type: initialType ?? '',
    },
  });
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

      const client = await createClient({
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
            <CardFooter className="flex justify-between bg-slate-50/80 px-5 py-4">
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
