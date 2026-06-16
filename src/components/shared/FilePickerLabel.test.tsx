import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilePickerLabel } from './FilePickerLabel';

describe('FilePickerLabel', () => {
  const baseProps = {
    id: 'test-file-picker',
    onChange: vi.fn(),
  };

  it('rend le label avec ses children', () => {
    render(
      <FilePickerLabel {...baseProps}>
        <span data-testid="label-content">Choisir un fichier</span>
      </FilePickerLabel>,
    );

    expect(screen.getByTestId('label-content')).toBeInTheDocument();
  });

  it('associe le label au input via htmlFor', () => {
    render(
      <FilePickerLabel {...baseProps}>
        Cliquez ici
      </FilePickerLabel>,
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.id).toBe(baseProps.id);
  });

  it('masque le input visuellement (sr-only)', () => {
    render(
      <FilePickerLabel {...baseProps}>
        Cliquez
      </FilePickerLabel>,
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.classList.contains('sr-only')).toBe(true);
  });

  it('transmet accept et multiple au input', () => {
    render(
      <FilePickerLabel {...baseProps} accept=".pdf" multiple>
        Choisir
      </FilePickerLabel>,
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input.accept).toBe('.pdf');
    expect(input.multiple).toBe(true);
  });

  it('appelle onChange avec les fichiers sélectionnés', () => {
    const onChange = vi.fn();
    render(
      <FilePickerLabel id="picker" onChange={onChange}>
        Sélectionner
      </FilePickerLabel>,
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith([file]);
  });

  it('appelle onChange avec plusieurs fichiers quand multiple est true', () => {
    const onChange = vi.fn();
    render(
      <FilePickerLabel id="picker-multi" onChange={onChange} multiple>
        Sélectionner
      </FilePickerLabel>,
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const files = [
      new File(['a'], 'a.pdf', { type: 'application/pdf' }),
      new File(['b'], 'b.pdf', { type: 'application/pdf' }),
    ];

    fireEvent.change(input, { target: { files } });

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(files);
  });

  it('ne déclenche pas onChange si aucun fichier n’est choisi', () => {
    const onChange = vi.fn();
    render(
      <FilePickerLabel id="picker-empty" onChange={onChange}>
        Sélectionner
      </FilePickerLabel>,
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('reset la valeur du input après sélection pour permettre la re-sélection', () => {
    const onChange = vi.fn();
    render(
      <FilePickerLabel id="picker-reset" onChange={onChange}>
        Sélectionner
      </FilePickerLabel>,
    );

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [file] } });
    expect(input.value).toBe('');
  });
});
