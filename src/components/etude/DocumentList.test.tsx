import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DocumentList } from './DocumentList';

vi.mock('../../contexts/ToastContext', () => ({ useToast: () => ({ toastError: vi.fn() }) }));
vi.mock('../../api/document', () => ({ openDocument: vi.fn(), downloadDocument: vi.fn() }));

describe('DocumentList', () => {
  it('affiche la catégorie en principal et le fichier en secondaire', () => {
    render(<DocumentList showCard={false} documents={[{
      id: 1,
      nomTelechargement: 'DUPONT_JEAN-G2_AVP-AUTRE-DIAGNOSTIC.pdf',
      categorieDemande: 'AUTRE',
      precisionCategorieDemande: 'Diagnostic pollution',
    }]} />);
    expect(screen.getByTitle('Autre — Diagnostic pollution')).toHaveTextContent('Autre — Diagnostic pollution');
    expect(screen.getByTitle('DUPONT_JEAN-G2_AVP-AUTRE-DIAGNOSTIC.pdf')).toHaveClass('text-[10px]');
  });

  it('conserve le libellé historique quand la catégorie est absente', () => {
    render(<DocumentList showCard={false} documents={[{ id: 2, label: 'Document historique' }]} />);
    expect(screen.getByTitle('Document historique')).toBeVisible();
  });
});
