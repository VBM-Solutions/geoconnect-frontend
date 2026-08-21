import { useCallback, useEffect, useRef, useState } from 'react';
import { format, startOfMonth, subMonths } from 'date-fns';
import { BarChart3, BriefcaseBusiness, Check, ChevronDown, CircleCheck, Clock3, Euro, FileCheck2, MessageSquareText, Send } from 'lucide-react';
import { getMaFicheBureauEtude, getMaPerformance } from '../../api/profilBureauEtude';
import { Card, CardContent } from '../../components/ui/Card';
import { ProfilBureauEtudeEvaluations } from '../../components/profil-be/ProfilBureauEtudeEvaluations';
import { extractErrorMessage } from '../../lib/utils';
import { PerformanceBureauEtudeDTO, SyntheseEvaluationsDTO } from '../../types';

type Preset = 'MONTH' | '3_MONTHS' | '6_MONTHS' | '12_MONTHS' | 'ALL' | 'CUSTOM';
const presets: Array<{ value: Preset; label: string; months: number }> = [
  { value: 'MONTH', label: 'Ce mois-ci', months: 0 },
  { value: '3_MONTHS', label: '3 mois', months: 2 },
  { value: '6_MONTHS', label: '6 mois', months: 5 },
  { value: '12_MONTHS', label: '12 mois', months: 11 },
  { value: 'ALL', label: 'Depuis le début', months: -1 },
  { value: 'CUSTOM', label: 'Personnalisée', months: -1 },
];

const money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

function periodStart(preset: Preset, customStart: string, today: Date, months: number) {
  if (preset === 'ALL') return '2000-01-01';
  if (preset === 'CUSTOM') return customStart;
  return format(startOfMonth(subMonths(today, months)), 'yyyy-MM-dd');
}

function comparisonLabel(value: number, previousValue: number) {
  if (value === previousValue) return 'Stable';
  const difference = Math.round(value - previousValue);
  const sign = difference > 0 ? '+' : '';
  return `${sign}${difference} vs période précédente`;
}

function PeriodSelect({ value, onChange }: Readonly<{ value: Preset; onChange: (value: Preset) => void }>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = presets.find(item => item.value === value) ?? presets[0];

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className="relative mt-1 min-w-44">
      <button type="button" aria-label="Période" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)} onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }} className="flex w-full items-center justify-between gap-3 rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-stone-800 shadow-sm outline-none transition hover:border-[#779649] focus:border-[#688239] focus:ring-2 focus:ring-[#dce6ca]">
        {selected.label}<ChevronDown className={`h-4 w-4 text-[#688239] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div role="listbox" aria-label="Choisir une période" className="absolute right-0 z-30 mt-2 w-full overflow-hidden rounded-xl border border-stone-200 bg-white p-1.5 shadow-xl shadow-stone-900/10">
        {presets.map(item => <button key={item.value} type="button" role="option" aria-selected={item.value === value} onClick={() => { onChange(item.value); setOpen(false); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${item.value === value ? 'bg-[#eef2e6] font-bold text-[#526c2c]' : 'font-medium text-stone-700 hover:bg-stone-100'}`}>
          {item.label}{item.value === value && <Check className="h-4 w-4" />}
        </button>)}
      </div>}
    </div>
  );
}

