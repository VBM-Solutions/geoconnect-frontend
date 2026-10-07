import { PropositionDevisDTO } from '../../types';
import { formatDelaiWithProjection } from '../../lib/delaiProjection';
import { formatProposalPrice } from '../../lib/proposalPrice';

const REFUS_LABELS: Record<string, string> = {
  PRIX: 'Prix',
  DELAI_INTERVENTION: 'Délai d’intervention',
  DELAI_RENDU: 'Délai de rendu',
  PERIMETRE_INADAPTE: 'Périmètre de la prestation inadapté',
  AUTRE_BUREAU_PREFERE: 'Autre bureau préféré',
  PROJET_REPORTE_OU_ANNULE: 'Projet reporté ou annulé',
  AUTRE: 'Autre motif',
  AUTRE_OFFRE_ACCEPTEE: 'Une autre offre a été acceptée',
};

function formatDate(value?: string): string | null {
  if (!value) return null;
  return new Date(value).toLocaleDateString('fr-FR');
}

export function ProposalHistory({ proposals }: Readonly<{ proposals: PropositionDevisDTO[] }>) {
  if (proposals.length === 0) return null;
  return (
    <details className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
      <summary className="cursor-pointer text-sm font-semibold text-amber-900">
        Offre précédente refusée
      </summary>
      <div className="mt-3 space-y-3">
        {proposals.map((proposal, index) => (
          <article key={proposal.id ?? index} className="rounded-md border border-amber-200 bg-white p-3 text-sm">
            <p className="font-semibold text-slate-800">Offre refusée{formatDate(proposal.createdAt) ? ` du ${formatDate(proposal.createdAt)}` : ''}</p>
            <dl className="mt-2 grid gap-2 sm:grid-cols-3">
              <div><dt className="text-xs font-semibold text-slate-500">Prix</dt><dd>{formatProposalPrice(proposal)}</dd></div>
              <div><dt className="text-xs font-semibold text-slate-500">Intervention</dt><dd>{formatDelaiWithProjection(proposal.delaiMaxIntervention, proposal.delaiProjectionIntervention)}</dd></div>
              <div><dt className="text-xs font-semibold text-slate-500">Rapport</dt><dd>{formatDelaiWithProjection(proposal.delaiMaxRendu, proposal.delaiProjectionRendu)}</dd></div>
            </dl>
            {proposal.inclusions?.length ? <p className="mt-2"><span className="font-semibold">Prestations incluses :</span> {proposal.inclusions.join(', ')}</p> : null}
            {proposal.exclusions?.length ? <p className="mt-1"><span className="font-semibold">Exclusions ou réserves :</span> {proposal.exclusions.join(', ')}</p> : null}
            {proposal.validiteOffreJusquAu ? <p className="mt-1"><span className="font-semibold">Validité :</span> jusqu’au {formatDate(`${proposal.validiteOffreJusquAu}T00:00:00`)}</p> : null}
            {proposal.motifRefus ? <p className="mt-2 text-amber-900"><span className="font-semibold">Motif du refus :</span> {REFUS_LABELS[proposal.motifRefus] ?? proposal.motifRefus}</p> : null}
            {proposal.commentaireRefus ? <p className="mt-1 whitespace-pre-line text-slate-700"><span className="font-semibold">Message :</span> {proposal.commentaireRefus}</p> : null}
          </article>
        ))}
      </div>
    </details>
  );
}
