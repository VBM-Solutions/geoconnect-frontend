import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LatLngExpression } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Building2, CalendarClock, ExternalLink, LocateFixed, List, MapPin, Navigation, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { BEMapDTO, BEMapFilters, BEMapMarkerDTO } from '../../types';
import { useBEMapData } from '../../hooks/useBEMapData';
import { Button } from '../ui/Button';
import { ETAT_LABELS, TYPE_LABELS } from '../../constants/labels';
import { formatCreneauIntervention, formatDateShort } from '../../lib/formatters';
import { BEMapFiltersPanel } from './BEMapFiltersPanel';
import {
  BEMapContext,
  LocalBEMapFilters,
  MapPoint,
  buildFilterOptions,
  createDefaultLocalFilters,
  filterMarkers,
} from './beMapFiltering';
import {
  BEMapViewportTarget,
  BUREAU_REGION_ZOOM,
  DEFAULT_CENTER,
  DEFAULT_FRANCE_ZOOM,
  MARKER_FOCUS_ZOOM,
} from './beMapViewport';
import { getAutoViewport } from './beMapViewportPolicy';
import { KIND_LABELS, MARKER_STYLES, createBureauIcon, createMarkerIcon, getMarkerStyle } from './beMapMarkerStyles';
import 'leaflet/dist/leaflet.css';
import './BEInteractiveMap.css';

interface BEInteractiveMapProps {
  readonly title: string;
  readonly context?: BEMapContext;
  readonly filters?: BEMapFilters;
  readonly height?: 'compact' | 'full';
  readonly showList?: boolean;
  readonly defaultNotificationDepartments?: string[];
  readonly defaultRestrictToNotificationDepartments?: boolean;
  readonly headerActions?: ReactNode;
}

interface FocusTarget {
  readonly viewport: BEMapViewportTarget;
  readonly nonce: number;
}

type MarkerGroup = 'INTERVENTION_A_PLANIFIER' | 'DATE_FIXEE' | 'MISSIONS' | 'AUTRES';

const EMPTY_NOTIFICATION_DEPARTMENTS: string[] = [];

const GROUP_LABELS: Record<MarkerGroup, string> = {
  INTERVENTION_A_PLANIFIER: 'Intervention à planifier',
  DATE_FIXEE: 'Date fixée',
  MISSIONS: 'Missions et propositions',
  AUTRES: 'Autres études',
};

function hasCoordinates(marker: BEMapMarkerDTO): boolean {
  return marker.adresseProjet?.latitude != null && marker.adresseProjet?.longitude != null;
}

function getMarkerPosition(marker: BEMapMarkerDTO): LatLngExpression {
  return [marker.adresseProjet.latitude, marker.adresseProjet.longitude];
}

function getBureauPosition(data: BEMapDTO | null): LatLngExpression | null {
  const adresse = data?.bureau?.adresse;
  return adresse?.latitude != null && adresse.longitude != null ? [adresse.latitude, adresse.longitude] : null;
}

function getBureauPoint(data: BEMapDTO | null): MapPoint | null {
  const adresse = data?.bureau?.adresse;
  return adresse?.latitude != null && adresse.longitude != null
    ? { latitude: adresse.latitude, longitude: adresse.longitude }
    : null;
}

function getMarkerLabel(marker: BEMapMarkerDTO): string {
  return marker.etatEtude ? ETAT_LABELS[marker.etatEtude]?.label ?? marker.etatEtude : KIND_LABELS[marker.kind];
}

function MapViewportController({ focusTarget }: Readonly<{ focusTarget: FocusTarget }>) {
  const map = useMap();

  useEffect(() => {
    if (focusTarget.viewport.mode === 'BOUNDS') {
      map.flyToBounds(focusTarget.viewport.bounds, { duration: 0.55, padding: focusTarget.viewport.padding ?? [32, 32] });
      return;
    }

    map.flyTo(focusTarget.viewport.center, focusTarget.viewport.zoom, { duration: 0.55 });
  }, [focusTarget, map]);

  return null;
}

function getInitialCenter(data: BEMapDTO | null, markers: BEMapMarkerDTO[]): LatLngExpression {
  const bureauPosition = getBureauPosition(data);
  if (bureauPosition) return bureauPosition;
  const firstMarker = markers.find(hasCoordinates);
  return firstMarker ? getMarkerPosition(firstMarker) : DEFAULT_CENTER;
}

