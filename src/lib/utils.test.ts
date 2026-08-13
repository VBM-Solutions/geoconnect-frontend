import { describe, it, expect } from 'vitest';
import { cn, extractCodeDepartement, extractErrorMessage, getPublicApiError } from './utils';

describe('messages d’erreur publics', () => {
  it('préfère le message API, puis le message natif, puis le fallback', () => {
    expect(extractErrorMessage({ response: { data: { message: 'API' } } })).toBe('API');
    expect(extractErrorMessage(new Error('Native'))).toBe('Native');
    expect(extractErrorMessage(null, 'Secours')).toBe('Secours');
  });

  it('retourne le code et le message public non vide de l’API', () => {
    expect(getPublicApiError({ response: { data: {
      code: 'INVALID_CREDENTIALS', message: 'Identifiants incorrects',
    } } }, 'Secours')).toEqual({ code: 'INVALID_CREDENTIALS', message: 'Identifiants incorrects' });
  });

  it('utilise le fallback pour un message absent, vide ou non textuel', () => {
    expect(getPublicApiError({}, 'Secours')).toEqual({ code: undefined, message: 'Secours' });
    expect(getPublicApiError({ response: { data: { message: '   ' } } }, 'Secours').message).toBe('Secours');
    expect(getPublicApiError({ response: { data: { message: 42 } } }, 'Secours').message).toBe('Secours');
  });
});

describe('cn', () => {
  it('retourne une chaîne vide si aucun argument', () => {
    expect(cn()).toBe('');
  });

  it('concatène des classes simples', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('ignore les valeurs falsy (undefined, null, false)', () => {
    expect(cn('foo', undefined, null, false, 'bar')).toBe('foo bar');
  });

  it('fusionne les classes Tailwind contradictoires (tailwind-merge)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('fusionne correctement les variantes de couleur', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('gère les objets de classe conditionnels (clsx)', () => {
    expect(cn({ 'font-bold': true, 'italic': false })).toBe('font-bold');
  });

  it('gère les tableaux de classes (clsx)', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });
});

// ─── extractCodeDepartement ───────────────────────────────────────────────────

describe('extractCodeDepartement', () => {
  // ── Cas invalides ────────────────────────────────────────────────────────────

  it('retourne null pour une chaîne vide', () => {
    expect(extractCodeDepartement('')).toBeNull();
  });

  it('retourne null pour null', () => {
    expect(extractCodeDepartement(null)).toBeNull();
  });

  it('retourne null pour undefined', () => {
    expect(extractCodeDepartement(undefined)).toBeNull();
  });

  it('retourne null pour un CP d\'un seul caractère', () => {
    expect(extractCodeDepartement('7')).toBeNull();
  });

  // ── Métropole standard ───────────────────────────────────────────────────────

  it('extrait "75" pour Paris (75000)', () => {
    expect(extractCodeDepartement('75000')).toBe('75');
  });

  it('extrait "01" pour l\'Ain (01000)', () => {
    expect(extractCodeDepartement('01000')).toBe('01');
  });

  it('extrait "92" pour les Hauts-de-Seine (92100)', () => {
    expect(extractCodeDepartement('92100')).toBe('92');
  });

  it('extrait "33" pour la Gironde (33000)', () => {
    expect(extractCodeDepartement('33000')).toBe('33');
  });

  it('extrait "69" pour le Rhône (69001)', () => {
    expect(extractCodeDepartement('69001')).toBe('69');
  });

  // ── Corse ────────────────────────────────────────────────────────────────────

  it('extrait "2A" pour Corse-du-Sud CP 20000', () => {
    expect(extractCodeDepartement('20000')).toBe('2A');
  });

  it('extrait "2A" pour Corse-du-Sud CP 20100 (Ajaccio)', () => {
    expect(extractCodeDepartement('20100')).toBe('2A');
  });

  it('extrait "2A" pour Corse-du-Sud CP 20190', () => {
    expect(extractCodeDepartement('20190')).toBe('2A');
  });

  it('extrait "2B" pour Haute-Corse CP 20200 (Bastia)', () => {
    expect(extractCodeDepartement('20200')).toBe('2B');
  });

  it('extrait "2B" pour Haute-Corse CP 20600', () => {
    expect(extractCodeDepartement('20600')).toBe('2B');
  });

  // ── DOM-TOM ──────────────────────────────────────────────────────────────────

  it('extrait "971" pour la Guadeloupe (97100)', () => {
    expect(extractCodeDepartement('97100')).toBe('971');
  });

  it('extrait "972" pour la Martinique (97200)', () => {
    expect(extractCodeDepartement('97200')).toBe('972');
  });

  it('extrait "973" pour la Guyane (97300)', () => {
    expect(extractCodeDepartement('97300')).toBe('973');
  });

  it('extrait "974" pour La Réunion (97400)', () => {
    expect(extractCodeDepartement('97400')).toBe('974');
  });

  it('extrait "976" pour Mayotte (97600)', () => {
    expect(extractCodeDepartement('97600')).toBe('976');
  });

  it('extrait "975" pour Saint-Pierre-et-Miquelon (97500)', () => {
    expect(extractCodeDepartement('97500')).toBe('975');
  });

  // ── Cohérence métropole proche du prefixe 97 ─────────────────────────────────

  it('ne confond pas "79" (Deux-Sèvres) avec un DOM-TOM', () => {
    expect(extractCodeDepartement('79000')).toBe('79');
  });

  it('CP de 2 chars exactement retourne les 2 chars', () => {
    expect(extractCodeDepartement('97')).toBe('97');
  });
});
