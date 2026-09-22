import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TypedDocumentUploader } from './TypedDocumentUploader';

describe('TypedDocumentUploader', () => {
  it('exige une catégorie avant de choisir un fichier', async () => {
    render(<TypedDocumentUploader id="docs" typeEtude="G0" documents={[]} onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /ajouter un document/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Sélectionnez d’abord/i);
  });

  it('exige et conserve la précision métier pour Autre', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TypedDocumentUploader id="docs" typeEtude="G0" documents={[]} onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText('Type de document'), 'AUTRE');
    await user.click(screen.getByRole('button', { name: /ajouter un document/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Précisez la nature/i);
    await user.type(screen.getByLabelText(/Précisez le type/i), '  Diagnostic pollution  ');
    await user.click(screen.getByRole('button', { name: /ajouter un document/i }));
    await user.upload(document.querySelector('input[type="file"]')!, new File(['x'], 'diag.pdf', { type: 'application/pdf' }));
    expect(onChange).toHaveBeenCalledWith([expect.objectContaining({
      file: expect.objectContaining({ name: 'diag.pdf' }),
      categorie: 'AUTRE',
      precision: 'Diagnostic pollution',
    })]);
  });

  it('affiche, supprime et limite les documents', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const documents = [{ key: '1', file: new File(['x'], 'plan.pdf'), categorie: 'PLAN_SITUATION' as const }];
    const { rerender } = render(<TypedDocumentUploader id="docs" typeEtude="G2_PRO" documents={documents} onChange={onChange} maxDocuments={1} />);
    expect(screen.getByText('plan.pdf')).toBeVisible();
    expect(screen.getByRole('button', { name: /ajouter un document/i })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /supprimer plan.pdf/i }));
    expect(onChange).toHaveBeenCalledWith([]);
    rerender(<TypedDocumentUploader id="docs" typeEtude="G2_PRO" documents={[]} onChange={onChange} maxDocuments={1} />);
    expect(screen.getByRole('option', { name: /Plan BET de DDC/i })).toBeInTheDocument();
  });

  it('refuse un document dépassant 10 Mo avant l’envoi', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const oversized = new File(['x'], 'volumineux.pdf', { type: 'application/pdf' });
    Object.defineProperty(oversized, 'size', { value: 10 * 1024 * 1024 + 1 });
    render(<TypedDocumentUploader id="docs" typeEtude="G0" documents={[]} onChange={onChange} maxFileSizeBytes={10 * 1024 * 1024} />);

    await user.selectOptions(screen.getByLabelText('Type de document'), 'PLAN_SITUATION');
    await user.click(screen.getByRole('button', { name: /ajouter un document/i }));
    await user.upload(document.querySelector('input[type="file"]')!, oversized);

    expect(screen.getByRole('alert')).toHaveTextContent(/10 Mo/i);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('conserve la limite standard de 20 Mo hors inscription', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const file = new File(['x'], 'rapport.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 });
    render(<TypedDocumentUploader id="docs" typeEtude="G0" documents={[]} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('Type de document'), 'PLAN_SITUATION');
    await user.click(screen.getByRole('button', { name: /ajouter un document/i }));
    await user.upload(document.querySelector('input[type="file"]')!, file);

    expect(onChange).toHaveBeenCalledOnce();
  });
});
