import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { ResetPasswordModal } from './ResetPasswordModal';

function renderModal(overrides: Partial<React.ComponentProps<typeof ResetPasswordModal>> = {}) {
  const props: React.ComponentProps<typeof ResetPasswordModal> = {
    login: 'client@test.fr',
    isLoading: false,
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<ResetPasswordModal {...props} />),
    props,
  };
}

describe('ResetPasswordModal', () => {
  it('affiche le login cible', () => {
    renderModal();
    expect(screen.getByText(/client@test.fr/i)).toBeTruthy();
  });

  it('n appelle pas onConfirm avec un mot de passe trop court', () => {
    const onConfirm = vi.fn();
    renderModal({ onConfirm });

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), { target: { value: 'abc' } });
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), { target: { value: 'abc' } });
    fireEvent.click(screen.getByRole('button', { name: /reinitialiser/i }));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('appelle onConfirm avec un mot de passe valide', () => {
    const onConfirm = vi.fn();
    renderModal({ onConfirm });

    fireEvent.change(screen.getByLabelText('Nouveau mot de passe'), { target: { value: 'MotDePasse123!' } });
    fireEvent.change(screen.getByLabelText('Confirmer le mot de passe'), { target: { value: 'MotDePasse123!' } });
    fireEvent.click(screen.getByRole('button', { name: /reinitialiser/i }));

    expect(onConfirm).toHaveBeenCalledWith('MotDePasse123!');
  });

  it('appelle onCancel quand on clique sur Annuler', () => {
    const onCancel = vi.fn();
    renderModal({ onCancel });

    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});


