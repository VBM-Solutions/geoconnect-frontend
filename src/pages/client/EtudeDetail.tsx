import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { validerDateIntervention, refuserDateIntervention, confirmerPaiement, uploaderDevisSigne } from '../../api/etude';
import { EtudeDetailDTO, EtatEtude } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EtudeDetailLayout, EtudeDetailLoadingSpinner } from '../../components/etude/EtudeDetailLayout';
import { InfoMsg } from '../../components/etude/InfoMsg';
import { clientMustAct } from '../../components/etude/EtudeStatusBadge';
import { CheckCircle2, XCircle, CreditCard, AlertCircle, Clock, Building2, Upload, FilePen } from 'lucide-react';
import { formatDateLong } from '../../lib/formatters';
import { useEtudeDetail } from '../../hooks/useEtudeDetail';

export default function ClientEtudeDetail() {
  const { id } = useParams<{ id: string }>();
  const { etude, documents, isLoading, actionLoading, actionKey, error, withAction } = useEtudeDetail(id);

  if (isLoading) return <EtudeDetailLoadingSpinner />;
  if (!etude) return <div className="text-center text-slate-500 py-12">Étude introuvable.</div>;

  const prop   = etude.propositionDevis;
  const bureau = prop?.bureauEtude;
  const etat   = etude.etat as EtatEtude | undefined;

  // Loaders séparés : chacun ne se déclenche que pour son propre actionKey
  const devisSigneLoading = actionLoading && actionKey === 'devisSigne';
  const stepLoading       = actionLoading && actionKey !== 'devisSigne';

  /**
   * Colonne gauche : carte bureau + carte devis signé (persistante jusqu'au dépôt)
   */
  const infoCard = (
    <>
      {/* Carte bureau d'études */}
      <Card>
        <CardHeader className="pb-2 border-b border-slate-100">
          <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Building2 className="w-3 h-3" /> Bureau d'études
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 space-y-1.5 text-xs">
          <p className="font-bold text-slate-800">{bureau?.raisonSociale || '—'}</p>
          {bureau?.emailContact && <p className="text-slate-500">{bureau.emailContact}</p>}
          {bureau?.telContact && <p className="text-slate-500">{bureau.telContact}</p>}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 mt-1">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Montant</p>
              <p className="font-bold text-slate-800">{prop?.prix == null ? '—' : `${prop.prix} €`}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Délai rendu</p>
              <p className="font-bold text-slate-800">{prop?.delaiMaxRendu == null ? '—' : `${prop.delaiMaxRendu} sem`}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Carte devis signé — visible tant que le document n'est pas déposé */}
      <DevisSigneCard
        devisSigneId={etude.devisSigneId}
        isLoading={devisSigneLoading}
        onUpload={(file) => withAction(() => uploaderDevisSigne(etude.id, file), 'devisSigne')}
      />
    </>
  );

  const actionBanner = clientMustAct(etat) && etude.dateIntervention ? (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2 text-orange-800 text-xs font-semibold">
      <AlertCircle className="w-4 h-4 shrink-0" />
      Une action de votre part est requise pour faire avancer ce dossier.
    </div>
  ) : undefined;

  const backTo = etat === 'PAIEMENT_EFFECTUE'
    ? '/client/dashboard?tab=ARCHIVES'
    : '/client/dashboard?tab=ETUDES';

  return (
    <EtudeDetailLayout
      etude={etude}
      documents={documents}
      error={error}
      backTo={backTo}
      headerLabel="Suivi d'étude"
      actionBanner={actionBanner}
      infoCard={infoCard}
      etatRole="CLIENT"
      renderActions={() => (
        <ClientStepActions
          etat={etat}
          etude={etude}
          isLoading={stepLoading}
          onValiderDate={() => withAction(() => validerDateIntervention(etude.id))}
          onRefuserDate={() => withAction(() => refuserDateIntervention(etude.id))}
          onConfirmerPaiement={() => withAction(() => confirmerPaiement(etude.id))}
        />
      )}
    />
  );
}

// ─── Carte devis signé (persistante, indépendante du stepper) ─────────────────

interface DevisSigneCardProps {
  devisSigneId?: number;
  isLoading: boolean;
  onUpload: (file: File) => Promise<void>;
}

/**
 * Affichée dans la colonne gauche, indépendamment de l'étape en cours.
 * - Tant que le devis signé n'est pas déposé : zone d'alerte avec upload.
 * - Une fois déposé : confirmation discrète verte.
 */
function DevisSigneCard({ devisSigneId, isLoading, onUpload }: Readonly<DevisSigneCardProps>) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  /* Devis déjà déposé → confirmation */
  if (devisSigneId != null) {
    return (
      <Card>
        <CardHeader className="pb-2 border-b border-green-100 bg-green-50 rounded-t-lg">
          <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-green-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Devis signé
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 text-xs text-green-700 font-medium">
          Votre devis signé a bien été déposé.
        </CardContent>
      </Card>
    );
  }

  /* Devis non encore déposé → alerte bien visible */
  return (
    <Card className="border-amber-300">
      <CardHeader className="pb-2 border-b border-amber-200 bg-amber-50 rounded-t-lg">
        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
          <FilePen className="w-3.5 h-3.5" /> Devis signé requis
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3 space-y-3">
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Action requise&nbsp;:</strong> veuillez imprimer le devis, le signer, puis le déposer ici afin que le bureau d'études puisse planifier votre intervention.
        </p>
        <div className="space-y-2">
          <input
            type="file"
            accept="application/pdf"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200"
          />
          <Button
            onClick={handleUpload}
            disabled={!file}
            isLoading={isLoading || uploading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Déposer le devis signé
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Actions contextuelles CLIENT (stepper) ───────────────────────────────────

interface ClientStepActionsProps {
  etat?: EtatEtude;
  etude: EtudeDetailDTO;
  isLoading: boolean;
  onValiderDate: () => void;
  onRefuserDate: () => void;
  onConfirmerPaiement: () => void;
}

function ClientStepActions({ etat, etude, isLoading, onValiderDate, onRefuserDate, onConfirmerPaiement }: Readonly<ClientStepActionsProps>) {
  const dateProposee = formatDateLong(etude.dateIntervention);

  switch (etat) {
    case 'DATE_INTERVENTION_PROPOSEE':
      /**
       * Après un refus de date, le backend remet dateIntervention à null tout en
       * maintenant l'état DATE_INTERVENTION_PROPOSEE. On attend que le BE
       * propose une nouvelle date avant d'afficher les boutons.
       */
      if (!dateProposee) {
        return (
          <InfoMsg color="orange" icon={<Clock className="w-4 h-4" />}>
            Le bureau d'études va vous proposer une nouvelle date suite à votre refus.
          </InfoMsg>
        );
      }
      return (
        <div className="space-y-3">
          <InfoMsg color="orange" icon={<Clock className="w-4 h-4" />}>
            Date proposée : <strong>{dateProposee}</strong>
          </InfoMsg>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onValiderDate} isLoading={isLoading} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Valider la date
            </Button>
            <Button variant="danger" onClick={onRefuserDate} isLoading={isLoading}>
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              Refuser la date
            </Button>
          </div>
        </div>
      );

    case 'RAPPORT_TERMINE':
      return (
        <Button onClick={onConfirmerPaiement} isLoading={isLoading} className="bg-teal-600 hover:bg-teal-700 text-white">
          <CreditCard className="w-3.5 h-3.5 mr-1.5" />
          Confirmer le paiement
        </Button>
      );

    default:
      return null;
  }
}
