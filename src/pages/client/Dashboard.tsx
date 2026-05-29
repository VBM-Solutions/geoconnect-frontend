import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { useClientDashboardData } from '../../hooks/useClientDashboardData';
import { STATUT_LABELS } from '../../constants/labels';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DashboardTabNav } from '../../components/ui/DashboardTabNav';
import { DashboardEmptyState } from '../../components/ui/DashboardEmptyState';
import { MapPin, Calendar, Clock, FileText, ChevronRight, FlaskConical, Building2, AlertCircle, Archive } from 'lucide-react';
import { clientMustAct } from '../../components/etude/EtudeStatusBadge';
import { EtudeCardHeader } from '../../components/etude/EtudeCardHeader';
import { Link, useSearchParams } from 'react-router-dom';
import { EtudeDetailDTO } from '../../types';

type TabType = 'DEMANDES' | 'ETUDES' | 'ARCHIVES';

// ─── Carte étude partagée (en cours + archives) ───────────────────────────────

interface EtudeCardProps {
  etude: EtudeDetailDTO;
  /** true = onglet Archives (paiement effectué) */
  archived?: boolean;
}

function EtudeCard({ etude, archived = false }: EtudeCardProps) {
  const prop     = etude.propositionDevis;
  const demande  = prop?.demandeDevis;
  const bureau   = prop?.bureauEtude;

  const cardBorder = archived ? 'border-green-200 bg-green-50/30' : 'border-slate-200';
  const offreBg    = archived ? 'bg-green-50 border-green-100'    : 'bg-blue-50/60 border-blue-100';
  const offreLabel = archived ? 'text-green-700'                  : 'text-blue-700';
  const mustAct    = !archived && clientMustAct(etude.etat);

  return (
    <Card className={`flex flex-col ${cardBorder}`}>
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
            <p>Rendu : <span className="font-semibold">{prop?.delaiMaxRendu == null ? '—' : `${prop.delaiMaxRendu} sem`}</span></p>
            <p>Intervention : <span className="font-semibold">{prop?.delaiMaxIntervention == null ? '—' : `${prop.delaiMaxIntervention} sem`}</span></p>
          </div>
        </div>
      </CardContent>

      {!!(etude.id) && (
        <CardFooter>
          <Link to={`/client/etude/${etude.id}`} className="w-full">
            {archived ? (
              <Button variant="outline" size="sm" className="w-full group border-green-300 text-green-700 hover:bg-green-50">
                <Archive className="w-3 h-3 mr-1.5 text-green-500" />
                Consulter l'étude <ChevronRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className={`w-full group ${mustAct ? 'border-orange-400 text-orange-700 hover:bg-orange-50' : ''}`}
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
  const { demandes, etudes, isLoading, error } = useClientDashboardData();
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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Mon Espace</h1>
          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-bold">Géotechnique - Suivi des études</p>
        </div>
        <div className="flex space-x-3 items-center">
          <Link to="/client/demande/new">
            <Button size="sm" className="hidden sm:inline-flex bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-8 rounded px-3 text-[11px] uppercase tracking-wider font-bold">
              Nouvelle demande
            </Button>
          </Link>
          <div className="bg-slate-50 border border-slate-100 rounded px-3 py-1.5 flex items-center gap-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Études Totales</p>
              <p className="text-sm font-bold text-teal-600">{etudesTotales}</p>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En Cours</p>
              <p className="text-sm font-bold text-orange-600">{etudesEnCours.length}</p>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terminées</p>
              <p className="text-sm font-bold text-green-600">{etudesTerminees}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <DashboardTabNav
        activeTab={activeTab}
        onTabChange={(id) => handleTabChange(id as TabType)}
        tabs={[
          { id: 'DEMANDES', label: 'Mes Demandes',     count: demandesEnCours.length,  hidden: demandesEnCours.length === 0 },
          { id: 'ETUDES',   label: 'Études en cours',  count: etudesEnCours.length },
          { id: 'ARCHIVES', label: 'Études archivées', count: etudesArchivees.length,  hidden: etudesArchivees.length === 0 },
        ]}
      />

      {/* Onglet Demandes */}
      {activeTab === 'DEMANDES' && (
        demandesEnCours.length === 0 ? (
          <DashboardEmptyState
            icon={<FileText className="w-8 h-8 text-slate-400" />}
            title="Aucune demande trouvée"
            description="Vous n'avez pas encore publié de demande de devis."
            action={<Link to="/"><Button>Créer une demande</Button></Link>}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-6 gap-4">
            {demandesEnCours.map(demande => {
              const propsCount = demande.propositions?.length || 0;
              return (
                <Card key={demande.id} className="flex flex-col">
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
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase">
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
                      <Button variant="outline" size="sm" className="w-full group">
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
                <EtudeCard etude={etude} archived />
              </React.Fragment>
            ))}
          </div>
        )
      )}
    </div>
  );
}
