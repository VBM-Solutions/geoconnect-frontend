import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useBEDashboardData } from '../../hooks/useBEDashboardData';
import { useToast } from '../../contexts/ToastContext';
import { STATUT_LABELS } from '../../constants/labels';
import { formatDateShort } from '../../lib/formatters';
import { extractCodeDepartement } from '../../lib/utils';
import { DemandeDevisDTO, PropositionDevisDTO, EtudeDetailDTO } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Calendar, ChevronRight, FlaskConical, User, Clock, AlertCircle, Archive, Globe, Sparkles, CircleDashed, CheckCircle2, FolderKanban, SlidersHorizontal, Map as MapIcon } from 'lucide-react';
import { beMustAct } from '../../components/etude/EtudeStatusBadge';
import { EtudeCardHeader } from '../../components/etude/EtudeCardHeader';
import { DashboardSidebarNav, type DashboardNavSection } from '../../components/ui/DashboardSidebarNav';
import { DashboardMetricCard } from '../../components/ui/DashboardMetricCard';
import { DashboardActivityFeed } from '../../components/ui/DashboardActivityFeed';
import { BEInteractiveMap } from '../../components/map/BEInteractiveMap';
import { Link, useSearchParams } from 'react-router-dom';
import { buildBEActivityFeed } from './dashboardActivityFeed';
import { formatDelaiWithProjection } from '../../lib/delaiProjection';

type TabType = 'OUVERT' | 'EN_ATTENTE' | 'ETUDE_EN_COURS' | 'ARCHIVES' | 'CARTE';
type DashboardContentView = 'CARTE' | 'LISTE';

interface BEDashboardComputedData {
  readonly openDemandes: DemandeDevisDTO[];
  readonly filteredOpenDemandes: DemandeDevisDTO[];
  readonly pendingItems: Array<readonly [number, PropositionDevisDTO]>;
  readonly etudesEnCours: EtudeDetailDTO[];
  readonly etudesArchivees: EtudeDetailDTO[];
}

function getDemandeActionLabel(isRefused: boolean, hasProp: boolean): string {
  if (isRefused) return 'Reproposer une offre';
  if (hasProp) return 'Voir détail';
  return 'Répondre au devis';
}

// ─── État vide pour les onglets études dans la grille BE ──────────────────────

function EtudesGridEmptyState({ icon, text }: Readonly<{ icon: React.ReactNode; text: string }>) {
  return (
    <div className="col-span-full py-12 text-center text-slate-500">
      {icon}
      <p>{text}</p>
    </div>
  );
}

function getAcceptedDemandeIds(
  demandes: DemandeDevisDTO[],
  allPropositionsPerDemande: PropositionDevisDTO[][],
): Set<number> {
  const acceptedDemandeIds = new Set<number>();
  demandes.forEach((demande, index) => {
    const hasAccepted = (allPropositionsPerDemande[index] ?? []).some((proposition) => proposition.statut === 'ACCEPTEE');
    if (hasAccepted && demande.id != null) acceptedDemandeIds.add(demande.id);
  });
  return acceptedDemandeIds;
}

function getMyActivePropPerDemande(myPropositions: PropositionDevisDTO[]): Map<number, PropositionDevisDTO> {
  const myPropsPerDemande = new Map<number, PropositionDevisDTO[]>();
  myPropositions.forEach((proposition) => {
    if (proposition.demandeDevisId == null) return;

    if (!myPropsPerDemande.has(proposition.demandeDevisId)) {
      myPropsPerDemande.set(proposition.demandeDevisId, []);
    }

    myPropsPerDemande.get(proposition.demandeDevisId)?.push(proposition);
  });

  const myActivePropPerDemande = new Map<number, PropositionDevisDTO>();
  myPropsPerDemande.forEach((propositions, demandeId) => {
    const active =
      propositions.find((proposition) => proposition.statut === 'EN_ATTENTE') ??
      propositions.find((proposition) => proposition.statut === 'ACCEPTEE') ??
      propositions.at(-1);

    if (active) myActivePropPerDemande.set(demandeId, active);
  });

  return myActivePropPerDemande;
}

