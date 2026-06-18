import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  proposerDateIntervention,
  marquerInterventionEffectuee,
  terminerRapport,
  definirDateRenduPrevue,
} from '../../api/etude';
import { uploadDocument } from '../../api/document';
import { EtatEtude } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { EtudeDetailLayout, EtudeDetailLoadingSpinner } from '../../components/etude/EtudeDetailLayout';
import { InfoMsg } from '../../components/etude/InfoMsg';
import { beMustAct } from '../../components/etude/EtudeStatusBadge';
import {
  CheckCircle2, Upload, AlertCircle, MapPin, Clock, User, Pencil, CalendarClock,
} from 'lucide-react';
import { useEtudeDetail } from '../../hooks/useEtudeDetail';
import { formatDateLong } from '../../lib/formatters';
import { useToast } from '../../contexts/ToastContext';

export default function BureauEtudeDetail() {
  const { id } = useParams<{ id: string }>();
  const { etude, documents, isLoading, actionLoading, actionKey, error, withAction } = useEtudeDetail(id);
  const { toastSuccess } = useToast();

  const [dateRenduPrevueInput, setDateRenduPrevueInput] = useState('');
  const [editingDateRenduPrevue, setEditingDateRenduPrevue] = useState(false);

  // Synchronise l'input avec la valeur retournée par le serveur
  useEffect(() => {
    setDateRenduPrevueInput(etude?.dateRenduPrevue ?? '');
  }, [etude?.dateRenduPrevue]);

  if (isLoading) return <EtudeDetailLoadingSpinner />;
  if (!etude) return <div className="text-center text-slate-500 py-12">Étude introuvable.</div>;

  const prop    = etude.propositionDevis;
  const demande = prop?.demandeDevis;
  const client  = demande?.client;
  const etat    = etude.etat as EtatEtude | undefined;

  const showDateRenduPrevueEditor =
    etat === 'DATE_INTERVENTION_FIXEE' || etat === 'INTERVENTION_EFFECTUEE';

  const dateSaving = actionLoading && actionKey === 'dateRenduPrevue';
  const interventionLoading = actionLoading && actionKey !== 'dateRenduPrevue';
  const hasExistingDate = !!etude.dateRenduPrevue;

  const handleSaveDateRenduPrevue = async () => {
    await withAction(() => definirDateRenduPrevue(etude.id, dateRenduPrevueInput), 'dateRenduPrevue');
    setEditingDateRenduPrevue(false);
  };

  const dateRenduPrevueEditor = showDateRenduPrevueEditor ? (
    (!editingDateRenduPrevue && hasExistingDate) ? (
      // Mode lecture : date formatée + badge jours restants + icône crayon
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-slate-800 text-xs">{formatDateLong(etude.dateRenduPrevue)}</span>
        <DaysRemainingBadge dateIso={etude.dateRenduPrevue} />
        <button
          onClick={() => setEditingDateRenduPrevue(true)}
          className="text-slate-400 hover:text-blue-600 transition-colors"
          title="Modifier la date"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      </div>
    ) : (
      // Mode édition : input + bouton enregistrer + annuler si date existante
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="date"
          value={dateRenduPrevueInput}
          onChange={e => setDateRenduPrevueInput(e.target.value)}
          className="border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <Button
          onClick={handleSaveDateRenduPrevue}
          disabled={!dateRenduPrevueInput}
          isLoading={dateSaving}
          variant="secondary"
        >
          Enregistrer
        </Button>
        {hasExistingDate && (
          <Button
            onClick={() => { setEditingDateRenduPrevue(false); setDateRenduPrevueInput(etude.dateRenduPrevue ?? ''); }}
            variant="ghost"
            disabled={dateSaving}
          >
            Annuler
          </Button>
        )}
      </div>
    )
  ) : undefined;

  const infoCard = (
    <Card>
      <CardHeader className="pb-2 border-b border-slate-100">
        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <User className="w-3 h-3" /> Client commanditaire
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3 space-y-1.5 text-xs">
        {client ? (
          <>
            <p className="font-bold text-slate-800">
              {[client.prenom, client.nom].filter(Boolean).join(' ') || '—'}
            </p>
            {client.tel && <p className="text-slate-500">{client.tel}</p>}
            {client.adresseFacturation?.ville && (
              <p className="text-slate-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {client.adresseFacturation.ville}
              </p>
            )}
          </>
        ) : (
          <p className="text-slate-400">Informations non disponibles.</p>
        )}
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
  );

  const actionBanner = beMustAct(etat) ? (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2 text-orange-800 text-xs font-semibold">
      <AlertCircle className="w-4 h-4 shrink-0" />
      Une action de votre part est attendue pour faire avancer ce dossier.
    </div>
  ) : undefined;

  const backTo = etat === 'PAIEMENT_EFFECTUE'
    ? '/be/dashboard?tab=ARCHIVES'
    : '/be/dashboard?tab=ETUDE_EN_COURS';

  return (
    <EtudeDetailLayout
      etude={etude}
      documents={documents}
      error={error}
      backTo={backTo}
      headerLabel="Gestion d'étude"
      actionBanner={actionBanner}
      infoCard={infoCard}
      etatRole="BE"
      dateRenduPrevueEditor={dateRenduPrevueEditor}
      renderActions={() => (
        <BEStepActions
          etat={etat}
          dateIntervention={etude.dateIntervention}
          isLoading={interventionLoading}
          onProposerDate={(date) => withAction(async () => {
            await proposerDateIntervention(etude.id, date);
            toastSuccess('Date d\'intervention proposée au client avec succès.');
          })}
          onInterventionEffectuee={() => withAction(() => marquerInterventionEffectuee(etude.id))}
          onTerminerRapport={(rapportId) => withAction(() => terminerRapport(etude.id, rapportId))}
        />
      )}
    />
  );
}

