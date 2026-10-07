import { describe, expect, it } from 'vitest';
import { formatProposalPrice } from './proposalPrice';

describe('formatProposalPrice', () => {
  it('affiche le TTC structuré', () => expect(formatProposalPrice({ totalTTC: 120, montantHT: 100 })).toBe('120.00 € TTC'));
  it('identifie explicitement le HT historique', () => expect(formatProposalPrice({ prix: 100 })).toBe('100.00 € HT · TVA non renseignée'));
  it('gère un prix absent', () => expect(formatProposalPrice()).toBe('—'));
});
