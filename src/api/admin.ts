import api from './index';
import { CreerUtilisateurPayload, UtilisateurDTO } from '../types';

const BASE_ADMIN_UTILISATEURS = '/admin/utilisateurs';

export const listerUtilisateurs = async (): Promise<UtilisateurDTO[]> => {
  const { data } = await api.get(BASE_ADMIN_UTILISATEURS);
  return data;
};

export const getUtilisateur = async (id: number): Promise<UtilisateurDTO> => {
  const { data } = await api.get(`${BASE_ADMIN_UTILISATEURS}/${id}`);
  return data;
};

export const creerUtilisateur = async (payload: CreerUtilisateurPayload): Promise<UtilisateurDTO> => {
  const { data } = await api.post(BASE_ADMIN_UTILISATEURS, payload);
  return data;
};

export const activerUtilisateur = async (id: number): Promise<void> => {
  await api.patch(`${BASE_ADMIN_UTILISATEURS}/${id}/activer`);
};

export const desactiverUtilisateur = async (id: number): Promise<void> => {
  await api.patch(`${BASE_ADMIN_UTILISATEURS}/${id}/desactiver`);
};

export const reinitialiserMotDePasse = async (id: number, nouveauMotDePasse: string): Promise<void> => {
  await api.patch(`${BASE_ADMIN_UTILISATEURS}/${id}/password`, { nouveauMotDePasse });
};

