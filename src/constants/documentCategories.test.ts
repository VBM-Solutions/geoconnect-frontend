import { describe, expect, it } from 'vitest';
import { categoriesForStudy, categoryShortLabel } from './documentCategories';

describe('categoriesForStudy', () => {
  it('retourne uniquement les catégories universelles pour G0', () => {
    expect(categoriesForStudy('G0')).not.toContain('PLAN_ARCHITECTURAL');
    expect(categoriesForStudy('G0')).toContain('AUTRE');
  });

  it('expose les catégories propres à la mission', () => {
    expect(categoriesForStudy('G2_PRO')).toEqual(expect.arrayContaining(['PLAN_ARCHITECTURAL', 'PLAN_BET_DDC']));
    expect(categoriesForStudy('G5')).toContain('RAPPORT_ASSURANCE');
    expect(categoriesForStudy('G2_AVP')).not.toContain('ETUDES_G2_AVP_PRO');
  });

  it('gère une mission absente et les libellés courts', () => {
    expect(categoriesForStudy()).toContain('EXTRAIT_CADASTRAL');
    expect(categoryShortLabel('AUTRE')).toBe('Autre');
    expect(categoryShortLabel('PLAN_SITUATION')).toBe('Plan de situation');
  });
});
