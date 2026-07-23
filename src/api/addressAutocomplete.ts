import api from './index';
import { AddressSuggestionDTO } from '../types';

export async function searchAddressSuggestions(
  text: string,
  limit = 8,
): Promise<AddressSuggestionDTO[]> {
  const { data } = await api.get<AddressSuggestionDTO[]>('/adresses/autocomplete', {
    params: { text, limit },
  });
  return data.map(normalizeAddressSuggestion);
}

export function normalizeAddressSuggestion(suggestion: AddressSuggestionDTO): AddressSuggestionDTO {
  return {
    ...suggestion,
    rue: enrichStreetFromLabel(suggestion.rue, suggestion.label, suggestion.codePostal, suggestion.ville),
  };
}

function enrichStreetFromLabel(
  rue: string | undefined,
  label: string,
  codePostal?: string,
  ville?: string,
): string | undefined {
  if (!label?.trim()) return rue;
  if (startsWithHouseNumber(rue)) return rue;

  let candidate = label.trim();
  if (codePostal) {
    const postalIndex = candidate.indexOf(codePostal);
    if (postalIndex > 0) {
      candidate = candidate.slice(0, postalIndex).trim();
    }
  } else if (ville) {
    const cityIndex = candidate.toLowerCase().lastIndexOf(ville.toLowerCase());
    if (cityIndex > 0) {
      candidate = candidate.slice(0, cityIndex).trim();
    }
  }

  candidate = trimTrailingSeparators(candidate);
  return startsWithHouseNumber(candidate) ? candidate : rue;
}

function trimTrailingSeparators(value: string): string {
  let end = value.length;
  while (end > 0 && isTrailingStreetSeparator(value[end - 1])) {
    end -= 1;
  }
  return value.slice(0, end).trim();
}

function startsWithHouseNumber(value: string | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;

  const firstCharCode = trimmed.codePointAt(0);
  return firstCharCode >= 48 && firstCharCode <= 57;
}

function isTrailingStreetSeparator(char: string): boolean {
  return char === ',' || char === ';' || char.trim() === '';
}
