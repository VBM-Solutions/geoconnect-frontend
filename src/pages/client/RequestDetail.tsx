import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { enrichirDemande, getDemandeDetail } from '../../api/demandeDevis';
import { accepterPropositionDevis, MotifRefusProposition, refuserPropositionDevis } from '../../api/propositionDevis';
import { DemandeDevisDTO, EnrichissementDemandeDTO, PropositionDevisDTO } from '../../types';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Check, ChevronDown, ClipboardList, Clock, FileText, FolderOpen } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { DetailPageShell } from '../../components/ui/DetailPageShell';
import { ProposalCarousel } from '../../components/client/ProposalCarousel';
import { ProposalComparisonTable } from '../../components/client/ProposalComparisonTable';
import { ProposalRefusalModal } from '../../components/client/ProposalRefusalModal';
import { getDefaultProposalSort, ProposalSort, sortProposals } from '../../lib/proposalComparison';
import { TYPE_LABELS } from '../../constants/labels';
import { DemandeInformationEditor } from '../../components/demande/DemandeInformationEditor';
import { DemandeDocumentSlots } from '../../components/demande/DemandeDocumentSlots';
import { cn } from '../../lib/utils';
import { DetailSectionPanel } from '../../components/ui/DetailSectionPanel';
import { groupCurrentProposals } from '../../lib/proposalHistory';

type RequestSection = 'offres' | 'description' | 'documents';

const PROPOSAL_SORT_OPTIONS: Array<{ value: ProposalSort; label: string }> = [
  { value: 'RECENT', label: 'Réception la plus récente' },
  { value: 'PRIX_ASC', label: 'Prix croissant' },
  { value: 'INTERVENTION_ASC', label: 'Intervention la plus rapide' },
  { value: 'RENDU_ASC', label: 'Rapport le plus rapide' },
  { value: 'NOTE_DESC', label: 'Meilleure note' },
];

