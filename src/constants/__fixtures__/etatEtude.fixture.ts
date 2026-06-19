/**
 * Fixture centralisé : liste exhaustive des états d'étude.
 * Évite la duplication inter-fichiers entre les suites de tests.
 */
import { EtatEtude } from '../../types';

export const ALL_ETATS: EtatEtude[] = [
  'DEVIS_VALIDE',
  'DEVIS_SIGNE',
  'DATE_INTERVENTION_PROPOSEE',
  'DATE_INTERVENTION_FIXEE',
  'INTERVENTION_EFFECTUEE',
  'RAPPORT_TERMINE',
  'PAIEMENT_EFFECTUE',
];
