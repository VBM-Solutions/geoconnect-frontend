import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfilMediaCropModal } from './ProfilMediaCropModal';
import * as mediaCrop from './mediaCrop';
import { StrictMode } from 'react';

describe('ProfilMediaCropModal', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:preview'), revokeObjectURL: vi.fn() });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('charge l’aperçu, règle le cadrage et confirme le fichier généré', async () => {
    const cropped = new File(['crop'], 'logo.webp', { type: 'image/webp' });
    vi.spyOn(mediaCrop, 'cropImage').mockResolvedValue(cropped);
    const onConfirm = vi.fn();
    const { unmount } = render(<ProfilMediaCropModal file={new File(['x'], 'source.png')} type="LOGO" onCancel={vi.fn()} onChangeSource={vi.fn()} onConfirm={onConfirm} />);
    const image = screen.getByAltText('Aperçu à recadrer');
    Object.defineProperties(image, { naturalWidth: { value: 1200 }, naturalHeight: { value: 600 } });
    fireEvent.load(image);
    fireEvent.change(screen.getByLabelText('Zoom'), { target: { value: '1.5' } });
    const viewport = screen.getByLabelText('Aperçu du recadrage, déplaçable avec les flèches');
    vi.spyOn(viewport, 'getBoundingClientRect').mockReturnValue({ width: 320, height: 320 } as DOMRect);
    fireEvent.pointerDown(viewport, { pointerId: 1, clientX: 0, clientY: 0 });
    fireEvent.pointerMove(viewport, { pointerId: 1, clientX: 32, clientY: 16 });
    fireEvent.pointerUp(viewport, { pointerId: 1 });
    fireEvent.click(screen.getByText('Utiliser cette image'));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(cropped));
    expect(mediaCrop.cropImage).toHaveBeenCalledWith(expect.anything(), 'LOGO', 1.5, .1, .2);
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it('permet d’annuler avec Échap et affiche une erreur de traitement', async () => {
    vi.spyOn(mediaCrop, 'cropImage').mockRejectedValue(new Error('encodage impossible'));
    const onCancel = vi.fn();
    render(<ProfilMediaCropModal file={new File(['x'], 'source.png')} type="BANNIERE" onCancel={onCancel} onChangeSource={vi.fn()} onConfirm={vi.fn()} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
    const image = screen.getByAltText('Aperçu à recadrer');
    Object.defineProperties(image, { naturalWidth: { value: 1600 }, naturalHeight: { value: 400 } });
    fireEvent.load(image);
    fireEvent.click(screen.getByText('Utiliser cette image'));
    expect(await screen.findByRole('alert')).toHaveTextContent('encodage impossible');
    fireEvent.click(screen.getByLabelText('Fermer'));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('signale un fichier qui ne peut pas être décodé comme image', () => {
    const onChangeSource = vi.fn();
    render(<ProfilMediaCropModal file={new File(['x'], 'source.png')} type="LOGO" onCancel={vi.fn()} onChangeSource={onChangeSource} onConfirm={vi.fn()} />);
    fireEvent.error(screen.getByAltText('Aperçu à recadrer'));
    expect(screen.getByRole('alert')).toHaveTextContent('ne peut pas être lu');
    fireEvent.click(screen.getByText('Changer le logo'));
    expect(onChangeSource).toHaveBeenCalled();
  });

  it('zoome à la molette et permet de recentrer', () => {
    render(<ProfilMediaCropModal file={new File(['x'], 'source.png')} type="LOGO" onCancel={vi.fn()} onChangeSource={vi.fn()} onConfirm={vi.fn()} />);
    const viewport = screen.getByLabelText('Aperçu du recadrage, déplaçable avec les flèches');
    fireEvent.wheel(viewport, { deltaY: -100 });
    expect(screen.getByLabelText('Zoom')).toHaveValue('1.2');
    fireEvent.keyDown(viewport, { key: 'ArrowRight' });
    fireEvent.keyDown(viewport, { key: 'Tab' });
    fireEvent.click(screen.getByText('Recentrer'));
    expect(screen.getByLabelText('Zoom')).toHaveValue('1');
  });

  it('recrée une URL valide lorsque StrictMode rejoue les effets', async () => {
    let sequence = 0;
    vi.mocked(URL.createObjectURL).mockImplementation(() => `blob:preview-${++sequence}`);
    render(<StrictMode><ProfilMediaCropModal file={new File(['x'], 'source.png')} type="LOGO" onCancel={vi.fn()} onChangeSource={vi.fn()} onConfirm={vi.fn()} /></StrictMode>);

    await waitFor(() => expect(screen.getByAltText('Aperçu à recadrer')).toHaveAttribute('src', 'blob:preview-2'));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-1');
  });
});
