import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  FileText,
  Home as HomeIcon,
  KeyRound,
  Mail,
  MapPin,
  SearchCheck,
  ShieldCheck,
  Star,
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
import { BrandLogo } from '../components/brand/BrandLogo';
import { PublicHomeSeo } from '../components/seo/PublicHomeSeo';
import { StudyFinderPlaceholder } from '../components/home/StudyFinderPlaceholder';

type StudyPreset = {
  code?: string;
  label: string;
  postalCode?: string;
};

type JourneyCard = {
  icon: typeof HomeIcon;
  title: string;
  mission: string;
  description: string;
  helpText: string;
  buttonLabel: string;
  preset: Omit<StudyPreset, 'postalCode'>;
};

const TRUST_ITEMS = [
  'Demande gratuite',
  'Sans engagement',
  'Bureaux d’études qualifiés',
  'Suivi en ligne',
  'Documents centralisés',
];

const journeyCards: JourneyCard[] = [
  {
    icon: MapPin,
    title: 'Je vends un terrain',
    mission: 'Mission G1',
    description: "L'étude G1 peut être demandée avant la vente d'un terrain constructible, notamment en zone argileuse.",
    helpText: 'Entrez le code postal du terrain pour préparer une demande adaptée.',
    buttonLabel: 'Demander une étude G1',
    preset: { code: 'G1', label: 'Vente de terrain' },
  },
  {
    icon: HomeIcon,
    title: 'Je construis une maison',
    mission: 'Mission G2 AVP',
    description: "Une étude G2 aide à dimensionner les fondations et à limiter les mauvaises surprises avant les travaux.",
    helpText: 'Entrez le code postal du chantier pour démarrer votre demande.',
    buttonLabel: 'Demander une étude G2',
    preset: { code: 'G2_AVP', label: 'Construction ou agrandissement' },
  },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [selectedPreset, setSelectedPreset] = useState<StudyPreset | null>(null);
  const [postalCodes, setPostalCodes] = useState<Record<string, string>>({});
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

  const handleJourneySubmit = (event: FormEvent<HTMLFormElement>, card: JourneyCard) => {
    event.preventDefault();
    openTunnel({
      ...card.preset,
      postalCode: postalCodes[card.title]?.trim(),
    });
  };

  const secondarySituations = [
    {
      icon: ClipboardList,
      title: "J'agrandis ou je rénove",
      mission: 'Mission G2 ou G5',
      text: 'Pour vérifier le sol avant des travaux importants.',
      preset: { code: 'G5', label: 'Travaux ou rénovation' },
    },
    {
      icon: FileText,
      title: 'On me demande une étude',
      mission: 'Mission à confirmer',
      text: 'Notaire, constructeur, banque : vous pouvez déposer la demande ici.',
      preset: { label: 'Étude demandée par un tiers' },
    },
  ];

  return (
    <div className="gc-landing mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 pb-6 sm:px-6 lg:px-8">
      <PublicHomeSeo />
      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-[#e6bd70]">
        <div className="mx-auto grid min-h-[590px] max-w-7xl lg:grid-cols-2">
          <div className="relative flex flex-col justify-center px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16 lg:pr-20">
            <BrandLogo priority className="mb-8 h-20 w-56 object-cover object-center mix-blend-multiply sm:h-24 sm:w-64" />

            <div className="inline-flex self-start items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Pour les particuliers
            </div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight text-stone-950 sm:text-5xl">
              Votre étude de sol, <span className="text-[#779649]">simplement.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Décrivez votre projet et recevez les devis proposés par des bureaux d'études géotechniques qualifiés près de chez vous.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">Vous réglez uniquement le prix TTC du devis choisi auprès du bureau d'études. Aucun frais supplémentaire n'est ajouté côté client.</p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button type="button" size="lg" className="gap-2" onClick={() => openTunnel()}>
                Demander mes devis
                <ArrowRight className="h-4 w-4" />
              </Button>
              <a
                href="#parcours"
                className="gc-motion-fast inline-flex h-11 items-center justify-center rounded border border-slate-400/70 bg-transparent px-6 text-sm font-bold tracking-wide text-slate-700 transition-[color,background-color,border-color,box-shadow,transform] hover:border-blue-600 hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2"
              >
                Trouver mon type d'étude
              </a>
            </div>
          </div>

          <div className="relative flex min-h-[390px] items-center justify-center overflow-visible lg:min-h-full">
            <img
              src="/brand/hero-geotechnical-study-detailed.webp"
              alt="Coupe architecturale d'une maison, de ses fondations et des différentes strates du sol"
              className="h-auto w-[116%] max-w-none object-contain object-center mix-blend-multiply [filter:saturate(.52)_contrast(.96)] lg:w-[118%]"
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-16 w-28 bg-gradient-to-r from-[#e6bd70] via-[#e6bd70]/90 to-transparent lg:-left-20 lg:w-36" />
          </div>
        </div>
      </section>

      <section className="grid gap-3 rounded-lg border border-slate-200 bg-white/88 p-4 shadow-sm md:grid-cols-5">
        {TRUST_ITEMS.map((item) => (
          <div key={item} className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            {item}
          </div>
        ))}
      </section>

      <section id="parcours" className="grid gap-5 lg:grid-cols-2">
        {journeyCards.map((card) => {
          const Icon = card.icon;

          return (
            <form
              key={card.title}
              onSubmit={(event) => handleJourneySubmit(event, card)}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-950">{card.title}</h2>
                  <p className="mt-1 text-xs font-black uppercase tracking-wider text-[#779649]">{card.mission}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                </div>
              </div>

              <div className="mt-5 rounded-lg bg-slate-50 p-4">
                <label htmlFor={`postal-${card.preset.code}`} className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                  Code postal du terrain
                </label>
                <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    id={`postal-${card.preset.code}`}
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="Ex : 75001"
                    value={postalCodes[card.title] ?? ''}
                    onChange={(event) => setPostalCodes((current) => ({ ...current, [card.title]: event.target.value }))}
                    className="h-11 rounded border border-slate-300 bg-white px-3 text-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                  <Button type="submit" size="lg" className="gap-2">
                    {card.buttonLabel}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{card.helpText}</p>
              </div>
            </form>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="rounded-lg border border-blue-100 bg-blue-50/80 p-5">
          <div className="flex gap-3">
            <CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            <div>
              <h2 className="text-base font-black text-slate-950">Pas sûr de savoir quelle étude choisir ?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ce n'est pas grave. Choisissez le cas le plus proche ou démarrez une demande libre : les bureaux d'études pourront préciser la mission nécessaire.
              </p>
              <Button type="button" variant="outline" className="mt-4 gap-2" onClick={() => openTunnel()}>
                Ouvrir le formulaire
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {secondarySituations.map(({ icon: Icon, title, mission, text, preset }) => (
            <button
              key={title}
              type="button"
              onClick={() => openTunnel(preset)}
              className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2"
            >
              <Icon className="mb-3 h-5 w-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">{title}</h2>
              <p className="mt-1 text-[11px] font-black uppercase tracking-wider text-[#779649]">{mission}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
            </button>
          ))}
        </div>
      </section>

      <section id="questions" aria-labelledby="faq-title" className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-2xl bg-[#6f873f] p-6 text-white shadow-lg sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/75">La question financière</p>
          <h2 id="faq-title" className="mt-3 text-3xl font-black">Combien coûte Mon étude de sol.fr au client ?</h2>
          <p className="mt-4 leading-7 text-white/90">Rien de plus : vous réglez directement au bureau d'études le montant TTC du devis que vous avez validé.</p>
          <Button type="button" variant="outline" className="mt-6 border-white bg-white text-stone-900" onClick={() => openTunnel()}>
            Demander mes devis
          </Button>
        </div>
        <div className="space-y-3">
          {[
            {
              question: 'Qui réalisera mon étude de sol ?',
              answer: "Un bureau d'études partenaire disponible dans votre secteur pourra vous transmettre un devis. Les preuves de qualification seront publiées dans l'espace prévu à cet effet.",
            },
            {
              question: 'Comment se passe la prise de rendez-vous ?',
              answer: "Vous proposez une période qui vous convient puis validez la date finale d'intervention avec le bureau d'études retenu.",
            },
            {
              question: 'Vais-je forcément recevoir plusieurs devis ?',
              answer: "Non. Vous recevez les devis effectivement proposés par les bureaux d'études. Selon les disponibilités dans votre zone, une ou plusieurs propositions peuvent vous parvenir.",
            },
          ].map(({ question, answer }, index) => (
            <details key={question} open={index === 0} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer font-black text-stone-900">{question}</summary>
              <p className="mt-3 leading-7 text-stone-600">{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <StudyFinderPlaceholder onContinue={() => openTunnel()} />

      {selectedPreset && (
        <section
          key={`${selectedPreset.label}-${selectedPreset.code ?? 'libre'}-${selectedPreset.postalCode ?? ''}`}
          id="demande"
          ref={formSectionRef}
          className="mx-auto w-full max-w-2xl scroll-mt-6"
        >
          <QuoteTunnel
            initialType={selectedPreset.code}
            initialPostalCode={selectedPreset.postalCode}
            presetLabel={selectedPreset.label}
          />
        </section>
      )}

      <section id="fonctionnement" aria-label="Comment ça marche" className="rounded-lg border border-slate-200 bg-white/88 p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-5 md:items-center">
          {[
            { icon: ClipboardList, label: 'Vous décrivez le projet' },
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
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-blue-700">La loi Élan</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Une étude de sol peut être obligatoire pour vendre ou construire.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Pour certains terrains constructibles exposés au retrait-gonflement des argiles, une étude géotechnique est demandée. Elle aide aussi à anticiper les risques liés aux fondations.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              question: 'Mon terrain est-il concerné ?',
              answer: "Cela dépend de sa localisation et de l'exposition aux argiles. Le code postal aide à orienter la demande.",
            },
            {
              question: "Et si je ne connais pas G1 ou G2 ?",
              answer: "Vous pouvez quand même continuer. Décrivez votre situation, les spécialistes vous guideront.",
            },
            {
              question: 'Suis-je engagé ?',
              answer: "Non. Vous recevez des propositions, puis vous choisissez librement celle qui vous convient.",
            },
          ].map(({ question, answer }) => (
            <div key={question} className="rounded-lg border border-slate-200 bg-white/82 p-5 shadow-sm">
              <h2 className="text-sm font-black text-slate-950">{question}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="trust-proof-title" className="gc-landing-section bg-white p-6 sm:p-8">
        <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="gc-kicker">Des preuves, pas des promesses</p>
            <h2 id="trust-proof-title" className="mt-2 text-3xl font-black tracking-tight text-stone-900">Un réseau que vous pourrez vérifier</h2>
            <p className="mt-3 leading-7 text-stone-600">Ces emplacements accueilleront les justificatifs vérifiables dès qu'ils seront disponibles.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: 'Qualifications contrôlées', text: 'Preuves et critères à publier' },
              { icon: Building2, title: 'Couverture territoriale', text: 'Indicateur à consolider' },
              { icon: Star, title: 'Avis authentifiés', text: 'Retours clients à venir' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-5">
                <Icon className="h-5 w-5 text-[#779649]" />
                <h3 className="mt-4 font-black text-stone-900">{title}</h3>
                <p className="mt-2 text-sm text-stone-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 pb-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-950">Vous représentez un bureau d'études ?</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            Rejoignez Mon étude de sol.fr pour consulter les demandes disponibles, proposer vos devis et piloter vos études depuis un espace dédié.
          </p>
        </div>
        <Link
          to="/bureau-etudes/inscription"
          className="gc-motion-fast inline-flex h-11 w-full items-center justify-center rounded border border-slate-300 bg-white px-6 text-sm font-bold tracking-wide text-slate-700 shadow-sm transition-[color,background-color,border-color,box-shadow,transform] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 md:w-auto"
        >
          Rejoindre le réseau
        </Link>
      </section>
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
