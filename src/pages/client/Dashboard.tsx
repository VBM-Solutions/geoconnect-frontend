import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useClientDashboardData } from '../../hooks/useClientDashboardData';
import { STATUT_LABELS } from '../../constants/labels';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DashboardSidebarNav, type DashboardNavSection } from '../../components/ui/DashboardSidebarNav';
import { DashboardEmptyState } from '../../components/ui/DashboardEmptyState';
import { DashboardMetricCard } from '../../components/ui/DashboardMetricCard';
import { DashboardActivityFeed, type DashboardActivityItem } from '../../components/ui/DashboardActivityFeed';
import { MapPin, Calendar, Clock, FileText, ChevronRight, FlaskConical, Building2, AlertCircle, Archive, Plus, Layers3, CheckCircle2, MessageSquareHeart, Sparkles } from 'lucide-react';
import { clientMustAct } from '../../components/etude/EtudeStatusBadge';
import { EtudeCardHeader } from '../../components/etude/EtudeCardHeader';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { EtudeDetailDTO } from '../../types';
import { formatDelaiWithProjection } from '../../lib/delaiProjection';

type TabType = 'DEMANDES' | 'ETUDES' | 'ARCHIVES';

// ─── Carte étude partagée (en cours + archives) ───────────────────────────────

interface EtudeCardProps {
  readonly etude: EtudeDetailDTO;
  /** true = onglet Archives (paiement effectué) */
  readonly archived?: boolean;
  readonly evaluationPending?: boolean;
}

function buildActivityFeed(
  demandesEnCours: Array<{ propositions?: Array<{ statut?: string }> }>,
  etudesEnCours: EtudeDetailDTO[],
  etudesArchivees: EtudeDetailDTO[],
  etudeIdsAEvaluer: number[],
  onNavigate: (tab: TabType) => void,
  onOpenEvaluation: (etudeId: number) => void,
): DashboardActivityItem[] {
  const demandesAvecPropositions = demandesEnCours.filter((demande) => (demande.propositions?.length ?? 0) > 0).length;
  const etudesAvecAction = etudesEnCours.filter((etude) => clientMustAct(etude.etat)).length;

  const feed: DashboardActivityItem[] = [];

  if (demandesAvecPropositions > 0) {
    feed.push({
      id: 'propositions',
      title: 'De nouvelles offres sont arrivées',
      description: `${demandesAvecPropositions} demande${demandesAvecPropositions > 1 ? 's ont' : ' a'} déjà reçu une ou plusieurs propositions à comparer.`,
      icon: <FileText className="h-4 w-4" />,
      toneClassName: 'bg-blue-50 text-blue-700 border-blue-200',
      actionLabel: 'Voir les demandes',
      onAction: () => onNavigate('DEMANDES'),
    });
  }

  if (etudesAvecAction > 0) {
    feed.push({
      id: 'actions',
      title: 'Une action de votre part est attendue',
      description: `${etudesAvecAction} étude${etudesAvecAction > 1 ? 's nécessitent' : ' nécessite'} votre validation ou votre suivi.`,
      icon: <AlertCircle className="h-4 w-4" />,
      toneClassName: 'bg-amber-50 text-amber-700 border-amber-200',
      actionLabel: 'Reprendre le suivi',
      onAction: () => onNavigate('ETUDES'),
    });
  }

  if (etudesEnCours.length > 0) {
    feed.push({
      id: 'progression',
      title: 'Vos études avancent',
      description: `${etudesEnCours.length} étude${etudesEnCours.length > 1 ? 's sont' : ' est'} actuellement en cours avec un bureau d études.`,
      icon: <FlaskConical className="h-4 w-4" />,
      toneClassName: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      actionLabel: 'Voir la progression',
      onAction: () => onNavigate('ETUDES'),
    });
  }

  if (etudeIdsAEvaluer.length > 0) {
    feed.push({
      id: 'evaluations',
      title: 'Votre avis compte',
      description: `${etudeIdsAEvaluer.length} étude${etudeIdsAEvaluer.length > 1 ? 's peuvent' : ' peut'} encore être évaluée${etudeIdsAEvaluer.length > 1 ? 's' : ''}. Cette étape reste facultative.`,
      icon: <MessageSquareHeart className="h-4 w-4" />,
      toneClassName: 'bg-violet-50 text-violet-700 border-violet-200',
      actionLabel: 'Donner mon avis',
      onAction: () => onOpenEvaluation(etudeIdsAEvaluer[0]),
    });
  }

  if (etudesArchivees.length > 0) {
    feed.push({
      id: 'archives',
      title: 'Des livrables sont disponibles',
      description: `${etudesArchivees.length} étude${etudesArchivees.length > 1 ? 's archivées sont' : ' archivée est'} accessible${etudesArchivees.length > 1 ? 's' : ''} à tout moment.`,
      icon: <Archive className="h-4 w-4" />,
      toneClassName: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      actionLabel: 'Consulter les archives',
      onAction: () => onNavigate('ARCHIVES'),
    });
  }

  if (feed.length === 0) {
    feed.push({
      id: 'welcome',
      title: 'Votre espace est prêt',
      description: 'Commencez par créer une première demande pour recevoir des propositions adaptées à votre projet.',
      icon: <Sparkles className="h-4 w-4" />,
      toneClassName: 'bg-violet-50 text-violet-700 border-violet-200',
      actionLabel: 'Voir mes demandes',
      onAction: () => onNavigate('DEMANDES'),
    });
  }

  return feed.slice(0, 5);
}

