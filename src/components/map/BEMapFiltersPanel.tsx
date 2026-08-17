import { Check, ChevronDown, ChevronUp, MapPinned, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import type React from 'react';
import { BEMapMarkerKind, TypeDemandeDevis } from '../../types';
import { ETAT_LABELS, TYPE_LABELS } from '../../constants/labels';
import {
  BEMapContext,
  BEMapFilterOptions,
  InterventionTimingFilter,
  LocalBEMapFilters,
  MapDistanceFilter,
  hasActiveLocalFilters,
} from './beMapFiltering';
import { formatDepartmentLabel, getAllDepartmentCodes } from './departments';

interface BEMapFiltersPanelProps {
  readonly context: BEMapContext;
  readonly filters: LocalBEMapFilters;
  readonly defaultFilters: LocalBEMapFilters;
  readonly options: BEMapFilterOptions;
  readonly canFilterByDistance: boolean;
  readonly totalCount: number;
  readonly filteredCount: number;
  readonly isOpen: boolean;
  readonly onToggleOpen: () => void;
  readonly onChange: (filters: LocalBEMapFilters) => void;
  readonly className?: string;
}

const KIND_LABELS: Record<BEMapMarkerKind, string> = {
  DEMANDE_DISPONIBLE: 'Demandes',
  PROPOSITION_EN_ATTENTE: 'Propositions',
  ETUDE_EN_COURS: 'Études',
  ETUDE_ARCHIVEE: 'Archives',
};

const DISTANCE_OPTIONS: Array<{ value: MapDistanceFilter; label: string }> = [
  { value: 'ALL', label: 'Toutes distances' },
  { value: 25, label: 'Rayon 25 km' },
  { value: 50, label: 'Rayon 50 km' },
  { value: 100, label: 'Rayon 100 km' },
  { value: 200, label: 'Rayon 200 km' },
];

const INTERVENTION_OPTIONS: Array<{ value: InterventionTimingFilter; label: string }> = [
  { value: 'ALL', label: 'Toutes les dates' },
  { value: 'TODAY', label: "Aujourd'hui" },
  { value: 'TOMORROW', label: 'Demain' },
  { value: 'UNPLANNED', label: 'À planifier' },
  { value: 'PLANNED', label: 'Date fixée' },
];

export function BEMapFiltersPanel({
  context,
  filters,
  defaultFilters,
  options,
  canFilterByDistance,
  totalCount,
  filteredCount,
  isOpen,
  onToggleOpen,
  onChange,
  className = '',
}: Readonly<BEMapFiltersPanelProps>) {
  const active = hasActiveLocalFilters(filters);
  const config = getFilterConfig(context);

  return (
    <div className={`rounded-lg border border-slate-200 bg-slate-50 shadow-sm ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-3">
        <button
          type="button"
          onClick={onToggleOpen}
          className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 hover:text-slate-800"
          aria-expanded={isOpen}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filtres
          <span className="rounded-full bg-white px-2 py-0.5 text-slate-600">
            {filteredCount}/{totalCount}
          </span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {active && (
          <button
            type="button"
            onClick={() => onChange({ ...defaultFilters })}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Réinitialiser
          </button>
        )}
      </div>

      {isOpen && (
        <div className="grid gap-3 border-t border-slate-200 p-3 xl:grid-cols-2">
          <label className="space-y-1 xl:col-span-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Recherche</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={filters.search}
                onChange={(event) => onChange({ ...filters, search: event.target.value })}
                placeholder="Ville, code postal, rue, référence..."
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
            </span>
          </label>

          {config.showKinds && (
            <FilterGroup title="Points">
              {options.kinds.map(kind => (
                <span key={kind}>
                  <FilterChip
                    label={KIND_LABELS[kind]}
                    active={filters.kinds.includes(kind)}
                    onClick={() => onChange({ ...filters, kinds: toggle(filters.kinds, kind) })}
                  />
                </span>
              ))}
            </FilterGroup>
          )}

          {config.showEtats && (
            <FilterGroup title="Avancement">
              {options.etats.map(etat => (
                <span key={etat}>
                  <FilterChip
                    label={ETAT_LABELS[etat]?.label ?? etat}
                    active={filters.etats.includes(etat)}
                    onClick={() => onChange({ ...filters, etats: toggle(filters.etats, etat) })}
                  />
                </span>
              ))}
            </FilterGroup>
          )}

          <DepartmentSelect
            selectedDepartments={filters.departments}
            onChange={(departments) => onChange({ ...filters, departments })}
          />

          {config.showInterventionTiming && (
            <label className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Intervention</span>
              <select
                value={filters.interventionTiming}
                onChange={(event) => onChange({ ...filters, interventionTiming: event.target.value as InterventionTimingFilter })}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
              >
                {INTERVENTION_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          )}

          {config.showType && (
            <label className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Type</span>
              <select
                value={filters.types[0] ?? ''}
                onChange={(event) => onChange({ ...filters, types: parseTypeFilterValue(event.target.value) })}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700"
              >
                <option value="">Tous les types</option>
                {options.types.map(type => (
                  <option key={type} value={type}>{TYPE_LABELS[type] ?? type}</option>
                ))}
              </select>
            </label>
          )}

          <label className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Distance au BE</span>
            <select
              value={String(filters.distanceKm)}
              disabled={!canFilterByDistance}
              onChange={(event) => onChange({ ...filters, distanceKm: parseDistanceValue(event.target.value) })}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-700 disabled:opacity-50"
            >
              {DISTANCE_OPTIONS.map(option => (
                <option key={String(option.value)} value={String(option.value)}>{option.label}</option>
              ))}
            </select>
          </label>

          {config.showArchivesToggle && (
            <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={filters.includeArchived}
                onChange={(event) => onChange({ ...filters, includeArchived: event.target.checked })}
                className="h-4 w-4 accent-slate-700"
              />
              <span>Afficher les études archivées</span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}

function getFilterConfig(context: BEMapContext): {
  showKinds: boolean;
  showEtats: boolean;
  showType: boolean;
  showInterventionTiming: boolean;
  showArchivesToggle: boolean;
} {
  return {
    showKinds: context === 'GLOBAL',
    showEtats: context !== 'MISSIONS_DISPONIBLES',
    showType: true,
    showInterventionTiming: context !== 'MISSIONS_DISPONIBLES',
    showArchivesToggle: context === 'GLOBAL',
  };
}

function FilterGroup({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{title}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: Readonly<{ label: string; active: boolean; onClick: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
        active
          ? 'border-blue-300 bg-blue-50 text-blue-700'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
      }`}
    >
      {label}
    </button>
  );
}

function DepartmentSelect({
  selectedDepartments,
  onChange,
}: Readonly<{
  selectedDepartments: string[];
  onChange: (departments: string[]) => void;
}>) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const departments = useMemo(() => getAllDepartmentCodes(), []);
  const filteredDepartments = useMemo(() => {
    const normalizedQuery = normalize(query);
    return departments.filter((department) => normalize(formatDepartmentLabel(department)).includes(normalizedQuery));
  }, [departments, query]);

  const label = getDepartmentSelectLabel(selectedDepartments.length);

  return (
    <div className="relative space-y-1">
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Départements</span>
      <button
        type="button"
        onClick={() => setIsOpen(current => !current)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-2 text-left text-sm text-slate-700"
        aria-expanded={isOpen}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          <MapPinned className="h-4 w-4 shrink-0 text-slate-400" />
          <span className="truncate">{label}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-[530] mt-1 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
          <span className="relative block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="75, Paris, Rhône..."
              className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
            />
          </span>

          <div className="mt-2 max-h-44 space-y-1 overflow-y-auto pr-1">
            {filteredDepartments.length === 0 && (
              <p className="px-2 py-3 text-center text-xs text-slate-500">Aucun département trouvé.</p>
            )}
            {filteredDepartments.map((department) => {
              const selected = selectedDepartments.includes(department);
              return (
              <button
                key={department}
                type="button"
                onClick={() => onChange(toggle(selectedDepartments, department))}
                className={`flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left text-sm transition-colors ${
                  selected
                    ? 'border-blue-200 bg-blue-50 text-blue-800'
                    : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{formatDepartmentLabel(department)}</span>
                {selected && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
              </button>
              );
            })}
          </div>

          {selectedDepartments.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-2 w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Effacer la sélection
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function toggle<T>(items: T[], value: T): T[] {
  return items.includes(value) ? items.filter(item => item !== value) : [...items, value];
}

function parseDistanceValue(value: string): MapDistanceFilter {
  return value === 'ALL' ? 'ALL' : Number(value) as MapDistanceFilter;
}

function parseTypeFilterValue(value: string): TypeDemandeDevis[] {
  return value ? [value as TypeDemandeDevis] : [];
}

function getDepartmentSelectLabel(selectedCount: number): string {
  if (selectedCount === 0) return 'Tous les départements';
  return `${selectedCount} département${selectedCount > 1 ? 's' : ''}`;
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}
