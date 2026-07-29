import api from './index';
import {
  FicheBureauEtudeDTO,
  ProfilPublicBureauEtudeDTO,
  UpdateProfilPublicBureauEtudePayload,
} from '../types';

const PROFIL_PATH = '/bureauEtude/me/profil-public';

export async function getMaFicheBureauEtude(): Promise<FicheBureauEtudeDTO> {
  const { data } = await api.get<FicheBureauEtudeDTO>('/bureauEtude/me/fiche');
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
