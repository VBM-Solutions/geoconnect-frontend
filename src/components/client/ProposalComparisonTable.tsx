import { ArrowUpDown, Award, Check, CheckCircle2, FileText, Gauge, Star, Timer, X } from 'lucide-react';
import { PropositionDevisDTO } from '../../types';
import { computeProposalHighlights, ProposalHighlight, ProposalSort } from '../../lib/proposalComparison';
import { formatDelaiWithProjection } from '../../lib/delaiProjection';
import { BureauEtudeProfileLink } from '../profil-be/BureauEtudeProfileLink';
import { Button } from '../ui/Button';

interface Props {
  readonly proposals: PropositionDevisDTO[];
  readonly returnTo: string;
  readonly processingId?: number | null;
  readonly onPreview: (id: number) => void;
  readonly onAccept: (id: number) => void;
  readonly onRefuse: (id: number) => void;
  readonly onSort: (sort: ProposalSort) => void;
}

const HIGHLIGHTS: Record<ProposalHighlight, { label: string; icon: typeof Award; className: string }> = {
  PRIX: { label: 'Prix le plus bas', icon: Award, className: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  INTERVENTION: { label: 'Intervention la plus rapide', icon: Gauge, className: 'bg-sky-50 text-sky-800 ring-sky-200' },
  RENDU: { label: 'Rapport le plus rapide', icon: Timer, className: 'bg-violet-50 text-violet-800 ring-violet-200' },
  NOTE: { label: 'Meilleure note', icon: Star, className: 'bg-amber-50 text-amber-800 ring-amber-200' },
};

function SortHeader({ label, sort, onSort }: Readonly<{ label: string; sort: ProposalSort; onSort: (sort: ProposalSort) => void }>) {
  return <th className="p-4"><button type="button" className="inline-flex items-center gap-1 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" onClick={() => onSort(sort)}>{label}<ArrowUpDown aria-hidden="true" className="h-3.5 w-3.5" /></button></th>;
}

function Price({ proposal }: Readonly<{ proposal: PropositionDevisDTO }>) {
  if (proposal.totalTTC != null) {
    return <><strong>{proposal.totalTTC.toFixed(2)} € TTC</strong><span className="block text-xs text-slate-500">{(proposal.totalHT ?? proposal.montantHT)?.toFixed(2)} € HT</span></>;
  }
  if (proposal.montantHT != null || proposal.prix != null) {
    return <><strong>{(proposal.montantHT ?? proposal.prix)?.toFixed(2)} € HT</strong><span className="block text-xs text-amber-700">TVA non renseignée</span></>;
  }
  return <>—</>;
}

export function ProposalComparisonTable({ proposals, returnTo, processingId, onPreview, onAccept, onRefuse, onSort }: Props) {
  const highlights = computeProposalHighlights(proposals);
  const acceptedProposal = proposals.some(proposal => proposal.statut === 'ACCEPTEE');

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-[1100px] w-full text-left text-sm">
        <caption className="sr-only">Comparaison des propositions de devis</caption>
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr><th className="p-4">Bureau</th><SortHeader label="Prix" sort="PRIX_ASC" onSort={onSort} /><SortHeader label="Intervention" sort="INTERVENTION_ASC" onSort={onSort} /><SortHeader label="Rapport" sort="RENDU_ASC" onSort={onSort} /><th className="p-4">Prestations</th><SortHeader label="Note" sort="NOTE_DESC" onSort={onSort} /><th className="p-4">Actions</th></tr>
        </thead>
        <tbody>
          {proposals.map(proposal => {
            const id = proposal.id;
            const isAccepted = proposal.statut === 'ACCEPTEE';
            const isRefused = proposal.statut === 'REFUSEE';
            return (
              <tr key={id} className="border-t border-slate-100 align-top">
                <td className="p-4">
                  <BureauEtudeProfileLink raisonSociale={proposal.bureauEtude?.raisonSociale} slug={proposal.bureauEtude?.profilPublicSlug} returnTo={returnTo} />
                  <div className="mt-2 flex max-w-64 flex-wrap gap-1">
                    {[...(highlights.get(id ?? -1) ?? [])].map(highlight => {
                      const { label, icon: Icon, className } = HIGHLIGHTS[highlight];
                      return <span key={highlight} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ring-1 ring-inset ${className}`}><Icon aria-hidden="true" className="h-3 w-3" />{label}</span>;
                    })}
                  </div>
                </td>
                <td className="p-4"><Price proposal={proposal} /></td>
                <td className="p-4">{formatDelaiWithProjection(proposal.delaiMaxIntervention, proposal.delaiProjectionIntervention)}</td>
                <td className="p-4">{formatDelaiWithProjection(proposal.delaiMaxRendu, proposal.delaiProjectionRendu)}</td>
                <td className="p-4"><ul className="list-disc space-y-1 pl-4">{proposal.inclusions?.map(item => <li key={item}>{item}</li>)}</ul>{proposal.exclusions?.length ? <p className="mt-2 text-xs text-amber-700">{proposal.exclusions.length} exclusion(s)</p> : null}{proposal.validiteOffreJusquAu && <p className="mt-2 text-xs text-slate-500">Valable jusqu’au {new Date(`${proposal.validiteOffreJusquAu}T00:00:00`).toLocaleDateString('fr-FR')}</p>}</td>
                <td className="p-4">{proposal.bureauEtude?.noteGlobale == null ? 'Non noté' : <>{proposal.bureauEtude.noteGlobale.toFixed(1)}/5<span className="block text-xs text-slate-500">{proposal.bureauEtude.nombreAvis ?? 0} avis</span></>}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {id != null && <Button variant="outline" size="sm" className="h-9 w-9 px-0" title="Voir le devis" aria-label="Voir le devis" onClick={() => onPreview(id)}><FileText className="h-4 w-4" /></Button>}
                    {isAccepted && <span className="inline-flex items-center gap-1 font-semibold text-green-700"><CheckCircle2 className="h-4 w-4" />Acceptée</span>}
                    {isRefused && <span className="font-semibold text-slate-500">Refusée</span>}
                    {!isAccepted && !isRefused && !acceptedProposal && id != null && <><Button variant="danger" size="sm" className="h-9 w-9 px-0" title="Refuser l’offre" aria-label="Refuser l’offre" onClick={() => onRefuse(id)} isLoading={processingId === id}><X className="h-4 w-4" /></Button><Button size="sm" className="h-9 w-9 px-0" title="Accepter l’offre" aria-label="Accepter l’offre" onClick={() => onAccept(id)} isLoading={processingId === id}><Check className="h-4 w-4" /></Button></>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
