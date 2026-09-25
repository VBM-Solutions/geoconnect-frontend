import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getDevisVersions } from '../../api/devisVersion';
import { downloadDocument, openDocument } from '../../api/document';
import { DevisVersionsCard } from './DevisVersionsCard';

vi.mock('../../api/devisVersion', () => ({ getDevisVersions: vi.fn() }));
vi.mock('../../api/document', () => ({ downloadDocument: vi.fn(), openDocument: vi.fn() }));

describe('DevisVersionsCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('affiche à droite les actions de visualisation et de téléchargement de chaque version', async () => {
    vi.mocked(getDevisVersions).mockResolvedValue([
      { id: 1, numero: 1, documentId: 10, prix: 1000, delaiMaxIntervention: 5, delaiMaxRendu: 6, createdAt: '2026-08-26T12:00:00' },
      { id: 2, numero: 2, documentId: 20, prix: 1000, delaiMaxIntervention: 5, delaiMaxRendu: 6, createdAt: '2026-08-27T12:00:00' },
    ]);
    render(<DevisVersionsCard etudeId={42} />);
    const viewVersion2 = await screen.findByRole('button', { name: 'Visualiser devis-V2.pdf' });
    const downloadVersion2 = screen.getByRole('button', { name: 'Télécharger devis-V2.pdf' });
    const version2Label = screen.getByText('V2');
    expect(version2Label.compareDocumentPosition(viewVersion2) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(version2Label.compareDocumentPosition(downloadVersion2) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(viewVersion2);
    expect(openDocument).toHaveBeenCalledWith(20, 'devis-V2.pdf');
    fireEvent.click(downloadVersion2);
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
