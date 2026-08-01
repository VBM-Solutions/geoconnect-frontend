import api from './index';
import { AdresseDTO, AuthResponseDTO, BureauEtudeRegistrationResponseDTO, Civilite, ClientRegistrationResponseDTO } from '../types';

export interface LoginRequest {
  login: string;
  password: string;
}

export interface RegisterRequest {
  login: string;
  password: string;
  role: 'CLIENT';
}

export interface ClientRegistrationRequest {
  login: string;
  password: string;
  civilite: Civilite;
  nom: string;
  prenom: string;
  telContact: string;
  adresseFacturation: AdresseDTO;
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
export const registerCall = async (userData: RegisterRequest): Promise<AuthResponseDTO> => {
  const { data } = await api.post('/auth/register', userData);
  return data;
};

export const registerClientCall = async (
  registration: ClientRegistrationRequest
): Promise<ClientRegistrationResponseDTO> => {
  const { data } = await api.post('/auth/register/client', registration);
  return data;
};

export const registerBureauEtudeCall = async (
  registration: BureauEtudeRegistrationRequest
): Promise<BureauEtudeRegistrationResponseDTO> => {
  const { data } = await api.post('/auth/register/bureau-etude', registration);
  return data;
};

/** Supprime le cookie HttpOnly jwt côté backend (Max-Age=0). */
export const logoutCall = async (): Promise<void> => {
  await api.post('/auth/logout');
};
