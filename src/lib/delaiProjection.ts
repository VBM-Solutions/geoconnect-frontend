import { DelaiProjectionDTO } from '../types';

export function formatDelaiWithProjection(
  delaiSemaines?: number,
  projection?: DelaiProjectionDTO,
): string {
  if (delaiSemaines == null) return '—';

  const base = `${delaiSemaines} sem`;
  if (!projection?.label) return base;

  const remaining = formatRemaining(projection.semainesRestantes);
  return `${base} (${remaining ? `${remaining}, ` : ''}${projection.label})`;
}

function formatRemaining(semainesRestantes?: number): string | null {
  if (semainesRestantes == null) return null;
  if (semainesRestantes < 0) return 'échu';
  if (semainesRestantes === 0) return 'reste moins d\'une semaine';
  if (semainesRestantes === 1) return 'reste environ 1 sem';
  return `reste environ ${semainesRestantes} sem`;
}
