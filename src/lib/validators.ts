/**
 * Règles de validation react-hook-form partagées entre les formulaires.
 * Centraliser ici permet d'assurer la cohérence entre les DTOs swagger et le front.
 */

// ─── Patterns ──────────────────────────────────────────────────────────────────

/**
 * Code postal français : exactement 5 chiffres.
 */
export const CODE_POSTAL_PATTERN = /^\d{5}$/;

/**
 * Numéro de téléphone français (format national ou international).
 * Accepte :
 *   - 0612345678 / 06 12 34 56 78 / 06.12.34.56.78 / 06-12-34-56-78
 *   - +33612345678 / +33 6 12 34 56 78
 *   - 0033612345678
 */
export const PHONE_FR_PATTERN = /^(?:(?:\+|00)33|0)[1-9](?:[\s.-]?\d{2}){4}$/;

/**
 * Mot de passe robuste : au moins 8 caractères, une majuscule, une minuscule,
 * un chiffre et un caractère spécial.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_UPPERCASE_PATTERN = /[A-Z]/;
export const PASSWORD_LOWERCASE_PATTERN = /[a-z]/;
export const PASSWORD_DIGIT_PATTERN = /\d/;
export const PASSWORD_SPECIAL_CHAR_PATTERN = /[^A-Za-z0-9\s]/;

export interface PasswordRequirement {
  key: 'minLength' | 'uppercase' | 'lowercase' | 'digit' | 'specialChar';
  label: string;
  isMet: (password: string) => boolean;
}

export const PASSWORD_REQUIREMENTS: readonly PasswordRequirement[] = [
  {
    key: 'minLength',
    label: `Au moins ${PASSWORD_MIN_LENGTH} caractères`,
    isMet: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    key: 'uppercase',
    label: 'Une majuscule',
    isMet: (password) => PASSWORD_UPPERCASE_PATTERN.test(password),
  },
  {
    key: 'lowercase',
    label: 'Une minuscule',
    isMet: (password) => PASSWORD_LOWERCASE_PATTERN.test(password),
  },
  {
    key: 'digit',
    label: 'Un chiffre',
    isMet: (password) => PASSWORD_DIGIT_PATTERN.test(password),
  },
  {
    key: 'specialChar',
    label: 'Un caractère spécial',
    isMet: (password) => PASSWORD_SPECIAL_CHAR_PATTERN.test(password),
  },
] as const;

export function getPasswordRequirementStatuses(password = '') {
  return PASSWORD_REQUIREMENTS.map((requirement) => ({
    ...requirement,
    isMet: requirement.isMet(password),
  }));
}

export function getMissingPasswordRequirementLabels(password = ''): string[] {
  return getPasswordRequirementStatuses(password)
    .filter((requirement) => !requirement.isMet)
    .map((requirement) => requirement.label.toLowerCase());
}

export function validatePasswordStrength(password = '') {
  const missingRequirements = getMissingPasswordRequirementLabels(password);

  if (missingRequirements.length === 0) {
    return true;
  }

  return `Le mot de passe doit contenir : ${missingRequirements.join(', ')}.`;
}

// ─── Règles react-hook-form ────────────────────────────────────────────────────

/**
 * Validator pour un champ code postal (5 chiffres).
 */
export const codePostalRules = {
  required: 'Requis',
  pattern: {
    value: CODE_POSTAL_PATTERN,
    message: '5 chiffres requis',
  },
} as const;

/**
 * Validator pour un champ téléphone français.
 */
export const phoneRules = {
  required: 'Requis',
  pattern: {
    value: PHONE_FR_PATTERN,
    message: 'Numéro invalide (ex : 06 12 34 56 78)',
  },
} as const;

/**
 * Validation e-mail volontairement simple et lineaire (sans regex complexe)
 * pour eviter les risques de backtracking excessif.
 */
export function isEmailValid(value: string): boolean {
  if (!value) return false;
  if (value.length > 254) return false;

  const atIndex = value.indexOf('@');
  if (atIndex <= 0 || atIndex !== value.lastIndexOf('@') || atIndex === value.length - 1) {
    return false;
  }

  const localPart = value.slice(0, atIndex);
  const domainPart = value.slice(atIndex + 1);

  if (localPart.length > 64) return false;
  if (!domainPart.includes('.')) return false;
  if (domainPart.startsWith('.') || domainPart.endsWith('.')) return false;

  const labels = domainPart.split('.');
  return labels.every((label) => {
    if (label.length === 0) return false;
    if (label.startsWith('-') || label.endsWith('-')) return false;

    for (const char of label) {
      const isLetter = (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
      const isDigit = char >= '0' && char <= '9';
      if (!isLetter && !isDigit && char !== '-') return false;
    }

    return true;
  });
}

export const emailRules = {
  required: 'Requis',
  validate: (value: string) => isEmailValid(value) || 'Adresse e-mail invalide',
} as const;

/**
 * Validator pour un mot de passe utilisateur.
 */
export const passwordRules = {
  required: 'Requis',
  validate: (value: string) => validatePasswordStrength(value),
} as const;

/**
 * Validator pour confirmer qu'un champ correspond bien à la valeur attendue.
 */
export function createMatchingFieldRules(
  getExpectedValue: () => string | undefined,
  mismatchMessage: string
) {
  return {
    required: 'Requis',
    validate: (value: string) => value === (getExpectedValue() ?? '') || mismatchMessage,
  } as const;
}

/**
 * Validator dédié à la confirmation du mot de passe.
 */
export function createConfirmPasswordRules(getPasswordValue: () => string | undefined) {
  return createMatchingFieldRules(getPasswordValue, 'Les mots de passe ne correspondent pas');
}


