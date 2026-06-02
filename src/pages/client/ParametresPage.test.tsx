import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ClientParametresPage from './ParametresPage';

const mockUseClientParametres = vi.fn();

vi.mock('../../hooks/useClientParametres', () => ({
  useClientParametres: () => mockUseClientParametres(),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    toastSuccess: vi.fn(),
    toastError: vi.fn(),
  }),
}));

beforeEach(() => {
  mockUseClientParametres.mockReturnValue({
    client: {
      telContact: '0612345678',
      adresseFacturation: { rue: '12 rue de la Paix', codePostal: '75001', ville: 'Paris' },
    },
    isLoading: false,
    loadError: null,
    isSavingTelephone: false,
    isSavingAdresse: false,
    isSavingMotDePasse: false,
    saveTelephone: vi.fn(),
    saveAdresseFacturation: vi.fn(),
    saveMotDePasse: vi.fn(),
  });
});

describe('ClientParametresPage', () => {
  it('affiche le shell de paramètres et les trois sections client', () => {
    render(<ClientParametresPage />);

    expect(screen.getByRole('heading', { name: /paramètres/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /téléphone/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /adresse de facturation/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /mot de passe/i })).toBeTruthy();
  });
});


