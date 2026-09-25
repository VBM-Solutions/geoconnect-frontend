import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DemandeDocumentSlots } from './DemandeDocumentSlots';
import { downloadDocument, openDocument, uploadDocument } from '../../api/document';

vi.mock('../../api/document', () => ({ uploadDocument: vi.fn(), openDocument: vi.fn(), downloadDocument: vi.fn() }));
vi.mock('../../contexts/ToastContext', () => ({ useToast: () => ({ toastError: vi.fn() }) }));
const demande = { id: 3, type: 'G2_PRO' as const, referencesCadastrales: [], presenceReseaux: 'OUI' as const, accessibiliteMachines: 'NON' as const };

describe('DemandeDocumentSlots', () => {
  beforeEach(() => vi.clearAllMocks());

  it('affiche toutes les catégories applicables et les documents manquants', () => {
    render(<DemandeDocumentSlots demande={demande} editable={false} onSave={vi.fn()} />);
    expect(screen.getByText('Plan BET de DDC')).toBeInTheDocument();
    expect(screen.getAllByText('Document non fourni').length).toBeGreaterThan(1);
    expect(screen.queryByRole('button', { name: 'Ajouter' })).toBeNull();
  });

  it('affiche à droite les actions de visualisation et de téléchargement sans rendre le nom cliquable', async () => {
    const user = userEvent.setup();
    render(<DemandeDocumentSlots demande={demande} documents={[{ id: 8, categorieDemande: 'PLAN_SITUATION', nomFichierOriginal: 'plan.pdf', nomTelechargement: 'download.pdf' }]} editable={false} onSave={vi.fn()} />);
    expect(screen.queryByText('plan.pdf')).toBeNull();
    expect(screen.queryByRole('button', { name: 'download.pdf' })).not.toBeInTheDocument();
    const viewButton = screen.getByRole('button', { name: 'Visualiser download.pdf' });
    const downloadButton = screen.getByRole('button', { name: 'Télécharger download.pdf' });
    const filename = screen.getByText('download.pdf');
    expect(filename.compareDocumentPosition(viewButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(filename.compareDocumentPosition(downloadButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await user.click(viewButton);
    expect(openDocument).toHaveBeenCalledWith(8, 'download.pdf');
    await user.click(screen.getByRole('button', { name: 'Télécharger download.pdf' }));
    expect(downloadDocument).toHaveBeenCalledWith(8, 'download.pdf');
  });

  it('ajoute puis remplace une catégorie unique', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    vi.mocked(uploadDocument).mockResolvedValue({ id: 9, nomFichierOriginal: 'new.pdf' });
    const old = { id: 4, categorieDemande: 'PLAN_SITUATION' as const, nomFichierOriginal: 'old.pdf' };
    render(<DemandeDocumentSlots demande={demande} documents={[old]} editable onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: 'Remplacer — Plan de situation' }));
    await user.upload(screen.getByLabelText('Fichier document'), new File(['x'], 'new.pdf'));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0].documentsDemande).toEqual([{ documentId: 9, categorie: 'PLAN_SITUATION', precision: undefined }]);
  });

  it('exige un intitulé et autorise plusieurs autres documents', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    vi.mocked(uploadDocument).mockResolvedValue({ id: 12 });
    render(<DemandeDocumentSlots demande={demande} documents={[{ id: 10, categorieDemande: 'AUTRE', precisionCategorieDemande: 'Diagnostic' }]} editable onSave={onSave} />);
    const add = screen.getByRole('button', { name: 'Ajouter un autre document' });
    expect(add).toBeDisabled();
    await user.type(screen.getByLabelText(/Intitulé/), 'Photo complémentaire');
    await user.click(add);
    await user.upload(screen.getByLabelText('Fichier document'), new File(['x'], 'photo.png'));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0].documentsDemande).toEqual([
      { documentId: 10, categorie: 'AUTRE', precision: 'Diagnostic' },
      { documentId: 12, categorie: 'AUTRE', precision: 'Photo complémentaire' },
    ]);
  });
});
