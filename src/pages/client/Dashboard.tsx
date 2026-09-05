import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import type { ClientDashboardData } from '../../hooks/useClientDashboardData';
import { STATUT_LABELS, TYPE_LABELS } from '../../constants/labels';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DashboardEmptyState } from '../../components/ui/DashboardEmptyState';
import { MapPin, Clock, FileText, ChevronRight, FlaskConical, Building2, AlertCircle, Archive, Plus, MessageSquareHeart } from 'lucide-react';
import { clientMustAct } from '../../components/etude/EtudeStatusBadge';
import { EtudeCardHeader } from '../../components/etude/EtudeCardHeader';
import { CompactEtudeStepper } from '../../components/etude/CompactEtudeStepper';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { EtudeDetailDTO } from '../../types';
import { formatDelaiWithProjection } from '../../lib/delaiProjection';
import { BureauEtudeProfileLink } from '../../components/profil-be/BureauEtudeProfileLink';
import { formatDateLong } from '../../lib/formatters';

type TabType = 'DEMANDES' | 'ETUDES' | 'ARCHIVES';

// ─── Carte étude partagée (en cours + archives) ───────────────────────────────

interface EtudeCardProps {
  readonly etude: EtudeDetailDTO;
  /** true = onglet Archives (paiement effectué) */
  readonly archived?: boolean;
  readonly evaluationPending?: boolean;
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
          <div className="rounded border border-slate-100 bg-slate-50 p-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="mr-1 font-bold uppercase tracking-wider text-slate-500">Bureau :</span>
              <BureauEtudeProfileLink raisonSociale={bureau.raisonSociale || '—'} slug={bureau.profilPublicSlug} returnTo="/client/dashboard" />
            </div>
            {(bureau.telContact || bureau.adresse) && (
              <p className="mt-1 text-slate-600">
                {[bureau.telContact, bureau.adresse?.rue, bureau.adresse?.codePostal, bureau.adresse?.ville].filter(Boolean).join(' · ')}
              </p>
            )}
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
            <p>Intervention : <span className="font-semibold">{formatDelaiWithProjection(prop?.delaiMaxIntervention, prop?.delaiProjectionIntervention)}</span></p>
            <p>Rendu : <span className="font-semibold">{formatDelaiWithProjection(prop?.delaiMaxRendu, prop?.delaiProjectionRendu)}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded border border-slate-100 bg-slate-50 p-2">
            <p className="font-bold uppercase tracking-wider text-slate-400">Intervention prévue</p>
            <p className="font-semibold text-slate-700">{formatDateLong(etude.dateIntervention) ?? '—'}</p>
          </div>
          <div className="rounded border border-slate-100 bg-slate-50 p-2">
            <p className="font-bold uppercase tracking-wider text-slate-400">Rendu prévu</p>
            <p className="font-semibold text-slate-700">{formatDateLong(etude.dateRenduPrevue ?? etude.dateRendu) ?? '—'}</p>
          </div>
        </div>

        {!archived && <CompactEtudeStepper etat={etude.etat} />}
      </CardContent>

