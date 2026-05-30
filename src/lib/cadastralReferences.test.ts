import { describe, expect, it } from 'vitest';
import {
  CADASTRAL_REFERENCE_PLACEHOLDER,
  EMPTY_CADASTRAL_REFERENCE,
  normalizeReferencesCadastrales,
} from './cadastralReferences';

describe('cadastralReferences', () => {
  it('expose les constantes partagées de saisie', () => {
    expect(EMPTY_CADASTRAL_REFERENCE).toBe('');
    expect(CADASTRAL_REFERENCE_PLACEHOLDER).toBe('Ex : AB 0042');
  });

  it('normalise les références cadastrales avant soumission', () => {
    expect(normalizeReferencesCadastrales([' AB 0042 ', '', '  ', 'CD 0099'])).toEqual([
      'AB 0042',
      'CD 0099',
    ]);
  });

  it('retourne un tableau vide si aucune référence exploitable n’est saisie', () => {
    expect(normalizeReferencesCadastrales(['', '   '])).toEqual([]);
    expect(normalizeReferencesCadastrales()).toEqual([]);
  });
});

