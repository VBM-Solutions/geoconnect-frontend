import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDemandeDevisById } from '../../api/demandeDevis';
import { getPropositionDevisByDemandeId, createPropositionDevis } from '../../api/propositionDevis';
import { getBureauByUserId } from '../../api/bureauEtude';
import { uploadDocument } from '../../api/document';
import { DemandeDevisDTO, PropositionDevisDTO, BureauEtudesDTO } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MapPin, Clock, FileCheck, Paperclip, History } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useForm } from 'react-hook-form';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { TYPE_LABELS } from '../../constants/labels';
import { buildDemandeDocuments } from '../../lib/formatters';
import { DocumentList } from '../../components/etude/DocumentList';
import { formatDelaiWithProjection } from '../../lib/delaiProjection';
import { DetailPageShell } from '../../components/ui/DetailPageShell';

// ─── Sous-composants ──────────────────────────────────────────────────────────

interface ActivePropositionCardProps {
  prop: PropositionDevisDTO;
  statusConfig: Record<string, { border: string; bg: string; text: string; title: string }>;
}

function ActivePropositionCard({ prop, statusConfig }: Readonly<ActivePropositionCardProps>) {
  const config = statusConfig[prop.statut as keyof typeof statusConfig] ?? statusConfig.EN_ATTENTE;
  let statutLabel = 'En attente';
  if (prop.statut === 'ACCEPTEE') statutLabel = 'Acceptée';
  else if (prop.statut === 'REFUSEE') statutLabel = 'Refusée';
  return (
    <Card className={`${config.border} ${config.bg} shadow-sm h-full`}>
      <CardHeader className="pb-2 border-b border-current">
        <CardTitle className={`flex items-center ${config.text} text-sm`}>
          <FileCheck className="w-4 h-4 mr-2" />
          {config.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 text-current space-y-4">
        <div>
          <span className="block text-[10px] font-bold uppercase mb-1">Montant Estimé</span>
          <span className="font-bold text-2xl font-mono">
            {prop.prix} € <span className="text-xs">HT</span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-current/10 p-2 rounded">
            <span className="block text-[10px] font-bold uppercase mb-1">Délai rendu</span>
            <span className="font-semibold text-xs">
              {formatDelaiWithProjection(prop.delaiMaxRendu, prop.delaiProjectionRendu)}
            </span>
          </div>
          <div className="bg-current/10 p-2 rounded">
            <span className="block text-[10px] font-bold uppercase mb-1">Statut</span>
            <span className="font-semibold text-xs">{statutLabel}</span>
          </div>
        </div>
        {prop.delaiMaxIntervention != null && (
          <div className="bg-current/10 p-2 rounded">
            <span className="block text-[10px] font-bold uppercase mb-1">Délai intervention</span>
            <span className="font-semibold text-xs">{formatDelaiWithProjection(prop.delaiMaxIntervention, prop.delaiProjectionIntervention)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface OfferFormProps {
  isResubmit: boolean;
  isSubmitting: boolean;
  register: ReturnType<typeof import('react-hook-form').useForm>['register'];
  errors: Record<string, unknown>;
  pdfFile: File | null;
  onFileChange: (f: File | null) => void;
  onSubmitClick: () => void;
}

function OfferForm({ isResubmit, isSubmitting, register, errors, pdfFile, onFileChange, onSubmitClick }: Readonly<OfferFormProps>) {
  return (
    <Card className="border-slate-200 h-full flex flex-col">
      <CardHeader className="bg-slate-50/50 pb-3 border-b border-slate-100">
        <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {isResubmit ? 'Resoumettre une offre' : 'Formuler une offre'}
        </CardTitle>
        <CardDescription className="text-[10px]">Déposez votre estimation pour ce projet</CardDescription>
      </CardHeader>
      <form className="flex-1 flex flex-col">
        <CardContent className="pt-4 space-y-3 flex-1">
          <Input
            label="PRIX D'INTERVENTION (€ HT) *"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Ex: 4200"
            {...register('prix', { required: true, min: { value: 0.01, message: 'Doit être > 0' } })}
            error={(errors as Record<string, { message?: string }>).prix
              ? ((errors as Record<string, { message?: string }>).prix?.message ?? 'Requis')
              : undefined}
          />
          <Input
            label="DÉLAI RENDU (semaines) *"
            type="number"
            min="1"
            placeholder="Ex: 4"
            {...register('delaiMaxRendu', { required: true, min: { value: 1, message: 'Minimum 1 semaine' } })}
            error={(errors as Record<string, { message?: string }>).delaiMaxRendu
              ? ((errors as Record<string, { message?: string }>).delaiMaxRendu?.message ?? 'Requis')
              : undefined}
          />
          <Input
            label="DÉLAI INTERVENTION (semaines) *"
            type="number"
            min="1"
            placeholder="Ex: 2"
            {...register('delaiMaxIntervention', { required: true, min: { value: 1, message: 'Minimum 1 semaine' } })}
            error={(errors as Record<string, { message?: string }>).delaiMaxIntervention
              ? ((errors as Record<string, { message?: string }>).delaiMaxIntervention?.message ?? 'Requis')
              : undefined}
          />
          <div>
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              DEVIS PDF (optionnel)
            </span>
            <label
              htmlFor="pdf-upload"
              className="flex items-center gap-2 w-full border border-dashed border-slate-300 rounded-md px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-xs text-slate-500 truncate">
                {pdfFile ? pdfFile.name : 'Joindre un fichier PDF…'}
              </span>
            </label>
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
          </div>
        </CardContent>
        <CardFooter className="bg-slate-50 border-t border-slate-100 py-3">
          <Button type="button" isLoading={isSubmitting} className="w-full text-[10px]" onClick={onSubmitClick}>
            {isResubmit ? 'RESOUMETTRE MON OFFRE' : 'SOUMETTRE MON OFFRE'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function BERequestDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toastError, toastSuccess } = useToast();
  const navigate = useNavigate();
  const [demande, setDemande] = useState<DemandeDevisDTO | null>(null);
  const [myProposition, setMyProposition] = useState<PropositionDevisDTO | null>(null);
  const [myRefusedPropositions, setMyRefusedPropositions] = useState<PropositionDevisDTO[]>([]);
  const [allPropositions, setAllPropositions] = useState<PropositionDevisDTO[]>([]);
  const [myBureau, setMyBureau] = useState<BureauEtudesDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    async function fetchData() {
      if (!id || !user) return;
      try {
        const bureau = await getBureauByUserId(user.userId);
        if (bureau) setMyBureau(bureau);

        const [demandeData, propsData] = await Promise.all([
          getDemandeDevisById(Number(id)),
          getPropositionDevisByDemandeId(Number(id)).catch((): PropositionDevisDTO[] => []),
        ]);
        setDemande(demandeData);
        setAllPropositions(propsData || []);

        if (bureau?.id) {
          const allMine = (propsData || []).filter((p: PropositionDevisDTO) => p.bureauEtudeId === bureau.id);
          const refused = allMine.filter(p => p.statut === 'REFUSEE');
          const active = allMine.find(p => p.statut === 'EN_ATTENTE' || p.statut === 'ACCEPTEE') ?? null;
          setMyRefusedPropositions(refused);
          setMyProposition(active);
        }
      } catch (err: any) {
        toastError(err?.response?.data?.message ?? err?.message ?? 'Impossible de charger la demande.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id, user]);

  const onSubmit = async (data: any) => {
    if (!demande || !user || !myBureau?.id) return;
    setIsSubmitting(true);
    try {
      // Upload PDF optionnel → récupère documentId
      let documentId: number | undefined;
      if (pdfFile) {
        const doc = await uploadDocument(pdfFile);
        documentId = doc.id;
      }

      const newProp = await createPropositionDevis({
        demandeDevisId: demande.id,
        bureauEtudeId: myBureau.id,
        prix: Number.parseFloat(data.prix),
        delaiMaxRendu: data.delaiMaxRendu ? Number(data.delaiMaxRendu) : undefined,
        delaiMaxIntervention: data.delaiMaxIntervention ? Number(data.delaiMaxIntervention) : undefined,
        documentId,
      });
      setMyProposition(newProp);
      setAllPropositions(prev => [...prev, newProp]);
      toastSuccess('Proposition soumise avec succès !');
      navigate('/be/dashboard');
    } catch (err: any) {
      toastError(err?.response?.data?.message ?? err?.message ?? 'Erreur lors de la soumission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!demande) return <div>Demande introuvable.</div>;

  const statusConfig: Record<string, { border: string; bg: string; text: string; title: string }> = {
    ACCEPTEE: { border: 'border-green-200', bg: 'bg-green-50', text: 'text-green-800', title: 'Offre Acceptée' },
    REFUSEE: { border: 'border-red-200', bg: 'bg-red-50', text: 'text-red-800', title: 'Offre Refusée' },
    EN_ATTENTE: { border: 'border-yellow-200', bg: 'bg-yellow-50', text: 'text-yellow-800', title: 'Offre En Attente' },
  };

  const hasAccepted = allPropositions.some(p => p.statut === 'ACCEPTEE');
  // Le formulaire est accessible si aucune prop n'est ACCEPTEE et qu'on n'a pas de prop active (EN_ATTENTE)
  const canSubmit = !hasAccepted && !myProposition;
  const demandeDocuments = buildDemandeDocuments(demande);

  // Onglet de retour : EN_ATTENTE si on a déjà soumis/resoumis, OUVERT sinon
  const backFallback =
    myProposition != null || myRefusedPropositions.length > 0
      ? '/be/dashboard?tab=EN_ATTENTE'
      : '/be/dashboard?tab=OUVERT';

  return (
    <DetailPageShell
      tone="be"
      backTo={backFallback}
      backLabel="Retour aux missions"
      eyebrow={`Mission #MES-${demande.id}`}
      title={demande.adresseProjet?.ville || 'Projet géotechnique'}
      description={(
        <span>
          {demande.type ? TYPE_LABELS[demande.type] ?? demande.type : 'Projet Standard'}
          {demande.adresseProjet?.codePostal ? ` - ${demande.adresseProjet.codePostal}` : ''}
        </span>
      )}
    >

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Colonne Principale */}
        <div className="flex-1 space-y-4">
          <Card className="bg-white">
            <CardHeader className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase tracking-wider">
                  RÉF: #MES-{demande.id}
                </CardTitle>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 uppercase border border-slate-200">
                  {demande.type ? TYPE_LABELS[demande.type] ?? demande.type : 'Projet Standard'}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider flex items-center">
                    <MapPin className="w-3 h-3 mr-1" /> Localisation
                  </h4>
                  <p className="text-xs font-semibold text-slate-700">
                    {demande.adresseProjet?.ville || 'Non renseigné'}
                    <span className="text-slate-500 ml-1">({demande.adresseProjet?.codePostal})</span>
                  </p>
                  {demande.adresseProjet?.rue && (
                    <p className="text-xs text-slate-500 mt-0.5">{demande.adresseProjet.rue}</p>
                  )}
                </div>
                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> Échéance
                  </h4>
                  <p className="text-xs font-semibold text-slate-700">
                    {demande.delaiMaxSouhaite == null
                        ? 'Flexible'
                        : `${demande.delaiMaxSouhaite} sem`}
                  </p>
                </div>
              </div>

              {/* Infos complémentaires */}
              <div className="grid grid-cols-3 gap-2">
                {demande.superficie && (
                  <div className="p-2 bg-slate-50 rounded border border-slate-100 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Superficie</span>
                    <span className="text-xs font-semibold text-slate-700">{demande.superficie} m²</span>
                  </div>
                )}
                {demande.nombreLot && (
                  <div className="p-2 bg-slate-50 rounded border border-slate-100 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Lots</span>
                    <span className="text-xs font-semibold text-slate-700">{demande.nombreLot}</span>
                  </div>
                )}
                {demande.referenceCadastrale && (
                  <div className="p-2 bg-slate-50 rounded border border-slate-100 text-center">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cadastre</span>
                    <span className="text-xs font-semibold text-slate-700">{demande.referenceCadastrale}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Description du besoin</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded border border-slate-200 shadow-sm whitespace-pre-wrap">
                  {demande.description || 'Description non fournie par le client.'}
                </p>
              </div>

              <DocumentList documents={demandeDocuments} />
            </CardContent>
          </Card>
        </div>

        {/* Colonne Latérale: Actions / Proposition */}
        <div className="w-full lg:w-80 space-y-4">
          {/* Historique des offres refusées */}
          {myRefusedPropositions.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2 border-b border-slate-100">
                <CardTitle className="flex items-center text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <History className="w-3.5 h-3.5 mr-1.5" />
                  Offres précédentes refusées
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2">
                {myRefusedPropositions.map((rp, idx) => (
                  <div key={rp.id ?? idx} className="p-2 bg-red-50 border border-red-100 rounded text-[11px]">
                    <div className="flex justify-between items-center">
                      <span className="text-red-600 font-bold">Offre #{idx + 1}</span>
                      <span className="font-mono font-bold text-slate-700">{rp.prix} €</span>
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Rendu : {formatDelaiWithProjection(rp.delaiMaxRendu, rp.delaiProjectionRendu)}
                      {rp.delaiMaxIntervention != null && ` · Intervention : ${formatDelaiWithProjection(rp.delaiMaxIntervention, rp.delaiProjectionIntervention)}`}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Proposition active ou message ou formulaire */}
          {hasAccepted && myProposition?.statut !== 'ACCEPTEE' && (
            <Card className="border-yellow-200 bg-yellow-50 shadow-sm">
              <CardContent className="pt-4 text-yellow-800">
                <p className="text-sm">Une proposition a déjà été acceptée pour cette demande. Vous ne pouvez plus soumettre d'offre.</p>
              </CardContent>
            </Card>
          )}
          {myProposition && (
            <ActivePropositionCard prop={myProposition} statusConfig={statusConfig} />
          )}
          {canSubmit && (
            <OfferForm
              isResubmit={myRefusedPropositions.length > 0}
              isSubmitting={isSubmitting}
              register={register}
              errors={errors}
              pdfFile={pdfFile}
              onFileChange={setPdfFile}
              onSubmitClick={() => setShowConfirmModal(true)}
            />
          )}
        </div>
      </div>

      {showConfirmModal && (
        <ConfirmModal
          title="Confirmer la soumission"
          message="Êtes-vous sûr de vouloir soumettre cette offre ? Vous ne pourrez plus la modifier."
          confirmLabel="Soumettre"
          isLoading={isSubmitting}
          onConfirm={async () => { setShowConfirmModal(false); await handleSubmit(onSubmit)(); }}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </DetailPageShell>
  );
}
