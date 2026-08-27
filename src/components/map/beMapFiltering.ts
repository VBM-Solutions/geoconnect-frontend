import { BEMapMarkerDTO, BEMapMarkerKind, EtatEtude, TypeDemandeDevis } from '../../types';
import { extractCodeDepartement } from '../../lib/utils';

export type MapDistanceFilter = 'ALL' | 25 | 50 | 100 | 200;
export type BEMapContext = 'MISSIONS_DISPONIBLES' | 'ETUDES_EN_COURS' | 'ETUDES_ARCHIVEES' | 'GLOBAL';
export type InterventionTimingFilter = 'ALL' | 'TODAY' | 'TOMORROW' | 'UNPLANNED' | 'PLANNED';

export interface MapPoint {
  latitude: number;
  longitude: number;
}

export interface LocalBEMapFilters {
  kinds: BEMapMarkerKind[];
  etats: EtatEtude[];
  types: TypeDemandeDevis[];
  departments: string[];
  search: string;
  distanceKm: MapDistanceFilter;
  interventionTiming: InterventionTimingFilter;
  includeArchived: boolean;
  restrictToNotificationDepartments: boolean;
}

export interface BEMapFilterOptions {
  kinds: BEMapMarkerKind[];
  etats: EtatEtude[];
  types: TypeDemandeDevis[];
  departments: string[];
}

export const DEFAULT_LOCAL_BE_MAP_FILTERS: LocalBEMapFilters = {
  kinds: [],
  etats: [],
  types: [],
  departments: [],
  search: '',
  distanceKm: 'ALL',
  interventionTiming: 'ALL',
  includeArchived: false,
  restrictToNotificationDepartments: false,
};

const ARCHIVED_ETATS = new Set<EtatEtude>(['RAPPORT_TERMINE', 'PAIEMENT_EFFECTUE']);

export function getMarkerDepartment(marker: BEMapMarkerDTO): string | null {
  return extractCodeDepartement(marker.adresseProjet?.codePostal ?? marker.codePostal);
}

export function getMarkerPoint(marker: BEMapMarkerDTO): MapPoint | null {
  const latitude = marker.adresseProjet?.latitude;
  const longitude = marker.adresseProjet?.longitude;
  return latitude != null && longitude != null ? { latitude, longitude } : null;
}

export function getDistanceKm(from: MapPoint, to: MapPoint): number {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.latitude - from.latitude);
  const deltaLng = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function buildFilterOptions(markers: BEMapMarkerDTO[]): BEMapFilterOptions {
  return {
    kinds: unique(markers.map(marker => marker.kind)),
    etats: unique(markers.map(marker => marker.etatEtude).filter(Boolean)),
    types: unique(markers.map(marker => marker.type).filter(Boolean)),
    departments: unique(markers.map(getMarkerDepartment).filter(Boolean)).sort(compareDepartment),
  };
}

export function filterMarkers(
  markers: BEMapMarkerDTO[],
  filters: LocalBEMapFilters,
  bureauPoint: MapPoint | null,
  notificationDepartments: string[] = [],
): BEMapMarkerDTO[] {
  const search = normalizeSearch(filters.search);
  const followedDepartments = new Set(notificationDepartments);

  return markers.filter(marker => markerMatchesFilters(marker, filters, bureauPoint, followedDepartments, search));
}

export function hasActiveLocalFilters(filters: LocalBEMapFilters): boolean {
  return filters.kinds.length > 0 ||
    filters.etats.length > 0 ||
    filters.types.length > 0 ||
    filters.departments.length > 0 ||
    filters.search.trim().length > 0 ||
    filters.distanceKm !== 'ALL' ||
    filters.interventionTiming !== 'ALL' ||
    filters.includeArchived ||
    filters.restrictToNotificationDepartments;
}

export function createDefaultLocalFilters(params: Readonly<{
  context: BEMapContext;
  restrictToNotificationDepartments?: boolean;
}>): LocalBEMapFilters {
  const archivedContext = params.context === 'ETUDES_ARCHIVEES';
  const activeStudiesContext = params.context === 'ETUDES_EN_COURS';
  let kinds: BEMapMarkerKind[] = [];
  if (archivedContext) {
    kinds = ['ETUDE_ARCHIVEE'];
  } else if (activeStudiesContext) {
    kinds = ['ETUDE_EN_COURS'];
  }
  return {
    ...DEFAULT_LOCAL_BE_MAP_FILTERS,
    kinds,
    includeArchived: archivedContext,
    restrictToNotificationDepartments:
      params.context === 'MISSIONS_DISPONIBLES' && Boolean(params.restrictToNotificationDepartments),
  };
}

export function isArchivedMarker(marker: BEMapMarkerDTO): boolean {
  return marker.kind === 'ETUDE_ARCHIVEE' || (marker.etatEtude ? ARCHIVED_ETATS.has(marker.etatEtude) : false);
}

