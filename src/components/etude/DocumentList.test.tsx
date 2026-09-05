import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentList } from './DocumentList';
import { downloadDocument, openDocument } from '../../api/document';

vi.mock('../../api/document', () => ({
  downloadDocument: vi.fn(),
  openDocument: vi.fn(),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ toastError: vi.fn() }),
}));

describe('DocumentList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('ne rend rien sans document valide', () => {
    const { container } = render(<DocumentList documents={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('autorise par défaut l’ouverture et le téléchargement', async () => {
    render(<DocumentList documents={[{ id: 7, label: 'Plan.pdf' }]} />);

    fireEvent.click(screen.getByTitle('Télécharger'));
    await waitFor(() => expect(downloadDocument).toHaveBeenCalledWith(7, 'Plan.pdf'));
    await waitFor(() => expect(screen.getByTitle('Ouvrir')).toBeTruthy());
    fireEvent.click(screen.getByTitle('Ouvrir'));
    await waitFor(() => expect(openDocument).toHaveBeenCalledWith(7, 'Plan.pdf'));
  });

  it('peut masquer le téléchargement tout en conservant la consultation', () => {
    render(<DocumentList documents={[{ id: 7, label: 'Plan.pdf' }]} allowDownload={false} />);

    expect(screen.getByTitle('Ouvrir')).toBeTruthy();
    expect(screen.queryByTitle('Télécharger')).toBeNull();
  });
});
