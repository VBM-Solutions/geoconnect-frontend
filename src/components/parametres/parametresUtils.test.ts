import { describe, it, expect } from 'vitest';
import {
  CODE_POSTAL_REGEX,
  IBAN_REGEX,
  TELEPHONE_REGEX,
  formatIban,
  getBackendErrorMessage,
  getBackendFieldError,
  getBackendValidationPayload,
  isNonEmpty,
  isValidCodePostal,
  isValidTelephone,
  normalizeIban,
} from './parametresUtils';

describe('parametresUtils', () => {
  it('valide les téléphones conformes et refuse les formats invalides', () => {
    expect(TELEPHONE_REGEX.test('0698765432')).toBe(true);
    expect(isValidTelephone('06 98 76 54 32')).toBe(true);
    expect(isValidTelephone('06')).toBe(false);
    expect(isValidTelephone('')).toBe(false);
  });

  it('valide les codes postaux à exactement 5 chiffres', () => {
    expect(CODE_POSTAL_REGEX.test('75001')).toBe(true);
    expect(isValidCodePostal('75001')).toBe(true);
    expect(isValidCodePostal('7500')).toBe(false);
    expect(isValidCodePostal('75A01')).toBe(false);
  });

  it('normalise et formate l IBAN en groupes de 4 caractères', () => {
    expect(normalizeIban(' fr76 3000 6000 0112 3456 7890 189 ')).toBe('FR7630006000011234567890189');
    expect(formatIban('fr76 3000 6000 0112 3456 7890 189')).toBe('FR76 3000 6000 0112 3456 7890 189');
    expect(formatIban('')).toBe('');
    expect(IBAN_REGEX.test('FR7630006000011234567890189')).toBe(true);
  });

  it('détecte les champs et messages backend', () => {
    const error = {
      response: {
        data: {
          typeError: 'VALIDATION_ERROR',
          message: 'L\'ancien mot de passe est incorrect',
          errors: {
            telephone: 'Le numéro de téléphone est invalide',
            iban: 'IBAN invalide',
          },
        },
      },
    };

    expect(getBackendValidationPayload(error)).toEqual(error.response.data);
    expect(getBackendFieldError(error, 'telephone')).toBe('Le numéro de téléphone est invalide');
    expect(getBackendFieldError(error, 'iban')).toBe('IBAN invalide');
    expect(getBackendFieldError(error, 'ancienMotDePasse')).toBe("L'ancien mot de passe est incorrect");
    expect(getBackendErrorMessage(error, 'fallback')).toBe("L'ancien mot de passe est incorrect");
  });

  it('retourne les valeurs par défaut si aucune erreur backend exploitable n est présente', () => {
    expect(isNonEmpty('  x ')).toBe(true);
    expect(isNonEmpty('   ')).toBe(false);
    expect(getBackendValidationPayload(new Error('boom'))).toBeNull();
    expect(getBackendFieldError(new Error('boom'), 'telephone')).toBeNull();
    expect(getBackendErrorMessage(new Error('boom'), 'Message générique')).toBe('Message générique');
  });
});

