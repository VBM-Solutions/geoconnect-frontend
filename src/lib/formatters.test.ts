import { describe, it, expect } from 'vitest';
import { formatDateShort, formatDateLong, buildDemandeDocuments, buildEtudeDocuments } from './formatters';
import { EtudeDetailDTO } from '../types';

// ...existing code...

describe('buildDemandeDocuments', () => {
  it('retourne un tableau vide si aucun document de demande n\'est présent', () => {
    expect(buildDemandeDocuments()).toEqual([]);
    expect(buildDemandeDocuments({ docsDevisIds: [] })).toEqual([]);
  });

  it('construit un document par id dans le même ordre', () => {
    expect(buildDemandeDocuments({ docsDevisIds: [20, 21] })).toEqual([
      { id: 20, label: 'Document de la demande #1' },
      { id: 21, label: 'Document de la demande #2' },
    ]);
  });

  it('ignore les ids null ou undefined', () => {
    expect(buildDemandeDocuments({ docsDevisIds: [20, undefined as unknown as number, 21] })).toEqual([
      { id: 20, label: 'Document de la demande #1' },
      { id: 21, label: 'Document de la demande #2' },
    ]);
  });
});

describe('buildEtudeDocuments', () => {
  it('retourne un tableau vide si aucun document n\'est présent', () => {
    const etude: EtudeDetailDTO = {};
    expect(buildEtudeDocuments(etude)).toEqual([]);
  });

  it('inclut le devis PDF de la proposition si devisPdfId est renseigné', () => {
    const etude: EtudeDetailDTO = { propositionDevis: { devisPdfId: 10 } };
    const docs = buildEtudeDocuments(etude);
    expect(docs).toHaveLength(1);
    expect(docs[0]).toEqual({ id: 10, label: 'Devis (proposition)' });
  });

  it('inclut les docs de la demande si docsDevisIds est renseigné', () => {
    const etude: EtudeDetailDTO = {
      propositionDevis: { demandeDevis: { docsDevisIds: [20, 21] } },
    };
    const docs = buildEtudeDocuments(etude);
    expect(docs).toHaveLength(2);
    expect(docs[0]).toEqual({ id: 20, label: 'Document de la demande #1' });
    expect(docs[1]).toEqual({ id: 21, label: 'Document de la demande #2' });
  });

  it('inclut le devis signé si devisSigneId est renseigné', () => {
    const etude: EtudeDetailDTO = { devisSigneId: 30 };
    const docs = buildEtudeDocuments(etude);
    expect(docs).toHaveLength(1);
    expect(docs[0]).toEqual({ id: 30, label: 'Devis signé' });
  });

  it('inclut le rapport si rapportId est renseigné', () => {
    const etude: EtudeDetailDTO = { rapportId: 40 };
    const docs = buildEtudeDocuments(etude);
    expect(docs).toHaveLength(1);
    expect(docs[0]).toEqual({ id: 40, label: 'Rapport final' });
  });

  it('inclut tous les documents disponibles et les retourne dans l\'ordre', () => {
    const etude: EtudeDetailDTO = {
      devisSigneId: 30,
      rapportId: 40,
      propositionDevis: {
        devisPdfId: 10,
        demandeDevis: { docsDevisIds: [20, 21] },
      },
    };
    const docs = buildEtudeDocuments(etude);
    expect(docs).toHaveLength(5);
    expect(docs.map(d => d.id)).toEqual([10, 20, 21, 30, 40]);
  });

  it('n\'inclut pas les entrées avec des IDs null ou undefined', () => {
    const etude: EtudeDetailDTO = {
      devisSigneId: undefined,
      rapportId: 40,
      propositionDevis: { devisPdfId: undefined },
    };
    const docs = buildEtudeDocuments(etude);
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe(40);
  });

  it('ne génère aucun nom de fichier côté client (le backend fournit nomTelechargement)', () => {
    const etude: EtudeDetailDTO = { rapportId: 99 };
    const docs = buildEtudeDocuments(etude);
    // DocumentRef ne doit contenir que id et label, sans fileName
    expect(Object.keys(docs[0])).toEqual(['id', 'label']);
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

