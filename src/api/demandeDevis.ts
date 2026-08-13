import api from './index';
import { BEDemandePageItemDTO, DemandeDetailDTO, DemandeDevisDTO, PageResponse } from '../types';

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

export const getDemandeDetail = async (id: number): Promise<DemandeDetailDTO> => {
  const { data } = await api.get<DemandeDetailDTO>(`/demandeDevis/${id}/detail`);
  return data;
};

export const getOpenDemandesClientPaginated = async (
  page = 0,
  size = 8,
): Promise<PageResponse<DemandeDevisDTO>> => {
  const { data } = await api.get<PageResponse<DemandeDevisDTO>>('/demandeDevis/client/open/paged', {
    params: { page, size },
  });
  return data;
};

export const getBureauEtudeWorkItemsPaginated = async (
  category: 'AVAILABLE' | 'PENDING',
  page = 0,
  size = 8,
  departments: string[] = [],
): Promise<PageResponse<BEDemandePageItemDTO>> => {
  const { data } = await api.get<PageResponse<BEDemandePageItemDTO>>('/demandeDevis/bureauEtude/work-items/paged', {
    params: { category, page, size, departments: departments.length ? departments : undefined },
  });
  return data;
};

export const deleteDemandeDevis = async (id: number): Promise<void> => {
  await api.delete(`/demandeDevis/${id}`);
};
