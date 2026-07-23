import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { SectionAdresseFacturation } from './SectionAdresseFacturation';
import { searchAddressSuggestions } from '../../api/addressAutocomplete';

const toastSuccess = vi.fn();
const toastError = vi.fn();

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ toastSuccess, toastError }),
}));

vi.mock('../../api/addressAutocomplete', () => ({
  searchAddressSuggestions: vi.fn(),
}));

const saveAdresseFacturation = vi.fn();
const props = {
  client: {
    adresseFacturation: { rue: '12 rue de la Paix', codePostal: '75001', ville: 'Paris' },
  },
  isLoading: false,
  isSavingAdresse: false,
  loadError: null,
  saveAdresseFacturation,
};

describe('SectionAdresseFacturation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(searchAddressSuggestions).mockResolvedValue([]);
  });

  it('affiche le spinner pendant le chargement', () => {
    render(<SectionAdresseFacturation {...props} isLoading />);
    expect(screen.getByText(/chargement des paramètres/i)).toBeTruthy();
  });

  it('affiche une erreur si le chargement échoue', () => {
    render(<SectionAdresseFacturation {...props} loadError="Erreur réseau" />);
    expect(screen.getByText('Erreur réseau')).toBeTruthy();
  });

  it('enregistre une adresse valide et affiche un toast', async () => {
    saveAdresseFacturation.mockResolvedValueOnce({ ...props.client, adresseFacturation: { rue: '8 avenue Montaigne', codePostal: '75008', ville: 'Paris' } });
    render(<SectionAdresseFacturation {...props} />);

    fireEvent.change(screen.getByLabelText(/^rue$/i), { target: { value: '8 avenue Montaigne' } });
    fireEvent.change(screen.getByLabelText(/code postal/i), { target: { value: '75008' } });
    fireEvent.change(screen.getByLabelText(/^ville$/i), { target: { value: 'Paris' } });
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => expect(saveAdresseFacturation).toHaveBeenCalledWith({
      rue: '8 avenue Montaigne',
      codePostal: '75008',
      ville: 'Paris',
    }));
    expect(toastSuccess).toHaveBeenCalledWith(expect.stringContaining('Adresse de facturation enregistrée'));
  });

  it('n’envoie rien si l’adresse n’a pas changé', () => {
    render(<SectionAdresseFacturation {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(saveAdresseFacturation).not.toHaveBeenCalled();
  });

  it('affiche des erreurs de validation si le code postal est invalide', async () => {
    render(<SectionAdresseFacturation {...props} />);
    fireEvent.change(screen.getByLabelText(/code postal/i), { target: { value: '75' } });
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(saveAdresseFacturation).not.toHaveBeenCalled();
  });

  it('relaye les erreurs backend champ par champ', async () => {
    saveAdresseFacturation.mockRejectedValueOnce({
      response: { data: { errors: { codePostal: 'Le code postal est invalide' } } },
    });
    render(<SectionAdresseFacturation {...props} />);
    fireEvent.change(screen.getByLabelText(/code postal/i), { target: { value: '75008' } });
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
    expect(await screen.findByText(/invalide/i)).toBeTruthy();
  });
});