function filterOpenDemandesByDepartment(
  openDemandes: DemandeDevisDTO[],
  filterByDept: boolean,
  notificationPreferences: {
    notifierTousDepartements: boolean;
    departementsSuivis: string[];
  } | null,
): DemandeDevisDTO[] {
  if (!filterByDept || !notificationPreferences || notificationPreferences.notifierTousDepartements) {
    return openDemandes;
  }

  const departementsSuivis = new Set(notificationPreferences.departementsSuivis);
  return openDemandes.filter((demande) => {
    const codeDepartement = extractCodeDepartement(demande.adresseProjet?.codePostal);
    return codeDepartement === null || departementsSuivis.has(codeDepartement);
  });
}

function computeBEDashboardData(
  demandes: DemandeDevisDTO[],
  allPropositionsPerDemande: PropositionDevisDTO[][],
  myPropositions: PropositionDevisDTO[],
  etudes: EtudeDetailDTO[],
  filterByDept: boolean,
  notificationPreferences: {
    notifierTousDepartements: boolean;
    departementsSuivis: string[];
  } | null,
): BEDashboardComputedData {
  const acceptedDemandeIds = getAcceptedDemandeIds(demandes, allPropositionsPerDemande);
  const myActivePropPerDemande = getMyActivePropPerDemande(myPropositions);

  const myPropDemandeIds = new Set(myPropositions.map((proposition) => proposition.demandeDevisId));
  const openDemandes = demandes.filter((demande, index) => {
    const hasAccepted = (allPropositionsPerDemande[index] ?? []).some((proposition) => proposition.statut === 'ACCEPTEE');
    return !myPropDemandeIds.has(demande.id) && !hasAccepted;
  });

  const filteredOpenDemandes = filterOpenDemandesByDepartment(openDemandes, filterByDept, notificationPreferences);

  const pendingItems = [...myActivePropPerDemande.entries()].filter(([demandeId, proposition]) => {
    return proposition.statut === 'EN_ATTENTE' || (proposition.statut === 'REFUSEE' && !acceptedDemandeIds.has(demandeId));
  });

  const etudesEnCours = etudes.filter((etude) => etude.etat !== 'PAIEMENT_EFFECTUE');
  const etudesArchivees = etudes.filter((etude) => etude.etat === 'PAIEMENT_EFFECTUE');

  return {
    openDemandes,
    filteredOpenDemandes,
    pendingItems,
    etudesEnCours,
    etudesArchivees,
  };
}

interface BEDashboardBodyProps {
  readonly activeTab: TabType;
  readonly hasDepFilter: boolean;
  readonly filterByDept: boolean;
  readonly notificationPreferences: {
    departementsSuivis: string[];
  } | null;
  readonly openDemandes: DemandeDevisDTO[];
  readonly filteredOpenDemandes: DemandeDevisDTO[];
  readonly pendingItems: Array<readonly [number, PropositionDevisDTO]>;
  readonly etudesEnCours: EtudeDetailDTO[];
  readonly etudesArchivees: EtudeDetailDTO[];
  readonly demandes: DemandeDevisDTO[];
  readonly onFilterByDeptChange: (checked: boolean) => void;
  readonly onShowAllMissions: () => void;
  readonly renderDemandeCard: (demande: DemandeDevisDTO, prop?: PropositionDevisDTO) => React.ReactNode;
  readonly renderEtudeCard: (etude: EtudeDetailDTO) => React.ReactNode;
  readonly page: number;
  readonly totalPages: number;
  readonly onPageChange: (page: number) => void;
}

function PaginationControls({ page, totalPages, onChange }: Readonly<{ page: number; totalPages: number; onChange: (page: number) => void }>) {
  if (totalPages <= 1) return null;
  return <div className="col-span-full flex items-center justify-center gap-3 pt-2">
    <Button size="sm" variant="outline" disabled={page === 0} onClick={() => onChange(page - 1)}>Précédent</Button>
    <span className="text-xs text-slate-500">Page {page + 1}/{totalPages}</span>
    <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>Suivant</Button>
  </div>;
}

