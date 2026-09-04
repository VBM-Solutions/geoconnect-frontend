import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { EtatEtude } from '../../types';
import { formatDateLong } from '../../lib/formatters';

// ─── Définition des étapes ────────────────────────────────────────────────────

export interface StepDef {
  etat: EtatEtude;
  label: string;
  descriptionClient: string;
  descriptionBE: string;
}

/** Factory local — évite la répétition littérale des clés dans chaque step. */
function step(
  etat: EtatEtude,
  label: string,
  descriptionClient: string,
  descriptionBE: string,
): StepDef {
  return { etat, label, descriptionClient, descriptionBE };
}

export const ETUDE_STEPS: StepDef[] = [
  step(
    'DEVIS_VALIDE',
    'Devis accepté',
    "Votre proposition de devis a été validée. Le bureau d'études attend la signature du devis pour continuer.",
    "Le client a accepté votre devis. Le devis signé est requis avant de proposer une date.",
  ),
  step(
    'DEVIS_SIGNE',
    'Devis signé',
    "Le devis signé a été déposé. Le bureau d'études peut maintenant proposer une date d'intervention.",
    "Le devis signé a été reçu. Proposez une date d'intervention au client.",
  ),
  step(
    'DATE_INTERVENTION_PROPOSEE',
    "Date d'intervention",
    "Le bureau d'études a soumis une date. Validez ou refusez-la pour continuer.",
    'En attente de la confirmation de date par le client.',
  ),
  step(
    'DATE_INTERVENTION_FIXEE',
    'Date confirmée',
    "La date d'intervention est confirmée. Vous serez informé une fois l'intervention réalisée.",
    'La date est validée par le client. Réalisez l\'intervention puis signalez-la.',
  ),
  step(
    'INTERVENTION_EFFECTUEE',
    'Intervention réalisée',
    "L'intervention terrain est terminée. Le rapport est en cours de rédaction.",
    'L\'intervention est effectuée. Uploadez le rapport final et indiquez sa date de remise.',
  ),
  step(
    'RAPPORT_TERMINE',
    'Rapport disponible',
    'Le rapport final est prêt. Confirmez le paiement pour clôturer le dossier.',
    'Le rapport a été transmis. En attente de la confirmation de paiement du client.',
  ),
  step(
    'PAIEMENT_EFFECTUE',
    'Dossier clôturé',
    'Le paiement a été confirmé. Merci pour votre confiance.',
    'Le paiement a été confirmé par le client. Dossier clôturé.',
  ),
];

/** Indexation : chaque état pointe vers l'étape à laquelle il appartient. */
const STEP_INDEX: Record<EtatEtude, number> = {
  DEVIS_VALIDE:               0, // étape 1 : "Devis accepté"
  DEVIS_SIGNE:                1, // étape 2 : "Devis signé"
  DATE_INTERVENTION_PROPOSEE: 2, // étape 3 : "Date d'intervention"
  DATE_INTERVENTION_FIXEE:    3, // étape 4 : "Date confirmée"
  INTERVENTION_EFFECTUEE:     4, // étape 5 : "Intervention réalisée"
  RAPPORT_TERMINE:            5, // étape 6 : "Rapport disponible"
  PAIEMENT_EFFECTUE:          6, // étape 7 : "Dossier clôturé"
};

/**
 * Détermine l'index de l'étape "active" (celle qui attend une action).
 * Les étapes précédentes sont considérées comme "complétées" (vertes).
 *
 * Règle métier :
 * - DEVIS_VALIDE      → active = 1 (attente du devis signé)
 * - DEVIS_SIGNE       → active = 2 (attente de la proposition de date)
 * - états suivants    → l'état lui-même est l'étape active
 */
export function getActiveStepIndex(etat: EtatEtude): number {
  switch (etat) {
    case 'DEVIS_VALIDE':
      return 1;
    case 'DEVIS_SIGNE':
      return 2;
    default:
      return STEP_INDEX[etat];
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'CLIENT' | 'BE';

interface EtudeStepperProps {
  etat?: EtatEtude;
  datesEtapes?: Partial<Record<EtatEtude, string>>;
  role: Role;
  /** Contenu action rendu à l'intérieur de l'étape active */
  renderActions?: (step: StepDef, index: number) => React.ReactNode;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export const EtudeStepper: React.FC<EtudeStepperProps> = ({ etat, datesEtapes, role, renderActions }) => {
  const currentIndex = etat !== undefined ? getActiveStepIndex(etat) : -1;

  return (
    <div className="relative">
      {ETUDE_STEPS.map((step, index) => {
        const isLast      = index === ETUDE_STEPS.length - 1;
        const isCompleted = index < currentIndex || (isLast && index === currentIndex);
        const isCurrent   = index === currentIndex && !isLast;
        const isPending   = index > currentIndex;

        const description = role === 'CLIENT' ? step.descriptionClient : step.descriptionBE;
        const actions = isCurrent && renderActions ? renderActions(step, index) : null;
        const dateFranchissement = (isCompleted || isCurrent)
          ? formatDateLong(datesEtapes?.[step.etat])
          : null;

        return (
          <div key={step.etat} className="flex gap-4">
            {/* Colonne gauche : indicateur + ligne verticale */}
            <div className="flex flex-col items-center">
              {/* Cercle d'état */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all
                  ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                  ${isCurrent  ? 'bg-white border-blue-600 text-blue-600 shadow-md' : ''}
                  ${isPending  ? 'bg-white border-slate-200 text-slate-300' : ''}
                `}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span className={`text-[10px] font-black ${isCurrent ? 'text-blue-600' : 'text-slate-300'}`}>
                    {index + 1}
                  </span>
                )}
              </div>
              {/* Ligne verticale */}
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-[1.5rem] my-1 ${isCompleted ? 'bg-green-400' : 'bg-slate-200'}`} />
              )}
            </div>

            {/* Colonne droite : contenu */}
            <div className={`pb-6 flex-1 ${isLast ? '' : ''}`}>
              {/* Label */}
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <p className={`text-xs font-bold uppercase tracking-wider leading-none ${
                  isCurrent  ? 'text-blue-700' :
                  isCompleted ? 'text-green-600' :
                  'text-slate-400'
                }`}>
                  {step.label}
                </p>
                {dateFranchissement && (
                  <time
                    dateTime={datesEtapes?.[step.etat]}
                    className="shrink-0 text-right text-[11px] italic text-slate-400"
                  >
                    {dateFranchissement}
                  </time>
                )}
              </div>

              {/* Description */}
              {(isCurrent || isCompleted) && (
                <p className={`text-[11px] leading-relaxed mb-2 ${isCurrent ? 'text-slate-600' : 'text-slate-400'}`}>
                  {description}
                </p>
              )}

              {/* Actions de l'étape active */}
              {actions && (
                <div className="mt-3">
                  {actions}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

