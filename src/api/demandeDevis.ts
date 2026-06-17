import api from './index';
import { DemandeDevisDTO } from '../types';

export const createDemandeDevis = async (demande: DemandeDevisDTO) => {
  const { data } = await api.post('/demandeDevis', demande);
  return data;
};

export const updateDemandeDevis = async (demande: DemandeDevisDTO) => {
  const { data } = await api.put('/demandeDevis', demande);
  return data;
};

export const getDemandeDevisById = async (id: number): Promise<DemandeDevisDTO> => {
  const { data } = await api.get(`/demandeDevis/${id}`);
  return data;
};

export const getAllDemandeDevis = async (): Promise<DemandeDevisDTO[]> => {
  const { data } = await api.get('/demandeDevis');
  return data;
};

export const deleteDemandeDevis = async (id: number): Promise<void> => {
  await api.delete(`/demandeDevis/${id}`);
};