// ─── Badge jours restants ─────────────────────────────────────────────────────

function DaysRemainingBadge({ dateIso }: { dateIso: string }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateIso);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  let label: string;
  let colorClass: string;

  if (diff > 7) {
    label = `${diff} j restants`;
    colorClass = 'bg-green-100 text-green-700';
  } else if (diff > 0) {
    label = `${diff} j restants`;
    colorClass = 'bg-orange-100 text-orange-700';
  } else if (diff === 0) {
    label = 'Aujourd\'hui';
    colorClass = 'bg-amber-100 text-amber-700';
  } else {
    label = `${Math.abs(diff)} j de retard`;
    colorClass = 'bg-red-100 text-red-700';
  }

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${colorClass}`}>
      {label}
    </span>
  );
}

// ─── Actions contextuelles BE ─────────────────────────────────────────────────

export interface BEStepActionsProps {
  etat?: EtatEtude;
  dateIntervention?: string;
  isLoading: boolean;
  onProposerDate: (date: string) => void;
  onInterventionEffectuee: () => void;
  onTerminerRapport: (rapportId: number) => void;
}

export function BEStepActions({ etat, dateIntervention, isLoading, onProposerDate, onInterventionEffectuee, onTerminerRapport }: Readonly<BEStepActionsProps>) {
  const [dateInput, setDateInput] = useState('');
  const [dateError, setDateError] = useState('');
  const [rapportFile, setRapportFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showInterventionModal, setShowInterventionModal] = useState(false);

  const handleTerminerRapport = async () => {
    if (!rapportFile) return;
    setUploading(true);
    try {
      const doc = await uploadDocument(rapportFile);
      if (doc.id) onTerminerRapport(doc.id);
    } finally {
      setUploading(false);
    }
  };

  // Date locale du navigateur au format YYYY-MM-DD
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const today = `${yyyy}-${mm}-${dd}`;

  // Calcul de l'écart entre aujourd'hui et la date d'intervention prévue
  const interventionDaysRemaining = (() => {
    if (!dateIntervention) return null;
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const target = new Date(dateIntervention);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - todayDate.getTime()) / 86_400_000);
  })();

  const interventionIsFuture = interventionDaysRemaining !== null && interventionDaysRemaining > 0;

  // Contenu du bandeau d'avertissement affiché dans la modale si la date n'est pas encore atteinte
  const interventionWarning = interventionIsFuture ? (
    <div className="flex items-start gap-2 rounded-lg bg-orange-50 border border-orange-200 p-3 text-xs text-orange-800">
      <CalendarClock className="w-4 h-4 shrink-0 mt-0.5 text-orange-500" />
      <span>
        La date d'intervention est prévue au{' '}
        <strong>{formatDateLong(dateIntervention)}</strong>, dans{' '}
        <strong>
          {interventionDaysRemaining} jour{interventionDaysRemaining > 1 ? 's' : ''}
        </strong>
        . Confirmez uniquement si l'intervention a bien été réalisée par anticipation.
      </span>
    </div>
  ) : null;

  switch (etat) {
    case 'DEVIS_SIGNE':
    case 'DATE_INTERVENTION_PROPOSEE':
      return (
        <div className="space-y-3">
          {etat === 'DATE_INTERVENTION_PROPOSEE' && (
            <InfoMsg color="orange" icon={<Clock className="w-4 h-4" />}>
              {dateIntervention
                ? "Le client n'a pas encore validé votre date. Vous pouvez en proposer une nouvelle."
                : "Le client a refusé la date proposée. Veuillez en proposer une nouvelle."}
            </InfoMsg>
          )}
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label htmlFor="dateIntervention" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Date d'intervention
              </label>
              <input
                id="dateIntervention"
                type="date"
                value={dateInput}
                min={today}
                onChange={e => {
                  setDateInput(e.target.value);
                  setDateError('');
                }}
                onBlur={e => {
                  if (e.target.value && e.target.value < today) {
                    setDateError('La date doit être dans le futur');
                  } else {
                    setDateError('');
                  }
                }}
                className={`border rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  dateError ? 'border-red-500 focus:ring-red-500' : 'border-slate-300'
                }`}
              />
              {dateError && <p className="text-red-500 text-[10px] mt-1">{dateError}</p>}
            </div>
            <Button
              onClick={() => {
                if (dateInput && dateInput < today) {
                  setDateError('La date doit être dans le futur');
                  return;
                }
                setDateError('');
                onProposerDate(dateInput);
              }}
              disabled={!dateInput || !!dateError}
              isLoading={isLoading}
            >
              Envoyer la date
            </Button>
          </div>
        </div>
      );

    case 'DATE_INTERVENTION_FIXEE':
      return (
        <div className="space-y-3">
          <Button onClick={() => setShowInterventionModal(true)} isLoading={isLoading}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
            Intervention réalisée
          </Button>

          {showInterventionModal && (
            <ConfirmModal
              title="Confirmer l'intervention"
              message="Êtes-vous sûr de vouloir marquer cette intervention comme réalisée ? Cette action est irréversible."
              confirmLabel="Oui, marquer comme effectuée"
              cancelLabel="Annuler"
              variant={interventionIsFuture ? 'warning' : 'default'}
              extra={interventionWarning}
              isLoading={isLoading}
              onConfirm={() => {
                setShowInterventionModal(false);
                onInterventionEffectuee();
              }}
              onCancel={() => setShowInterventionModal(false)}
            />
          )}
        </div>
      );

    case 'INTERVENTION_EFFECTUEE':
      return (
        <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div>
            <label htmlFor="rapportFinal" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Rapport final (PDF)
            </label>
            <input
              id="rapportFinal"
              type="file"
              accept="application/pdf"
              onChange={e => setRapportFile(e.target.files?.[0] ?? null)}
              className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <Button
            onClick={handleTerminerRapport}
            disabled={!rapportFile}
            isLoading={isLoading || uploading}
          >
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            Terminer le rapport
          </Button>
        </div>
      );

    default:
      return null;
  }
}

