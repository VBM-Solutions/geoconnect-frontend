import api from './index';
import { BureauEtudesDTO } from '../types';

export const createBureauEtude = async (bureau: BureauEtudesDTO) => {
  const { data } = await api.post('/bureauEtude', bureau);
  return data;
};

export const updateBureauEtude = async (bureau: BureauEtudesDTO) => {
  const { data } = await api.put('/bureauEtude', bureau);
  return data;
};

export const getBureauEtudeById = async (id: number): Promise<BureauEtudesDTO> => {
  const { data } = await api.get(`/bureauEtude/${id}`);
  return data;
};

export const getAllBureauEtude = async (): Promise<BureauEtudesDTO[]> => {
  const { data } = await api.get('/bureauEtude');
  return data;
};

/**
 * Retourne le profil Bureau d'Études de l'utilisateur connecté via GET /bureauEtude/me.
 */
export const getCurrentBureauEtude = async (): Promise<BureauEtudesDTO | null> => {
  const { data } = await api.get('/bureauEtude/me');
  return data ?? null;
};

/**
 * Retourne le profil bureau d'études de l'utilisateur connecté via GET /bureauEtude/me.
 * Le paramètre userId est conservé pour compatibilité de signature, mais n'est plus utilisé :
 * l'identité est lue depuis le JWT côté backend.
 */
export const getBureauByUserId = async (_userId: number): Promise<BureauEtudesDTO | null> => {
  return getCurrentBureauEtude();
};

export const deleteBureauEtude = async (id: number): Promise<void> => {
  await api.delete(`/bureauEtude/${id}`);
};
