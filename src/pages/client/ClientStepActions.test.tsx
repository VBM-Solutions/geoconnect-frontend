import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ClientStepActions } from './EtudeDetail';

const props = {
  etat: 'DATE_INTERVENTION_PROPOSEE' as const,
  etude: { id: 1, dateIntervention: '2026-08-28', periodeIntervention: 'MATIN' as const },
  isLoading: false,
  onValiderDate: vi.fn(),
  onRefuserDate: vi.fn(),
  onConfirmerPaiement: vi.fn(),
};

describe('ClientStepActions - créneau d’intervention', () => {
  it('affiche la demi-journée et exige un motif avant le refus', () => {
    const onRefuserDate = vi.fn();
    render(<ClientStepActions {...props} onRefuserDate={onRefuserDate} />);
    expect(screen.getByText(/28 août 2026 - matin/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Refuser la date' }));
    const confirm = screen.getByRole('button', { name: 'Confirmer le refus' });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/expliquez votre refus/i), {
      target: { value: '  Je serai absent.  ' },
    });
    fireEvent.click(confirm);
    expect(onRefuserDate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Oui, refuser la date' }));
    expect(onRefuserDate).toHaveBeenCalledWith('Je serai absent.');
  });

  it('demande confirmation avant validation et ne charge que la bonne action', () => {
    const onValiderDate = vi.fn();
    const { rerender } = render(<ClientStepActions {...props} onValiderDate={onValiderDate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Valider la date' }));
    expect(onValiderDate).not.toHaveBeenCalled();

    rerender(<ClientStepActions {...props} onValiderDate={onValiderDate} isLoading actionKey="validerDate" />);
    const confirmationButton = screen.getByRole('button', { name: 'Oui, valider la date' });
    expect(confirmationButton.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refuser la date' }).querySelector('.animate-spin')).not.toBeInTheDocument();
  });

  it('limite le motif à 1000 caractères', () => {
    render(<ClientStepActions {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Refuser la date' }));
    expect(screen.getByLabelText(/expliquez votre refus/i)).toHaveAttribute('maxlength', '1000');
  });
});
