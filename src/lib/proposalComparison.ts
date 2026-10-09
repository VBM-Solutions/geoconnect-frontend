import { PropositionDevisDTO } from '../types';

export type ProposalSort = 'RECENT' | 'PRIX_ASC' | 'INTERVENTION_ASC' | 'RENDU_ASC' | 'NOTE_DESC';
export type ProposalHighlight = 'PRIX' | 'INTERVENTION' | 'RENDU' | 'NOTE';

const ACTIVE_STATUS = new Set(['EN_ATTENTE', 'ACCEPTEE']);

function compareNullable(a: number | undefined, b: number | undefined, direction: 1 | -1): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return (a - b) * direction;
}

function stableFallback(a: PropositionDevisDTO, b: PropositionDevisDTO): number {
  const dateComparison = (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
  if (dateComparison !== 0) return dateComparison;
  return (a.id ?? Number.MAX_SAFE_INTEGER) - (b.id ?? Number.MAX_SAFE_INTEGER);
}

export function sortProposals(proposals: PropositionDevisDTO[], sort: ProposalSort): PropositionDevisDTO[] {
  return [...proposals].sort((a, b) => {
    const activeComparison = Number(ACTIVE_STATUS.has(b.statut ?? '')) - Number(ACTIVE_STATUS.has(a.statut ?? ''));
    if (activeComparison !== 0) return activeComparison;

    let comparison = 0;
    if (sort === 'PRIX_ASC') comparison = compareNullable(a.totalTTC, b.totalTTC, 1) || compareNullable(a.prix, b.prix, 1);
    if (sort === 'INTERVENTION_ASC') comparison = compareNullable(a.delaiMaxIntervention, b.delaiMaxIntervention, 1);
    if (sort === 'RENDU_ASC') comparison = compareNullable(a.delaiMaxRendu, b.delaiMaxRendu, 1);
    if (sort === 'NOTE_DESC') comparison = compareNullable(a.bureauEtude?.noteGlobale, b.bureauEtude?.noteGlobale, -1);
    return comparison || stableFallback(a, b);
  });
}

export function getDefaultProposalSort(): ProposalSort {
  return 'RECENT';
}

function comparableProposals(proposals: PropositionDevisDTO[]): PropositionDevisDTO[] {
  const active = proposals.filter(proposal => ACTIVE_STATUS.has(proposal.statut ?? ''));
  return active.length > 0 ? active : proposals;
}

export function computeProposalHighlights(proposals: PropositionDevisDTO[]): Map<number, Set<ProposalHighlight>> {
  const result = new Map<number, Set<ProposalHighlight>>();
  const comparable = comparableProposals(proposals);
  if (comparable.length < 2) return result;

  const addMinima = (highlight: ProposalHighlight, value: (proposal: PropositionDevisDTO) => number | undefined) => {
    const known = comparable.filter(proposal => proposal.id != null && value(proposal) != null);
    if (known.length < 2) return;
    const minimum = Math.min(...known.map(proposal => value(proposal)!));
    known.filter(proposal => value(proposal) === minimum).forEach(proposal => {
      const highlights = result.get(proposal.id!) ?? new Set<ProposalHighlight>();
      highlights.add(highlight);
      result.set(proposal.id!, highlights);
    });
  };

  addMinima('PRIX', proposal => proposal.totalTTC ?? proposal.prix);
  addMinima('INTERVENTION', proposal => proposal.delaiMaxIntervention);
  addMinima('RENDU', proposal => proposal.delaiMaxRendu);

  const rated = comparable.filter(proposal =>
    proposal.id != null && proposal.bureauEtude?.noteGlobale != null && (proposal.bureauEtude.nombreAvis ?? 0) >= 10);
  if (rated.length >= 2) {
    const maximum = Math.max(...rated.map(proposal => proposal.bureauEtude!.noteGlobale!));
    rated.filter(proposal => proposal.bureauEtude?.noteGlobale === maximum).forEach(proposal => {
      const highlights = result.get(proposal.id!) ?? new Set<ProposalHighlight>();
      highlights.add('NOTE');
      result.set(proposal.id!, highlights);
    });
  }
  return result;
}
