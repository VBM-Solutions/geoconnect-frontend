import { useState } from 'react';
import { AlertTriangle, BadgeCheck, Star } from 'lucide-react';
import { MotifSignalementEvaluation, SyntheseEvaluationsDTO } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { signalerEvaluation } from '../../api/evaluationModeration';
import { useToast } from '../../contexts/ToastContext';

const MOTIFS: Array<{ value: MotifSignalementEvaluation; label: string }> = [
  { value: 'DONNEES_PERSONNELLES', label: 'Données personnelles' },
  { value: 'PROPOS_INJURIEUX', label: 'Propos injurieux' },
  { value: 'CONTENU_HORS_SUJET', label: 'Contenu hors sujet' },
  { value: 'INFORMATION_FAUSSE', label: 'Information manifestement fausse' },
  { value: 'AUTRE', label: 'Autre motif' },
];

export function ProfilBureauEtudeEvaluations({
  evaluations,
}: Readonly<{ evaluations?: SyntheseEvaluationsDTO }>) {
  const { toastError, toastSuccess } = useToast();
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number>();
  const [motif, setMotif] = useState<MotifSignalementEvaluation>('DONNEES_PERSONNELLES');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statuts, setStatuts] = useState<Record<number, string>>({});

  if (!evaluations) return null;
  if (evaluations.nombreEvaluations === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Avis clients</CardTitle></CardHeader>
        <CardContent className="text-xs text-slate-500">
          Aucun avis pour le moment. Les clients pourront vous noter après la clôture de leur étude.
        </CardContent>
      </Card>
    );
  }

  const criteres = [
    ['Qualité des échanges', evaluations.qualiteEchanges],
    ['Respect des délais', evaluations.respectDelais],
    ['Qualité du rapport', evaluations.qualiteRapport],
    ['Adéquation au besoin', evaluations.adequationBesoin],
  ] as const;

  const submitSignalement = async () => {
    if (selectedEvaluationId == null || submitting) return;
    setSubmitting(true);
    try {
      const resultat = await signalerEvaluation(selectedEvaluationId, motif, details);
      setStatuts(current => ({ ...current, [selectedEvaluationId]: resultat.statut }));
      setSelectedEvaluationId(undefined);
      setDetails('');
      toastSuccess('Le commentaire a été transmis à la modération.');
    } catch {
      toastError("Le signalement n'a pas pu être enregistré.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Avis clients</span>
          <span className="flex items-center gap-1 text-amber-600">
            <Star className="h-4 w-4 fill-current" aria-hidden="true" />
            {Number(evaluations.noteGlobale).toFixed(1)}/5
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-slate-500">
          Moyenne calculée sur {evaluations.nombreEvaluations} étude{evaluations.nombreEvaluations > 1 ? 's' : ''} vérifiée{evaluations.nombreEvaluations > 1 ? 's' : ''}.
        </p>
        <dl className="grid gap-2 sm:grid-cols-2">
          {criteres.map(([label, valeur]) => (
            <div key={label} className="flex justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-xs">
              <dt className="text-slate-600">{label}</dt>
              <dd className="font-bold text-slate-900">{Number(valeur).toFixed(1)}</dd>
            </div>
          ))}
        </dl>
        {evaluations.avis.length > 0 && (
          <div className="space-y-3 border-t border-slate-100 pt-4">
            {evaluations.avis.map(avis => {
              const statut = avis.evaluationId == null
                ? avis.statutSignalement
                : statuts[avis.evaluationId] ?? avis.statutSignalement;
              return (
                <article key={`${avis.createdAt}-${avis.commentaire}`} className="rounded-md border border-slate-100 p-3 text-xs">
                  <div className="flex items-center gap-2 font-semibold text-slate-800">
                    <span>{Number(avis.noteGlobale).toFixed(1)}/5</span>
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Étude vérifiée
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-slate-600">{avis.commentaire}</p>
                  {avis.evaluationId != null && (
                    <div className="mt-2">
                      {statut === 'EN_ATTENTE' ? (
                        <span className="inline-flex items-center gap-1 text-amber-700">
                          <AlertTriangle className="h-3.5 w-3.5" /> Signalement en cours d’examen
                        </span>
                      ) : (statut == null || statut === 'AUCUN') && (
                        <button
                          type="button"
                          onClick={() => setSelectedEvaluationId(avis.evaluationId)}
                          className="font-semibold text-slate-500 hover:text-red-700 hover:underline"
                        >
                          Signaler ce commentaire
                        </button>
                      )}
                    </div>
                  )}
                  {selectedEvaluationId === avis.evaluationId && (
                    <div className="mt-3 space-y-2 rounded-md bg-slate-50 p-3">
                      <label className="block font-semibold text-slate-700">
                        Motif
                        <select
                          value={motif}
                          onChange={event => setMotif(event.target.value as MotifSignalementEvaluation)}
                          className="mt-1 block w-full rounded border border-slate-300 bg-white px-2 py-1.5"
                        >
                          {MOTIFS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="block font-semibold text-slate-700">
                        Précisions <span className="font-normal text-slate-400">(facultatif)</span>
                        <textarea
                          value={details}
                          onChange={event => setDetails(event.target.value)}
                          maxLength={1000}
                          rows={2}
                          className="mt-1 block w-full rounded border border-slate-300 bg-white px-2 py-1.5"
                        />
                      </label>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={submitSignalement} isLoading={submitting}>
                          Envoyer le signalement
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSelectedEvaluationId(undefined)}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
