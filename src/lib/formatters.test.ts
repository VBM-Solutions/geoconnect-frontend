import { describe, it, expect } from 'vitest';
import { formatDateShort, formatDateLong, buildDemandeDocuments } from './formatters';

// ...existing code...

describe('buildDemandeDocuments', () => {
  it('retourne un tableau vide si aucun document de demande n\'est présent', () => {
    expect(buildDemandeDocuments()).toEqual([]);
    expect(buildDemandeDocuments({ documentsDevis: [] })).toEqual([]);
  });

  it('retourne les documents enrichis par le backend dans le même ordre', () => {
    expect(buildDemandeDocuments({ documentsDevis: [
      { id: 20, nomTelechargement: 'DUPONT_JEAN-G1_ES_PGC-DOCS_CLIENT_1.pdf' },
      { id: 21, nomTelechargement: 'DUPONT_JEAN-G1_ES_PGC-DOCS_CLIENT_2.png' },
    ] })).toEqual([
      { id: 20, nomTelechargement: 'DUPONT_JEAN-G1_ES_PGC-DOCS_CLIENT_1.pdf' },
      { id: 21, nomTelechargement: 'DUPONT_JEAN-G1_ES_PGC-DOCS_CLIENT_2.png' },
    ]);
  });

  it('retourne un tableau vide si le champ enrichi est absent', () => {
    expect(buildDemandeDocuments({ documentsDevis: undefined })).toEqual([]);
  });
});

describe('formatDateShort', () => {
  it('retourne "—" si la valeur est undefined', () => {
    expect(formatDateShort(undefined)).toBe('—');
  });

  it('retourne "—" si la valeur est une chaîne vide', () => {
    expect(formatDateShort('')).toBe('—');
  });

  it('retourne "—" si la date est invalide', () => {
    expect(formatDateShort('not-a-date')).toBe('—');
  });

  it('formate une date ISO valide en dd/MM/yyyy', () => {
    expect(formatDateShort('2024-03-15T00:00:00Z')).toBe('15/03/2024');
  });

  it('formate correctement le 1er janvier', () => {
    expect(formatDateShort('2023-01-01T00:00:00Z')).toBe('01/01/2023');
  });
});

describe('formatDateLong', () => {
  it('retourne null si la valeur est undefined', () => {
    expect(formatDateLong(undefined)).toBeNull();
  });

  it('retourne null si la valeur est une chaîne vide', () => {
    expect(formatDateLong('')).toBeNull();
  });

  it('retourne null si la date est invalide', () => {
    expect(formatDateLong('invalid')).toBeNull();
  });

  it('formate une date ISO valide en français (dd MMMM yyyy)', () => {
    const result = formatDateLong('2024-03-15T00:00:00Z');
    expect(result).toMatch(/15 mars 2024/);
  });

  it('formate correctement un mois en minuscules (locale fr)', () => {
    const result = formatDateLong('2024-12-25T00:00:00Z');
    expect(result).toMatch(/25 décembre 2024/);
  });
});