function OpenDemandesContent({
  filterByDept,
  openDemandes,
  filteredOpenDemandes,
  onShowAllMissions,
  renderDemandeCard,
}: Readonly<{
  filterByDept: boolean;
  openDemandes: DemandeDevisDTO[];
  filteredOpenDemandes: DemandeDevisDTO[];
  onShowAllMissions: () => void;
  renderDemandeCard: (demande: DemandeDevisDTO, prop?: PropositionDevisDTO) => React.ReactNode;
}>) {
  if (filteredOpenDemandes.length === 0) {
    return (
      <div className="col-span-full py-12 text-center text-slate-500">
        {filterByDept && openDemandes.length > 0
          ? (
            <div className="space-y-2">
              <p>Aucune mission disponible dans vos départements suivis.</p>
              <button
                type="button"
                onClick={onShowAllMissions}
                className="text-sm text-blue-600 hover:underline"
              >
                Voir toutes les missions ({openDemandes.length})
              </button>
            </div>
          )
          : <p>Aucune nouvelle demande correspondante.</p>
        }
      </div>
    );
  }

  return <>{filteredOpenDemandes.map((demande) => renderDemandeCard(demande))}</>;
}

function PendingDemandesContent({
  pendingItems,
  demandes,
  renderDemandeCard,
}: Readonly<{
  pendingItems: Array<readonly [number, PropositionDevisDTO]>;
  demandes: DemandeDevisDTO[];
  renderDemandeCard: (demande: DemandeDevisDTO, prop?: PropositionDevisDTO) => React.ReactNode;
}>) {
  if (pendingItems.length === 0) {
    return <div className="col-span-full py-12 text-center text-slate-500">Aucune proposition en attente.</div>;
  }

  return (
    <>
      {pendingItems.map(([demandeId, proposition]) => {
        const demande = demandes.find((item) => item.id === demandeId);
        return demande ? renderDemandeCard(demande, proposition) : null;
      })}
    </>
  );
}

