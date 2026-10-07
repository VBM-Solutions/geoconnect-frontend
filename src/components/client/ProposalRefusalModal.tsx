import { useState } from 'react';
import { MotifRefusProposition } from '../../api/propositionDevis';
import { Button } from '../ui/Button';

const OPTIONS: { value: MotifRefusProposition; label: string }[] = [
  { value: 'PRIX', label: 'Prix trop élevé' }, { value: 'DELAI_INTERVENTION', label: 'Délai d’intervention trop long' },
  { value: 'DELAI_RENDU', label: 'Délai de rendu trop long' }, { value: 'PERIMETRE_INADAPTE', label: 'Périmètre de prestation inadapté' },
  { value: 'AUTRE_BUREAU_PREFERE', label: 'Préférence pour un autre bureau' },
  { value: 'PROJET_REPORTE_OU_ANNULE', label: 'Projet reporté ou annulé' }, { value: 'AUTRE', label: 'Autre' },
];

export function ProposalRefusalModal({ isLoading, onConfirm, onCancel }: Readonly<{
  isLoading: boolean; onConfirm: (motif: MotifRefusProposition, commentaire?: string) => void; onCancel: () => void;
}>) {
  const [motif, setMotif] = useState<MotifRefusProposition>('PRIX');
  const [commentaire, setCommentaire] = useState('');
  const [confirmation, setConfirmation] = useState(false);
  const invalid = motif === 'AUTRE' && commentaire.trim().length === 0;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="dialog" aria-modal="true" aria-labelledby="refus-title">
    <div className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-xl">
      <h2 id="refus-title" className="text-lg font-bold">{confirmation ? 'Confirmer le refus ?' : 'Pourquoi refusez-vous cette proposition ?'}</h2>
      {confirmation ? <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
        <p>Cette action est irréversible. Le bureau d’études verra le motif suivant :</p>
        <p className="font-semibold">{OPTIONS.find(option => option.value === motif)?.label}</p>
        {commentaire.trim() && <p className="whitespace-pre-line text-slate-700">{commentaire.trim()}</p>}
      </div> : <>
      <label className="block text-sm font-semibold">Motif
        <select className="mt-1 w-full rounded-md border border-slate-300 p-2" value={motif} onChange={event => setMotif(event.target.value as MotifRefusProposition)}>
          {OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold">Commentaire {motif === 'AUTRE' ? '(obligatoire)' : '(facultatif)'}
        <textarea className="mt-1 min-h-24 w-full rounded-md border border-slate-300 p-2" maxLength={500} value={commentaire} onChange={event => setCommentaire(event.target.value)} />
      </label>
      {invalid && <p className="text-sm text-red-700">Précisez la raison lorsque vous choisissez « Autre ».</p>}
      </>}
      <div className="flex justify-end gap-2"><Button variant="outline" onClick={confirmation ? () => setConfirmation(false) : onCancel}>{confirmation ? 'Retour' : 'Annuler'}</Button><Button variant="danger" disabled={invalid} isLoading={isLoading} onClick={() => confirmation ? onConfirm(motif, commentaire.trim() || undefined) : setConfirmation(true)}>{confirmation ? 'Confirmer le refus' : 'Continuer'}</Button></div>
    </div>
  </div>;
}
