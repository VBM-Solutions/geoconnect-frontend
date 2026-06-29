import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { DocumentDTO } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { downloadDocument } from '../../api/document';
import { useToast } from '../../contexts/ToastContext';

interface RapportDownloadCardProps {
  rapport: DocumentDTO;
}

/**
 * Carte CTA dédiée au téléchargement du rapport final.
 * Affichée uniquement post-paiement (PAIEMENT_EFFECTUE) quand le rapport est disponible.
 */
export function RapportDownloadCard({ rapport }: Readonly<RapportDownloadCardProps>) {
  const { toastError } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!rapport.id) return;
    setIsDownloading(true);
    try {
      await downloadDocument(rapport.id, rapport.nomTelechargement);
    } catch {
      toastError('Impossible de télécharger le rapport. Veuillez réessayer.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-2 border-b border-blue-100">
        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Rapport final
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-3 space-y-2">
        <p className="text-xs text-blue-800">
          Votre étude est terminée. Le rapport final est disponible ci-dessous.
        </p>
        <Button
          onClick={handleDownload}
          isLoading={isDownloading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Télécharger mon rapport
        </Button>
      </CardContent>
    </Card>
  );
}
