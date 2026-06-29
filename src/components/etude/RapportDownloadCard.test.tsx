import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { RapportDownloadCard } from './RapportDownloadCard';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockDownloadDocument = vi.fn();
const mockToastError = vi.fn();

vi.mock('../../api/document', () => ({
  downloadDocument: (...args: any[]) => mockDownloadDocument(...args),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ toastError: mockToastError }),
}));

// ─── Fixtures ───────────────────────────────────────────────────────────────────

const rapportFixture = {
  id: 42,
  nomTelechargement: 'Projet_Rapport_BE.pdf',
  typeContenu: 'application/pdf',
  tailleFichier: 12345,
};

// ─── Tests ──────────────────────────────────────────────────────────────────────

describe('RapportDownloadCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDownloadDocument.mockResolvedValue(undefined);
  });

  it('affiche le titre "Rapport final" et le message explicatif', () => {
    render(<RapportDownloadCard rapport={rapportFixture} />);
    expect(screen.getByText('Rapport final')).toBeTruthy();
    expect(screen.getByText(/Votre étude est terminée/)).toBeTruthy();
  });

  it('affiche le bouton CTA "Télécharger mon rapport"', () => {
    render(<RapportDownloadCard rapport={rapportFixture} />);
    const btn = screen.getByRole('button', { name: /Télécharger mon rapport/i });
    expect(btn).toBeTruthy();
  });

  it('appelle downloadDocument avec le bon id et nomTelechargement au clic', async () => {
    render(<RapportDownloadCard rapport={rapportFixture} />);
    fireEvent.click(screen.getByRole('button', { name: /Télécharger mon rapport/i }));

    await waitFor(() => {
      expect(mockDownloadDocument).toHaveBeenCalledTimes(1);
      expect(mockDownloadDocument).toHaveBeenCalledWith(42, 'Projet_Rapport_BE.pdf');
    });
  });

  it('désactive le bouton et affiche le loader pendant le téléchargement', async () => {
    let resolveDl: (() => void) | undefined;
    mockDownloadDocument.mockImplementation(
      () => new Promise<void>((resolve) => { resolveDl = resolve; })
    );

    render(<RapportDownloadCard rapport={rapportFixture} />);
    const btn = screen.getByRole('button', { name: /Télécharger mon rapport/i });

    fireEvent.click(btn);
    expect(btn).toBeDisabled();

    resolveDl?.();
    await waitFor(() => {
      expect(mockDownloadDocument).toHaveBeenCalledTimes(1);
    });
  });

  it('affiche un toast en cas d\'erreur de téléchargement', async () => {
    mockDownloadDocument.mockRejectedValue(new Error('Network error'));

    render(<RapportDownloadCard rapport={rapportFixture} />);
    fireEvent.click(screen.getByRole('button', { name: /Télécharger mon rapport/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        'Impossible de télécharger le rapport. Veuillez réessayer.'
      );
    });
  });
});
