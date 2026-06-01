import { describe, it, expect } from 'vitest';
import {
  CODE_POSTAL_PATTERN,
  PASSWORD_DIGIT_PATTERN,
  PASSWORD_LOWERCASE_PATTERN,
  PASSWORD_MIN_LENGTH,
  PASSWORD_SPECIAL_CHAR_PATTERN,
  PASSWORD_UPPERCASE_PATTERN,
  PHONE_FR_PATTERN,
  PASSWORD_REQUIREMENTS,
  codePostalRules,
  createConfirmPasswordRules,
  emailRules,
  getMissingPasswordRequirementLabels,
  isEmailValid,
  getPasswordRequirementStatuses,
  passwordRules,
  phoneRules,
  validatePasswordStrength,
} from './validators';

// ─── CODE POSTAL ──────────────────────────────────────────────────────────────

describe('CODE_POSTAL_PATTERN', () => {
  it('accepte un code postal valide à 5 chiffres', () => {
    expect(CODE_POSTAL_PATTERN.test('75001')).toBe(true);
    expect(CODE_POSTAL_PATTERN.test('13100')).toBe(true);
    expect(CODE_POSTAL_PATTERN.test('06000')).toBe(true);
  });

  it('refuse moins de 5 chiffres', () => {
    expect(CODE_POSTAL_PATTERN.test('7500')).toBe(false);
    expect(CODE_POSTAL_PATTERN.test('750')).toBe(false);
    expect(CODE_POSTAL_PATTERN.test('7')).toBe(false);
  });

  it('refuse plus de 5 chiffres', () => {
    expect(CODE_POSTAL_PATTERN.test('750011')).toBe(false);
    expect(CODE_POSTAL_PATTERN.test('123456')).toBe(false);
  });

  it('refuse des lettres', () => {
    expect(CODE_POSTAL_PATTERN.test('ABCDE')).toBe(false);
    expect(CODE_POSTAL_PATTERN.test('7500A')).toBe(false);
  });

  it('refuse une chaîne vide', () => {
    expect(CODE_POSTAL_PATTERN.test('')).toBe(false);
  });

  it('refuse des espaces', () => {
    expect(CODE_POSTAL_PATTERN.test('750 1')).toBe(false);
    expect(CODE_POSTAL_PATTERN.test(' 75001')).toBe(false);
  });
});

// ─── TÉLÉPHONE ────────────────────────────────────────────────────────────────

describe('PHONE_FR_PATTERN', () => {
  describe('format national (sans séparateurs)', () => {
    it('accepte un numéro mobile valide', () => {
      expect(PHONE_FR_PATTERN.test('0612345678')).toBe(true);
      expect(PHONE_FR_PATTERN.test('0712345678')).toBe(true);
    });

    it('accepte un numéro fixe valide', () => {
      expect(PHONE_FR_PATTERN.test('0123456789')).toBe(true);
      expect(PHONE_FR_PATTERN.test('0456789012')).toBe(true);
    });
  });

  describe('format national avec séparateurs', () => {
    it('accepte les espaces comme séparateurs', () => {
      expect(PHONE_FR_PATTERN.test('06 12 34 56 78')).toBe(true);
      expect(PHONE_FR_PATTERN.test('01 23 45 67 89')).toBe(true);
    });

    it('accepte les points comme séparateurs', () => {
      expect(PHONE_FR_PATTERN.test('06.12.34.56.78')).toBe(true);
    });

    it('accepte les tirets comme séparateurs', () => {
      expect(PHONE_FR_PATTERN.test('06-12-34-56-78')).toBe(true);
    });
  });

  describe('format international +33', () => {
    it('accepte le format +33 sans séparateur', () => {
      expect(PHONE_FR_PATTERN.test('+33612345678')).toBe(true);
      expect(PHONE_FR_PATTERN.test('+33123456789')).toBe(true);
    });

    it('accepte le format 0033', () => {
      expect(PHONE_FR_PATTERN.test('0033612345678')).toBe(true);
    });
  });

  describe('formats invalides', () => {
    it('refuse un numéro commençant par 00 (sauf 0033)', () => {
      expect(PHONE_FR_PATTERN.test('00123456789')).toBe(false);
    });

    it('refuse un numéro trop court', () => {
      expect(PHONE_FR_PATTERN.test('061234567')).toBe(false);
      expect(PHONE_FR_PATTERN.test('0612')).toBe(false);
    });

    it('refuse un numéro trop long', () => {
      expect(PHONE_FR_PATTERN.test('06123456789')).toBe(false);
    });

    it('refuse des lettres', () => {
      expect(PHONE_FR_PATTERN.test('06ABCDEFGH')).toBe(false);
    });

    it('refuse une chaîne vide', () => {
      expect(PHONE_FR_PATTERN.test('')).toBe(false);
    });
  });
});

// ─── Règles react-hook-form ────────────────────────────────────────────────────

