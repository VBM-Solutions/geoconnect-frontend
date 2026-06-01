import { describe, expect, it } from 'vitest';
import {
  getApiMessage,
  normalizeText,
  paginateUtilisateurs,
  roleBadgeClass,
  sortUtilisateurs,
} from '../../lib/adminUsers';
import { UtilisateurDTO } from '../../types';

const utilisateurs: UtilisateurDTO[] = [
  { id: 1, login: 'zeta@test.fr', role: 'CLIENT', enabled: false, createdAt: '2026-02-10T09:00:00' },
  { id: 2, login: 'alpha@test.fr', role: 'ADMIN', enabled: true, createdAt: '2026-01-10T09:00:00' },
  { id: 3, login: 'beta@test.fr', role: 'BUREAU_ETUDE', enabled: true, createdAt: '2026-03-10T09:00:00' },
];

describe('adminUtils', () => {
  it('retourne le message backend prioritairement', () => {
    const value = getApiMessage({ response: { data: { message: 'Erreur backend' } } }, 'Fallback');
    expect(value).toBe('Erreur backend');
  });

  it('retourne fallback si aucun message', () => {
    expect(getApiMessage({}, 'Fallback')).toBe('Fallback');
  });

  it('normalise le texte', () => {
    expect(normalizeText('  TEST@Mail.FR  ')).toBe('test@mail.fr');
  });

  it('retourne la classe de badge selon le role', () => {
    expect(roleBadgeClass('ADMIN')).toContain('border-red-200');
    expect(roleBadgeClass('BUREAU_ETUDE')).toContain('border-violet-200');
    expect(roleBadgeClass('CLIENT')).toContain('border-blue-200');
  });

  it('trie par login asc et desc', () => {
    const asc = sortUtilisateurs(utilisateurs, 'login', 'asc');
    const desc = sortUtilisateurs(utilisateurs, 'login', 'desc');

    expect(asc.map((u) => u.login)).toEqual(['alpha@test.fr', 'beta@test.fr', 'zeta@test.fr']);
    expect(desc.map((u) => u.login)).toEqual(['zeta@test.fr', 'beta@test.fr', 'alpha@test.fr']);
  });

  it('trie par role selon l ordre metier', () => {
    const sorted = sortUtilisateurs(utilisateurs, 'role', 'asc');
    expect(sorted.map((u) => u.role)).toEqual(['CLIENT', 'BUREAU_ETUDE', 'ADMIN']);
  });

  it('trie par statut et date', () => {
    const byStatus = sortUtilisateurs(utilisateurs, 'status', 'asc');
    const byDate = sortUtilisateurs(utilisateurs, 'createdAt', 'desc');

    expect(byStatus[0].enabled).toBe(false);
    expect(byDate[0].createdAt).toBe('2026-03-10T09:00:00');
  });

  it('pagine correctement et borne le numero de page', () => {
    const page1 = paginateUtilisateurs(utilisateurs, 1, 2);
    const page99 = paginateUtilisateurs(utilisateurs, 99, 2);

    expect(page1.totalPages).toBe(2);
    expect(page1.items).toHaveLength(2);
    expect(page99.items).toHaveLength(1);
  });

  it('retourne une pagination vide stable si liste vide', () => {
    expect(paginateUtilisateurs([], 1, 10)).toEqual({ items: [], totalPages: 1 });
  });
});


