import { describe, expect, it } from 'vitest';
import { FAQ_ITEMS, STUDY_CARDS, TRUST_ITEMS } from './landingContent';

describe('landingContent', () => {
  it('reprend uniquement les réassurances prévues par la spécification', () => {
    expect(TRUST_ITEMS).toEqual([
      'Demande gratuite',
      'Sans engagement',
      'Bureaux d’études qualifiés',
      'Suivi en ligne',
      'Documents centralisés',
    ]);
  });

  it('associe chaque étude au code attendu par le tunnel', () => {
    expect(STUDY_CARDS.map(({ code }) => code)).toEqual([
      'ASSAINISSEMENT',
      'G0',
      'G1_ES_PGC',
      'G1_ELAN',
      'G2_AVP',
      'G2_PRO',
      'G5',
    ]);
  });

  it('contient les trois questions et réponses validées', () => {
    expect(FAQ_ITEMS).toHaveLength(3);
    expect(FAQ_ITEMS[0].answer).toContain('Un système de notation des bureaux d’études partenaires');
    expect(FAQ_ITEMS[1].answer).toContain('Les informations détaillées du bureau d’étude');
    expect(FAQ_ITEMS[2]).toMatchObject({
      question: 'Comment se déroule le suivi du projet ?',
      answer: 'Un système de suivi et de notification vous informe des diverses avancées de votre projet.',
    });
  });
});
