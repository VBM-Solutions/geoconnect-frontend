import api from './index';
import { PlanningDTO } from '../types';

export async function getMyPlanning(start: string, end: string): Promise<PlanningDTO> {
  const { data } = await api.get<PlanningDTO>('/planning/be/me', { params: { start, end } });
  return data;
}
