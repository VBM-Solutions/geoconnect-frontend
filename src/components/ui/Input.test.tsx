import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input — toggle show/hide password', () => {
  it('n\'affiche pas le toggle si showPasswordToggle est false ou absent', () => {
    render(<Input type="password" />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('affiche le toggle si showPasswordToggle est true et type est password', () => {
    render(<Input type="password" showPasswordToggle />);

    expect(screen.getByRole('button', { name: /afficher le mot de passe/i })).toBeTruthy();
  });

  it('n\'affiche pas le toggle si showPasswordToggle est true mais type n\'est pas password', () => {
    render(<Input type="text" showPasswordToggle />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('change le type de password à text au clic sur le toggle', async () => {
    const user = userEvent.setup();
    const { container } = render(<Input type="password" showPasswordToggle />);

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('password');

    const toggleButton = screen.getByRole('button', { name: /afficher le mot de passe/i });
    await user.click(toggleButton);

    expect(input.type).toBe('text');
  });

  it('bascule l\'icône du toggle entre Eye et EyeOff', async () => {
    const user = userEvent.setup();
    render(<Input type="password" showPasswordToggle />);

    expect(screen.getByRole('button', { name: /afficher le mot de passe/i })).toBeTruthy();

    const toggleButton = screen.getByRole('button', { name: /afficher le mot de passe/i });
    await user.click(toggleButton);

    expect(screen.getByRole('button', { name: /masquer le mot de passe/i })).toBeTruthy();
  });
});

