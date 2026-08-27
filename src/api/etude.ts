import api from './index';
import {
  EtudeDTO,
  EtudeDetailDTO,
  EtudeDocumentsDTO,
  EvaluationEtudeDTO,
  EvaluationEtudePayload,
  StatutEvaluationEtudeDTO,
  PageResponse,
} from '../types';

export type EtudeListCategory = 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';

// ─── Transitions d'état ───────────────────────────────────────────────────────

/** BE → propose une date d'intervention */
export const proposerDateIntervention = async (id: number, dateIntervention: string, periodeIntervention: 'MATIN' | 'APRES_MIDI'): Promise<EtudeDetailDTO> => {
  const { data } = await api.patch(`/etude/${id}/proposer-date`, { dateIntervention, periodeIntervention });
  return data;
};

/** CLIENT → valide la date proposée */
export const validerDateIntervention = async (id: number): Promise<EtudeDetailDTO> => {
  const { data } = await api.patch(`/etude/${id}/valider-date`);
  return data;
};

/** CLIENT → refuse la date proposée */
export const refuserDateIntervention = async (id: number, motifRefusDateIntervention: string): Promise<EtudeDetailDTO> => {
  const { data } = await api.patch(`/etude/${id}/refuser-date`, { motifRefusDateIntervention });
  return data;
};

/** BE → marque l'intervention comme effectuée */
export const marquerInterventionEffectuee = async (id: number): Promise<EtudeDetailDTO> => {
  const { data } = await api.patch(`/etude/${id}/intervention-effectuee`);
  return data;
};

/** BE → clôture le rapport (nécessite un document déjà uploadé) — dateRendu fixée automatiquement à la date du jour par le backend */
export const terminerRapport = async (id: number, rapportId: number): Promise<EtudeDetailDTO> => {
  const { data } = await api.patch(`/etude/${id}/rapport-termine`, { rapportId });
  return data;
};

/** BE → enregistre la date de rendu prévue sans modifier l'état de l'étude */
export const definirDateRenduPrevue = async (id: number, dateRenduPrevue: string): Promise<EtudeDetailDTO> => {
  const { data } = await api.patch(`/etude/${id}/date-rendu-prevue`, { dateRenduPrevue });
  return data;
};

/** CLIENT → confirme le paiement */
export const confirmerPaiement = async (id: number): Promise<EtudeDetailDTO> => {
  const { data } = await api.patch(`/etude/${id}/paiement-effectue`);
  return data;
};

// ─── CRUD de base ─────────────────────────────────────────────────────────────

export const createEtude = async (etude: EtudeDTO) => {
  const { data } = await api.post('/etude', etude);
  return data;
};

export const updateEtude = async (etude: EtudeDTO) => {
  const { data } = await api.put('/etude', etude);
  return data;
};

export const getEtudesByBureauId = async (bureauId: number): Promise<EtudeDTO[]> => {
  const { data } = await api.get(`/etude/bureauEtude/${bureauId}`);
  return data ?? [];
};

export const getEtudesByClientId = async (clientId: number): Promise<EtudeDTO[]> => {
  const { data } = await api.get(`/etude/client/${clientId}`);
  return data ?? [];
};
export const getEtudeDetailsByBureauId = async (bureauId: number): Promise<EtudeDetailDTO[]> => {
  const { data } = await api.get(`/etude/bureauEtude/${bureauId}/details`);
  return data ?? [];
};

export const getEtudeDetailsByBureauIdPaginated = async (
  bureauId: number,
  category: EtudeListCategory,
  page = 0,
  size = 8,
): Promise<PageResponse<EtudeDetailDTO>> => {
  const { data } = await api.get<PageResponse<EtudeDetailDTO>>(`/etude/bureauEtude/${bureauId}/details/paged`, {
    params: { category, page, size },
  });
  return data;
};

export const getEtudeDetailsByClientId = async (clientId: number): Promise<EtudeDetailDTO[]> => {
  const { data } = await api.get(`/etude/client/${clientId}/details`);
  return data ?? [];
};

export const getEtudeDetailsByClientIdPaginated = async (
  clientId: number,
  category: EtudeListCategory,
  page = 0,
  size = 8,
): Promise<PageResponse<EtudeDetailDTO>> => {
  const { data } = await api.get<PageResponse<EtudeDetailDTO>>(`/etude/client/${clientId}/details/paged`, {
    params: { category, page, size },
  });
  return data;
};

export const getEtudeDetailById = async (id: number): Promise<EtudeDetailDTO> => {
  const { data } = await api.get(`/etude/${id}/detail`);
  return data;
};

export const getEtudeDocuments = async (id: number): Promise<EtudeDocumentsDTO> => {
  const { data } = await api.get(`/etude/${id}/documents`);
  return data;
};

export const getStatutEvaluation = async (id: number): Promise<StatutEvaluationEtudeDTO> => {
  const { data } = await api.get(`/etude/${id}/evaluation`);
  return data;
};

export const getEtudeIdsAEvaluer = async (): Promise<number[]> => {
  const { data } = await api.get('/etude/evaluations/a-faire');
  return data ?? [];
};

export const evaluerEtude = async (
  id: number,
  evaluation: EvaluationEtudePayload,
): Promise<EvaluationEtudeDTO> => {
  const { data } = await api.post(`/etude/${id}/evaluation`, evaluation);
  return data;
};