function EtudesContent({
  etudes,
  emptyText,
  renderEtudeCard,
}: Readonly<{
  etudes: EtudeDetailDTO[];
  emptyText: string;
  renderEtudeCard: (etude: EtudeDetailDTO) => React.ReactNode;
}>) {
  if (etudes.length === 0) {
    return <EtudesGridEmptyState icon={<FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-3" />} text={emptyText} />;
  }

  return <>{etudes.map((etude) => renderEtudeCard(etude))}</>;
}

function EtudesArchiveesContent({
  etudes,
  renderEtudeCard,
}: Readonly<{
  etudes: EtudeDetailDTO[];
  renderEtudeCard: (etude: EtudeDetailDTO) => React.ReactNode;
}>) {
  if (etudes.length === 0) {
    return <EtudesGridEmptyState icon={<Archive className="w-8 h-8 text-slate-300 mx-auto mb-3" />} text="Aucune étude archivée pour le moment." />;
  }

  return <>{etudes.map((etude) => renderEtudeCard(etude))}</>;
}

function BEDashboardBody({
  activeTab,
  hasDepFilter,
  filterByDept,
  notificationPreferences,
  openDemandes,
  filteredOpenDemandes,
  pendingItems,
  etudesEnCours,
  etudesArchivees,
  demandes,
  onFilterByDeptChange,
  onShowAllMissions,
  renderDemandeCard,
  renderEtudeCard,
  page,
  totalPages,
  onPageChange,
}: Readonly<BEDashboardBodyProps>) {
  const [contentView, setContentView] = useState<DashboardContentView>('CARTE');
  const hasSwitchableMap = activeTab === 'OUVERT' || activeTab === 'ETUDE_EN_COURS';

  useEffect(() => {
    if (hasSwitchableMap) setContentView('CARTE');
  }, [activeTab, hasSwitchableMap]);

  const showIntegratedMap = hasSwitchableMap && contentView === 'CARTE';
  const showListGrid = activeTab !== 'CARTE' && (!hasSwitchableMap || contentView === 'LISTE');

  return (
    <div className="min-w-0 flex-1 space-y-4">
      {/* Toggle "Mes départements" — visible uniquement sur l'onglet Missions Disponibles */}
      {activeTab === 'OUVERT' && hasDepFilter && (
        <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <label className="flex items-center gap-2.5 cursor-pointer select-none" aria-label="Filtrer les missions par mes départements">
            <input
              type="checkbox"
              checked={filterByDept}
              onChange={(event) => onFilterByDeptChange(event.target.checked)}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
            <span className="font-medium text-blue-800">Filtrer par mes départements</span>
            {filterByDept && notificationPreferences && (
              <span className="text-blue-600 text-xs">
                ({notificationPreferences.departementsSuivis.length} département{notificationPreferences.departementsSuivis.length > 1 ? 's' : ''} suivis)
              </span>
            )}
          </label>
          {filterByDept && openDemandes.length > filteredOpenDemandes.length && (
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              {openDemandes.length - filteredOpenDemandes.length} mission{openDemandes.length - filteredOpenDemandes.length > 1 ? 's' : ''} hors zone masquée{openDemandes.length - filteredOpenDemandes.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {hasSwitchableMap && (
        <div className="flex w-fit rounded-lg border border-slate-200 bg-slate-50 p-1 text-sm">
          <button
            type="button"
            onClick={() => setContentView('CARTE')}
            className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${contentView === 'CARTE' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Carte
          </button>
          <button
            type="button"
            onClick={() => setContentView('LISTE')}
            className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${contentView === 'LISTE' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Liste
          </button>
        </div>
      )}

      <div
        data-testid="dashboard-switchable-view"
        className={hasSwitchableMap ? 'min-h-[520px]' : undefined}
      >
      {showIntegratedMap && activeTab === 'OUVERT' && (
        <BEInteractiveMap
          title="Missions disponibles géolocalisées"
          context="MISSIONS_DISPONIBLES"
          filters={{ kind: 'DEMANDE_DISPONIBLE' }}
          defaultNotificationDepartments={notificationPreferences?.departementsSuivis ?? []}
          defaultRestrictToNotificationDepartments={filterByDept}
        />
      )}

      {showIntegratedMap && activeTab === 'ETUDE_EN_COURS' && (
        <BEInteractiveMap title="Études en cours géolocalisées" context="ETUDES_EN_COURS" filters={{ kind: 'ETUDE_EN_COURS' }} />
      )}

      {activeTab === 'CARTE' && (
        <BEInteractiveMap title="Vue géographique globale" context="GLOBAL" filters={{ withArchived: true }} height="full" />
      )}

      {showListGrid && <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTab === 'OUVERT' && (
          <OpenDemandesContent
            filterByDept={filterByDept}
            openDemandes={openDemandes}
            filteredOpenDemandes={filteredOpenDemandes}
            onShowAllMissions={onShowAllMissions}
            renderDemandeCard={renderDemandeCard}
          />
        )}
        {activeTab === 'EN_ATTENTE' && (
          <PendingDemandesContent
            pendingItems={pendingItems}
            demandes={demandes}
            renderDemandeCard={renderDemandeCard}
          />
        )}
        {activeTab === 'ETUDE_EN_COURS' && (
          <EtudesContent
            etudes={etudesEnCours}
            emptyText="Aucune étude en cours pour le moment."
            renderEtudeCard={renderEtudeCard}
          />
        )}
        {activeTab === 'ARCHIVES' && (
          <EtudesArchiveesContent
            etudes={etudesArchivees}
            renderEtudeCard={renderEtudeCard}
          />
        )}
        <PaginationControls page={page} totalPages={totalPages} onChange={onPageChange} />
      </div>}
      </div>
    </div>
  );
}

export default function BEDashboard() {
  const { toastError } = useToast();
  const {
    bureau, demandes, allPropositionsPerDemande, myPropositions, etudes, notificationPreferences,
    filterByDept, availableTotal, pendingTotal, activeEtudeTotal, archivedEtudeTotal,
    availablePage, pendingPage, activeEtudePage, archivedEtudePage,
    availableTotalPages, pendingTotalPages, activeEtudeTotalPages, archivedEtudeTotalPages,
    setFilterByDept, setAvailablePage, setPendingPage, setActiveEtudePage, setArchivedEtudePage,
    isLoading, error,
  } = useBEDashboardData();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam ?? 'OUVERT');
  const contentPanelRef = useRef<HTMLDivElement | null>(null);

  // Synchronise l'onglet si le param URL change (ex : retour arrière)
  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  // Filtre par département : activé par défaut si le BE a des départements sélectionnés
  const hasDepFilter =
    notificationPreferences !== null &&
    !notificationPreferences.notifierTousDepartements &&
    notificationPreferences.departementsSuivis.length > 0;



  // Active le filtre automatiquement dès que les préférences sont chargées
  useEffect(() => {
    // Le hook initialise le filtre avant de charger la première page.
  }, [hasDepFilter]);

  const scrollToContentPanel = () => {
    contentPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleTabChange = (tab: TabType, options?: Readonly<{ scrollToContent?: boolean }>) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
    if (options?.scrollToContent) {
      scrollToContentPanel();
    }
  };

  useEffect(() => {
    if (error) toastError(error);
  }, [error, toastError]);

  const { openDemandes, filteredOpenDemandes, pendingItems, etudesEnCours, etudesArchivees } = useMemo(() => {
    return computeBEDashboardData(
      demandes,
      allPropositionsPerDemande,
      myPropositions,
      etudes,
      filterByDept,
      notificationPreferences,
    );
  }, [demandes, allPropositionsPerDemande, myPropositions, etudes, filterByDept, notificationPreferences]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  const navSections: DashboardNavSection[] = [
    {
      id: 'demandes',
      title: 'Demandes',
      defaultExpanded: true,
      items: [
        { id: 'OUVERT', label: 'Missions disponibles', count: availableTotal, icon: <Globe className="w-4 h-4" /> },
        { id: 'EN_ATTENTE', label: 'En attente', count: pendingTotal, icon: <Clock className="w-4 h-4" /> },
      ],
    },
    {
      id: 'etudes',
      title: 'Études',
      defaultExpanded: true,
      items: [
        { id: 'ETUDE_EN_COURS', label: 'Études en cours', count: activeEtudeTotal, icon: <FlaskConical className="w-4 h-4" /> },
        { id: 'ARCHIVES', label: 'Études archivées', count: archivedEtudeTotal, icon: <Archive className="w-4 h-4" /> },
      ],
    },
    {
      id: 'carte',
      title: 'Carte',
      defaultExpanded: true,
      items: [
        { id: 'CARTE', label: 'Vue carte', count: availableTotal + activeEtudeTotal, icon: <MapIcon className="w-4 h-4" /> },
      ],
    },
  ];
  const missionsCount = availableTotal;
  const sectionMeta: Record<TabType, { title: string; description: string }> = {
    OUVERT: {
      title: 'Missions disponibles',
      description: 'Repérez rapidement les nouvelles opportunités correspondant à votre zone et à votre capacité de production.',
    },
    EN_ATTENTE: {
      title: 'Propositions en attente',
      description: 'Concentrez-vous sur les devis à relancer, actualiser ou requalifier avant décision du client.',
    },
    ETUDE_EN_COURS: {
      title: 'Études en cours',
      description: 'Suivez les missions en production et priorisez les étapes qui nécessitent votre attention.',
    },
    ARCHIVES: {
      title: 'Études archivées',
      description: 'Retrouvez les études finalisées, les livrables remis et l’historique de vos missions.',
    },
    CARTE: {
      title: 'Carte interactive',
      description: 'Visualisez vos opportunités, propositions et études sur une carte centrée sur votre bureau.',
    },
  };
  const activityFeed = buildBEActivityFeed({
    openDemandesCount: missionsCount,
    pendingCount: pendingTotal,
    etudesEnCoursCount: activeEtudeTotal,
    etudesArchiveesCount: archivedEtudeTotal,
    hasDepFilter,
    onNavigate: handleTabChange,
  });
  const paginationByTab = {
    OUVERT: { page: availablePage, totalPages: availableTotalPages, onPageChange: setAvailablePage },
    EN_ATTENTE: { page: pendingPage, totalPages: pendingTotalPages, onPageChange: setPendingPage },
    ETUDE_EN_COURS: { page: activeEtudePage, totalPages: activeEtudeTotalPages, onPageChange: setActiveEtudePage },
    ARCHIVES: { page: archivedEtudePage, totalPages: archivedEtudeTotalPages, onPageChange: setArchivedEtudePage },
    CARTE: { page: availablePage, totalPages: 0, onPageChange: setAvailablePage },
  } satisfies Record<TabType, {
    readonly page: number;
    readonly totalPages: number;
    readonly onPageChange: (page: number) => Promise<void>;
  }>;
  const pagination = paginationByTab[activeTab];

  const renderDemandeCard = (demande: DemandeDevisDTO, prop?: PropositionDevisDTO) => {
    const isRefused = prop?.statut === 'REFUSEE';
    const actionLabel = getDemandeActionLabel(isRefused, Boolean(prop));
    return (
    <Card key={demande.id} className={`gc-motion-base ${prop ? 'border-slate-200' : 'border-blue-200'} hover:-translate-y-0.5 hover:shadow-md`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-0.5">
            <CardTitle className="flex items-center text-blue-600">
              {demande.adresseProjet?.ville || 'Localisation N/A'}
            </CardTitle>
            <CardDescription className="flex items-center">
              <Calendar className="w-3 h-3 mr-1"/>
              Réf. #MES-{demande.id}
            </CardDescription>
          </div>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
            {demande.type || 'Général'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        {prop && (
          <div className={`p-2 rounded border mb-3 text-[11px] ${isRefused ? 'bg-red-50/50 border-red-100' : 'bg-blue-50/50 border-blue-100'}`}>
            <div className="flex justify-between items-center mb-1">
              <span className={`font-bold uppercase tracking-wider ${isRefused ? 'text-red-600' : 'text-blue-700'}`}>
                {isRefused ? 'Offre refusée — à reproposer' : 'Votre proposition'}
              </span>
              <span className="font-bold text-slate-900 text-xs">{prop.prix} €</span>
            </div>
            <div className="text-slate-500">
              Rendu: {formatDelaiWithProjection(prop.delaiMaxRendu, prop.delaiProjectionRendu)}
            </div>
          </div>
        )}
        <p className="text-xs text-slate-600 line-clamp-2 mb-2">
          {demande.description || 'Aucune description fournie.'}
        </p>
      </CardContent>
      <CardFooter>
        <Link to={`/be/demande/${demande.id}`} className="w-full">
          <Button variant={prop ? "outline" : "primary"} size="sm" className={`w-full group ${isRefused ? 'border-red-300 text-red-700 hover:bg-red-50' : 'border-slate-300 hover:border-blue-300 hover:bg-blue-50/70'}`}>
            {actionLabel}
          </Button>
        </Link>
      </CardFooter>
    </Card>
    );
  };

  const renderEtudeCard = (etude: EtudeDetailDTO) => {
    const prop    = etude.propositionDevis;
    const demande = prop?.demandeDevis;
    const client  = demande?.client;

    return (
      <Card key={etude.id} className="gc-motion-base border-slate-200 flex flex-col hover:-translate-y-0.5 hover:shadow-md">
        <CardHeader>
          <EtudeCardHeader demande={demande} etat={etude.etat} />
        </CardHeader>
        <CardContent className="pt-2 text-xs text-slate-600 space-y-3 flex-1">
          {/* Description */}
          <p className="line-clamp-2">{demande?.description || 'Aucune description.'}</p>

          {/* Client commanditaire */}
          {client && (
            <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded border border-slate-100 text-[11px]">
              <User className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="text-slate-500 font-bold uppercase tracking-wider mr-1">Client :</span>
              <span className="font-semibold text-slate-700">
                {[client.prenom, client.nom].filter(Boolean).join(' ') || '—'}
              </span>
            </div>
          )}

          {/* Infos demande */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <p className="text-slate-400 font-bold uppercase tracking-wider">Réf. projet</p>
              <p className="font-semibold text-slate-700">{demande?.id ? `#MES-${demande.id}` : '—'}</p>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <p className="text-slate-400 font-bold uppercase tracking-wider">Délai client</p>
              <p className="font-semibold text-slate-700">{demande?.delaiMaxSouhaite == null ? '—' : `${demande.delaiMaxSouhaite} sem`}</p>
            </div>
            {Boolean(demande?.superficie) && (
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <p className="text-slate-400 font-bold uppercase tracking-wider">Superficie</p>
                <p className="font-semibold text-slate-700">{demande.superficie} m²</p>
              </div>
            )}
            {Boolean(demande?.nombreLot) && (
              <div className="p-2 bg-slate-50 rounded border border-slate-100">
                <p className="text-slate-400 font-bold uppercase tracking-wider">Lots</p>
                <p className="font-semibold text-slate-700">{demande.nombreLot}</p>
              </div>
            )}
          </div>

          {/* Proposition */}
          <div className="p-2 bg-blue-50/50 rounded border border-blue-100 text-[11px]">
            <p className="text-blue-700 font-bold uppercase tracking-wider mb-1">Votre proposition</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-700">
              <p>Montant : <span className="font-semibold">{prop?.prix == null ? '—' : `${prop.prix} €`}</span></p>
              <p>Statut : <span className="font-semibold">{prop?.statut ? (STATUT_LABELS[prop.statut] ?? prop.statut) : '—'}</span></p>
              <p>Intervention : <span className="font-semibold">{formatDelaiWithProjection(prop?.delaiMaxIntervention, prop?.delaiProjectionIntervention)}</span></p>
              <p>Rendu : <span className="font-semibold">{formatDelaiWithProjection(prop?.delaiMaxRendu, prop?.delaiProjectionRendu)}</span></p>
            </div>
          </div>

          {/* Dates étude */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <p className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/>Intervention</p>
              <p className="font-semibold text-slate-700">{formatDateShort(etude.dateIntervention)}</p>
            </div>
            <div className="p-2 bg-slate-50 rounded border border-slate-100">
              <p className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3"/>Rendu</p>
              <p className="font-semibold text-slate-700">{formatDateShort(etude.dateRendu)}</p>
            </div>
          </div>
        </CardContent>
        {Boolean(demande?.id) && (
          <CardFooter>
            <Link to={`/be/etude/${etude.id}`} className="w-full">
              <Button
                variant="outline"
                size="sm"
                className={`w-full group ${beMustAct(etude.etat) ? 'border-orange-400 text-orange-700 hover:bg-orange-50' : 'border-slate-300 hover:border-blue-300 hover:bg-blue-50/70'}`}
              >
                {beMustAct(etude.etat) && <AlertCircle className="w-3 h-3 mr-1.5 text-orange-500" />}
                Gérer l'étude <ChevronRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </CardFooter>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-800/10 bg-linear-to-r from-slate-900 via-slate-800 to-blue-700 p-5 text-white shadow-lg shadow-slate-300/60">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
              <Sparkles className="h-3.5 w-3.5" />
              Bureau d'études
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
            <p className="text-sm text-slate-200/95">
              {bureau?.raisonSociale
                ? `${bureau.raisonSociale} · pilotez vos opportunités, vos propositions et vos études depuis une vue unifiée.`
                : 'Pilotez vos opportunités, vos propositions et vos études depuis une vue unifiée.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTab !== 'OUVERT' && (
              <button
                type="button"
                onClick={() => handleTabChange('OUVERT', { scrollToContent: true })}
                className="gc-motion-fast inline-flex h-9 items-center rounded-md border border-white/30 px-3 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
              >
                Voir les missions
              </button>
            )}
            {activeTab !== 'ETUDE_EN_COURS' && (
              <button
                type="button"
                onClick={() => handleTabChange('ETUDE_EN_COURS', { scrollToContent: true })}
                className="gc-motion-fast inline-flex h-9 items-center rounded-md border border-white/55 bg-white text-slate-900 px-3 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-slate-100"
              >
                Suivre mes études
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            label="Missions visibles"
            value={missionsCount}
            icon={<Globe className="h-4 w-4" />}
            valueClassName="text-blue-700"
          />
          <DashboardMetricCard
            label="En attente"
            value={pendingTotal}
            icon={<CircleDashed className="h-4 w-4" />}
            valueClassName="text-amber-600"
          />
          <DashboardMetricCard
            label="Études en cours"
            value={activeEtudeTotal}
            icon={<FolderKanban className="h-4 w-4" />}
            valueClassName="text-cyan-700"
          />
          <DashboardMetricCard
            label="Études finalisées"
            value={archivedEtudeTotal}
            icon={<CheckCircle2 className="h-4 w-4" />}
            valueClassName="text-emerald-600"
          />
        </div>
      </div>

      <DashboardActivityFeed items={activityFeed} />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <DashboardSidebarNav
          activeItemId={activeTab}
          onItemChange={(id) => handleTabChange(id as TabType)}
          sections={navSections}
        />

        <div ref={contentPanelRef} className="gc-surface-panel min-w-0 flex-1 rounded-2xl p-4 md:p-5">
          <div className="mb-4 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Vue active
            </div>
            <h2 className="mt-2 text-base font-semibold text-slate-900">{sectionMeta[activeTab].title}</h2>
            <p className="mt-1 text-sm text-slate-500">{sectionMeta[activeTab].description}</p>
          </div>

          <BEDashboardBody
            activeTab={activeTab}
            hasDepFilter={hasDepFilter}
            filterByDept={filterByDept}
            notificationPreferences={notificationPreferences}
            openDemandes={openDemandes}
            filteredOpenDemandes={filteredOpenDemandes}
            pendingItems={pendingItems}
            etudesEnCours={etudesEnCours}
            etudesArchivees={etudesArchivees}
            demandes={demandes}
            onFilterByDeptChange={setFilterByDept}
            onShowAllMissions={() => setFilterByDept(false)}
            renderDemandeCard={renderDemandeCard}
            renderEtudeCard={renderEtudeCard}
            page={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      </div>
    </div>
  );
}
