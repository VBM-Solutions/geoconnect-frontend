import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDevisVersions } from '../../api/devisVersion';
import { downloadDocument } from '../../api/document';
import { DevisVersionsCard } from './DevisVersionsCard';

vi.mock('../../api/devisVersion', () => ({ getDevisVersions: vi.fn() }));
vi.mock('../../api/document', () => ({ downloadDocument: vi.fn() }));

describe('DevisVersionsCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('affiche les versions et télécharge celle qui est sélectionnée', async () => {
    vi.mocked(getDevisVersions).mockResolvedValue([
      { id: 1, numero: 1, documentId: 10, prix: 1000, delaiMaxIntervention: 5, delaiMaxRendu: 6, createdAt: '2026-08-26T12:00:00' },
      { id: 2, numero: 2, documentId: 20, prix: 1000, delaiMaxIntervention: 5, delaiMaxRendu: 6, createdAt: '2026-08-27T12:00:00' },
    ]);
    render(<DevisVersionsCard etudeId={42} />);
    const version2 = await screen.findByRole('button', { name: /V2/ });
    expect(screen.getByRole('button', { name: /V1/ })).toBeTruthy();
    fireEvent.click(version2);
    expect(downloadDocument).toHaveBeenCalledWith(20, 'devis-V2.pdf');
  });

  it('reste vide si le chargement échoue sans produire de rejet non géré', async () => {
    vi.mocked(getDevisVersions).mockRejectedValue(new Error('réseau indisponible'));
    const { container } = render(<DevisVersionsCard etudeId={43} />);
    await waitFor(() => expect(getDevisVersions).toHaveBeenCalledWith(43));
    expect(container).toBeEmptyDOMElement();
  });

  it('ne charge les versions qu’une fois sous StrictMode', async () => {
    vi.mocked(getDevisVersions).mockResolvedValue([]);
    render(<StrictMode><DevisVersionsCard etudeId={44} /></StrictMode>);
    await waitFor(() => expect(getDevisVersions).toHaveBeenCalledWith(44));
    expect(getDevisVersions).toHaveBeenCalledTimes(1);
  });
});