export function matchesInterventionTiming(marker: BEMapMarkerDTO, timing: InterventionTimingFilter, now: Date = new Date()): boolean {
  if (timing === 'UNPLANNED') return marker.kind === 'ETUDE_EN_COURS' && !marker.dateIntervention;
  if (timing === 'PLANNED') return Boolean(marker.dateIntervention);
  if (!marker.dateIntervention) return false;

  const markerDate = parseLocalDate(marker.dateIntervention);
  if (!markerDate) return false;

  if (timing === 'TODAY') return isSameLocalDay(markerDate, now);
  if (timing === 'TOMORROW') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return isSameLocalDay(markerDate, tomorrow);
  }

  return true;
}

function markerMatchesFilters(
  marker: BEMapMarkerDTO,
  filters: LocalBEMapFilters,
  bureauPoint: MapPoint | null,
  followedDepartments: ReadonlySet<string>,
  search: string,
): boolean {
  return matchesArchiveFilter(marker, filters) &&
    matchesCollectionFilters(marker, filters) &&
    matchesDepartmentFilters(marker, filters, followedDepartments) &&
    matchesDistanceFilter(marker, filters, bureauPoint) &&
    matchesTimingFilter(marker, filters) &&
    matchesSearchFilter(marker, search);
}

function matchesArchiveFilter(marker: BEMapMarkerDTO, filters: LocalBEMapFilters): boolean {
  return filters.includeArchived || !isArchivedMarker(marker);
}

function matchesCollectionFilters(marker: BEMapMarkerDTO, filters: LocalBEMapFilters): boolean {
  const matchesKind = matchesSelectedValues(filters.kinds, marker.kind)
    || (filters.includeArchived
      && marker.kind === 'ETUDE_ARCHIVEE'
      && filters.kinds.length === 1
      && filters.kinds[0] === 'ETUDE_EN_COURS');
  return matchesKind &&
    matchesSelectedValues(filters.etats, marker.etatEtude) &&
    matchesSelectedValues(filters.types, marker.type);
}

function matchesSelectedValues<T>(selectedValues: T[], markerValue: T | undefined): boolean {
  return selectedValues.length === 0 || (markerValue !== undefined && selectedValues.includes(markerValue));
}

function matchesDepartmentFilters(
  marker: BEMapMarkerDTO,
  filters: LocalBEMapFilters,
  followedDepartments: ReadonlySet<string>,
): boolean {
  const department = getMarkerDepartment(marker);
  return matchesSelectedDepartments(department, filters.departments) &&
    matchesNotificationDepartments(department, filters, followedDepartments);
}

function matchesSelectedDepartments(department: string | null, selectedDepartments: string[]): boolean {
  return selectedDepartments.length === 0 || (department !== null && selectedDepartments.includes(department));
}

function matchesNotificationDepartments(
  department: string | null,
  filters: LocalBEMapFilters,
  followedDepartments: ReadonlySet<string>,
): boolean {
  const shouldRestrict = filters.restrictToNotificationDepartments && followedDepartments.size > 0;
  return !shouldRestrict || (department !== null && followedDepartments.has(department));
}

function matchesDistanceFilter(
  marker: BEMapMarkerDTO,
  filters: LocalBEMapFilters,
  bureauPoint: MapPoint | null,
): boolean {
  if (filters.distanceKm === 'ALL') return true;

  const markerPoint = getMarkerPoint(marker);
  return bureauPoint !== null &&
    markerPoint !== null &&
    getDistanceKm(bureauPoint, markerPoint) <= filters.distanceKm;
}

function matchesTimingFilter(marker: BEMapMarkerDTO, filters: LocalBEMapFilters): boolean {
  return filters.interventionTiming === 'ALL' ||
    matchesInterventionTiming(marker, filters.interventionTiming);
}

function matchesSearchFilter(marker: BEMapMarkerDTO, search: string): boolean {
  return !search || getMarkerSearchText(marker).includes(search);
}

function toRadians(value: number): number {
  return value * Math.PI / 180;
}

function unique<T extends string>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function compareDepartment(left: string, right: string): number {
  return left.localeCompare(right, 'fr', { numeric: true });
}

function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

function getMarkerSearchText(marker: BEMapMarkerDTO): string {
  return normalizeSearch([
    marker.id,
    marker.demandeDevisId ? `MES-${marker.demandeDevisId}` : null,
    marker.ville,
    marker.codePostal,
    marker.adresseProjet?.rue,
    marker.adresseProjet?.ville,
    marker.adresseProjet?.codePostal,
    marker.type,
    marker.etatEtude,
    marker.description,
  ].filter(Boolean).join(' '));
}

function parseLocalDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
}
