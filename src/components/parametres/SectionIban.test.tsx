import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { SectionIban } from './SectionIban';

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ toastSuccess, toastError }),
}));

const saveIban = vi.fn();
const props = {
  bureau: {
    iban: 'FR7630006000011234567890189',
  },
  isLoading: false,
  isSavingIban: false,
  loadError: null,
  saveIban,
};

describe('SectionIban', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le spinner pendant le chargement', () => {
    render(<SectionIban {...props} isLoading />);
    expect(screen.getByText(/chargement des paramètres/i)).toBeTruthy();
  });

  it('affiche une erreur si le chargement échoue', () => {
    render(<SectionIban {...props} loadError="Erreur réseau" />);
    expect(screen.getByText('Erreur réseau')).toBeTruthy();
  });

  it('enregistre un IBAN valide et affiche un toast', async () => {
    saveIban.mockResolvedValueOnce({ ...props.bureau, iban: 'FR7612345678901234567890123' });
    render(<SectionIban {...props} />);

    fireEvent.change(screen.getByRole('textbox', { name: /^iban$/i }), { target: { value: 'FR76 1234 5678 9012 3456 7890 123' } });
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => expect(saveIban).toHaveBeenCalledWith('FR7612345678901234567890123'));
    expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining('IBAN enregistré'));
  });

  it('n’envoie rien si l’IBAN n’a pas changé', () => {
    render(<SectionIban {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(saveIban).not.toHaveBeenCalled();
  });

  it('affiche une erreur si l’IBAN est invalide', async () => {
    render(<SectionIban {...props} />);
    fireEvent.change(screen.getByRole('textbox', { name: /^iban$/i }), { target: { value: 'FR12' } });
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(saveIban).not.toHaveBeenCalled();
  });

  it('relaye une erreur backend spécifique', async () => {
    saveIban.mockRejectedValueOnce({ response: { data: { errors: { iban: 'IBAN invalide' } } } });
    render(<SectionIban {...props} />);
    fireEvent.change(screen.getByRole('textbox', { name: /^iban$/i }), { target: { value: 'FR76 1234 5678 9012 3456 7890 123' } });
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(await screen.findByText(/IBAN invalide/i)).toBeTruthy();
  });
});