function markerGroup(marker: BEMapMarkerDTO): MarkerGroup {
  if (marker.kind === 'DEMANDE_DISPONIBLE' || marker.kind === 'PROPOSITION_EN_ATTENTE') {
    return 'MISSIONS';
  }
  if (marker.etatEtude === 'DATE_INTERVENTION_FIXEE' && marker.dateIntervention) {
    return 'DATE_FIXEE';
  }
  if (marker.kind === 'ETUDE_EN_COURS' && !marker.dateIntervention) {
    return 'INTERVENTION_A_PLANIFIER';
  }
  return 'AUTRES';
}

function groupMarkers(markers: BEMapMarkerDTO[]): Array<readonly [MarkerGroup, BEMapMarkerDTO[]]> {
  const order: MarkerGroup[] = ['INTERVENTION_A_PLANIFIER', 'DATE_FIXEE', 'MISSIONS', 'AUTRES'];
  return order
    .map(group => [group, markers.filter(marker => markerGroup(marker) === group)] as const)
    .filter(([, items]) => items.length > 0);
}

function MarkerPopup({ marker }: Readonly<{ marker: BEMapMarkerDTO }>) {
  return (
    <div className="min-w-56 space-y-2 text-sm">
      <div>
        <p className="font-semibold text-slate-900">{marker.ville || 'Localisation'}</p>
        <p className="text-xs text-slate-500">{marker.codePostal || ''}</p>
      </div>
      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getMarkerStyle(marker).badge}`}>
        {getMarkerLabel(marker)}
      </span>
      {marker.type && <p className="text-xs font-medium text-slate-700">{TYPE_LABELS[marker.type] ?? marker.type}</p>}
      {marker.dateIntervention && (
        <div className="rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs text-blue-800">
          <span className="font-semibold">Intervention :</span> {formatCreneauIntervention(marker.dateIntervention, marker.periodeIntervention, formatDateShort)}
        </div>
      )}
      {!marker.dateIntervention && marker.kind === 'ETUDE_EN_COURS' && (
        <div className="rounded-md border border-orange-100 bg-orange-50 px-2 py-1 text-xs text-orange-800">
          Intervention à planifier
        </div>
      )}
      {marker.dateRenduPrevue && <p className="text-xs text-slate-600">Rendu prévu : {formatDateShort(marker.dateRenduPrevue)}</p>}
      {marker.dateRendu && (
        <div className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1.5 text-xs text-slate-800">
          <span className="font-semibold">Rapport rendu le :</span> {formatDateShort(marker.dateRendu)}
        </div>
      )}
      {marker.description && <p className="line-clamp-3 text-xs text-slate-600">{marker.description}</p>}
      {marker.actionUrl && (
        <Link to={marker.actionUrl} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">
          Ouvrir le détail <ExternalLink className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function BureauPopup({ data }: Readonly<{ data: BEMapDTO | null }>) {
  const bureau = data?.bureau;
  return (
    <div className="min-w-48 space-y-1 text-sm">
      <p className="font-semibold text-slate-900">{bureau?.raisonSociale || "Bureau d'études"}</p>
      <p className="text-xs text-slate-500">
        {[bureau?.adresse?.rue, bureau?.adresse?.codePostal, bureau?.adresse?.ville].filter(Boolean).join(', ')}
      </p>
    </div>
  );
}

function MarkerList({
  data,
  markers,
  selectedMarkerKey,
  onSelectMarker,
  onCenterBureau,
}: Readonly<{
  data: BEMapDTO | null;
  markers: BEMapMarkerDTO[];
  selectedMarkerKey: string | null;
  onSelectMarker: (marker: BEMapMarkerDTO) => void;
  onCenterBureau: () => void;
}>) {
  const bureauPosition = getBureauPosition(data);

  return (
    <div className="h-full space-y-3 overflow-y-auto pr-1">
      <button
        type="button"
        onClick={onCenterBureau}
        disabled={!bureauPosition}
        className="flex w-full items-center gap-3 rounded-lg border border-slate-300 bg-slate-900 p-3 text-left text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Building2 className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{data?.bureau?.raisonSociale || 'Mon bureau'}</span>
          <span className="block truncate text-xs text-slate-300">Recentrer sur le bureau</span>
        </span>
        <Navigation className="h-4 w-4 shrink-0" />
      </button>

      {markers.length === 0 && (
        <div className="flex min-h-36 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm text-slate-500">
          Aucun point géolocalisé pour cette vue.
        </div>
      )}

      {groupMarkers(markers).map(([group, items]) => (
        <div key={group} className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
            <span>{GROUP_LABELS[group]}</span>
            <span>{items.length}</span>
          </div>
          {items.map((marker) => {
            const markerKey = `${marker.kind}-${marker.id}`;
            const selected = selectedMarkerKey === markerKey;
            return (
              <div
                key={markerKey}
                className={`rounded-lg border bg-white p-3 transition-colors ${selected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-200'}`}
              >
                <button type="button" onClick={() => onSelectMarker(marker)} className="block w-full text-left">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{marker.ville || 'Localisation'}</p>
                      <p className="text-xs text-slate-500">#{marker.demandeDevisId ? `MES-${marker.demandeDevisId}` : marker.id}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getMarkerStyle(marker).badge}`}>
                      {getMarkerLabel(marker)}
                    </span>
                  </div>
                  {marker.dateIntervention && (
                    <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-700">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Intervention {formatCreneauIntervention(marker.dateIntervention, marker.periodeIntervention, formatDateShort)}
                    </p>
                  )}
                  {!marker.dateIntervention && marker.kind === 'ETUDE_EN_COURS' && (
                    <p className="mt-2 text-xs font-semibold text-orange-700">Intervention à planifier</p>
                  )}
                  {marker.dateRendu && (
                    <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-slate-700">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Rapport rendu le {formatDateShort(marker.dateRendu)}
                    </p>
                  )}
                  {marker.description && <p className="mt-2 line-clamp-2 text-xs text-slate-500">{marker.description}</p>}
                </button>
                {marker.actionUrl && (
                  <Link to={marker.actionUrl} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">
                    Accéder au détail <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function BEInteractiveMap({
  title,
  context = 'GLOBAL',
  filters,
  height = 'compact',
  showList = true,
  defaultNotificationDepartments = EMPTY_NOTIFICATION_DEPARTMENTS,
  defaultRestrictToNotificationDepartments = false,
  headerActions,
}: Readonly<BEInteractiveMapProps>) {
  const { data, isLoading, error, refetch } = useBEMapData(filters);
  const rawMarkers = useMemo(() => (data?.markers ?? []).filter(hasCoordinates), [data]);
  const defaultLocalFilters = useMemo(
    () => createDefaultLocalFilters({ context, restrictToNotificationDepartments: defaultRestrictToNotificationDepartments }),
    [context, defaultRestrictToNotificationDepartments],
  );
  const [localFilters, setLocalFilters] = useState<LocalBEMapFilters>(defaultLocalFilters);
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const bureauPoint = useMemo(() => getBureauPoint(data), [data]);
  const notificationDepartmentsKey = defaultNotificationDepartments.join('|');
  const notificationDepartments = useMemo(
    () => defaultNotificationDepartments,
    // The parent may pass a new array instance with the same values on each render.
    // Keep filtering stable so automatic fit-bounds does not keep stealing map control.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notificationDepartmentsKey],
  );
  const filterOptions = useMemo(() => buildFilterOptions(rawMarkers), [rawMarkers]);
  const markers = useMemo(
    () => filterMarkers(rawMarkers, localFilters, bureauPoint, notificationDepartments),
    [rawMarkers, localFilters, bureauPoint, notificationDepartments],
  );
  const center = useMemo(() => getInitialCenter(data, markers), [data, markers]);
  const bureauPosition = useMemo(() => getBureauPosition(data), [data]);
  const defaultViewport = useMemo(
    () => getAutoViewport({
      markers,
      bureauPoint,
      distanceKm: localFilters.distanceKm,
      selectedDepartments: localFilters.departments,
    }),
    [markers, bureauPoint, localFilters.distanceKm, localFilters.departments],
  );
  const defaultViewportKey = getViewportKey(defaultViewport);
  const [focusTarget, setFocusTarget] = useState<FocusTarget>({ viewport: defaultViewport, nonce: 0 });
  const [selectedMarkerKey, setSelectedMarkerKey] = useState<string | null>(null);
  const mapHeightClass = height === 'full'
    ? 'h-[clamp(560px,calc(100vh-10rem),820px)]'
    : 'h-[clamp(480px,calc(100vh-14rem),760px)]';

  useEffect(() => {
    setLocalFilters(defaultLocalFilters);
  }, [defaultLocalFilters]);

  useEffect(() => {
    setSelectedMarkerKey(null);
    setFocusTarget(current => ({ viewport: defaultViewport, nonce: current.nonce + 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultViewportKey]);

  const handleSelectMarker = (marker: BEMapMarkerDTO) => {
    setSelectedMarkerKey(`${marker.kind}-${marker.id}`);
    setFocusTarget(current => ({
      viewport: { mode: 'CENTER', center: getMarkerPosition(marker), zoom: MARKER_FOCUS_ZOOM },
      nonce: current.nonce + 1,
    }));
  };

  const handleCenterBureau = () => {
    if (!bureauPoint) return;
    setSelectedMarkerKey(null);
    setFocusTarget(current => ({
      viewport: { mode: 'CENTER', center: [bureauPoint.latitude, bureauPoint.longitude], zoom: BUREAU_REGION_ZOOM },
      nonce: current.nonce + 1,
    }));
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="h-7 w-44 animate-pulse rounded bg-slate-100" />
        <div className={`mt-3 ${mapHeightClass} animate-pulse rounded-lg bg-slate-100`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p className="font-semibold">Carte indisponible</p>
        <p className="mt-1">{error}</p>
        <Button type="button" variant="outline" size="sm" className="mt-3" onClick={refetch}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            <LocateFixed className="h-3.5 w-3.5" />
            Carte
          </div>
          <h3 className="mt-1 text-base font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {headerActions}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="h-4 w-4 text-blue-600" />
            {markers.length} point{markers.length > 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className={`be-interactive-map relative ${mapHeightClass} overflow-hidden rounded-lg border border-slate-200 bg-slate-100`}>
        <div className="absolute left-14 right-3 top-3 z-[500] max-w-[calc(100%-4.25rem)] md:left-16 md:right-auto md:max-w-[460px]">
          <BEMapFiltersPanel
            context={context}
            filters={localFilters}
            defaultFilters={defaultLocalFilters}
            options={filterOptions}
            canFilterByDistance={bureauPoint !== null}
            totalCount={rawMarkers.length}
            filteredCount={markers.length}
            isOpen={areFiltersOpen}
            onToggleOpen={() => setAreFiltersOpen(current => !current)}
            onChange={setLocalFilters}
            className="bg-white/95 backdrop-blur"
          />
        </div>

        {showList && (
          <button
            type="button"
            onClick={() => setIsListOpen(current => !current)}
            className="absolute right-3 top-3 z-[510] inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-3 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur transition-colors hover:bg-white md:right-4"
            aria-expanded={isListOpen}
          >
            {isListOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            <span className="hidden sm:inline">{isListOpen ? 'Masquer la liste' : 'Afficher la liste'}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5">{markers.length}</span>
          </button>
        )}

        {showList && isListOpen && (
          <aside className="absolute inset-x-3 bottom-3 z-[500] max-h-[44%] rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur md:inset-x-auto md:bottom-4 md:right-4 md:top-16 md:h-auto md:max-h-none md:w-[340px]">
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                <List className="h-3.5 w-3.5" />
                Liste
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                {markers.length}
              </span>
            </div>
            <div className="h-[calc(100%-2.25rem)] min-h-0">
              <MarkerList
                data={data}
                markers={markers}
                selectedMarkerKey={selectedMarkerKey}
                onSelectMarker={handleSelectMarker}
                onCenterBureau={handleCenterBureau}
              />
            </div>
          </aside>
        )}

        <div className="h-full w-full">
          <MapContainer center={center} zoom={bureauPosition ? BUREAU_REGION_ZOOM : DEFAULT_FRANCE_ZOOM} className="h-full w-full" scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewportController focusTarget={focusTarget} />
            {bureauPosition && (
              <Marker position={bureauPosition} icon={createBureauIcon()}>
                <Popup>
                  <BureauPopup data={data} />
                </Popup>
              </Marker>
            )}
            {markers.map((marker) => (
              <Marker key={`${marker.kind}-${marker.id}`} position={getMarkerPosition(marker)} icon={createMarkerIcon(marker)}>
                <Popup>
                  <MarkerPopup marker={marker} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
        <LegendItem color="#111827" label="BE" />
        <LegendItem color={MARKER_STYLES.MISSION.dot} label="Mission" />
        <LegendItem color={MARKER_STYLES.INTERVENTION_TODAY.dot} label="Aujourd'hui" />
        <LegendItem color={MARKER_STYLES.INTERVENTION_TO_PLAN.dot} label="À planifier" />
        <LegendItem color={MARKER_STYLES.INTERVENTION_PLANNED.dot} label="Date fixée" />
        <LegendItem color={MARKER_STYLES.ARCHIVED.dot} label="Étude archivée" />
      </div>
    </section>
  );
}

function LegendItem({ color, label }: Readonly<{ color: string; label: string }>) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function getViewportKey(viewport: BEMapViewportTarget): string {
  if (viewport.mode === 'CENTER') {
    return `CENTER:${serializeCenter(viewport.center)}:${viewport.zoom}`;
  }

  return `BOUNDS:${JSON.stringify(viewport.bounds)}:${viewport.padding?.join(',') ?? ''}`;
}

function serializeCenter(center: LatLngExpression): string {
  if (Array.isArray(center)) {
    return center.join(',');
  }
  return `${center.lat},${center.lng}`;
}
