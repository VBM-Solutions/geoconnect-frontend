import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { SectionTelephone } from './SectionTelephone';

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ toastSuccess, toastError }),
}));

const saveTelephone = vi.fn();
const props = {
  client: {
    telContact: '0612345678',
  },
  isLoading: false,
  isSavingTelephone: false,
  loadError: null,
  saveTelephone,
};

function submitTelephone(value: string) {
  fireEvent.change(screen.getByRole('textbox', { name: /^téléphone$/i }), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
}

describe('SectionTelephone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche le spinner pendant le chargement', () => {
    render(<SectionTelephone {...props} isLoading />);
    expect(screen.getByText(/chargement des paramètres/i)).toBeTruthy();
  });

  it('affiche une erreur si le chargement échoue', () => {
    render(<SectionTelephone {...props} loadError="Erreur réseau" />);
    expect(screen.getByText('Erreur réseau')).toBeTruthy();
  });

  it('enregistre un nouveau téléphone valide et affiche un toast', async () => {
    saveTelephone.mockResolvedValueOnce({ ...props.client, telContact: '0698765432' });
    render(<SectionTelephone {...props} />);

    submitTelephone('0698765432');

    await waitFor(() => expect(saveTelephone).toHaveBeenCalledWith('0698765432'));
    expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining('Téléphone enregistré'));
  });

  it('n’envoie rien si le numéro n’a pas changé', async () => {
    render(<SectionTelephone {...props} />);

    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

    expect(saveTelephone).not.toHaveBeenCalled();
  });

  it('affiche une erreur de validation sur un numéro invalide', async () => {
    render(<SectionTelephone {...props} />);

    submitTelephone('12');

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(saveTelephone).not.toHaveBeenCalled();
  });

  it('relaye une erreur backend field-specific', async () => {
    saveTelephone.mockRejectedValueOnce({
      response: { data: { errors: { telephone: 'Le numéro de téléphone est invalide' } } },
    });
    render(<SectionTelephone {...props} />);

    submitTelephone('0698765432');

    expect(await screen.findByText(/invalide/i)).toBeTruthy();
  });
});


