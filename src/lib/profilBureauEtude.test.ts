import { describe, expect, it } from 'vitest';
import {
  getProfilValidationErrors,
  getPublicationRequirements,
  toProfilPublicPayload,
} from './profilBureauEtude';
import { ProfilPublicBureauEtudeDTO, UpdateProfilPublicBureauEtudePayload } from '../types';

const validDraft: UpdateProfilPublicBureauEtudePayload = {
  descriptionCourte: 'Bureau spécialisé dans les études géotechniques pour vos projets.',
  descriptionLongue: '',
  siteWeb: 'https://geo.example',
  anneesExperience: 12,
  telephonePublic: '',
  emailPublic: 'contact@geo.example',
  afficherAdresseComplete: false,
  typesEtude: ['G2_AVP'],
  zonesIntervention: ['44'],
};

describe('profilBureauEtude', () => {
  it('transforme le profil serveur en brouillon indépendant', () => {
    const profile = {
      ...validDraft,
      slug: 'geo-44',
      statut: 'BROUILLON',
      raisonSociale: 'Geo 44',
    } satisfies ProfilPublicBureauEtudeDTO;

    const draft = toProfilPublicPayload(profile);
    draft.typesEtude.push('G5');

    expect(profile.typesEtude).toEqual(['G2_AVP']);
    expect(draft.descriptionCourte).toBe(profile.descriptionCourte);
  });

  it('valide les formats modifiables indépendamment de la publication', () => {
    expect(getProfilValidationErrors({
      ...validDraft,
      siteWeb: 'geo.example',
      emailPublic: 'invalide',
      anneesExperience: 201,
    })).toHaveLength(3);
    expect(getProfilValidationErrors(validDraft)).toEqual([]);
  });

  it('liste les informations requises pour publier', () => {
    expect(getPublicationRequirements({
      ...validDraft,
      descriptionCourte: 'Trop court',
      typesEtude: [],
      zonesIntervention: [],
    })).toHaveLength(3);
    expect(getPublicationRequirements(validDraft)).toEqual([]);
  });
});
