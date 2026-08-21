import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfilBureauEtudeMedia } from './ProfilBureauEtudeMedia';
import { downloadMediaProfil, uploadMediaProfil } from '../../api/profilBureauEtude';

vi.mock('../../api/profilBureauEtude', () => ({ uploadMediaProfil: vi.fn(), downloadMediaProfil: vi.fn() }));
vi.mock('./ProfilMediaCropModal', () => ({
  ProfilMediaCropModal: ({ type, file, onCancel, onConfirm, onChangeSource }: any) => <div role="dialog"><span>{file.name}</span><button onClick={onChangeSource}>Changer dans l’outil</button><button onClick={onCancel}>Annuler le recadrage</button><button onClick={() => onConfirm(new File(['crop'], `${type}.webp`, { type: 'image/webp' }))}>Valider le recadrage</button></div>,
}));

describe('ProfilBureauEtudeMedia', () => {
  beforeEach(() => vi.clearAllMocks());

  it('affiche les médias existants et remplace le logo', async () => {
    const onUpdated = vi.fn();
    vi.mocked(uploadMediaProfil).mockResolvedValue({ logoDocumentId: 9 } as never);
    vi.mocked(downloadMediaProfil).mockResolvedValue(new Blob(['logo'], { type: 'image/png' }));
    render(<ProfilBureauEtudeMedia profil={{ logoDocumentId: 3, banniereDocumentId: 4 } as never} onUpdated={onUpdated} />);
    expect(screen.getByAltText('Logo actuel')).toHaveAttribute('src', '/api/public/profil-media/3');
    expect(screen.getByAltText('Bandeau actuel')).toHaveAttribute('src', '/api/public/profil-media/4');

    fireEvent.click(screen.getByRole('button', { name: 'Recadrer le logo' }));
    expect(await screen.findByRole('dialog')).toBeTruthy();
    expect(downloadMediaProfil).toHaveBeenCalledWith(3);
    expect(screen.getByText('logo-actuel.png')).toBeTruthy();
    fireEvent.click(screen.getByText('Valider le recadrage'));

    await waitFor(() => expect(uploadMediaProfil).toHaveBeenCalledWith('LOGO', expect.objectContaining({ name: 'LOGO.webp' })));
    expect(onUpdated).toHaveBeenCalledWith({ logoDocumentId: 9 });
  });

  it('ignore une sélection vide et affiche une erreur d’upload', async () => {
    vi.mocked(uploadMediaProfil).mockRejectedValue(new Error('upload ko'));
    const { container } = render(<ProfilBureauEtudeMedia profil={{} as never} onUpdated={vi.fn()} />);
    const inputs = container.querySelectorAll('input[type="file"]');
    fireEvent.change(inputs[0], { target: { files: [] } });
    expect(uploadMediaProfil).not.toHaveBeenCalled();
    fireEvent.change(inputs[1], { target: { files: [new File(['x'], 'banner.png', { type: 'image/png' })] } });
    fireEvent.click(screen.getByText('Valider le recadrage'));
    expect(await screen.findByRole('alert')).toHaveTextContent('upload ko');
  });

  it('refuse uniquement un fichier dépassant la limite mémoire et permet d’annuler', () => {
    const { container } = render(<ProfilBureauEtudeMedia profil={{} as never} onUpdated={vi.fn()} />);
    const oversized = new File([new Uint8Array(1024 * 1024 + 1)], 'logo.png', { type: 'image/png' });
    fireEvent.change(container.querySelectorAll('input[type="file"]')[0], { target: { files: [oversized] } });
    expect(screen.getByRole('alert')).toHaveTextContent('1 Mo');
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.change(container.querySelectorAll('input[type="file"]')[0], { target: { files: [new File(['x'], 'logo.png', { type: 'image/png' })] } });
    fireEvent.click(screen.getByText('Annuler le recadrage'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('propose de changer de fichier uniquement depuis l’outil et remonte une erreur de chargement', async () => {
    const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click');
    const { container, rerender } = render(<ProfilBureauEtudeMedia profil={{} as never} onUpdated={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choisir le logo' }));
    expect(inputClick).toHaveBeenCalledTimes(1);
    fireEvent.change(container.querySelectorAll('input[type="file"]')[0], { target: { files: [new File(['x'], 'nouveau.png', { type: 'image/png' })] } });
    fireEvent.click(screen.getByText('Changer dans l’outil'));
    expect(inputClick).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByText('Annuler le recadrage'));
    vi.mocked(downloadMediaProfil).mockRejectedValue(new Error('lecture impossible'));
    rerender(<ProfilBureauEtudeMedia profil={{ logoDocumentId: 8 } as never} onUpdated={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Recadrer le logo' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('lecture impossible');
  });
});
