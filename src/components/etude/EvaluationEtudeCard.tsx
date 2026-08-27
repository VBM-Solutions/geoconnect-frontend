import React, { useEffect, useState } from 'react';
import { CheckCircle2, MessageSquareHeart, Star } from 'lucide-react';
import { evaluerEtude, getStatutEvaluation } from '../../api/etude';
import { EvaluationEtudeDTO, EvaluationEtudePayload } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';

interface EvaluationEtudeCardProps {
  etudeId: number;
}

type Notes = Omit<EvaluationEtudePayload, 'commentaire'>;
type Critere = keyof Notes;

const CRITERES: ReadonlyArray<{ key: Critere; label: string }> = [
  { key: 'qualiteEchanges', label: 'Qualité des échanges' },
  { key: 'respectDelais', label: 'Respect des délais' },
  { key: 'qualiteRapport', label: 'Qualité et clarté du rapport' },
];

const NOTES_INITIALES: Notes = {
  qualiteEchanges: 0,
  respectDelais: 0,
  qualiteRapport: 0,
};

export function EvaluationEtudeCard({ etudeId }: Readonly<EvaluationEtudeCardProps>) {
  const { toastError, toastSuccess } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationEtudeDTO>();
  const [notes, setNotes] = useState<Notes>(NOTES_INITIALES);
  const [commentaire, setCommentaire] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let active = true;
    getStatutEvaluation(etudeId)
      .then(statut => {
        if (!active) return;
        setEligible(statut.eligible);
        setEvaluation(statut.evaluation);
      })
      .catch(() => {
        if (active) toastError("Impossible de charger l'étape de notation.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [etudeId, toastError]);

  const complete = CRITERES.every(({ key }) => notes[key] >= 1);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!complete || submitting) return;
    setSubmitting(true);
    try {
      const created = await evaluerEtude(etudeId, {
        ...notes,
        commentaire: commentaire.trim() || undefined,
      });
      setEvaluation(created);
      setEligible(false);
      toastSuccess('Merci, votre avis a bien été enregistré.');
    } catch {
      toastError("Votre avis n'a pas pu être enregistré.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-5 text-xs text-slate-500">Chargement de la notation…</CardContent>
      </Card>
    );
  }

  if (evaluation) {
    return (
      <Card className="border-emerald-200">
        <CardHeader className="pb-2 border-b border-emerald-100 bg-emerald-50 rounded-t-lg">
          <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Avis transmis
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-3 text-xs text-slate-600">
          Merci pour votre retour. Note globale :{' '}
          <strong className="text-slate-900">{Number(evaluation.noteGlobale).toFixed(1)}/5</strong>.
          Cet avis provient d’une étude vérifiée et ne peut être soumis qu’une fois.
        </CardContent>
      </Card>
    );
  }

  if (!eligible || collapsed) return null;

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-2 border-b border-blue-100 bg-blue-50 rounded-t-lg">
        <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
          <MessageSquareHeart className="w-3.5 h-3.5" /> Évaluer cette étude
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="mb-4 text-xs leading-relaxed text-slate-600">
          Cette étape est facultative. Votre retour aide les particuliers à choisir leur bureau
          d’études et ne pourra être envoyé qu’une seule fois.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {CRITERES.map(({ key, label }) => (
            <fieldset key={key} className="flex flex-wrap items-center justify-between gap-2">
              <legend className="text-xs font-semibold text-slate-700">{label}</legend>
              <div className="flex gap-0.5" aria-label={`${label} sur 5`}>
                {[1, 2, 3, 4, 5].map(note => (
                  <button
                    key={note}
                    type="button"
                    aria-label={`${note} sur 5 pour ${label}`}
                    aria-pressed={notes[key] === note}
                    onClick={() => setNotes(current => ({ ...current, [key]: note }))}
                    className="rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        note <= notes[key]
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          <div>
            <label htmlFor="evaluation-commentaire" className="text-xs font-semibold text-slate-700">
              Commentaire public <span className="font-normal text-slate-400">(facultatif)</span>
            </label>
            <textarea
              id="evaluation-commentaire"
              value={commentaire}
              onChange={event => setCommentaire(event.target.value)}
              maxLength={2000}
              rows={3}
              className="mt-1.5 w-full rounded-md border border-slate-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Partagez votre expérience sans inclure de données personnelles."
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!complete} isLoading={submitting}>
              Envoyer mon avis
            </Button>
            <Button type="button" variant="ghost" onClick={() => setCollapsed(true)}>
              Plus tard
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
