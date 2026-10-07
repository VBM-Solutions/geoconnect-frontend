import api from './index';
import { PropositionDevisDTO } from '../types';

export const createPropositionDevis = async (proposition: PropositionDevisDTO) => {
  const { data } = await api.post('/propositionDevis', proposition);
  return data;
};

export interface ModificationPropositionPayload {
  prix: number;
  montantHT?: number;
  tauxTVA?: number;
  devise?: string;
  fraisDeplacementHT?: number;
  fraisDeplacementInclus?: boolean;
  inclusions?: string[];
  exclusions?: string[];
  validiteOffreJusquAu?: string;
  delaiMaxIntervention: number;
  delaiMaxRendu: number;
  documentId?: number;
}

export const modifierPropositionDevis = async (id: number, payload: ModificationPropositionPayload): Promise<PropositionDevisDTO> => {
  const { data } = await api.patch<PropositionDevisDTO>(`/propositionDevis/${id}`, payload);
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
  const { data } = await api.patch<{ etudeId: number }>(`/propositionDevis/${id}/accepter`);
  return data;
};

export type MotifRefusProposition = 'PRIX' | 'DELAI_INTERVENTION' | 'DELAI_RENDU' | 'PERIMETRE_INADAPTE' | 'AUTRE_BUREAU_PREFERE' | 'PROJET_REPORTE_OU_ANNULE' | 'AUTRE';

export const refuserPropositionDevis = async (id: number, motif?: MotifRefusProposition, commentaire?: string) => {
  const { data } = motif
    ? await api.patch(`/propositionDevis/${id}/refuser`, { motif, commentaire })
    : await api.patch(`/propositionDevis/${id}/refuser`);
  return data;
};

export const deletePropositionDevis = async (id: number): Promise<void> => {
  await api.delete(`/propositionDevis/${id}`);
};
