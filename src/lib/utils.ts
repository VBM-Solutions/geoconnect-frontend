import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extrait un message d'erreur lisible depuis une erreur Axios ou native.
 */
export function extractErrorMessage(err: unknown, fallback = 'Erreur lors du chargement des données.'): string {
  const e = err as any;
  return e?.response?.data?.message ?? e?.message ?? fallback;
}

export type PublicApiErrorCode =
  | 'ACCOUNT_ALREADY_EXISTS' | 'INVALID_CREDENTIALS' | 'EMAIL_VERIFICATION_REQUIRED'
  | 'ACCOUNT_UNAVAILABLE' | 'VERIFICATION_LINK_INVALID' | 'VALIDATION_ERROR'
  | 'TOO_MANY_REQUESTS' | 'ACCESS_DENIED' | 'SESSION_EXPIRED' | 'TECHNICAL_ERROR';

export function getPublicApiError(err: unknown, fallback: string): { code?: PublicApiErrorCode; message: string } {
  const error = err as any;
  const code = error?.response?.data?.code as PublicApiErrorCode | undefined;
  const message = error?.response?.data?.message;
  return typeof message === 'string' && message.trim() ? { code, message } : { code, message: fallback };
}

/**
 * Dérive le code INSEE du département à partir d'un code postal français à 5 chiffres.
 *
 * Règles :
 * - DOM-TOM (971–976, 984–989…) : 3 premiers caractères
 * - Corse 20xxx : "2A" si CP[2] < '2', "2B" sinon
 * - Métropole standard : 2 premiers caractères
 *
 * @returns Le code département (ex. "75", "2A", "971") ou `null` si le CP est invalide.
 */
export function extractCodeDepartement(codePostal: string | null | undefined): string | null {
  if (!codePostal || codePostal.length < 2) return null;

  // DOM-TOM : préfixes 97x et 98x sur 3 chiffres
  if (/^9[78]\d/.test(codePostal)) {
    return codePostal.slice(0, 3);
  }

  // Corse : 20000-20199 → 2A, 20200-20999 → 2B
  if (codePostal.startsWith('20') && codePostal.length >= 3) {
    return codePostal[2] < '2' ? '2A' : '2B';
  }

  // Métropole standard : 2 premiers chiffres
  return codePostal.slice(0, 2);
}


