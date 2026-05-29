import React, { useState, useEffect } from 'react';
import { FileText, Eye, Download, Loader2 } from 'lucide-react';
import { DocumentRef, DocumentDTO } from '../../types';
import { openDocument, downloadDocument, getAllDocuments } from '../../api/document';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { useToast } from '../../contexts/ToastContext';

interface DocumentListProps {
  readonly documents: DocumentRef[];
  /** Affiche le titre de la carte. Défaut : true */
  readonly showCard?: boolean;
}

export function DocumentList({ documents, showCard = true }: DocumentListProps) {
  const { toastError } = useToast();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  /** Map id → DocumentDTO pour accéder à nomTelechargement */
  const [dtoMap, setDtoMap] = useState<Map<number, DocumentDTO>>(new Map());

  useEffect(() => {
    if (documents.length === 0) return;
    const ids = new Set(documents.map(d => d.id));
    getAllDocuments()
      .then(all => {
        const map = new Map<number, DocumentDTO>();
        all.filter(d => d.id != null && ids.has(d.id!)).forEach(d => map.set(d.id!, d));
        setDtoMap(map);
      })
      .catch(() => {
        // Échec silencieux : les actions restent disponibles, sans nomTelechargement
      });
  }, [documents]);

  if (documents.length === 0) return null;

  const handle = async (action: () => void | Promise<void>, docId: number) => {
    setLoadingId(docId);
    try {
      await Promise.resolve(action());
    } catch {
      toastError('Impossible d\'ouvrir/télécharger ce document. Veuillez réessayer.');
    } finally {
      setLoadingId(null);
    }
  };

  const list = (
    <ul className="space-y-2">
      {documents.map((doc) => {
        const isBusy = loadingId === doc.id;
        const dto = dtoMap.get(doc.id);
        const nom = dto?.nomTelechargement;
        return (
          <li
            key={doc.id}
            className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100"
          >
            <span className="flex items-center gap-2 text-xs font-medium text-slate-700 min-w-0">
              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate" title={nom}>
                {/* Affiche nomTelechargement (ex: DUPONT_JEAN-G1-RAPPORT.pdf) dès qu'il est chargé */}
                {nom ?? doc.label}
              </span>
            </span>
            <span className="flex items-center gap-1 shrink-0">
              {isBusy ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              ) : (
                <>
                  <button
                    title="Ouvrir"
                    onClick={() => handle(() => openDocument(doc.id, nom), doc.id)}
                    className="p-1 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    title="Télécharger"
                    onClick={() => handle(() => downloadDocument(doc.id, nom), doc.id)}
                    className="p-1 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );

  if (!showCard) return list;

  return (
    <Card>
      <CardHeader className="pb-2 border-b border-slate-100">
        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <FileText className="w-3 h-3" /> Documents de l'étude
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3">
        {list}
      </CardContent>
    </Card>
  );
}
