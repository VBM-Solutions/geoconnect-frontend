import { PropositionDevisDTO } from '../types';

export function formatProposalPrice(proposal?: Pick<PropositionDevisDTO, 'prix' | 'montantHT' | 'totalTTC'> | null): string {
  if (proposal?.totalTTC != null) return `${proposal.totalTTC.toFixed(2)} € TTC`;
  const ht = proposal?.montantHT ?? proposal?.prix;
  return ht == null ? '—' : `${ht.toFixed(2)} € HT · TVA non renseignée`;
}
