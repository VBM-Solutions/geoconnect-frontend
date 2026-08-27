import api from './index';
import { DevisVersionDTO } from '../types';

export const getDevisVersions = async (etudeId: number): Promise<DevisVersionDTO[]> =>
  (await api.get(`/etude/${etudeId}/devis-versions`)).data ?? [];

export const proposerDevisVersion = async (etudeId: number, file: File): Promise<DevisVersionDTO> => {
  const data = new FormData();
  data.append('file', file);
  return (await api.post(`/etude/${etudeId}/devis-versions`, data, {
    // Supprime le Content-Type JSON par défaut ; le navigateur ajoute la boundary multipart.
    headers: { 'Content-Type': undefined as any },
  })).data;
};

export const deposerDernierDevisSigne = async (etudeId: number, file: File): Promise<void> => {
  const data = new FormData(); data.append('file', file);
  await api.post(`/etude/${etudeId}/devis-versions/signe`, data, {
    headers: { 'Content-Type': undefined as any },
  });
};
export const validerDernierDevisSigne = async (etudeId: number): Promise<void> => {
  await api.patch(`/etude/${etudeId}/devis-versions/signe/validation`);
};
export const refuserDernierDevisSigne = async (etudeId: number): Promise<void> => {
  await api.delete(`/etude/${etudeId}/devis-versions/signe`);
};