export default function PerformanceBureauEtudePage() {
  const [preset, setPreset] = useState<Preset>('MONTH');
  const [customStart, setCustomStart] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [performance, setPerformance] = useState<PerformanceBureauEtudeDTO | null>(null);
  const [evaluations, setEvaluations] = useState<SyntheseEvaluationsDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const today = new Date();
    const months = presets.find(item => item.value === preset)?.months ?? 0;
    const debut = periodStart(preset, customStart, today, months);
    const fin = preset === 'CUSTOM' ? customEnd : format(today, 'yyyy-MM-dd');
    try {
      const [result, fiche] = await Promise.all([
        getMaPerformance(debut, fin),
        getMaFicheBureauEtude(),
      ]);
      setPerformance(result);
      setEvaluations(fiche.evaluations);
    } catch (cause) {
      setError(extractErrorMessage(cause, 'Impossible de charger vos performances.'));
    } finally {
      setLoading(false);
    }
  }, [customEnd, customStart, preset]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <p className="py-20 text-center text-sm text-stone-500">Chargement des performances…</p>;
  if (error || !performance) return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</p>;

  const kpi = performance.indicateurs;
  const previous = performance.periodePrecedente;
  const metrics = [
    ['Demandes traitées', kpi.demandesTraitees, previous.demandesTraitees, BriefcaseBusiness],
    ['Propositions envoyées', kpi.propositionsEnvoyees, previous.propositionsEnvoyees, Send],
    ['Taux d’acceptation', `${Math.round(kpi.tauxAcceptation)} %`, previous.tauxAcceptation, CircleCheck],
    ['Chiffre d’affaires', money.format(kpi.montantAccepte), previous.montantAccepte, Euro],
    ['Études en cours', performance.etudesEnCours, undefined, BarChart3],
    ['Rapports rendus', kpi.rapportsRendus, previous.rapportsRendus, FileCheck2],
    ['Rapports dans les délais', `${Math.round(kpi.tauxRapportsDansLesDelais)} %`, previous.tauxRapportsDansLesDelais, Clock3],
    ['Note client', kpi.noteGlobale == null ? '—' : `${kpi.noteGlobale.toFixed(1)} / 5`, previous.noteGlobale, MessageSquareText],
  ] as const;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#688239]">Pilotage</p><h1 className="mt-1 text-3xl font-black text-stone-950">Performance</h1><p className="mt-1 text-sm text-stone-500">Suivez votre activité commerciale, votre production et la satisfaction client.</p></div>
        <div className="flex flex-wrap items-end gap-2"><div><span className="text-xs font-bold text-stone-700">Période</span><PeriodSelect value={preset} onChange={setPreset} /></div>{preset === 'CUSTOM' && <><label className="text-xs font-bold text-stone-700">Du<input aria-label="Début personnalisé" type="date" value={customStart} max={customEnd} onChange={event => setCustomStart(event.target.value)} className="ml-1 rounded-lg border border-stone-300 px-2 py-2 font-medium" /></label><label className="text-xs font-bold text-stone-700">Au<input aria-label="Fin personnalisée" type="date" value={customEnd} min={customStart} onChange={event => setCustomEnd(event.target.value)} className="ml-1 rounded-lg border border-stone-300 px-2 py-2 font-medium" /></label></>}</div>
      </header>
      <section aria-label="Indicateurs clés" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, previousValue, Icon]) => <Card key={label}><CardContent className="flex justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-wide text-stone-500">{label}</p><p className="mt-2 text-2xl font-black text-stone-950">{value}</p>{preset !== 'ALL' && typeof value === 'number' && previousValue !== undefined && <p className={`mt-1 text-[11px] font-bold ${value >= previousValue ? 'text-[#688239]' : 'text-amber-700'}`}>{comparisonLabel(value, previousValue)}</p>}</div><span className="h-fit rounded-xl bg-[#eef2e6] p-2.5 text-[#688239]"><Icon className="h-5 w-5" /></span></CardContent></Card>)}
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent><h2 className="font-bold">Propositions</h2><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><dt>Acceptées</dt><dd>{kpi.propositionsAcceptees}</dd></div><div className="flex justify-between"><dt>En attente</dt><dd>{kpi.propositionsEnAttente}</dd></div><div className="flex justify-between"><dt>Refusées</dt><dd>{kpi.propositionsRefusees}</dd></div><div className="flex justify-between border-t pt-2 font-bold"><dt>Montant proposé</dt><dd>{money.format(kpi.montantPropositions)}</dd></div></dl></CardContent></Card>
        <Card><CardContent><h2 className="font-bold">Production</h2><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><dt>Études démarrées</dt><dd>{kpi.etudesDemarrees}</dd></div><div className="flex justify-between"><dt>Études en cours</dt><dd>{performance.etudesEnCours}</dd></div><div className="flex justify-between"><dt>Rapports rendus</dt><dd>{kpi.rapportsRendus}</dd></div><div className="flex justify-between border-t pt-2 font-bold"><dt>Évaluations reçues</dt><dd>{kpi.evaluations}</dd></div></dl></CardContent></Card>
        <Card><CardContent><h2 className="font-bold">Délais moyens</h2><p className="mt-4 text-sm text-stone-500">Réponse à une demande</p><p className="text-2xl font-black">{kpi.delaiMoyenReponseJours?.toFixed(1) ?? '—'} jours</p><p className="mt-4 text-sm text-stone-500">Intervention → rapport</p><p className="text-2xl font-black">{kpi.delaiMoyenRenduJours?.toFixed(1) ?? '—'} jours</p></CardContent></Card>
        <Card><CardContent><h2 className="font-bold">Qualité détaillée</h2>{[['Échanges', kpi.qualiteEchanges], ['Délais', kpi.respectDelais], ['Rapport', kpi.qualiteRapport], ['Besoin', kpi.adequationBesoin]].map(([label, value]) => <div key={label as string} className="mt-3 flex justify-between text-sm"><span>{label}</span><strong>{value == null ? '—' : `${Number(value).toFixed(1)} / 5`}</strong></div>)}</CardContent></Card>
      </section>
      {evaluations && <ProfilBureauEtudeEvaluations evaluations={evaluations} />}
    </div>
  );
}
