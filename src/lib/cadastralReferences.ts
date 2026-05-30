export const EMPTY_CADASTRAL_REFERENCE = '';
export const CADASTRAL_REFERENCE_PLACEHOLDER = 'Ex : AB 0042';

/**
 * Nettoie les références cadastrales saisies avant soumission.
 * - trim de chaque valeur
 * - suppression des entrées vides
 */
export function normalizeReferencesCadastrales(
  referencesCadastrales?: readonly string[] | null
): string[] {
  return (referencesCadastrales ?? [])
    .map((reference) => reference.trim())
    .filter((reference) => reference !== '');
}

