import { describe, expect, it, vi } from 'vitest';
import { normalizeAddressSuggestion, searchAddressSuggestions } from './addressAutocomplete';
import api from './index';

vi.mock('./index', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('addressAutocomplete api', () => {
  it('appelle GET /adresses/autocomplete avec le texte et la limite', async () => {
    const suggestions = [{ label: '12 Rue de la Paix 75001 Paris', rue: '12 Rue de la Paix' }];
    (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: suggestions });

    const result = await searchAddressSuggestions('12 rue paix', 5);

    expect(api.get).toHaveBeenCalledWith('/adresses/autocomplete', {
      params: { text: '12 rue paix', limit: 5 },
    });
    expect(result).toEqual(suggestions);
  });

  it('ajoute le numero dans rue depuis le label quand il manque dans la suggestion', async () => {
    const result = normalizeAddressSuggestion({
      label: '12 Rue de la Paix 75001 Paris',
      rue: 'Rue de la Paix',
      codePostal: '75001',
      ville: 'Paris',
    });

    expect(result.rue).toBe('12 Rue de la Paix');
  });

  it('retire la virgule de fin quand la rue est extraite depuis le label', async () => {
    const result = normalizeAddressSuggestion({
      label: '12 Rue de la Paix, 75001 Paris',
      rue: 'Rue de la Paix',
      codePostal: '75001',
      ville: 'Paris',
    });

    expect(result.rue).toBe('12 Rue de la Paix');
  });

  it('extrait la rue depuis le label avec la ville quand le code postal est absent', async () => {
    const result = normalizeAddressSuggestion({
      label: '12 Rue de la Paix Paris',
      rue: 'Rue de la Paix',
      ville: 'Paris',
    });

    expect(result.rue).toBe('12 Rue de la Paix');
  });

  it('ne duplique pas le numero quand rue le contient deja', async () => {
    const result = normalizeAddressSuggestion({
      label: '12 Rue de la Paix 75001 Paris',
      rue: '12 Rue de la Paix',
      codePostal: '75001',
      ville: 'Paris',
    });

    expect(result.rue).toBe('12 Rue de la Paix');
  });

  it('conserve la rue existante quand le label est vide', async () => {
    const result = normalizeAddressSuggestion({
      label: '',
      rue: 'Rue de la Paix',
      codePostal: '75001',
      ville: 'Paris',
    });

    expect(result.rue).toBe('Rue de la Paix');
  });

  it('conserve la rue existante quand le label ne permet pas de retrouver un numero', async () => {
    const result = normalizeAddressSuggestion({
      label: 'Rue de la Paix Paris',
      rue: 'Rue de la Paix',
      ville: 'Paris',
    });

    expect(result.rue).toBe('Rue de la Paix');
  });

  it('retire les separateurs de fin meme sans code postal reconnu', async () => {
    const result = normalizeAddressSuggestion({
      label: '12 Rue de la Paix,',
      rue: 'Rue de la Paix',
      codePostal: '99999',
    });

    expect(result.rue).toBe('12 Rue de la Paix');
  });
});
