import api from './index';
import { AdresseDTO, BureauEtudesDTO, ClientDTO, EmailNotificationPreferencesDTO, NotificationPreferencesDTO } from '../types';

export interface MotDePassePayload {
  ancienMotDePasse: string;
  nouveauMotDePasse: string;
}

export type ClientMotDePassePayload = MotDePassePayload;

/**
 * Récupère les préférences de notification de l'utilisateur connecté.
 * GET /parametres/bureau/me/notifications  (rôle requis : BUREAU_ETUDE)
 */
export async function getNotificationPreferences(): Promise<NotificationPreferencesDTO> {
  const { data } = await api.get<NotificationPreferencesDTO>('/parametres/bureau/me/notifications');
  return data;
}

/**
 * Met à jour les préférences de notification de l'utilisateur connecté.
 * PUT /parametres/bureau/me/notifications  (rôle requis : BUREAU_ETUDE)
 *
 * @param prefs - Nouvelles préférences. `notifierTousDepartements` est obligatoire (@NotNull côté back).
 * @returns Les préférences telles que persistées par le serveur.
 */
export async function updateNotificationPreferences(
  prefs: NotificationPreferencesDTO,
): Promise<NotificationPreferencesDTO> {
  const { data } = await api.put<NotificationPreferencesDTO>('/parametres/bureau/me/notifications', prefs);
  return data;
}

export async function getEmailNotificationPreferences(): Promise<EmailNotificationPreferencesDTO> {
  const { data } = await api.get<EmailNotificationPreferencesDTO>('/parametres/me/notifications-email');
  return data;
}

export async function updateEmailNotificationPreferences(
  preferences: EmailNotificationPreferencesDTO,
): Promise<EmailNotificationPreferencesDTO> {
  const { data } = await api.put<EmailNotificationPreferencesDTO>(
    '/parametres/me/notifications-email', preferences,
  );
  return data;
}

/**
 * Récupère le profil client connecté via GET /parametres/client/me/profil.
 */
export async function getClientProfil(): Promise<ClientDTO> {
  const { data } = await api.get<ClientDTO>('/parametres/client/me/profil');
  return data;
}

/**
 * Met à jour le téléphone du client connecté via PUT /parametres/client/me/telephone.
 */
export async function updateClientTelephone(telephone: string): Promise<ClientDTO> {
  const { data } = await api.put<ClientDTO>('/parametres/client/me/telephone', { telephone });
  return data;
}

/**
 * Met à jour l'adresse de facturation du client connecté via PUT /parametres/client/me/adresse-facturation.
 * Le champ `id` éventuel est volontairement ignoré.
 */
export async function updateClientAdresseFacturation(
  adresse: Pick<AdresseDTO, 'rue' | 'codePostal' | 'ville'>,
): Promise<ClientDTO> {
  const { data } = await api.put<ClientDTO>('/parametres/client/me/adresse-facturation', adresse);
  return data;
}

/**
 * Met à jour le mot de passe du client connecté via PUT /parametres/client/me/mot-de-passe.
 */
export async function updateClientMotDePasse(payload: ClientMotDePassePayload): Promise<void> {
  await api.put('/parametres/client/me/mot-de-passe', payload);
}

/**
 * Met à jour l'IBAN du Bureau d'Études connecté via PUT /parametres/bureau/me/iban.
 */
export async function updateBureauEtudeIban(iban: string): Promise<BureauEtudesDTO> {
  const { data } = await api.put<BureauEtudesDTO>('/parametres/bureau/me/iban', { iban });
  return data;
}

/**
 * Met à jour le mot de passe du Bureau d'Études connecté via PUT /parametres/bureau/me/mot-de-passe.
 */
export async function updateBureauEtudeMotDePasse(payload: MotDePassePayload): Promise<void> {
  await api.put('/parametres/bureau/me/mot-de-passe', payload);
}