function EtudeCard(props: Readonly<EtudeCardProps>) {
  const { etude, archived = false, evaluationPending = false } = props;
  const prop     = etude.propositionDevis;
  const demande  = prop?.demandeDevis;
  const bureau   = prop?.bureauEtude;

  const cardBorder = archived ? 'border-green-200 bg-green-50/30' : 'border-slate-200';
  const offreBg    = archived ? 'bg-green-50 border-green-100'    : 'bg-blue-50/60 border-blue-100';
  const offreLabel = archived ? 'text-green-700'                  : 'text-blue-700';
  const mustAct    = !archived && clientMustAct(etude.etat);

  return (
    <Card className={`gc-motion-base flex flex-col transition-all hover:-translate-y-0.5 hover:shadow-md ${cardBorder}`}>
      <CardHeader>
        <EtudeCardHeader demande={demande} etat={etude.etat} />
      </CardHeader>

      <CardContent className="pt-2 space-y-3 flex-1">
        <p className="text-xs text-slate-600 line-clamp-2">{demande?.description || 'Aucune description.'}</p>

        {bureau && (
          <div className="flex items-center gap-1.5 p-2 bg-slate-50 rounded border border-slate-100 text-[11px]">
            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-slate-500 font-bold uppercase tracking-wider mr-1">Bureau :</span>
            <span className="font-semibold text-slate-700">{bureau.raisonSociale || '—'}</span>
          </div>
        )}

        {evaluationPending && (
          <div className="flex items-center gap-2 rounded border border-violet-200 bg-violet-50 p-2 text-[11px] font-semibold text-violet-700">
            <MessageSquareHeart className="h-3.5 w-3.5 shrink-0" />
            Votre avis facultatif est attendu
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2 bg-slate-50 rounded border border-slate-100">
            <p className="text-slate-400 font-bold uppercase tracking-wider">Réf. projet</p>
            <p className="text-slate-700 font-semibold">{demande?.id ? `#MES-${demande.id}` : '—'}</p>
          </div>
          <div className="p-2 bg-slate-50 rounded border border-slate-100">
            <p className="text-slate-400 font-bold uppercase tracking-wider">Délai souhaité</p>
            <p className="text-slate-700 font-semibold">{demande?.delaiMaxSouhaite == null ? '—' : `${demande.delaiMaxSouhaite} sem`}</p>
          </div>
        </div>

        <div className={`p-2 rounded border text-[11px] ${offreBg}`}>
          <p className={`font-bold uppercase tracking-wider mb-1 ${offreLabel}`}>Offre retenue</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-700">
            <p>Montant : <span className="font-semibold">{prop?.prix == null ? '—' : `${prop.prix} €`}</span></p>
            <p>Statut : <span className="font-semibold">{prop?.statut ? (STATUT_LABELS[prop.statut] ?? prop.statut) : '—'}</span></p>
            <p>Rendu : <span className="font-semibold">{formatDelaiWithProjection(prop?.delaiMaxRendu, prop?.delaiProjectionRendu)}</span></p>
            <p>Intervention : <span className="font-semibold">{formatDelaiWithProjection(prop?.delaiMaxIntervention, prop?.delaiProjectionIntervention)}</span></p>
          </div>
        </div>
      </CardContent>

      {!!(etude.id) && (
        <CardFooter>
          <Link to={`/client/etude/${etude.id}`} className="w-full">
            {archived ? (
              <Button variant="outline" size="sm" className="w-full group border-green-300 text-green-700 hover:border-green-400 hover:bg-green-50">
                {evaluationPending ? (
                  <MessageSquareHeart className="w-3 h-3 mr-1.5 text-violet-500" />
                ) : (
                  <Archive className="w-3 h-3 mr-1.5 text-green-500" />
                )}
                {evaluationPending ? 'Consulter et noter' : "Consulter l'étude"}
                <ChevronRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className={`w-full group ${mustAct ? 'border-orange-400 text-orange-700 hover:bg-orange-50' : 'border-slate-300 hover:border-blue-300 hover:bg-blue-50/70'}`}
              >
                {mustAct && <AlertCircle className="w-3 h-3 mr-1.5 text-orange-500" />}
                Suivre l'étude <ChevronRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            )}
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}

// ─── Dashboard client ─────────────────────────────────────────────────────────

export default function ClientDashboard() {
  const { toastError } = useToast();
  const { demandes, etudes, etudeIdsAEvaluer = [], isLoading, error } = useClientDashboardData();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam ?? 'DEMANDES');
  const contentPanelRef = useRef<HTMLDivElement | null>(null);

  // Synchronise l'onglet si le param URL change (ex : retour arrière)
  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  useEffect(() => {
    if (error) toastError(error);
  }, [error, toastError]);

  // Si aucun onglet dans l'URL et des études existent → afficher ETUDES par défaut
  useEffect(() => {
    if (!isLoading && etudes.length > 0 && !tabParam) {
      setActiveTab('ETUDES');
      setSearchParams({ tab: 'ETUDES' }, { replace: true });
    }
  }, [isLoading, etudes.length, tabParam]);

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-200 animate-pulse rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  const demandesEnCours = demandes.filter(d => !d.propositions?.some(p => p.statut === 'ACCEPTEE'));
  const etudesTotales   = etudes.length;
  const etudesArchivees = etudes.filter(e => e.etat === 'PAIEMENT_EFFECTUE');
  const etudesEnCours   = etudes.filter(e => e.etat !== 'PAIEMENT_EFFECTUE');
  const etudesTerminees = etudes.filter(e => e.etat === 'RAPPORT_TERMINE' || e.etat === 'PAIEMENT_EFFECTUE').length;
  const navSections: DashboardNavSection[] = [
    {
      id: 'pilotage',
      title: 'Pilotage',
      defaultExpanded: true,
      items: [
        { id: 'DEMANDES', label: 'Mes demandes', count: demandesEnCours.length, icon: <FileText className="w-4 h-4" />, hidden: demandesEnCours.length === 0 },
        { id: 'ETUDES', label: 'Études en cours', count: etudesEnCours.length, icon: <FlaskConical className="w-4 h-4" /> },
        { id: 'ARCHIVES', label: 'Études archivées', count: etudesArchivees.length, icon: <Archive className="w-4 h-4" />, hidden: etudesArchivees.length === 0 },
      ],
    },
  ];
  const sectionMeta: Record<TabType, { title: string; description: string }> = {
    DEMANDES: {
      title: 'Demandes de devis',
      description: 'Suivez vos projets en attente de validation et comparez rapidement les propositions.',
    },
    ETUDES: {
      title: 'Études en cours',
      description: 'Visualisez les étapes actives et les prochaines actions de votre bureau d études.',
    },
    ARCHIVES: {
      title: 'Études archivées',
      description: 'Retrouvez l historique des missions finalisées et payées.',
    },
  };
  const activityFeed = buildActivityFeed(
    demandesEnCours,
    etudesEnCours,
    etudesArchivees,
    etudeIdsAEvaluer,
    handleTabChange,
    etudeId => navigate(`/client/etude/${etudeId}`),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-600 via-blue-600 to-cyan-500 p-5 text-white shadow-lg shadow-blue-200/70">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
              <Sparkles className="h-3.5 w-3.5" />
              Tableau de bord client
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Mon espace projet</h1>
            <p className="text-sm text-blue-50/95">Pilotez vos demandes, suivez vos études et gardez un oeil sur vos livrables en temps réel.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/client/demande/new">
              <Button size="sm" className="h-9 border border-white/60 bg-white text-blue-700 hover:bg-blue-50">
                <Plus className="mr-1.5 h-4 w-4" />
                Nouvelle demande
              </Button>
            </Link>
            {activeTab !== 'ETUDES' && (
              <button
                type="button"
                onClick={() => handleTabChange('ETUDES', { scrollToContent: true })}
                className="inline-flex h-9 items-center rounded-md border border-white/40 px-3 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
              >
                Voir mes études
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            label="Études totales"
            value={etudesTotales}
            icon={<Layers3 className="h-4 w-4" />}
            valueClassName="text-cyan-700"
          />
          <DashboardMetricCard
            label="Études en cours"
            value={etudesEnCours.length}
            icon={<FlaskConical className="h-4 w-4" />}
            valueClassName="text-orange-600"
          />
          <DashboardMetricCard
            label="Études terminées"
            value={etudesTerminees}
            icon={<CheckCircle2 className="h-4 w-4" />}
            valueClassName="text-green-600"
          />
          <DashboardMetricCard
            label="Demandes ouvertes"
            value={demandesEnCours.length}
            icon={<FileText className="h-4 w-4" />}
            valueClassName="text-blue-700"
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
            <h2 className="text-base font-semibold text-slate-900">{sectionMeta[activeTab].title}</h2>
            <p className="mt-1 text-sm text-slate-500">{sectionMeta[activeTab].description}</p>
          </div>

          {/* Onglet Demandes */}
          {activeTab === 'DEMANDES' && (
            demandesEnCours.length === 0 ? (
              <DashboardEmptyState
                icon={<FileText className="w-8 h-8 text-slate-400" />}
                title="Aucune demande trouvée"
                description="Vous n'avez pas encore publié de demande de devis. Utilisez le bouton « Nouvelle demande » en haut de page pour en créer une."
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6 gap-4">
                {demandesEnCours.map(demande => {
                  const propsCount = demande.propositions?.length || 0;
                  return (
                    <Card key={demande.id} className="flex flex-col border-slate-200/90 transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <CardTitle className="flex items-center">
                              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400"/>
                              {demande.adresseProjet?.ville || 'Ville non spécifiée'}
                              <span className="text-slate-400 font-normal ml-2 text-xs">({demande.adresseProjet?.codePostal || ''})</span>
                            </CardTitle>
                            <CardDescription className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1"/>
                              Réf. #MES-{demande.id}
                            </CardDescription>
                          </div>
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-700">
                            {demande.type || 'Projet'}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                          {demande.description || 'Projet de construction/rénovation sans description détaillée.'}
                        </p>
                        <div className="flex items-center text-xs text-slate-500 mb-2">
                          <Clock className="w-3 h-3 mr-1.5" />
                          Délai max: {demande.delaiMaxSouhaite ? `${demande.delaiMaxSouhaite} sem` : 'Non précisé'}
                        </div>
                        <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 mt-3">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Propositions reçues</span>
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-600 text-white text-[10px] font-bold">{propsCount}</span>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Link to={`/client/demande/${demande.id}`} className="w-full">
                          <Button variant="outline" size="sm" className="w-full group border-slate-300 hover:border-blue-300 hover:bg-blue-50/70">
                            Voir les détails <ChevronRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )
          )}

          {/* Onglet Études en cours */}
          {activeTab === 'ETUDES' && (
            etudesEnCours.length === 0 ? (
              <DashboardEmptyState
                icon={<FlaskConical className="w-8 h-8 text-slate-400" />}
                title="Aucune étude en cours"
                description="Acceptez une proposition de devis pour démarrer une étude."
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6 gap-4">
                {etudesEnCours.map((etude, index) => (
                  <React.Fragment key={etude.id ?? `etude-${index}`}>
                    <EtudeCard etude={etude} />
                  </React.Fragment>
                ))}
              </div>
            )
          )}

          {/* Onglet Études archivées */}
          {activeTab === 'ARCHIVES' && (
            etudesArchivees.length === 0 ? (
              <DashboardEmptyState
                icon={<Archive className="w-8 h-8 text-slate-400" />}
                title="Aucune étude archivée"
                description="Les études dont le paiement a été effectué apparaîtront ici."
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6 gap-4">
                {etudesArchivees.map((etude, index) => (
                  <React.Fragment key={etude.id ?? `archive-${index}`}>
                    <EtudeCard
                      etude={etude}
                      archived
                      evaluationPending={etude.id != null && etudeIdsAEvaluer.includes(etude.id)}
                    />
                  </React.Fragment>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
