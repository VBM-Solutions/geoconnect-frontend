import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SectionNotifications } from './SectionNotifications';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({
    toastSuccess: mockToastSuccess,
    toastError: mockToastError,
  }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const fakeDepts = [
  { code: '75', libelle: 'Paris' },
  { code: '92', libelle: 'Hauts-de-Seine' },
  { code: '971', libelle: 'Guadeloupe' },
];

const defaultProps = {
  departements: fakeDepts,
  preferences: { notifierTousDepartements: false, departementsSuivis: ['75'] },
  isLoading: false,
  isSaving: false,
  loadError: null,
  savePreferences: vi.fn().mockResolvedValue(true),
};

function renderSection(overrides: Partial<typeof defaultProps> = {}) {
  const props = { ...defaultProps, ...overrides, savePreferences: overrides.savePreferences ?? vi.fn().mockResolvedValue(true) };
  return render(<SectionNotifications {...props} />);
}

function submitForm() {
  fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));
}

function renderSelectionSection(savePreferences: any) {
  renderSection({
    preferences: { notifierTousDepartements: false, departementsSuivis: ['75'] },
    savePreferences,
  });
}

describe('SectionNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── États de chargement ───────────────────────────────────────────────────────

  it('affiche un spinner quand isLoading=true', () => {
    renderSection({ isLoading: true, preferences: null });
    expect(screen.getByText(/chargement des paramètres/i)).toBeTruthy();
  });

  it('affiche le message d\'erreur quand loadError est défini', () => {
    renderSection({ loadError: 'Erreur réseau', preferences: null });
    expect(screen.getByText('Erreur réseau')).toBeTruthy();
  });

  it('affiche le formulaire quand les données sont chargées', () => {
    renderSection();
    expect(screen.getByText(/préférences de notification/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeTruthy();
  });

  // ── État initial du formulaire ────────────────────────────────────────────────

  it('coche "Tous les départements" si notifierTousDepartements=true', () => {
    renderSection({ preferences: { notifierTousDepartements: true, departementsSuivis: [] } });
    const radioTous = screen.getByDisplayValue('tous');
    expect((radioTous as HTMLInputElement).checked).toBe(true);
  });

  it('coche "Sélection manuelle" si notifierTousDepartements=false', () => {
    renderSection({ preferences: { notifierTousDepartements: false, departementsSuivis: ['75'] } });
    const radioSelection = screen.getByDisplayValue('selection');
    expect((radioSelection as HTMLInputElement).checked).toBe(true);
  });

  // ── Interactions ──────────────────────────────────────────────────────────────

  it('bascule vers "Tous les départements" au clic sur le radio correspondant', async () => {
    renderSection({ preferences: { notifierTousDepartements: false, departementsSuivis: ['75'] } });
    const radioTous = screen.getByDisplayValue('tous');

    await userEvent.click(radioTous);

    expect((radioTous as HTMLInputElement).checked).toBe(true);
  });

  it('désactive le MultiSelect quand notifierTousDepartements=true', () => {
    renderSection({ preferences: { notifierTousDepartements: true, departementsSuivis: [] } });
    const trigger = screen.getByRole('button', { name: /sélectionner des départements/i });
    expect(trigger).toBeDisabled();
  });

  it('active le MultiSelect quand notifierTousDepartements=false', () => {
    renderSection({ preferences: { notifierTousDepartements: false, departementsSuivis: [] } });
    const trigger = screen.getByRole('button', { name: /sélectionner des départements/i });
    expect(trigger).not.toBeDisabled();
  });

  // ── Validation ────────────────────────────────────────────────────────────────

  it('affiche un toast d\'erreur si on soumet avec aucun dept et mode sélection', async () => {
    renderSection({ preferences: { notifierTousDepartements: false, departementsSuivis: [] } });

    submitForm();

    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('Aucun département sélectionné'),
    );
    expect(defaultProps.savePreferences).not.toHaveBeenCalled();
  });

  it('n\'affiche pas d\'avertissement si notifierTousDepartements=true et liste vide', () => {
    renderSection({ preferences: { notifierTousDepartements: true, departementsSuivis: [] } });
    // L'alerte "Aucun département" ne doit pas apparaître
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('affiche l\'avertissement inline si mode sélection et aucun dept choisi', () => {
    renderSection({ preferences: { notifierTousDepartements: false, departementsSuivis: [] } });
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  // ── Soumission réussie ────────────────────────────────────────────────────────

  it('appelle savePreferences avec les bonnes données et affiche un toast de succès', async () => {
    const saveMock = vi.fn().mockResolvedValue(true);
    renderSelectionSection(saveMock);
    submitForm();

    await waitFor(() => expect(saveMock).toHaveBeenCalledOnce());
    expect(saveMock).toHaveBeenCalledWith({
      notifierTousDepartements: false,
      departementsSuivis: ['75'],
      afficherTousDepartements: true,
      departementsVisibles: [],
    });
    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.stringContaining('Préférences de notification enregistrées'),
    );
  });

  it('vide departementsSuivis dans le payload si notifierTousDepartements=true', async () => {
    const saveMock = vi.fn().mockResolvedValue(true);
    renderSection({
      preferences: { notifierTousDepartements: true, departementsSuivis: [] },
      savePreferences: saveMock,
    });

    submitForm();

    await waitFor(() => expect(saveMock).toHaveBeenCalled());
    expect(saveMock).toHaveBeenCalledWith({
      notifierTousDepartements: true,
      departementsSuivis: [],
      afficherTousDepartements: true,
      departementsVisibles: [],
    });
  });

  it('affiche un toast d\'erreur si savePreferences retourne false', async () => {
    const saveMock = vi.fn().mockResolvedValue(false);
    renderSelectionSection(saveMock);
    submitForm();

    await waitFor(() => expect(mockToastError).toHaveBeenCalled());
    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringContaining('Impossible d\'enregistrer'),
    );
  });

  // ── Bouton isSaving ───────────────────────────────────────────────────────────

  it('affiche "Enregistrement…" et désactive le bouton quand isSaving=true', () => {
    renderSection({ isSaving: true });
    const btn = screen.getByRole('button', { name: /enregistrement/i });
    expect(btn).toBeDisabled();
  });
});

