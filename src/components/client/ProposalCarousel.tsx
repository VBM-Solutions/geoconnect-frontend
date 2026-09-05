import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PropositionDevisDTO } from '../../types';
import { formatDelaiWithProjection } from '../../lib/delaiProjection';
import { BureauEtudeProfileLink } from '../profil-be/BureauEtudeProfileLink';
import { Button } from '../ui/Button';

interface ProposalCarouselProps {
  proposals: PropositionDevisDTO[];
  initialProposalId?: number | null;
  returnTo: string;
  processingId?: number | null;
  onAccept: (id: number) => void;
  onRefuse: (id: number) => void;
}

export function ProposalCarousel({
  proposals,
  initialProposalId,
  returnTo,
  processingId,
  onAccept,
  onRefuse,
}: Readonly<ProposalCarouselProps>) {
  const initialIndex = useMemo(() => {
    const selected = proposals.findIndex(proposal => proposal.id === initialProposalId);
    return selected >= 0 ? selected : 0;
  }, [initialProposalId, proposals]);
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => setIndex(initialIndex), [initialIndex]);

  if (proposals.length === 0) return null;

  const proposalIndex = Math.min(index, proposals.length - 1);
  const proposal = proposals[proposalIndex];
  const acceptedProposal = proposals.some(item => item.statut === 'ACCEPTEE');
  const isAccepted = proposal.statut === 'ACCEPTEE';
  const isRefused = proposal.statut === 'REFUSEE';

  return (
    <section className="space-y-4" aria-label="Propositions de devis">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-500" aria-live="polite">
          Proposition {index + 1} sur {proposals.length}
        </p>
        {proposals.length > 1 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIndex(current => current - 1)} disabled={index === 0} aria-label="Proposition précédente">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIndex(current => current + 1)} disabled={index === proposals.length - 1} aria-label="Proposition suivante">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <BureauEtudeProfileLink
              raisonSociale={proposal.bureauEtude?.raisonSociale}
              slug={proposal.bureauEtude?.profilPublicSlug}
              returnTo={returnTo}
            />
            {proposal.bureauEtude?.ville && <p className="mt-1 text-xs text-slate-500">{proposal.bureauEtude.ville}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="block text-[10px] font-bold uppercase text-slate-400">Prix</span>{proposal.prix == null ? '—' : `${proposal.prix} €`}</div>
            <div><span className="block text-[10px] font-bold uppercase text-slate-400">Délai</span>{formatDelaiWithProjection(proposal.delaiMaxRendu, proposal.delaiProjectionRendu)}</div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
          {proposal.documentId ? (
            <iframe
              title={`Prévisualisation du devis de ${proposal.bureauEtude?.raisonSociale ?? 'bureau d’études'}`}
              src={`/api/documents/${proposal.documentId}/download/devis.pdf`}
              className="h-80 w-full"
            />
          ) : (
            <p className="p-8 text-center text-sm text-slate-500">Prévisualisation du devis indisponible.</p>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          {isAccepted && <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700"><CheckCircle2 className="h-4 w-4" /> Proposition acceptée</span>}
          {isRefused && <span className="text-sm font-semibold text-slate-500">Proposition refusée</span>}
          {!isAccepted && !isRefused && !acceptedProposal && proposal.id != null && (
            <>
              <Button variant="destructive" size="sm" onClick={() => onRefuse(proposal.id!)} isLoading={processingId === proposal.id}>Refuser</Button>
              <Button size="sm" onClick={() => onAccept(proposal.id!)} isLoading={processingId === proposal.id}>Accepter</Button>
            </>
          )}
        </div>
      </article>
    </section>
  );
}
