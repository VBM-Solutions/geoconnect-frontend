import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getDemandeDetail, updateDemandeDevis } from '../../api/demandeDevis';
import { accepterPropositionDevis, refuserPropositionDevis } from '../../api/propositionDevis';
import { DemandeDevisDTO, PropositionDevisDTO } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { MapPin, Clock, FileText } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { buildDemandeDocuments } from '../../lib/formatters';
import { DocumentList } from '../../components/etude/DocumentList';
import { DetailPageShell } from '../../components/ui/DetailPageShell';
import { ProposalCarousel } from '../../components/client/ProposalCarousel';
import { TYPE_LABELS } from '../../constants/labels';
import { uploadDocuments } from '../../api/document';

export default function ClientRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedPropositionId = Number(searchParams.get('proposition')) || null;
  const { toastError, toastSuccess } = useToast();
  const [demande, setDemande] = useState<DemandeDevisDTO | null>(null);
  const [propositions, setPropositions] = useState<PropositionDevisDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [confirmAcceptId, setConfirmAcceptId] = useState<number | null>(null);
  const [confirmRefuseId, setConfirmRefuseId] = useState<number | null>(null);
  const [isAttachingDocuments, setIsAttachingDocuments] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const detail = await getDemandeDetail(Number(id));
        setDemande(detail.demande);
        setPropositions(detail.propositions ?? []);
      } catch (err: any) {
        if (err?.response?.status === 403) {
          navigate('/client/dashboard', { replace: true });
          return;
        }
        toastError(err?.response?.data?.message ?? err?.message ?? 'Impossible de charger la demande.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleAccept = async (propId: number) => {
    setIsProcessing(propId);
    try {
      await accepterPropositionDevis(propId);
      setPropositions(props => props.map(p =>
        p.id === propId ? { ...p, statut: 'ACCEPTEE' as const } : { ...p, statut: 'REFUSEE' as const }
      ));
      toastSuccess('Proposition acceptée. L\'étude va démarrer.');
    } catch (err: any) {
      toastError(err?.response?.data?.message ?? err?.message ?? "Erreur lors de l'acceptation.");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleRefuse = async (propId: number) => {
    setIsProcessing(propId);
    try {
      await refuserPropositionDevis(propId);
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

  const handleAttachDocuments = async (files: FileList | null) => {
    if (!demande || !files?.length) return;
    setIsAttachingDocuments(true);
    try {
      const uploadedIds = await uploadDocuments(Array.from(files));
      await updateDemandeDevis({
        ...demande,
        docsDevisIds: [...(demande.docsDevisIds ?? []), ...uploadedIds],
      });
      const refreshed = await getDemandeDetail(demande.id!);
      setDemande(refreshed.demande);
      toastSuccess('Documents ajoutés à la demande.');
    } catch (err: any) {
      toastError(err?.response?.data?.message ?? err?.message ?? 'Impossible d’ajouter les documents.');
    } finally {
      setIsAttachingDocuments(false);
    }
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

  const demandeDocuments = buildDemandeDocuments(demande);
  return (
    <DetailPageShell
      tone="client"
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

      <div className="flex min-w-0 flex-col gap-4 md:flex-row">
        
        {/* Colonne Demande */}
        <div className="w-full md:w-[320px] space-y-4">
          <Card className="bg-slate-50 border-slate-200">
            <CardHeader className="pb-2 border-b border-slate-200">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center">
                <FileText className="w-3 h-3 mr-1.5" /> Fiche Projet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs pt-4">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Localisation</span>
                <span className="font-semibold text-slate-800 flex items-center">
                  <MapPin className="w-3 h-3 mr-1 text-slate-400"/>
                  {demande.adresseProjet?.ville} ({demande.adresseProjet?.codePostal})
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</span>
                  <span className="font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-sm text-[10px]">
                    {demande.type || 'Standard'}
                  </span>
                </div>
                {demande.delaiMaxSouhaite && (
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Délai Max Souhaité</span>
                    <span className="font-semibold text-slate-800">
                      {demande.delaiMaxSouhaite} sem
                    </span>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Surface</span>
                  <span className="font-semibold text-slate-800">{demande.superficie == null ? 'Non précisée' : `${demande.superficie} m²`}</span>
                </div>
                <div>
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Nombre de lots</span>
                  <span className="font-semibold text-slate-800">{demande.nombreLot ?? 'Non précisé'}</span>
                </div>
              </div>
              <div>
                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Références cadastrales</span>
                <span className="font-semibold text-slate-800">
                  {demande.referencesCadastrales?.length ? demande.referencesCadastrales.join(', ') : demande.referenceCadastrale || 'Non précisées'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</span>
                <p className="text-slate-600 bg-white p-2.5 rounded border border-slate-200 shadow-sm whitespace-pre-wrap leading-relaxed">
                  {demande.description || '...'}
                </p>
              </div>
              <DocumentList documents={demandeDocuments} allowDownload={false} />
              <label className="inline-flex cursor-pointer items-center rounded border border-blue-200 bg-blue-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-blue-700 hover:bg-blue-100">
                {isAttachingDocuments ? 'Ajout en cours…' : 'Attacher des documents'}
                <input
                  type="file"
                  multiple
                  className="sr-only"
                  disabled={isAttachingDocuments}
                  onChange={event => handleAttachDocuments(event.target.files)}
                />
              </label>
            </CardContent>
          </Card>
        </div>

        {/* Colonne Propositions */}
        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="font-bold text-slate-800 text-sm">Offres Reçues ({propositions.length})</h2>
            </div>
            
            {propositions.length === 0 ? (
              <div className="text-center p-12 bg-white">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-medium">En attente des retours géotechniques.</p>
              </div>
            ) : (
              <div className="p-4">
                <ProposalCarousel
                  proposals={propositions}
                  initialProposalId={selectedPropositionId}
                  returnTo={`/client/demande/${id}`}
                  processingId={isProcessing}
                  onAccept={setConfirmAcceptId}
                  onRefuse={setConfirmRefuseId}
                />
              </div>
            )}
          </div>
        </div>
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
        <ConfirmModal
          title="Refuser cette proposition ?"
          message="Êtes-vous sûr de vouloir refuser cette offre ? Cette action est irréversible."
          confirmLabel="Refuser l'offre"
          cancelLabel="Annuler"
          isLoading={isProcessing === confirmRefuseId}
          onConfirm={async () => {
            const id = confirmRefuseId;
            setConfirmRefuseId(null);
            await handleRefuse(id);
          }}
          onCancel={() => setConfirmRefuseId(null)}
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
