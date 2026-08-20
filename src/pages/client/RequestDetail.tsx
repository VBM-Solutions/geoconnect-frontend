import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getDemandeDetail } from '../../api/demandeDevis';
import { accepterPropositionDevis, refuserPropositionDevis } from '../../api/propositionDevis';
import { DemandeDevisDTO, PropositionDevisDTO } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { MapPin, Clock, Building2, CheckCircle2, FileText } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { buildDemandeDocuments } from '../../lib/formatters';
import { DocumentList } from '../../components/etude/DocumentList';
import { formatDelaiWithProjection } from '../../lib/delaiProjection';
import { DetailPageShell } from '../../components/ui/DetailPageShell';
import { BureauEtudeProfileLink } from '../../components/profil-be/BureauEtudeProfileLink';

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

  const acceptedProp = propositions.find(p => p.statut === 'ACCEPTEE');
  const demandeDocuments = buildDemandeDocuments(demande);

  return (
    <DetailPageShell
      tone="client"
      backTo="/client/dashboard?tab=DEMANDES"
      backLabel="Retour aux demandes"
      eyebrow={`Demande #MES-${demande.id}`}
      title={demande.adresseProjet?.ville || 'Projet géotechnique'}
      description={(
        <span>
          {demande.type || 'Projet'}
          {demande.adresseProjet?.codePostal ? ` - ${demande.adresseProjet.codePostal}` : ''}
        </span>
      )}
    >

      <div className="flex flex-col md:flex-row gap-4">
        
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
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</span>
                <p className="text-slate-600 bg-white p-2.5 rounded border border-slate-200 shadow-sm whitespace-pre-wrap leading-relaxed">
                  {demande.description || '...'}
                </p>
              </div>
              <DocumentList documents={demandeDocuments} />
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
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase text-slate-400 bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-2 font-bold whitespace-nowrap">Bureau d'Études</th>
                      <th className="px-4 py-2 font-bold whitespace-nowrap text-right">Devis Est.</th>
                      <th className="px-4 py-2 font-bold whitespace-nowrap">Délai Rendu</th>
                      <th className="px-4 py-2 font-bold whitespace-nowrap text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {propositions.map(prop => {
                      const isAccepted = prop.statut === 'ACCEPTEE';
                      const isRefused  = prop.statut === 'REFUSEE';
                      const isSelected = prop.id === selectedPropositionId;
                      let rowClassName = 'hover:bg-slate-50';
                      if (isAccepted) {
                        rowClassName = 'bg-green-50/50';
                      } else if (isRefused) {
                        rowClassName = 'opacity-50';
                      }
                      if (isSelected) rowClassName += ' ring-2 ring-inset ring-blue-400 bg-blue-50';
                      return (
                        <tr key={prop.id} aria-current={isSelected ? 'true' : undefined} className={`border-b border-slate-50 ${rowClassName}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center">
                              <Building2 className="w-3 h-3 mr-1.5 text-slate-400"/>
                              <BureauEtudeProfileLink
                                raisonSociale={prop.bureauEtude?.raisonSociale}
                                slug={prop.bureauEtude?.profilPublicSlug}
                                returnTo={`/client/demande/${id}`}
                              />
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 ml-4.5">
                              {prop.bureauEtude?.ville || 'France'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                            {prop.prix} €
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatDelaiWithProjection(prop.delaiMaxRendu, prop.delaiProjectionRendu)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isAccepted && (
                              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded font-bold text-[10px] uppercase tracking-wider">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Validée
                              </span>
                            )}
                            {isRefused && (
                              <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Refusée</span>
                            )}
                            {!isAccepted && !isRefused && !acceptedProp && (
                                <div className="flex justify-center gap-2">
                                  <Button
                                      size="sm"
                                      onClick={() => setConfirmAcceptId(prop.id)}
                                      isLoading={isProcessing === prop.id}
                                  >
                                    Accepter
                                  </Button>
                                  <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => setConfirmRefuseId(prop.id)}
                                      isLoading={isProcessing === prop.id}
                                  >
                                    Refuser
                                  </Button>
                                </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
