import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import BEParametresPage from './ParametresPage';

const useParametresNotificationsMock = vi.fn();
const useBureauEtudeIbanMock = vi.fn();

vi.mock('../../hooks/useParametresNotifications', () => ({
  useParametresNotifications: () => useParametresNotificationsMock(),
}));

vi.mock('../../hooks/useBureauEtudeIban', () => ({
  useBureauEtudeIban: () => useBureauEtudeIbanMock(),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ toastSuccess: vi.fn(), toastError: vi.fn() }),
}));

beforeEach(() => {
  useParametresNotificationsMock.mockReturnValue({
    departements: [],
    preferences: { notifierTousDepartements: true, departementsSuivis: [] },
    isLoading: false,
    isSaving: false,
    loadError: null,
    savePreferences: vi.fn(),
  });
  useBureauEtudeIbanMock.mockReturnValue({
    bureau: { iban: 'FR7630006000011234567890189' },
    isLoading: false,
    loadError: null,
    isSavingIban: false,
    isSavingMotDePasse: false,
    saveIban: vi.fn(),
    saveMotDePasse: vi.fn(),
  });
});

describe('BEParametresPage', () => {
  it('affiche le shell de paramètres et les sections notifications/IBAN/mot de passe', () => {
    render(<BEParametresPage />);

    expect(screen.getByRole('heading', { name: /paramètres/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /préférences de notification/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /^iban$/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /mot de passe/i })).toBeTruthy();
  });
});


