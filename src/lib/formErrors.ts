import { FieldError, FieldErrorsImpl, Merge } from 'react-hook-form';

/**
 * Extrait le message d'erreur d'un champ react-hook-form de façon type-safe.
 * Élimine les casts `as { message?: string }` dupliqués dans les composants.
 */
export function getFieldMessage(
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<unknown>>
): string | undefined {
  return (error as FieldError | undefined)?.message;
}