      {!!(etude.id) && (
        <CardFooter>
          <Link to={`/client/etude/${etude.id}${archived ? '?source=ARCHIVES' : ''}`} className="w-full">
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

function PaginationControls({ page, totalPages, onChange }: Readonly<{
  page: number;
  totalPages: number;
  onChange: (page: number) => void | Promise<void>;
}>) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-slate-200 pt-4">
      <span className="text-xs text-slate-500">Page {page + 1}/{totalPages}</span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={page === 0} onClick={() => onChange(page - 1)}>Précédent</Button>
        <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>Suivant</Button>
      </div>
    </div>
  );
}

export default function ClientDashboard() {
  const { toastError } = useToast();
  const {
    demandes, etudes, etudeIdsAEvaluer = [], isLoading, error,
    demandePage, activeEtudePage, archivedEtudePage,
    demandeTotal, activeEtudeTotal, archivedEtudeTotal,
    demandeTotalPages, activeEtudeTotalPages, archivedEtudeTotalPages,
    setDemandePage, setActiveEtudePage, setArchivedEtudePage,
  } = useOutletContext<ClientDashboardData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam ?? 'DEMANDES');

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
  const etudesArchivees = etudes.filter(e => e.etat === 'PAIEMENT_EFFECTUE');
  const etudesEnCours   = etudes.filter(e => e.etat !== 'PAIEMENT_EFFECTUE');
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
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-600 via-blue-600 to-cyan-500 p-5 text-white shadow-lg shadow-blue-200/70">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Mon espace</h1>
          </div>
          <Link to="/client/demande/new">
            <Button size="sm" className="h-9 border border-white/60 bg-white text-blue-700 hover:bg-blue-50">
              <Plus className="mr-1.5 h-4 w-4" />
              Nouvelle demande
            </Button>
          </Link>
        </div>
      </div>

      <div className="gc-surface-panel min-w-0 rounded-2xl p-4 md:p-5">
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
              <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {demandesEnCours.map(demande => {
                  const propsCount = demande.propositions?.length || 0;
                  return (
                    <Card key={demande.id} className="flex flex-col border-slate-200/90">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <CardTitle className="flex flex-wrap items-center gap-x-1">
                              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400"/>
                              {TYPE_LABELS[demande.type ?? 'G0'] ?? demande.type ?? 'Mission'} – {demande.adresseProjet?.ville || 'Ville non spécifiée'}
                            </CardTitle>
                            <CardDescription>
                              {[demande.adresseProjet?.rue, demande.adresseProjet?.codePostal, demande.adresseProjet?.ville, 'France'].filter(Boolean).join(', ')}
                            </CardDescription>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-slate-500">Réf. #MES-{demande.id}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-3">
                        <div className="flex items-center text-xs text-slate-500">
                          <Clock className="mr-1.5 h-3 w-3" />
                          Délai souhaité : {demande.delaiMaxSouhaite ? `${demande.delaiMaxSouhaite} sem` : 'Non précisé'}
                        </div>
                        <div>
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Propositions reçues ({propsCount})</p>
                          {propsCount === 0 ? (
                            <p className="rounded-lg border border-dashed border-slate-300 p-4 text-xs text-slate-500">Aucune proposition reçue.</p>
                          ) : (
                            <div className="flex gap-3 overflow-x-auto pb-2" aria-label={`Propositions pour la demande ${demande.id}`}>
                              {demande.propositions.map((proposition) => (
                                <Link
                                  key={proposition.id}
                                  to={`/client/demande/${demande.id}?proposition=${proposition.id}`}
                                  className="w-64 shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50"
                                >
                                  <p className="truncate text-sm font-semibold text-slate-800">{proposition.bureauEtude?.raisonSociale ?? 'Bureau d’études'}</p>
                                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
                                    <span>{proposition.prix == null ? 'Prix non renseigné' : `${proposition.prix} €`}</span>
                                    <span>{proposition.delaiMaxRendu == null ? 'Délai non renseigné' : `${proposition.delaiMaxRendu} sem`}</span>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
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
              <PaginationControls page={demandePage} totalPages={demandeTotalPages} onChange={setDemandePage} />
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
              <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {etudesEnCours.map((etude, index) => (
                  <React.Fragment key={etude.id ?? `etude-${index}`}>
                    <EtudeCard etude={etude} />
                  </React.Fragment>
                ))}
              </div>
              <PaginationControls page={activeEtudePage} totalPages={activeEtudeTotalPages} onChange={setActiveEtudePage} />
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
              <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
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
              <PaginationControls page={archivedEtudePage} totalPages={archivedEtudeTotalPages} onChange={setArchivedEtudePage} />
              </div>
            )
          )}
      </div>
    </div>
  );
}
