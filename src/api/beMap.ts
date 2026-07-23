import api from './index';
import { BEMapDTO, BEMapFilters } from '../types';

export const getBEMapData = async (filters: BEMapFilters = {}): Promise<BEMapDTO> => {
  const { data } = await api.get('/bureauEtude/me/carte', { params: filters });
  return data;
};
