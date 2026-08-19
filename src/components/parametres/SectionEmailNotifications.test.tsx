import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SectionEmailNotifications } from './SectionEmailNotifications';
import { NotificationCategory } from '../../types';

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('../../contexts/ToastContext', () => ({ useToast: () => ({ toastSuccess, toastError }) }));

const baseProps = {
  categoriesActives: ['PROPOSITIONS', 'PLANIFICATION'] as NotificationCategory[],
  isLoading: false,
  isSaving: false,
  loadError: null,
  save: vi.fn().mockResolvedValue(true),
  recipientRole: 'BUREAU_ETUDE' as const,
};

describe('SectionEmailNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adapte les libellés au rôle du destinataire', () => {
    const { rerender } = render(<SectionEmailNotifications {...baseProps} />);
    expect(screen.getByText(/vos propositions acceptées ou refusées/i)).toBeTruthy();
    expect(screen.getByText(/dates d'intervention validées ou refusées/i)).toBeTruthy();

    rerender(<SectionEmailNotifications {...baseProps} recipientRole="CLIENT" />);
    expect(screen.getByText(/nouvelles propositions reçues/i)).toBeTruthy();
    expect(screen.getByText(/dates d'intervention proposées/i)).toBeTruthy();
    expect(screen.queryByText('Opportunités')).toBeNull();
    expect(screen.queryByText('Paiement et clôture')).toBeNull();
  });

  it('affiche chargement et erreur', () => {
    const { rerender } = render(<SectionEmailNotifications {...baseProps} isLoading />);
    expect(screen.getByText(/chargement/i)).toBeTruthy();
    rerender(<SectionEmailNotifications {...baseProps} isLoading={false} loadError="Erreur email" />);
    expect(screen.getByText('Erreur email')).toBeTruthy();
  });

  it('permet de désactiver une catégorie et sauvegarde', async () => {
    const save = vi.fn().mockResolvedValue(true);
    render(<SectionEmailNotifications {...baseProps} categoriesActives={['PROPOSITIONS']} save={save} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /propositions/i }));
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => expect(save).toHaveBeenCalledWith([]));
    expect(toastSuccess).toHaveBeenCalled();
  });

  it('permet d’activer une catégorie et signale un échec', async () => {
    const save = vi.fn().mockResolvedValue(false);
    render(<SectionEmailNotifications {...baseProps} categoriesActives={[]} save={save} />);

    fireEvent.click(screen.getByRole('checkbox', { name: /opportunités/i }));
    fireEvent.click(screen.getByRole('button', { name: /enregistrer/i }));

    await waitFor(() => expect(save).toHaveBeenCalledWith(['OPPORTUNITES']));
    expect(toastError).toHaveBeenCalled();
  });

  it('désactive le bouton pendant la sauvegarde', () => {
    render(<SectionEmailNotifications {...baseProps} isSaving />);
    expect(screen.getByRole('button', { name: /enregistrement/i })).toBeDisabled();
  });
});
