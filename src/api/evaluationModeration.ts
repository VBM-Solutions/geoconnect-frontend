import api from './index';
import {
  EvaluationSignaleeDTO,
  MotifSignalementEvaluation,
} from '../types';

export async function signalerEvaluation(
  evaluationId: number,
  motif: MotifSignalementEvaluation,
  details?: string,
): Promise<EvaluationSignaleeDTO> {
  const { data } = await api.post<EvaluationSignaleeDTO>(
    `/bureauEtude/me/evaluations/${evaluationId}/signalement`,
    { motif, details: details?.trim() || undefined },
  );
  return data;
}

export async function listerEvaluationsSignalees(): Promise<EvaluationSignaleeDTO[]> {
  const { data } = await api.get<EvaluationSignaleeDTO[]>('/admin/evaluations/signalees');
  return data ?? [];
}

export async function modererEvaluation(
  evaluationId: number,
  decision: 'MASQUER' | 'CONSERVER',
): Promise<EvaluationSignaleeDTO> {
  const { data } = await api.patch<EvaluationSignaleeDTO>(
    `/admin/evaluations/${evaluationId}/moderation`,
    { decision },
  );
  return data;
}
