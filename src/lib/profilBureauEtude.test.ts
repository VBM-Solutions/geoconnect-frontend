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

  it('normalise les champs éditoriaux absents', () => {
    const profile = {
      ...validDraft,
      slug: 'geo-44',
      statut: 'BROUILLON',
      raisonSociale: 'Geo 44',
      descriptionCourte: null,
      descriptionLongue: undefined,
      siteWeb: null,
      telephonePublic: undefined,
      emailPublic: null,
    } as unknown as ProfilPublicBureauEtudeDTO;

    expect(toProfilPublicPayload(profile)).toMatchObject({
      descriptionCourte: '',
      descriptionLongue: '',
      siteWeb: '',
      telephonePublic: '',
      emailPublic: '',
    });
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

  it('contrôle les limites des descriptions', () => {
    expect(getProfilValidationErrors({
      ...validDraft,
      descriptionCourte: 'a'.repeat(301),
      descriptionLongue: 'b'.repeat(5001),
    })).toEqual([
      'La présentation courte dépasse 300 caractères.',
      'La présentation détaillée dépasse 5000 caractères.',
    ]);
  });

  it.each([
    '@geo.example',
    'contact@@geo.example',
    'contact@.example',
    'contact@geo.',
    'contact @geo.example',
  ])('refuse l’adresse publique invalide %s', emailPublic => {
    expect(getProfilValidationErrors({ ...validDraft, emailPublic })).toContain(
      'L’adresse e-mail publique est invalide.',
    );
  });

  it.each([1.5, -1, 201])('refuse le nombre d’années d’expérience %s', anneesExperience => {
    expect(getProfilValidationErrors({ ...validDraft, anneesExperience })).toContain(
      'Le nombre d’années d’expérience doit être compris entre 0 et 200.',
    );
  });

  it('accepte les coordonnées facultatives et une expérience non renseignée', () => {
    expect(getProfilValidationErrors({
      ...validDraft,
      siteWeb: '',
      emailPublic: '',
      anneesExperience: null,
    })).toEqual([]);
  });

  it('accepte aussi une description détaillée absente', () => {
    expect(getProfilValidationErrors({
      ...validDraft,
      descriptionLongue: undefined,
    })).toEqual([]);
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

  it('demande une présentation lorsque celle-ci est absente', () => {
    expect(getPublicationRequirements({
      ...validDraft,
      descriptionCourte: undefined,
    })).toContain('Rédiger une présentation courte d’au moins 40 caractères.');
  });
});
