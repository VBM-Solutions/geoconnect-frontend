import { format, getISOWeek, getISOWeeksInYear, getISOWeekYear, isSameMonth, isSameWeek, isToday, setISOWeek, startOfISOWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { useBEPlanning } from '../../hooks/useBEPlanning';
import { eventOccursOn } from '../../lib/planningCalendar';
import { PlanningEventDTO, PlanningEventStatus } from '../../types';

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const STATUS_LABELS: Record<PlanningEventStatus, string> = {
  CONTRACTUEL: 'Semaine contractuelle',
  A_CONFIRMER: 'À confirmer',
  CONFIRME: 'Confirmé',
  ANNONCE: 'Annoncé',
  REALISE: 'Réalisé',
};

const LEGEND_ITEMS: Array<{ label: string; style: string }> = [
  { label: 'Semaine d’intervention', style: 'border-violet-400 bg-violet-50 text-violet-800 border-dashed' },
  { label: 'Semaine de rendu', style: 'border-emerald-500 bg-emerald-50 text-emerald-800 border-dashed' },
  { label: 'À confirmer', style: 'border-amber-500 bg-amber-50 text-amber-900 border-dashed' },
  { label: 'Intervention confirmée', style: 'border-cyan-600 bg-cyan-600 text-white' },
  { label: 'Rendu annoncé', style: 'border-emerald-600 bg-emerald-600 text-white' },
  { label: 'Réalisé', style: 'border-emerald-700 bg-emerald-50 text-emerald-800' },
];

function eventStyle(event: PlanningEventDTO, day: Date): string {
  if (event.precision === 'SEMAINE') {
    return event.type === 'INTERVENTION'
      ? 'border-violet-400 bg-violet-50 text-violet-800 border-dashed'
      : 'border-emerald-500 bg-emerald-50 text-emerald-800 border-dashed';
  }
  if (event.type === 'INTERVENTION' && isToday(day)) return 'border-red-600 bg-red-600 text-white';
  if (event.statut === 'A_CONFIRMER') return 'border-amber-500 bg-amber-50 text-amber-900 border-dashed';
  if (event.statut === 'CONFIRME') return 'border-cyan-600 bg-cyan-600 text-white';
  if (event.statut === 'ANNONCE') return 'border-emerald-600 bg-emerald-600 text-white';
  return 'border-emerald-700 bg-emerald-50 text-emerald-800';
}

function eventTitle(event: PlanningEventDTO): string {
  const type = event.type === 'INTERVENTION' ? 'Intervention' : 'Rendu';
  if (!event.typeEtude) return type;
  return `${type} · ${event.typeEtude}`;
}

function eventLocation(event: PlanningEventDTO): string | undefined {
  if (event.ville && event.codePostal) return `${event.ville} - ${event.codePostal}`;
  return event.ville || event.codePostal;
}

function PlanningEvent({ event, day }: Readonly<{ event: PlanningEventDTO; day: Date }>) {
  const weekly = event.precision === 'SEMAINE';
  const location = eventLocation(event);
  return (
    <Link
      to={`/be/etude/${event.etudeId}`}
      title={`${eventTitle(event)} — ${STATUS_LABELS[event.statut]}`}
      aria-label={`${eventTitle(event)}, ${STATUS_LABELS[event.statut]}`}
      className={`block min-h-7 border px-1.5 py-1 text-[10px] font-semibold leading-tight hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${eventStyle(event, day)} ${weekly ? 'rounded-sm' : 'rounded-md'}`}
    >
      <span className="block truncate">{eventTitle(event)}</span>
      {location && <span className="mt-0.5 flex items-center gap-0.5 truncate font-normal"><MapPin className="h-2.5 w-2.5 shrink-0" />{location}</span>}
    </Link>
  );
}

function toLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

interface PositionedEvent {
  event: PlanningEventDTO;
  startColumn: number;
  span: number;
  lane: number;
}

function positionWeekEvents(events: PlanningEventDTO[], days: Date[]): PositionedEvent[] {
  const lanes: Array<Array<{ start: number; end: number }>> = [];
  return events.map(event => {
    const startColumn = event.precision === 'SEMAINE'
      ? 1
      : Math.max(1, days.findIndex(day => eventOccursOn(event, day)) + 1);
    const span = event.precision === 'SEMAINE' ? 5 : 1;
    const endColumn = startColumn + span - 1;
    let lane = lanes.findIndex(occupied => occupied.every(slot => endColumn < slot.start || startColumn > slot.end));
    if (lane === -1) {
      lane = lanes.length;
      lanes.push([]);
    }
    lanes[lane].push({ start: startColumn, end: endColumn });
    return { event, startColumn, span, lane };
  });
}

function dayBackground(outsideMonth: boolean, weekend: boolean): string {
  if (weekend && outsideMonth) return 'bg-slate-200/60';
  if (weekend) return 'bg-slate-100/90';
  if (outsideMonth) return 'bg-stone-50/70';
  return 'bg-white';
}

function dayNumberStyle(currentDay: boolean, outsideMonth: boolean, weekend: boolean): string {
  if (currentDay) return 'bg-blue-700 text-white ring-2 ring-blue-200';
  if (outsideMonth) return 'text-slate-400';
  if (weekend) return 'text-slate-500';
  return 'text-slate-700';
}

function CalendarWeek({ days, events, anchor, monthView }: Readonly<{
  key?: string;
  days: Date[];
  events: PlanningEventDTO[];
  anchor: Date;
  monthView: boolean;
}>) {
  const weekEvents = events.filter(event => days.some(day => eventOccursOn(event, day)));
  const positionedEvents = positionWeekEvents(weekEvents, days);
  const laneCount = positionedEvents.reduce((maximum, event) => Math.max(maximum, event.lane + 1), 0);
  const minHeight = 78 + laneCount * 38;

  return (
    <div className="relative grid grid-cols-7 border-l border-slate-200" style={{ minHeight }}>
      {days.map((day, index) => {
        const outsideMonth = monthView && !isSameMonth(day, anchor);
        const weekend = index >= 5;
        const currentDay = isToday(day);
        const currentWeek = monthView && isSameWeek(day, new Date(), { weekStartsOn: 1 });
        return (
          <article
            key={day.toISOString()}
            data-current-day={currentDay || undefined}
            data-current-week={currentWeek || undefined}
            data-weekend={weekend || undefined}
            className={`relative border-b border-r border-slate-200 p-1.5 ${dayBackground(outsideMonth, weekend)} ${currentWeek && index === 0 ? 'border-l-4 border-l-[#779649]' : ''} ${currentDay ? 'z-10 bg-blue-100/80 ring-2 ring-inset ring-blue-500' : ''}`}
          >
            <time dateTime={format(day, 'yyyy-MM-dd')} className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${dayNumberStyle(currentDay, outsideMonth, weekend)}`}>
              {format(day, 'd')}
            </time>
          </article>
        );
      })}
      <div className="pointer-events-none absolute inset-x-0 top-10 space-y-1 px-1">
        {positionedEvents.map(({ event, startColumn, span, lane }) => {
          const eventDay = toLocalDate(event.startDate);
          return (
            <div key={event.id} className="absolute inset-x-0 grid grid-cols-7 gap-0" style={{ top: lane * 38 }} data-event-lane={lane}>
              <div className="pointer-events-auto mx-1" style={{ gridColumn: `${startColumn} / span ${span}` }}>
                <PlanningEvent event={event} day={eventDay} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function weekDateRange(start: Date): string {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  if (isSameMonth(start, end)) {
    return `${format(start, 'd')}–${format(end, 'd MMMM', { locale: fr })}`;
  }
  return `${format(start, 'd MMM', { locale: fr })}–${format(end, 'd MMM', { locale: fr })}`;
}

function MonthOptions({ year, anchor, onSelect }: Readonly<{ year: number; anchor: Date; onSelect: (date: Date) => void }>) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {Array.from({ length: 12 }, (_, month) => {
        const date = new Date(year, month, 1);
        const selected = anchor.getFullYear() === year && anchor.getMonth() === month;
        const style = selected ? 'bg-blue-600 font-semibold text-white' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700';
        return <button key={month} type="button" aria-label={`Afficher ${format(date, 'MMMM yyyy', { locale: fr })}`} onClick={() => onSelect(date)} className={`rounded-md px-2 py-2 text-sm capitalize ${style}`}>{format(date, 'MMM', { locale: fr })}</button>;
      })}
    </div>
  );
}

function WeekOptions({ year, anchor, onSelect, selectedRef }: Readonly<{
  year: number;
  anchor: Date;
  onSelect: (date: Date) => void;
  selectedRef: RefObject<HTMLButtonElement | null>;
}>) {
  return (
    <div className="max-h-40 space-y-1 overflow-y-auto pr-1">
      {Array.from({ length: getISOWeeksInYear(new Date(year, 6, 1)) }, (_, index) => {
        const week = index + 1;
        const date = startOfISOWeek(setISOWeek(new Date(year, 0, 4), week));
        const selected = getISOWeekYear(anchor) === year && getISOWeek(anchor) === week;
        const style = selected ? 'bg-blue-600 font-semibold text-white' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700';
        const numberStyle = selected ? 'text-white' : 'text-slate-500';
        return (
          <button ref={selected ? selectedRef : undefined} key={week} type="button" aria-label={`Afficher la semaine ${week} de ${year}`} onClick={() => onSelect(date)} className={`flex w-full items-center rounded-md px-3 py-1.5 text-left text-sm ${style}`}>
            <span className={`w-12 shrink-0 font-bold ${numberStyle}`}>S{week}</span>
            <span className="capitalize">{weekDateRange(date)}</span>
          </button>
        );
      })}
    </div>
  );
}

function PeriodPicker({ view, anchor, onSelect }: Readonly<{
  view: 'week' | 'month';
  anchor: Date;
  onSelect: (date: Date) => void;
}>) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const selectedWeekRef = useRef<HTMLButtonElement>(null);
  const [year, setYear] = useState(anchor.getFullYear());
  useEffect(() => setYear(view === 'week' ? getISOWeekYear(anchor) : anchor.getFullYear()), [anchor, view]);
  const select = (date: Date) => {
    onSelect(date);
    detailsRef.current?.removeAttribute('open');
  };
  const label = view === 'week' ? `S${getISOWeek(anchor)} ${anchor.getFullYear()}` : format(anchor, 'MMMM yyyy', { locale: fr });

  return (
    <details
      ref={detailsRef}
      className="relative"
      onToggle={event => {
        if (event.currentTarget.open && view === 'week') {
          requestAnimationFrame(() => selectedWeekRef.current?.scrollIntoView?.({ block: 'center' }));
        }
      }}
    >
      <summary aria-label={view === 'week' ? 'Choisir une semaine' : 'Choisir un mois'} className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium capitalize text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden">
        <CalendarDays className="h-4 w-4 text-slate-500" />{label}
      </summary>
      <div className="absolute left-0 top-11 z-30 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <button type="button" aria-label="Année précédente" onClick={() => setYear(value => value - 1)} className="rounded-md border border-slate-200 p-1.5 hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /></button>
          <strong className="text-sm text-slate-800">{year}</strong>
          <button type="button" aria-label="Année suivante" onClick={() => setYear(value => value + 1)} className="rounded-md border border-slate-200 p-1.5 hover:bg-slate-50"><ChevronRight className="h-4 w-4" /></button>
        </div>
        {view === 'month'
          ? <MonthOptions year={year} anchor={anchor} onSelect={select} />
          : <WeekOptions year={year} anchor={anchor} onSelect={select} selectedRef={selectedWeekRef} />}
      </div>
    </details>
  );
}

export default function Planning() {
  const planning = useBEPlanning();
  const title = planning.view === 'week'
    ? `Semaine du ${format(planning.range.start, 'd MMMM yyyy', { locale: fr })}`
    : format(planning.anchor, 'MMMM yyyy', { locale: fr });
  const periodLabel = planning.view === 'week'
    ? `S${getISOWeek(planning.anchor)}`
    : format(planning.anchor, 'MMMM', { locale: fr });

  return (
    <main className="space-y-6" aria-labelledby="planning-title">
      <header className="flex flex-col gap-4 rounded-2xl bg-slate-900 p-5 text-white shadow-lg md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-200">
            <CalendarDays className="h-4 w-4" /> Bureau d'études
          </div>
          <h1 id="planning-title" className="text-2xl font-bold">Planning</h1>
          <p className="mt-1 text-sm text-slate-300">Interventions et rendus, planifiés ou réalisés.</p>
        </div>
        <Link to="/be/dashboard" className="text-sm font-medium text-blue-200 hover:text-white">Retour au tableau de bord</Link>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Calendrier du planning">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <button type="button" onClick={planning.previous} aria-label="Période précédente" className="rounded-md border border-slate-300 p-2 hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /></button>
            <span className="min-w-20 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-center text-sm font-bold capitalize text-slate-700" aria-label="Période affichée">{periodLabel}</span>
            <button type="button" onClick={planning.next} aria-label="Période suivante" className="rounded-md border border-slate-300 p-2 hover:bg-slate-50"><ChevronRight className="h-4 w-4" /></button>
            <button type="button" onClick={planning.today} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">Aujourd'hui</button>
            <PeriodPicker view={planning.view} anchor={planning.anchor} onSelect={planning.goToDate} />
          </div>
          <h2 className="text-lg font-bold capitalize text-slate-800" aria-live="polite">{title}</h2>
          <div className="inline-flex rounded-lg bg-slate-100 p-1" aria-label="Mode d'affichage">
            {(['week', 'month'] as const).map(view => (
              <button key={view} type="button" onClick={() => planning.setView(view)} aria-pressed={planning.view === view}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${planning.view === view ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}>
                {view === 'week' ? 'Semaine' : 'Mois'}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
          {LEGEND_ITEMS.map(item => (
            <span key={item.label} className="inline-flex items-center gap-1.5"><span className={`h-3 w-5 rounded-sm border ${item.style}`} />{item.label}</span>
          ))}
        </div>

        {planning.error && <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{planning.error}</div>}
        {planning.isLoading && <output className="block py-12 text-center text-sm text-slate-500">Chargement du planning…</output>}

        {!planning.isLoading && !planning.error && (
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="border-t border-slate-200">
                <div className="grid grid-cols-7 border-l border-slate-200">
                  {WEEK_DAYS.map((day, index) => <div key={day} className={`border-b border-r border-slate-200 py-2 text-center text-xs font-bold uppercase text-slate-500 ${index >= 5 ? 'bg-slate-200/80' : 'bg-slate-50'}`}>{day}</div>)}
                </div>
                {Array.from({ length: planning.range.days.length / 7 }, (_, index) => {
                  const days = planning.range.days.slice(index * 7, index * 7 + 7);
                  return <CalendarWeek key={days[0].toISOString()} days={days} events={planning.events} anchor={planning.anchor} monthView={planning.view === 'month'} />;
                })}
              </div>
              {planning.events.length === 0 && <p className="py-5 text-center text-sm text-slate-500">Aucune échéance sur cette période.</p>}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
