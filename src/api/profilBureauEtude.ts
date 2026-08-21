import api from './index';
import {
  FicheBureauEtudeDTO,
  ProfilPublicBureauEtudeDTO,
  UpdateProfilPublicBureauEtudePayload,
  PerformanceBureauEtudeDTO,
} from '../types';

const PROFIL_PATH = '/bureauEtude/me/profil-public';

export async function getMaFicheBureauEtude(): Promise<FicheBureauEtudeDTO> {
  const { data } = await api.get<FicheBureauEtudeDTO>('/bureauEtude/me/fiche');
  return data;
}

export async function getMaPerformance(debut: string, fin: string): Promise<PerformanceBureauEtudeDTO> {
  const { data } = await api.get<PerformanceBureauEtudeDTO>('/bureauEtude/me/performance', {
    params: { debut, fin },
  });
  return data;
}

export async function updateMonProfilPublic(
  payload: UpdateProfilPublicBureauEtudePayload,
): Promise<ProfilPublicBureauEtudeDTO> {
  const { data } = await api.put<ProfilPublicBureauEtudeDTO>(PROFIL_PATH, payload);
  return data;
}

export async function publierMonProfilPublic(): Promise<ProfilPublicBureauEtudeDTO> {
  const { data } = await api.post<ProfilPublicBureauEtudeDTO>(`${PROFIL_PATH}/publier`);
  return data;
}

export async function depublierMonProfilPublic(): Promise<ProfilPublicBureauEtudeDTO> {
  const { data } = await api.post<ProfilPublicBureauEtudeDTO>(`${PROFIL_PATH}/depublier`);
  return data;
}

export async function uploadMediaProfil(
  type: 'LOGO' | 'BANNIERE',
  file: File,
): Promise<ProfilPublicBureauEtudeDTO> {
  const formData = new FormData();
  formData.append('type', type);
  formData.append('file', file);
  const { data } = await api.post<ProfilPublicBureauEtudeDTO>(`${PROFIL_PATH}/media`, formData, {
    // Laisser le navigateur ajouter la boundary multipart.
    headers: { 'Content-Type': undefined as any },
  });
  return data;
}

export async function downloadMediaProfil(documentId: number): Promise<Blob> {
  const { data } = await api.get<Blob>(`/public/profil-media/${documentId}`, { responseType: 'blob' });
  return data;
}
