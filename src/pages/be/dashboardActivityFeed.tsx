import React from 'react';
import { Archive, CircleDashed, FlaskConical, Globe, Sparkles } from 'lucide-react';
import { DashboardActivityItem } from '../../components/ui/DashboardActivityFeed';

export type BEDashboardTab = 'OUVERT' | 'EN_ATTENTE' | 'ETUDE_EN_COURS' | 'ARCHIVES';

interface BuildBEActivityFeedParams {
  readonly openDemandesCount: number;
  readonly pendingCount: number;
  readonly etudesEnCoursCount: number;
  readonly etudesArchiveesCount: number;
  readonly hasDepFilter: boolean;
  readonly onNavigate: (tab: BEDashboardTab) => void;
}

function createActivityItem(
  id: string,
  title: string,
  description: string,
  icon: React.ReactNode,
  toneClassName: string,
  actionLabel: string,
  onAction: () => void,
): DashboardActivityItem {
  return {
    id,
    title,
    description,
    icon,
    toneClassName,
    actionLabel,
    onAction,
  };
}

function appendIfPositive(
  items: DashboardActivityItem[],
  count: number,
  itemFactory: () => DashboardActivityItem,
): void {
  if (count > 0) {
    items.push(itemFactory());
  }
}

function getMissionAvailabilityDescription(count: number): string {
  const missionLabel = count > 1 ? 'missions sont' : 'mission est';
  const openedLabel = count > 1 ? 'ouvertes' : 'ouverte';
  return `${count} ${missionLabel} ${openedLabel} à la réponse.`;
}

function getPendingProposalDescription(count: number): string {
  const propositionLabel = count > 1 ? 'propositions demandent' : 'proposition demande';
  return `${count} ${propositionLabel} une relance ou une mise à jour.`;
}

function getStudyProgressDescription(count: number): string {
  const etudeLabel = count > 1 ? 'études sont' : 'étude est';
  return `${count} ${etudeLabel} actuellement en production avec des jalons à surveiller.`;
}

function getArchivedStudyDescription(count: number): string {
  const archivedLabel = count > 1 ? 'études archivées sont' : 'étude archivée est';
  const readyLabel = count > 1 ? 'prêtes' : 'prête';
  const consultLabel = count > 1 ? 'consultées' : 'consultée';
  return `${count} ${archivedLabel} ${readyLabel} à être ${consultLabel}.`;
}

function getEmptyActivityDescription(hasDepFilter: boolean): string {
  return hasDepFilter
    ? 'Vos filtres départementaux sont actifs. Vérifiez vos missions disponibles ou élargissez temporairement le périmètre.'
    : 'Aucune mission ni étude active pour le moment. Le tableau de bord se mettra à jour dès qu’une nouvelle opportunité apparaîtra.';
}

export function buildBEActivityFeed({
  openDemandesCount,
  pendingCount,
  etudesEnCoursCount,
  etudesArchiveesCount,
  hasDepFilter,
  onNavigate,
}: Readonly<BuildBEActivityFeedParams>): DashboardActivityItem[] {
  const items: DashboardActivityItem[] = [];

  appendIfPositive(items, openDemandesCount, () => createActivityItem(
    'opportunities',
    'De nouvelles missions sont disponibles',
    getMissionAvailabilityDescription(openDemandesCount),
    <Globe className="h-4 w-4" />,
    'bg-blue-50 text-blue-700 border-blue-200',
    'Voir les missions',
    () => onNavigate('OUVERT'),
  ));

  appendIfPositive(items, pendingCount, () => createActivityItem(
    'pending',
    'Des propositions attendent un suivi',
    getPendingProposalDescription(pendingCount),
    <CircleDashed className="h-4 w-4" />,
    'bg-amber-50 text-amber-700 border-amber-200',
    'Ouvrir En attente',
    () => onNavigate('EN_ATTENTE'),
  ));

  appendIfPositive(items, etudesEnCoursCount, () => createActivityItem(
    'etudes',
    'Vos études avancent',
    getStudyProgressDescription(etudesEnCoursCount),
    <FlaskConical className="h-4 w-4" />,
    'bg-cyan-50 text-cyan-700 border-cyan-200',
    'Suivre les études',
    () => onNavigate('ETUDE_EN_COURS'),
  ));

  appendIfPositive(items, etudesArchiveesCount, () => createActivityItem(
    'archives',
    'Des livrables finalisés sont disponibles',
    getArchivedStudyDescription(etudesArchiveesCount),
    <Archive className="h-4 w-4" />,
    'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Voir les archives',
    () => onNavigate('ARCHIVES'),
  ));

  if (items.length > 0) {
    return items.slice(0, 4);
  }

  return [createActivityItem(
    'empty',
    'Votre activité est calme',
    getEmptyActivityDescription(hasDepFilter),
    <Sparkles className="h-4 w-4" />,
    'bg-violet-50 text-violet-700 border-violet-200',
    'Voir le dashboard',
    () => onNavigate('OUVERT'),
  )];
}

