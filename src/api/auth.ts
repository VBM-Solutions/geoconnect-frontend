import api from './index';
import { AdresseDTO, AuthResponseDTO, BureauEtudeRegistrationResponseDTO, Civilite, ClientRegistrationResponseDTO, DemandeDevisDTO } from '../types';

export interface LoginRequest {
  login: string;
  password: string;
}

export interface ClientRegistrationRequest {
  login: string;
  password: string;
  civilite: Civilite;
  nom: string;
  prenom: string;
  telContact: string;
  adresseFacturation: AdresseDTO;
  demande: Omit<DemandeDevisDTO, 'id' | 'clientId' | 'docsDevisIds' | 'documentsDevis'>;
}

export interface BureauEtudeRegistrationRequest {
  login: string;
  password: string;
  raisonSociale: string;
  telContact: string;
  adresse: AdresseDTO;
}

/** Retourne { userId, login, role } — le JWT est posé en cookie HttpOnly par le backend. */
export const loginCall = async (credentials: LoginRequest): Promise<AuthResponseDTO> => {
  const { data } = await api.post('/auth/login', credentials);
  return data;
};

/** Retourne { userId, login, role } — le JWT est posé en cookie HttpOnly par le backend. */
export const registerClientCall = async (
  registration: ClientRegistrationRequest,
  documents: File[] = [],
): Promise<ClientRegistrationResponseDTO> => {
  const body = new FormData();
  body.append('registration', new Blob([JSON.stringify(registration)], { type: 'application/json' }));
  documents.forEach(document => body.append('documents', document));
  // Laisser le navigateur définir multipart/form-data avec sa boundary.
  const { data } = await api.post('/auth/register/client', body, {
    headers: { 'Content-Type': undefined as any },
  });
  return data;
};

export const registerBureauEtudeCall = async (
  registration: BureauEtudeRegistrationRequest
): Promise<BureauEtudeRegistrationResponseDTO> => {
  const { data } = await api.post('/auth/register/bureau-etude', registration);
  return data;
};

export const confirmEmailCall = async (token: string): Promise<void> => {
  await api.post('/auth/email-verifications/confirm', { token });
};

export const resendVerificationEmailCall = async (login: string): Promise<void> => {
  await api.post('/auth/email-verifications/resend', { login });
};

/** Supprime le cookie HttpOnly jwt côté backend (Max-Age=0). */
export const logoutCall = async (): Promise<void> => {
  await api.post('/auth/logout');
};
