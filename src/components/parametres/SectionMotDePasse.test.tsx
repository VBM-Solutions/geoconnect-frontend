import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { SectionMotDePasse } from './SectionMotDePasse';

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ toastSuccess, toastError }),
}));

const saveMotDePasse = vi.fn();
const props = {
  isSavingMotDePasse: false,
  saveMotDePasse,
};

function submitPasswordForm(newPassword: string, confirmation: string) {
  fireEvent.change(screen.getByLabelText(/ancien mot de passe/i), { target: { value: 'ancien1234' } });
  fireEvent.change(screen.getByLabelText(/nouveau mot de passe/i), { target: { value: newPassword } });
  fireEvent.change(screen.getByLabelText(/confirmation/i), { target: { value: confirmation } });
  fireEvent.click(screen.getByRole('button', { name: /changer/i }));
}

describe('SectionMotDePasse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le formulaire et permet de modifier le mot de passe', async () => {
    saveMotDePasse.mockResolvedValueOnce(undefined);
    render(<SectionMotDePasse {...props} />);

    submitPasswordForm('Nouveau123!', 'Nouveau123!');

    await waitFor(() => expect(saveMotDePasse).toHaveBeenCalledWith({
      ancienMotDePasse: 'ancien1234',
      nouveauMotDePasse: 'Nouveau123!',
    }));
    expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining('Mot de passe modifié'));
  });

  it('affiche les erreurs de validation si les champs sont invalides', async () => {
    render(<SectionMotDePasse {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /changer/i }));
    expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
    expect(saveMotDePasse).not.toHaveBeenCalled();
  });

  it('affiche une erreur quand la confirmation ne correspond pas', async () => {
    render(<SectionMotDePasse {...props} />);

    submitPasswordForm('Nouveau123!', 'autre');

    expect(await screen.findByText(/ne correspondent pas/i)).toBeTruthy();
  });

  it('bloque la soumission si le mot de passe ne respecte pas les critères de sécurité', async () => {
    render(<SectionMotDePasse {...props} />);

    submitPasswordForm('abcdefghi', 'abcdefghi');

    const error = await screen.findByRole('alert');
    expect(error.textContent).toContain('Le mot de passe doit contenir');
    expect(saveMotDePasse).not.toHaveBeenCalled();
  });

  it('relaye l’erreur backend de mot de passe actuel incorrect', async () => {
    saveMotDePasse.mockRejectedValueOnce({
      response: { data: { message: "L'ancien mot de passe est incorrect" } },
    });
    render(<SectionMotDePasse {...props} />);

    submitPasswordForm('Nouveau123!', 'Nouveau123!');

    expect(await screen.findByText(/ancien mot de passe est incorrect/i)).toBeTruthy();
  });
});



