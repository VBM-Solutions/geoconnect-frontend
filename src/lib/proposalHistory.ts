import { PropositionDevisDTO } from '../types';

export interface CurrentProposalWithHistory {
  current: PropositionDevisDTO;
  refusedHistory: PropositionDevisDTO[];
}

function bureauKey(proposal: PropositionDevisDTO, index: number): string {
  const bureauId = proposal.bureauEtudeId ?? proposal.bureauEtude?.id;
  return bureauId == null ? `proposition-${proposal.id ?? index}` : `bureau-${bureauId}`;
}

function compareNewestFirst(left: PropositionDevisDTO, right: PropositionDevisDTO): number {
  const byDate = (right.createdAt ? Date.parse(right.createdAt) : 0) - (left.createdAt ? Date.parse(left.createdAt) : 0);
  return byDate || (right.id ?? 0) - (left.id ?? 0);
}

export function groupCurrentProposals(proposals: PropositionDevisDTO[] = []): CurrentProposalWithHistory[] {
  const groups = new Map<string, PropositionDevisDTO[]>();
  proposals.forEach((proposal, index) => {
    const key = bureauKey(proposal, index);
    groups.set(key, [...(groups.get(key) ?? []), proposal]);
  });

  return [...groups.values()].flatMap(group => {
    const sorted = [...group].sort(compareNewestFirst);
    const current = sorted.find(proposal => proposal.statut !== 'REFUSEE');
    if (!current) return [];
    return [{
      current,
      refusedHistory: sorted.filter(proposal => proposal.statut === 'REFUSEE'),
    }];
  });
}

