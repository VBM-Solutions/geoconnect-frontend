import { DivIcon } from 'leaflet';
import { BEMapMarkerDTO, BEMapMarkerKind, EtatEtude } from '../../types';

export type MarkerVisualState =
  | 'MISSION'
  | 'PROPOSITION'
  | 'INTERVENTION_TODAY'
  | 'INTERVENTION_TOMORROW'
  | 'INTERVENTION_TO_PLAN'
  | 'INTERVENTION_PLANNED'
  | 'DONE'
  | 'ARCHIVED';

export interface MarkerStyle {
  readonly dot: string;
  readonly ring: string;
  readonly badge: string;
  readonly glyph: string;
  readonly pulse?: boolean;
}

export const MARKER_STYLES: Record<MarkerVisualState, MarkerStyle> = {
  MISSION: { dot: '#2563eb', ring: '#bfdbfe', badge: 'bg-blue-50 text-blue-700 border-blue-200', glyph: '+' },
  PROPOSITION: { dot: '#d97706', ring: '#fed7aa', badge: 'bg-amber-50 text-amber-700 border-amber-200', glyph: '?' },
  INTERVENTION_TODAY: { dot: '#dc2626', ring: '#fecaca', badge: 'bg-red-50 text-red-700 border-red-200', glyph: '!' , pulse: true },
  INTERVENTION_TOMORROW: { dot: '#7c3aed', ring: '#ddd6fe', badge: 'bg-violet-50 text-violet-700 border-violet-200', glyph: 'J+1' },
  INTERVENTION_TO_PLAN: { dot: '#ea580c', ring: '#fed7aa', badge: 'bg-orange-50 text-orange-700 border-orange-200', glyph: '...' },
  INTERVENTION_PLANNED: { dot: '#0891b2', ring: '#a5f3fc', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200', glyph: '✓' },
  DONE: { dot: '#059669', ring: '#bbf7d0', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', glyph: '✓' },
  ARCHIVED: { dot: '#64748b', ring: '#cbd5e1', badge: 'bg-slate-50 text-slate-700 border-slate-200', glyph: '•' },
};

const DONE_ETATS = new Set<EtatEtude>(['INTERVENTION_EFFECTUEE', 'RAPPORT_TERMINE', 'PAIEMENT_EFFECTUE']);

export function getMarkerVisualState(marker: BEMapMarkerDTO, now: Date = new Date()): MarkerVisualState {
  if (marker.kind === 'ETUDE_ARCHIVEE' || marker.etatEtude === 'PAIEMENT_EFFECTUE' || marker.etatEtude === 'RAPPORT_TERMINE') return 'ARCHIVED';
  if (marker.kind === 'DEMANDE_DISPONIBLE') return 'MISSION';
  if (marker.kind === 'PROPOSITION_EN_ATTENTE') return 'PROPOSITION';
  if (marker.kind === 'ETUDE_EN_COURS' && !marker.dateIntervention) return 'INTERVENTION_TO_PLAN';
  if (marker.dateIntervention && isSameLocalDay(new Date(marker.dateIntervention), now)) return 'INTERVENTION_TODAY';
  if (marker.dateIntervention && isTomorrow(new Date(marker.dateIntervention), now)) return 'INTERVENTION_TOMORROW';
  if (marker.etatEtude && DONE_ETATS.has(marker.etatEtude)) return 'DONE';
  return 'INTERVENTION_PLANNED';
}

export function getMarkerStyle(marker: BEMapMarkerDTO): MarkerStyle {
  return MARKER_STYLES[getMarkerVisualState(marker)];
}

export function createMarkerIcon(marker: BEMapMarkerDTO): DivIcon {
  const style = getMarkerStyle(marker);
  const size = style.glyph.length > 1 ? 30 : 26;
  const pulse = style.pulse
    ? `<span style="position:absolute;inset:-7px;border-radius:9999px;background:${style.dot};opacity:.18;animation:pulse 1.5s infinite"></span>`
    : '';

  return new DivIcon({
    className: '',
    html: `<span style="position:relative;display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:9999px;background:${style.dot};border:3px solid white;box-shadow:0 8px 20px rgba(15,23,42,.28);outline:4px solid ${style.ring};color:white;font-size:10px;font-weight:800;line-height:1">${pulse}<span style="position:relative">${style.glyph}</span></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -14],
  });
}

export function createBureauIcon(): DivIcon {
  return new DivIcon({
    className: '',
    html: '<span style="display:block;width:20px;height:20px;border-radius:9999px;background:#111827;border:4px solid white;box-shadow:0 8px 20px rgba(15,23,42,.3);outline:4px solid #cbd5e1"></span>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });
}

export const KIND_LABELS: Record<BEMapMarkerKind, string> = {
  DEMANDE_DISPONIBLE: 'Mission disponible',
  PROPOSITION_EN_ATTENTE: 'Proposition en attente',
  ETUDE_EN_COURS: 'Étude en cours',
  ETUDE_ARCHIVEE: 'Étude archivée',
};

function isTomorrow(value: Date, now: Date): boolean {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameLocalDay(value, tomorrow);
}

function isSameLocalDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
}
