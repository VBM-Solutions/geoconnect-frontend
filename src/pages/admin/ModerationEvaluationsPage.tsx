import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, EyeOff } from 'lucide-react';
import {
  listerEvaluationsSignalees,
  modererEvaluation,
} from '../../api/evaluationModeration';
import { EvaluationSignaleeDTO } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useToast } from '../../contexts/ToastContext';

const MOTIF_LABELS: Record<string, string> = {
  DONNEES_PERSONNELLES: 'Données personnelles',
  PROPOS_INJURIEUX: 'Propos injurieux',
  CONTENU_HORS_SUJET: 'Contenu hors sujet',
  INFORMATION_FAUSSE: 'Information manifestement fausse',
  AUTRE: 'Autre motif',
};

export default function ModerationEvaluationsPage() {
  const { toastError, toastSuccess } = useToast();
  const [evaluations, setEvaluations] = useState<EvaluationSignaleeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number>();

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      setEvaluations(await listerEvaluationsSignalees());
    } catch {
      toastError('Impossible de charger les signalements.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    charger();
  }, [charger]);

  const decider = async (evaluationId: number, decision: 'MASQUER' | 'CONSERVER') => {
    setProcessingId(evaluationId);
    try {
      await modererEvaluation(evaluationId, decision);
      setEvaluations(current => current.filter(item => item.id !== evaluationId));
      toastSuccess(decision === 'MASQUER'
        ? 'Le commentaire est désormais masqué.'
        : 'Le commentaire est conservé.');
    } catch {
      toastError("La décision de modération n'a pas pu être enregistrée.");
    } finally {
      setProcessingId(undefined);
    }
  };

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Modération des avis</h1>
        <p className="mt-1 text-sm text-slate-500">
          Les notes vérifiées sont conservées ; seule la visibilité du commentaire est modérée.
        </p>
      </header>

      {loading && (
        <p className="text-sm text-slate-500">Chargement des signalements…</p>
      )}
      {!loading && evaluations.length === 0 && (
        <Card>
          <CardContent className="flex items-center gap-2 py-8 text-sm text-emerald-700">
            <CheckCircle2 className="h-5 w-5" /> Aucun commentaire en attente.
          </CardContent>
        </Card>
      )}
      {!loading && evaluations.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {evaluations.map(evaluation => (
            <Card key={evaluation.id} className="border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Étude #{evaluation.etudeId}
                  </span>
                  <span className="text-amber-700">{Number(evaluation.noteGlobale).toFixed(1)}/5</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <blockquote className="rounded-md bg-slate-50 p-3 text-slate-700">
                  {evaluation.commentaire}
                </blockquote>
                <p><strong>Motif :</strong> {MOTIF_LABELS[evaluation.motif] ?? evaluation.motif}</p>
                {evaluation.details && <p><strong>Précisions :</strong> {evaluation.details}</p>}
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    isLoading={processingId === evaluation.id}
                    onClick={() => decider(evaluation.id, 'MASQUER')}
                  >
                    <EyeOff className="mr-1.5 h-4 w-4" /> Masquer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={processingId === evaluation.id}
                    onClick={() => decider(evaluation.id, 'CONSERVER')}
                  >
                    Conserver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
