import { describe, it, expect } from 'vitest';
import { buildDemandePayload, mapFormFieldsToPayloadBase } from './demandePayload';

describe('demandePayload', () => {
  describe('mapFormFieldsToPayloadBase', () => {
    it('extrait les champs de base depuis les données du formulaire', () => {
      const data = {
        delaiMaxSouhaite: '8',
        type: 'G0',
        description: 'Test',
        nombreLot: '2',
        superficie: '500',
      };

      const base = mapFormFieldsToPayloadBase(data);

      expect(base).toStrictEqual({
        delaiMaxSouhaite: '8',
        type: 'G0',
        description: 'Test',
        nombreLot: '2',
        superficie: '500',
      });
    });

    it('gère les champs absents ou null', () => {
      const base = mapFormFieldsToPayloadBase({
        type: 'G2_PRO',
        description: undefined,
      });

      expect(base.delaiMaxSouhaite).toBeUndefined();
      expect(base.nombreLot).toBeUndefined();
      expect(base.superficie).toBeUndefined();
      expect(base.type).toBe('G2_PRO');
      expect(base.description).toBeUndefined();
    });
  });

  describe('buildDemandePayload', () => {
    it('construit un payload complet avec conversion numérique', () => {
      const payload = buildDemandePayload({
        clientId: 42,
        delaiMaxSouhaite: '8',
        type: 'G0' as const,
        description: 'Ma description',
        nombreLot: '2',
        referencesCadastrales: ['AB 0042'],
        superficie: '500',
        rueProjet: '12 rue de la Paix',
        codePostalProjet: '75001',
        villeProjet: 'Paris',
      });

      expect(payload).toStrictEqual({
        clientId: 42,
        delaiMaxSouhaite: 8,
        type: 'G0',
        description: 'Ma description',
        nombreLot: 2,
        referencesCadastrales: ['AB 0042'],
        superficie: 500,
        adresseProjet: {
          rue: '12 rue de la Paix',
          codePostal: '75001',
          ville: 'Paris',
        },
      });
    });

    it('ignore les champs numériques vides', () => {
      const payload = buildDemandePayload({
        clientId: 1,
        type: 'G0' as const,
        referencesCadastrales: [],
        rueProjet: 'Rue A',
        codePostalProjet: '01000',
        villeProjet: 'Bourg',
      });

      expect(payload.delaiMaxSouhaite).toBeUndefined();
      expect(payload.nombreLot).toBeUndefined();
      expect(payload.superficie).toBeUndefined();
    });

    it('filtre les références cadastrales vides', () => {
      const payload = buildDemandePayload({
        clientId: 1,
        type: 'G0' as const,
        referencesCadastrales: ['AB 0042', '', 'CD 0099', '  '],
        rueProjet: 'Rue A',
        codePostalProjet: '01000',
        villeProjet: 'Bourg',
      });

      expect(payload.referencesCadastrales).toStrictEqual(['AB 0042', 'CD 0099']);
    });
  });
});