function ProposalSortSelect({ value, onChange }: Readonly<{ value: ProposalSort; onChange: (value: ProposalSort) => void }>) {
  const [open, setOpen] = useState(false);
  const selected = PROPOSAL_SORT_OPTIONS.find(option => option.value === value) ?? PROPOSAL_SORT_OPTIONS[0];
  return (
    <div className="relative">
      <button type="button" role="combobox" aria-label="Trier les offres" aria-expanded={open} aria-controls="proposal-sort-options"
        onClick={() => setOpen(current => !current)}
        className="inline-flex h-10 min-w-60 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30">
        <span>{selected.label}</span>
        <ChevronDown aria-hidden="true" className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div id="proposal-sort-options" role="listbox" aria-label="Tri des offres"
        className="absolute right-0 z-20 mt-2 min-w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
        {PROPOSAL_SORT_OPTIONS.map(option => <button key={option.value} type="button" role="option" aria-selected={option.value === value}
          onClick={() => { onChange(option.value); setOpen(false); }}
          className={`flex w-full items-center justify-between gap-4 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition-colors ${option.value === value ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
          {option.label}{option.value === value && <Check aria-hidden="true" className="h-4 w-4" />}
        </button>)}
      </div>}
    </div>
  );
}

export default function ClientRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedPropositionId = Number(searchParams.get('proposition')) || null;
  const requestedSort = searchParams.get('tri') as ProposalSort | null;
  const allowedSorts: ProposalSort[] = ['RECENT', 'PRIX_ASC', 'INTERVENTION_ASC', 'RENDU_ASC', 'NOTE_DESC'];
  const proposalSort = requestedSort && allowedSorts.includes(requestedSort) ? requestedSort : getDefaultProposalSort();
  const sectionParam = searchParams.get('section');
  const activeSection: RequestSection = sectionParam === 'description' || sectionParam === 'documents' ? sectionParam : 'offres';
  const { toastError, toastSuccess } = useToast();
  const [demande, setDemande] = useState<DemandeDevisDTO | null>(null);
  const [propositions, setPropositions] = useState<PropositionDevisDTO[]>([]);
  const proposalGroups = groupCurrentProposals(propositions);
  const visiblePropositions = proposalGroups.map(group => group.current);
  const refusedHistoryByProposalId = new Map(proposalGroups.flatMap(group => group.current.id == null ? [] : [[group.current.id, group.refusedHistory] as const]));
  const comparisonMode = visiblePropositions.length > 1 && searchParams.get('vue') !== 'devis';
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [confirmAcceptId, setConfirmAcceptId] = useState<number | null>(null);
  const [confirmRefuseId, setConfirmRefuseId] = useState<number | null>(null);
  const [acceptedEtudeId, setAcceptedEtudeId] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const detail = await getDemandeDetail(Number(id));
        setDemande(detail.demande);
        setPropositions(detail.propositions ?? []);
      } catch (err: any) {
        if (err?.response?.status === 403) {
          void navigate('/client/dashboard', { replace: true });
          return;
        }
        toastError(err?.response?.data?.message ?? err?.message ?? 'Impossible de charger la demande.');
      } finally {
        setIsLoading(false);
      }
    }
    void fetchData();
  }, [id]);

  const handleAccept = async (propId: number) => {
    setIsProcessing(propId);
    try {
      const { etudeId } = await accepterPropositionDevis(propId);
      setPropositions(props => props.map(p =>
        p.id === propId ? { ...p, statut: 'ACCEPTEE' as const } : { ...p, statut: 'REFUSEE' as const }
      ));
      if (etudeId != null) setAcceptedEtudeId(etudeId);
    } catch (err: any) {
      toastError(err?.response?.data?.message ?? err?.message ?? "Erreur lors de l'acceptation.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRefuse = async (propId: number, motif: MotifRefusProposition, commentaire?: string) => {
    setIsProcessing(propId);
    try {
      await refuserPropositionDevis(propId, motif, commentaire);
      setPropositions(props => props.map(p =>
        p.id === propId ? { ...p, statut: 'REFUSEE' as const } : p
      ));
      toastSuccess('Proposition refusée.');
    } catch (err: any) {
      toastError(err?.response?.data?.message ?? err?.message ?? 'Erreur lors du refus.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleEnrichment = async (payload: EnrichissementDemandeDTO) => {
    if (demande?.id == null) return;
    try {
      const updated = await enrichirDemande(demande.id, payload);
      setDemande(updated);
      toastSuccess('Les informations de la demande ont été mises à jour.');
    } catch (err: any) {
      toastError(err?.response?.data?.message ?? err?.message ?? 'Impossible de mettre à jour la demande.');
      throw err;
    }
  };

  const selectSection = (section: RequestSection) => {
    setSearchParams(current => {
      const next = new URLSearchParams(current);
      if (section === 'offres') next.delete('section');
      else next.set('section', section);
      return next;
    }, { replace: true });
  };

  const updateProposalParams = (changes: Record<string, string | null>) => {
    setSearchParams(current => {
      const next = new URLSearchParams(current);
      Object.entries(changes).forEach(([key, value]) => value == null ? next.delete(key) : next.set(key, value));
      return next;
    }, { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!demande) {
    return <div>Contenu indisponible.</div>;
  }

  return (
    <DetailPageShell
      tone="client"
      unframedContent
      backTo="/client/dashboard?tab=DEMANDES"
      backLabel="Retour aux demandes"
      eyebrow={`Demande #MES-${demande.id}`}
      title={buildRequestTitle(demande)}
      description={(
        <span>
          {[demande.adresseProjet?.rue, demande.adresseProjet?.codePostal, demande.adresseProjet?.ville, 'France'].filter(Boolean).join(', ')} · Réf. #MES-{demande.id}
        </span>
      )}
    >

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[230px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-4 xl:self-start">
          <nav className="flex gap-2 overflow-x-auto pb-1 xl:flex-col xl:overflow-visible xl:pb-0">
            {([
              { id: 'offres' as const, label: 'Offres reçues', icon: ClipboardList },
              { id: 'description' as const, label: 'Description', icon: FileText },
              { id: 'documents' as const, label: 'Documents', icon: FolderOpen },
            ]).map(section => {
              const Icon = section.icon;
              return <button key={section.id} type="button" onClick={() => selectSection(section.id)} className={cn('flex min-h-10 shrink-0 items-center gap-2 rounded-md border px-3 text-left text-xs font-semibold transition-colors xl:w-full', activeSection === section.id ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-transparent bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50')}><Icon className="h-4 w-4" />{section.label}</button>;
            })}
          </nav>
        </aside>
        <main className="min-w-0">
          {activeSection === 'offres' && (
          <DetailSectionPanel title={`Offres Reçues (${visiblePropositions.length})`}>
            {visiblePropositions.length === 0 ? (
              <div className="bg-white p-8 text-center">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-medium">En attente des retours géotechniques.</p>
              </div>
            ) : <div className="space-y-4">
              {visiblePropositions.length > 1 && <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="flex rounded-lg border border-slate-200 p-1" aria-label="Mode d’affichage des offres">
                  <button type="button" className={cn('rounded-md px-3 py-2 text-xs font-semibold', comparisonMode ? 'bg-blue-600 text-white' : 'text-slate-600')} onClick={() => updateProposalParams({ vue: null })}>Comparer</button>
                  <button type="button" className={cn('rounded-md px-3 py-2 text-xs font-semibold', !comparisonMode ? 'bg-blue-600 text-white' : 'text-slate-600')} onClick={() => updateProposalParams({ vue: 'devis' })}>Voir le devis</button>
                </div>
                {comparisonMode && <div className="flex items-center gap-2 text-xs font-semibold text-slate-600"><span>Trier par</span><ProposalSortSelect value={proposalSort} onChange={sort => updateProposalParams({ tri: sort })} /></div>}
              </div>}
              {comparisonMode ? <ProposalComparisonTable
                proposals={sortProposals(visiblePropositions, proposalSort)} returnTo={`/client/demande/${id}`} processingId={isProcessing}
                onPreview={proposalId => updateProposalParams({ vue: 'devis', proposition: String(proposalId) })}
                onAccept={setConfirmAcceptId} onRefuse={setConfirmRefuseId}
                onSort={sort => updateProposalParams({ tri: sort })}
              /> : (
              <ProposalCarousel
                proposals={visiblePropositions}
                refusedHistoryByProposalId={refusedHistoryByProposalId}
                initialProposalId={selectedPropositionId}
                returnTo={`/client/demande/${id}`}
                processingId={isProcessing}
                onAccept={setConfirmAcceptId}
                onRefuse={setConfirmRefuseId}
              />
              )}
            </div>}
          </DetailSectionPanel>
          )}
          {activeSection === 'description' && <DetailSectionPanel title="Description de la demande"><DemandeInformationEditor demande={demande} editable onSave={handleEnrichment} /></DetailSectionPanel>}
          {activeSection === 'documents' && <DetailSectionPanel title="Documents du projet"><DemandeDocumentSlots demande={demande} editable onSave={handleEnrichment} /></DetailSectionPanel>}
        </main>
      </div>

      {confirmAcceptId !== null && (
        <ConfirmModal
          title="Accepter cette proposition ?"
          message="En confirmant, vous acceptez cette offre et les autres propositions seront automatiquement refusées. Cette action est irréversible."
          confirmLabel="Accepter l'offre"
          isLoading={isProcessing === confirmAcceptId}
          onConfirm={async () => {
            const id = confirmAcceptId;
            setConfirmAcceptId(null);
            await handleAccept(id);
          }}
          onCancel={() => setConfirmAcceptId(null)}
        />
      )}

      {confirmRefuseId !== null && (
        <ProposalRefusalModal
          isLoading={isProcessing === confirmRefuseId}
          onConfirm={async (motif, commentaire) => {
            const id = confirmRefuseId;
            setConfirmRefuseId(null);
            await handleRefuse(id, motif, commentaire);
          }}
          onCancel={() => setConfirmRefuseId(null)}
        />
      )}
      {acceptedEtudeId !== null && (
        <ConfirmModal
          title="Votre proposition est acceptée"
          message="Pour permettre au bureau d’études de poursuivre votre dossier, vous devez signer le devis puis téléverser le PDF signé dans l’étude."
          confirmLabel="Accéder à l’étude"
          cancelLabel="Fermer"
          dismissible={false}
          onConfirm={() => navigate(`/client/etude/${acceptedEtudeId}`)}
          onCancel={() => setAcceptedEtudeId(null)}
        />
      )}
    </DetailPageShell>
  );
}

function buildRequestTitle(demande: DemandeDevisDTO): string {
  const type = demande.type ? (TYPE_LABELS[demande.type] ?? demande.type) : 'Étude';
  const ville = demande.adresseProjet?.ville || 'Ville non spécifiée';
  const codePostal = demande.adresseProjet?.codePostal;
  return [type, ville, codePostal].filter(Boolean).join(' – ');
}
