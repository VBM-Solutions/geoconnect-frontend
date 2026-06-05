import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { ConfirmDesactiverModal } from './ConfirmDesactiverModal';

describe('ConfirmDesactiverModal', () => {
  it('affiche le message de desactivation avec le login', () => {
    render(
      <ConfirmDesactiverModal
        login="client@test.fr"
        isLoading={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText(/client@test.fr/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /desactiver/i })).toBeTruthy();
  });

  it('appelle onConfirm au clic sur Desactiver', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDesactiverModal
        login="client@test.fr"
        isLoading={false}
        onCancel={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /desactiver/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

