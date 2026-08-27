import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PerformanceBureauEtudePage from './PerformanceBureauEtudePage';
import { getMaFicheBureauEtude, getMaPerformance } from '../../api/profilBureauEtude';
import { ToastProvider } from '../../contexts/ToastContext';

vi.mock('../../api/profilBureauEtude', () => ({ getMaPerformance: vi.fn(), getMaFicheBureauEtude: vi.fn() }));

const indicateurs = {
  demandesTraitees: 7, propositionsEnvoyees: 8, propositionsAcceptees: 4,
  propositionsRefusees: 3, propositionsEnAttente: 1, tauxAcceptation: 50,
  montantPropositions: 10000, montantAccepte: 5000, etudesDemarrees: 4,
  rapportsRendus: 3, rapportsRendusDansLesDelais: 2, tauxRapportsDansLesDelais: 66.7,
  delaiMoyenReponseJours: 1.5, delaiMoyenRenduJours: 12, evaluations: 2,
  noteGlobale: 4.5, qualiteEchanges: 4.5, respectDelais: 4, qualiteRapport: 5,
};

describe('PerformanceBureauEtudePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMaPerformance).mockResolvedValue({ debut: '2026-08-01', fin: '2026-08-21', indicateurs, periodePrecedente: indicateurs, etudesEnCours: 2 });
    vi.mocked(getMaFicheBureauEtude).mockResolvedValue({ evaluations: { nombreEvaluations: 0, avis: [] } } as never);
  });

  it('affiche les KPI et recharge lors du changement de période', async () => {
    render(<ToastProvider><PerformanceBureauEtudePage /></ToastProvider>);
    expect(await screen.findByRole('heading', { name: 'Performance' })).toBeTruthy();
    expect(screen.getByText('50 %')).toBeTruthy();
    expect(screen.getAllByText('4.5 / 5')).not.toHaveLength(0);
    expect(screen.getByText('Chiffre d’affaires')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Période'));
    expect(screen.getByRole('listbox', { name: 'Choisir une période' })).toBeTruthy();
    fireEvent.click(screen.getByRole('option', { name: '3 mois' }));
    await waitFor(() => expect(getMaPerformance).toHaveBeenCalledTimes(2));
  });

  it('masque les comparaisons pour la période depuis le début', async () => {
    render(<ToastProvider><PerformanceBureauEtudePage /></ToastProvider>);
    expect(await screen.findAllByText('Stable')).not.toHaveLength(0);

    fireEvent.click(screen.getByLabelText('Période'));
    fireEvent.click(screen.getByRole('option', { name: 'Depuis le début' }));

    await waitFor(() => expect(getMaPerformance).toHaveBeenLastCalledWith('2000-01-01', expect.any(String)));
    expect(screen.queryByText('Stable')).toBeNull();
    expect(screen.queryByText(/vs période précédente/)).toBeNull();
  });

  it('affiche une erreur de chargement', async () => {
    vi.mocked(getMaPerformance).mockRejectedValue(new Error('performance ko'));
    render(<ToastProvider><PerformanceBureauEtudePage /></ToastProvider>);
    expect(await screen.findByRole('alert')).toHaveTextContent('performance ko');
  });
});
