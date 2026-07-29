import {
  ProfilPublicBureauEtudeDTO,
  UpdateProfilPublicBureauEtudePayload,
} from '../types';

export function toProfilPublicPayload(
  profil: ProfilPublicBureauEtudeDTO,
): UpdateProfilPublicBureauEtudePayload {
  return {
    descriptionCourte: profil.descriptionCourte ?? '',
    descriptionLongue: profil.descriptionLongue ?? '',
    siteWeb: profil.siteWeb ?? '',
    anneesExperience: profil.anneesExperience,
    telephonePublic: profil.telephonePublic ?? '',
    emailPublic: profil.emailPublic ?? '',
    afficherAdresseComplete: profil.afficherAdresseComplete,
    typesEtude: [...profil.typesEtude],
    zonesIntervention: [...profil.zonesIntervention],
  };
}

export function getProfilValidationErrors(
  profil: UpdateProfilPublicBureauEtudePayload,
): string[] {
  const errors: string[] = [];
  if ((profil.descriptionCourte?.length ?? 0) > 300) {
    errors.push('La présentation courte dépasse 300 caractères.');
  }
  if ((profil.descriptionLongue?.length ?? 0) > 5000) {
    errors.push('La présentation détaillée dépasse 5000 caractères.');
  }
  if (profil.siteWeb && !/^https?:\/\/.+/i.test(profil.siteWeb)) {
    errors.push('Le site web doit commencer par http:// ou https://.');
  }
  if (profil.emailPublic && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profil.emailPublic)) {
    errors.push('L’adresse e-mail publique est invalide.');
  }
  if (
    profil.anneesExperience != null
    && (!Number.isInteger(profil.anneesExperience)
      || profil.anneesExperience < 0
      || profil.anneesExperience > 200)
  ) {
    errors.push('Le nombre d’années d’expérience doit être compris entre 0 et 200.');
  }
  return errors;
}

export function getPublicationRequirements(
  profil: UpdateProfilPublicBureauEtudePayload,
): string[] {
  const requirements = [...getProfilValidationErrors(profil)];
  if ((profil.descriptionCourte?.trim().length ?? 0) < 40) {
    requirements.push('Rédiger une présentation courte d’au moins 40 caractères.');
  }
  if (profil.typesEtude.length === 0) {
    requirements.push('Sélectionner au moins un type d’étude.');
  }
  if (profil.zonesIntervention.length === 0) {
    requirements.push('Sélectionner au moins un département d’intervention.');
  }
  return requirements;
}