describe('codePostalRules', () => {
  it('contient une règle required avec message', () => {
    expect(codePostalRules.required).toBe('Requis');
  });

  it('contient un pattern correspondant à CODE_POSTAL_PATTERN', () => {
    expect(codePostalRules.pattern.value).toBe(CODE_POSTAL_PATTERN);
    expect(codePostalRules.pattern.message).toBe('5 chiffres requis');
  });
});

describe('phoneRules', () => {
  it('contient une règle required avec message', () => {
    expect(phoneRules.required).toBe('Requis');
  });

  it('contient un pattern correspondant à PHONE_FR_PATTERN', () => {
    expect(phoneRules.pattern.value).toBe(PHONE_FR_PATTERN);
    expect(typeof phoneRules.pattern.message).toBe('string');
  });
});

describe('isEmailValid', () => {
  it('accepte un email valide simple', () => {
    expect(isEmailValid('utilisateur@domaine.fr')).toBe(true);
  });

  it('refuse les emails sans arobase ou avec plusieurs arobase', () => {
    expect(isEmailValid('utilisateur.domaine.fr')).toBe(false);
    expect(isEmailValid('a@b@c.fr')).toBe(false);
  });

  it('refuse un domaine invalide', () => {
    expect(isEmailValid('user@domaine')).toBe(false);
    expect(isEmailValid('user@-domaine.fr')).toBe(false);
    expect(isEmailValid('user@domaine-.fr')).toBe(false);
  });
});

describe('emailRules', () => {
  it('contient une regle required avec message', () => {
    expect(emailRules.required).toBe('Requis');
  });

  it('retourne true pour un email valide', () => {
    expect(emailRules.validate('valide@geo-connect.fr')).toBe(true);
  });

  it('retourne un message pour un email invalide', () => {
    expect(emailRules.validate('invalide')).toBe('Adresse e-mail invalide');
  });
});

describe('passwordRules', () => {
  it('contient une règle required avec message', () => {
    expect(passwordRules.required).toBe('Requis');
  });

  it('valide un mot de passe robuste', () => {
    expect(passwordRules.validate('MotDePasse!123')).toBe(true);
  });

  it('retourne un message détaillé si des critères sont manquants', () => {
    expect(passwordRules.validate('motdepasse')).toBe(
      'Le mot de passe doit contenir : une majuscule, un chiffre, un caractère spécial.'
    );
  });
});

describe('règles de robustesse du mot de passe', () => {
  it('expose les 5 critères attendus', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
    expect(PASSWORD_REQUIREMENTS).toHaveLength(5);
  });

  it('détecte correctement chaque type de caractère requis', () => {
    expect(PASSWORD_UPPERCASE_PATTERN.test('A')).toBe(true);
    expect(PASSWORD_UPPERCASE_PATTERN.test('a')).toBe(false);
    expect(PASSWORD_LOWERCASE_PATTERN.test('a')).toBe(true);
    expect(PASSWORD_LOWERCASE_PATTERN.test('A')).toBe(false);
    expect(PASSWORD_DIGIT_PATTERN.test('1')).toBe(true);
    expect(PASSWORD_DIGIT_PATTERN.test('a')).toBe(false);
    expect(PASSWORD_SPECIAL_CHAR_PATTERN.test('!')).toBe(true);
    expect(PASSWORD_SPECIAL_CHAR_PATTERN.test('A')).toBe(false);
    expect(PASSWORD_SPECIAL_CHAR_PATTERN.test(' ')).toBe(false);
  });

  it('retourne les statuts détaillés des critères', () => {
    expect(getPasswordRequirementStatuses('Abcdefgh')).toEqual([
      expect.objectContaining({ key: 'minLength', isMet: true }),
      expect.objectContaining({ key: 'uppercase', isMet: true }),
      expect.objectContaining({ key: 'lowercase', isMet: true }),
      expect.objectContaining({ key: 'digit', isMet: false }),
      expect.objectContaining({ key: 'specialChar', isMet: false }),
    ]);
  });

  it('liste uniquement les critères manquants', () => {
    expect(getMissingPasswordRequirementLabels('Abcdefgh')).toEqual([
      'un chiffre',
      'un caractère spécial',
    ]);
  });

  it('valide un mot de passe complet', () => {
    expect(validatePasswordStrength('Abcdef!1')).toBe(true);
  });

  it('explique clairement les critères manquants', () => {
    expect(validatePasswordStrength('abcdefghi')).toBe(
      'Le mot de passe doit contenir : une majuscule, un chiffre, un caractère spécial.'
    );
  });
});

describe('createConfirmPasswordRules', () => {
  it('retourne une règle required avec message', () => {
    const rules = createConfirmPasswordRules(() => 'MotDePasse!123');
    expect(rules.required).toBe('Requis');
  });

  it('accepte une confirmation identique', () => {
    const rules = createConfirmPasswordRules(() => 'MotDePasse!123');
    expect(rules.validate('MotDePasse!123')).toBe(true);
  });

  it('retourne le message attendu si les mots de passe diffèrent', () => {
    const rules = createConfirmPasswordRules(() => 'MotDePasse!123');
    expect(rules.validate('AutreMotDePasse!123')).toBe('Les mots de passe ne correspondent pas');
  });
});

