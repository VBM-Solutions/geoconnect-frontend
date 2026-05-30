import api from './index';
import { DocumentDTO } from '../types';

/**
 * Upload un fichier standalone → retourne un DocumentDTO avec son id et nomTelechargement.
 * NE PAS définir Content-Type manuellement, axios le fait automatiquement avec le bon boundary.
 */
export const uploadDocument = async (file: File): Promise<DocumentDTO> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': undefined as any },
  });
  return data;
};

/**
 * Upload plusieurs documents et retourne la liste des ids créés.
 * L'ordre retourné suit l'ordre de sélection des fichiers.
 */
export const uploadDocuments = async (files: File[]): Promise<number[]> => {
  const documentIds: number[] = [];

  for (const file of files) {
    const uploaded = await uploadDocument(file);
    if (uploaded.id == null) {
      throw new Error(`Document uploadé sans identifiant pour le fichier "${file.name}".`);
    }
    documentIds.push(uploaded.id);
  }

  return documentIds;
};

export const getAllDocuments = async (): Promise<DocumentDTO[]> => {
  const { data } = await api.get('/documents');
  return data;
};

/**
 * Déclenche le téléchargement du fichier dans le navigateur.
 * Passer nomTelechargement (issu du DocumentDTO) comme nom — aucune logique de nommage côté front.
 */
export const downloadDocument = async (documentId: number, nomTelechargement?: string): Promise<void> => {
  const res = await api.get(`/documents/${documentId}/download`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomTelechargement ?? `document-${documentId}`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Ouvre le document dans un nouvel onglet.
 * Le cookie HttpOnly jwt est envoyé automatiquement par le navigateur —
 * aucun trick de token nécessaire depuis la migration vers les cookies.
 */
export const openDocument = (documentId: number, nomTelechargement?: string): void => {
  const fileName = encodeURIComponent(nomTelechargement ?? `document-${documentId}.pdf`);
  window.open(`/api/documents/${documentId}/download/${fileName}`, '_blank');
};

export const deleteDocument = async (documentId: number): Promise<void> => {
  await api.delete(`/documents/${documentId}`);
};
