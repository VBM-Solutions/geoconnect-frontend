import { describe, expect, it } from 'vitest';
import { formatDelaiWithProjection } from './delaiProjection';

describe('formatDelaiWithProjection', () => {
  it('retourne un tiret si le delai est absent', () => {
    expect(formatDelaiWithProjection()).toBe('—');
  });

  it('retourne le delai seul si la projection est absente', () => {
    expect(formatDelaiWithProjection(4)).toBe('4 sem');
  });

  it('ajoute le restant et le label de projection', () => {
    expect(formatDelaiWithProjection(4, {
      label: 'entre le 26/01/2026 et le 01/02/2026',
      semainesRestantes: 2,
    })).toBe('4 sem (reste environ 2 sem, entre le 26/01/2026 et le 01/02/2026)');
  });

  it('affiche un delai echu', () => {
    expect(formatDelaiWithProjection(1, {
      label: 'entre le 05/01/2026 et le 11/01/2026',
      semainesRestantes: -1,
    })).toBe('1 sem (échu, entre le 05/01/2026 et le 11/01/2026)');
  });

  it('affiche seulement le label si le restant est absent', () => {
    expect(formatDelaiWithProjection(3, {
      label: 'entre le 19/01/2026 et le 25/01/2026',
    })).toBe('3 sem (entre le 19/01/2026 et le 25/01/2026)');
  });

  it('affiche moins d une semaine restante', () => {
    expect(formatDelaiWithProjection(2, {
      label: 'entre le 12/01/2026 et le 18/01/2026',
      semainesRestantes: 0,
    })).toBe('2 sem (reste moins d\'une semaine, entre le 12/01/2026 et le 18/01/2026)');
  });

  it('affiche une semaine restante au singulier', () => {
    expect(formatDelaiWithProjection(2, {
      label: 'entre le 12/01/2026 et le 18/01/2026',
      semainesRestantes: 1,
    })).toBe('2 sem (reste environ 1 sem, entre le 12/01/2026 et le 18/01/2026)');
  });
});
