import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProposalRefusalModal } from './ProposalRefusalModal';

describe('ProposalRefusalModal', () => {
  it('transmet un motif structuré', () => {
    const onConfirm = vi.fn();
    render(<ProposalRefusalModal isLoading={false} onConfirm={onConfirm} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/^Motif$/), { target: { value: 'DELAI_RENDU' } });
    fireEvent.click(screen.getByRole('button', { name: /continuer/i }));
    expect(screen.getByText(/cette action est irréversible/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /confirmer le refus/i }));
    expect(onConfirm).toHaveBeenCalledWith('DELAI_RENDU', undefined);
  });

  it('exige un commentaire pour autre et le borne', () => {
    const onConfirm = vi.fn();
    render(<ProposalRefusalModal isLoading={false} onConfirm={onConfirm} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/^Motif$/), { target: { value: 'AUTRE' } });
    expect(screen.getByRole('button', { name: /continuer/i })).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Commentaire/), { target: { value: '  Un besoin différent  ' } });
    fireEvent.click(screen.getByRole('button', { name: /continuer/i }));
    fireEvent.click(screen.getByRole('button', { name: /confirmer le refus/i }));
    expect(onConfirm).toHaveBeenCalledWith('AUTRE', 'Un besoin différent');
  });

  it('permet d’annuler', () => {
    const onCancel = vi.fn();
    render(<ProposalRefusalModal isLoading={false} onConfirm={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
