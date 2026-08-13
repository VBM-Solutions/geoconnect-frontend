import api from './index';
import { PropositionDevisDTO } from '../types';

export const createPropositionDevis = async (proposition: PropositionDevisDTO) => {
  const { data } = await api.post('/propositionDevis', proposition);
  return data;
};

export const getAllPropositionDevis = async (): Promise<PropositionDevisDTO[]> => {
  const { data } = await api.get('/propositionDevis');
  return data;
};

export const getPropositionDevisById = async (id: number): Promise<PropositionDevisDTO> => {
  const { data } = await api.get(`/propositionDevis/${id}`);
  return data;
};

export const getPropositionDevisByDemandeId = async (demandeId: number): Promise<PropositionDevisDTO[]> => {
  const { data } = await api.get(`/propositionDevis/devis/${demandeId}`);
  return data;
};

export type PropositionsByDemandeId = Record<number, PropositionDevisDTO[]>;

export const getPropositionsByDemandeIds = async (
  demandeIds: number[],
): Promise<PropositionsByDemandeId> => {
  if (demandeIds.length === 0) return {};
  const ids = [...new Set(demandeIds)];
  const { data } = await api.get<PropositionsByDemandeId>('/propositionDevis/devis', {
    params: { ids: ids.join(',') },
  });
  return data ?? {};
};

export const getPropositionDevisByBureauId = async (bureauId: number): Promise<PropositionDevisDTO[]> => {
  const { data } = await api.get(`/propositionDevis/bureauEtude/${bureauId}`);
  return data;
};

export const accepterPropositionDevis = async (id: number) => {
  const { data } = await api.patch(`/propositionDevis/${id}/accepter`);
  return data;
};

export const refuserPropositionDevis = async (id: number) => {
  const { data } = await api.patch(`/propositionDevis/${id}/refuser`);
  return data;
};

export const deletePropositionDevis = async (id: number): Promise<void> => {
  await api.delete(`/propositionDevis/${id}`);
};
