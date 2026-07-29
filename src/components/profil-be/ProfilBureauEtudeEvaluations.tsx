import { BadgeCheck, Star } from 'lucide-react';
import { SyntheseEvaluationsDTO } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export function ProfilBureauEtudeEvaluations({
  evaluations,
}: Readonly<{ evaluations?: SyntheseEvaluationsDTO }>) {
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
            {evaluations.avis.map(avis => (
              <article key={`${avis.createdAt}-${avis.commentaire}`} className="text-xs">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <span>{Number(avis.noteGlobale).toFixed(1)}/5</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Étude vérifiée
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-line text-slate-600">{avis.commentaire}</p>
              </article>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
