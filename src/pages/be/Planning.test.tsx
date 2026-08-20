import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBEPlanning } from '../../hooks/useBEPlanning';
import Planning from './Planning';

vi.mock('../../hooks/useBEPlanning', () => ({ useBEPlanning: vi.fn() }));

const actions = {
  setView: vi.fn(), previous: vi.fn(), next: vi.fn(), today: vi.fn(), goToDate: vi.fn(),
};

function basePlanning(overrides = {}) {
  const days = Array.from({ length: 7 }, (_, index) => new Date(2026, 7, 17 + index));
  return {
    view: 'week' as const,
    anchor: new Date(2026, 7, 20),
    range: { start: days[0], endExclusive: new Date(2026, 7, 24), days },
    events: [], isLoading: false, error: null,
    ...actions,
    ...overrides,
  };
}

function renderPage() {
  return render(<MemoryRouter><Planning /></MemoryRouter>);
}

describe('BE Planning page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(new Date(2026, 7, 20, 12));
    vi.mocked(useBEPlanning).mockReturnValue(basePlanning());
  });

  it('renders daily events and a visibly distinct contractual week', () => {
    vi.mocked(useBEPlanning).mockReturnValue(basePlanning({
      events: [
        { id: 'INTERVENTION-1', etudeId: 1, type: 'INTERVENTION', precision: 'JOUR', statut: 'A_CONFIRMER', startDate: '2026-08-19', endDate: '2026-08-19', typeEtude: 'G2_AVP', ville: 'Nantes', codePostal: '44000' },
        { id: 'RENDU-2', etudeId: 2, type: 'RENDU', precision: 'SEMAINE', statut: 'CONTRACTUEL', startDate: '2026-08-17', endDate: '2026-08-23', typeEtude: 'G1_ES_PGC' },
        { id: 'INTERVENTION-6', etudeId: 6, type: 'INTERVENTION', precision: 'SEMAINE', statut: 'CONTRACTUEL', startDate: '2026-08-17', endDate: '2026-08-23' },
        { id: 'INTERVENTION-3', etudeId: 3, type: 'INTERVENTION', precision: 'JOUR', statut: 'CONFIRME', startDate: '2026-08-20', endDate: '2026-08-20' },
        { id: 'RENDU-4', etudeId: 4, type: 'RENDU', precision: 'JOUR', statut: 'ANNONCE', startDate: '2026-08-21', endDate: '2026-08-21' },
        { id: 'RENDU-5', etudeId: 5, type: 'RENDU', precision: 'JOUR', statut: 'REALISE', startDate: '2026-08-22', endDate: '2026-08-22' },
      ],
    }));

    renderPage();

    expect(screen.getByRole('heading', { name: 'Planning' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Intervention · G2_AVP, À confirmer/ })).toHaveAttribute('href', '/be/etude/1');
    const contractualLinks = screen.getAllByRole('link', { name: /Rendu · G1_ES_PGC, Semaine contractuelle/ });
    expect(contractualLinks).toHaveLength(1);
    expect(contractualLinks[0]).toHaveClass('border-dashed', 'border-emerald-500');
    expect(screen.getAllByRole('link', { name: /Intervention, Semaine contractuelle/ })[0])
      .toHaveClass('border-dashed', 'border-violet-400');
    expect(screen.getByRole('link', { name: 'Intervention, Confirmé' })).toHaveClass('bg-red-600');
    expect(screen.getByText('Nantes - 44000')).toBeInTheDocument();
  });

  it('aligns non-overlapping daily events on the same row', () => {
    vi.mocked(useBEPlanning).mockReturnValue(basePlanning({
      events: [
        { id: 'INTERVENTION-1', etudeId: 1, type: 'INTERVENTION', precision: 'JOUR', statut: 'CONFIRME', startDate: '2026-08-17', endDate: '2026-08-17' },
        { id: 'RENDU-2', etudeId: 2, type: 'RENDU', precision: 'JOUR', statut: 'REALISE', startDate: '2026-08-18', endDate: '2026-08-18' },
      ],
    }));
    renderPage();

    const interventionLane = screen.getByRole('link', { name: 'Intervention, Confirmé' }).closest('[data-event-lane]');
    const renderingLane = screen.getByRole('link', { name: 'Rendu, Réalisé' }).closest('[data-event-lane]');
    expect(interventionLane).toHaveAttribute('data-event-lane', '0');
    expect(renderingLane).toHaveAttribute('data-event-lane', '0');
  });

  it('wires period and view controls', () => {
    renderPage();
    expect(screen.getByLabelText('Période affichée')).toHaveTextContent('S34');
    fireEvent.click(screen.getByRole('button', { name: 'Période précédente' }));
    fireEvent.click(screen.getByRole('button', { name: "Aujourd'hui" }));
    fireEvent.click(screen.getByRole('button', { name: 'Période suivante' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mois' }));
    fireEvent.click(screen.getByLabelText('Choisir une semaine'));
    expect(screen.getByRole('button', { name: 'Afficher la semaine 34 de 2026' })).toHaveTextContent('S3417–23 août');
    fireEvent.click(screen.getByRole('button', { name: 'Afficher la semaine 40 de 2026' }));
    expect(actions.previous).toHaveBeenCalledOnce();
    expect(actions.today).toHaveBeenCalledOnce();
    expect(actions.next).toHaveBeenCalledOnce();
    expect(actions.setView).toHaveBeenCalledWith('month');
    expect(actions.goToDate).toHaveBeenCalledWith(new Date(2026, 8, 28));
  });

  it('renders loading, error and empty states', () => {
    vi.mocked(useBEPlanning).mockReturnValue(basePlanning({ isLoading: true }));
    const { rerender } = renderPage();
    expect(screen.getByRole('status')).toHaveTextContent('Chargement du planning');

    vi.mocked(useBEPlanning).mockReturnValue(basePlanning({ error: 'Erreur planning' }));
    rerender(<MemoryRouter><Planning /></MemoryRouter>);
    expect(screen.getByRole('alert')).toHaveTextContent('Erreur planning');

    vi.mocked(useBEPlanning).mockReturnValue(basePlanning());
    rerender(<MemoryRouter><Planning /></MemoryRouter>);
    expect(screen.getByText('Aucune échéance sur cette période.')).toBeInTheDocument();
  });

  it('renders a month title and outside-month days', () => {
    vi.mocked(useBEPlanning).mockReturnValue(basePlanning({ view: 'month' }));
    renderPage();
    expect(screen.getByRole('heading', { name: 'août 2026' })).toBeInTheDocument();
    expect(screen.getByLabelText('Période affichée')).toHaveTextContent('août');
    expect(screen.getByLabelText('Choisir un mois')).toHaveTextContent('août 2026');
    expect(document.querySelectorAll('[data-current-week="true"]')).toHaveLength(7);
    const currentDay = screen.getByText('20').closest('article');
    expect(currentDay).toHaveAttribute('data-current-day', 'true');
    expect(document.querySelectorAll('[data-weekend="true"]')).toHaveLength(2);
    const currentWeekStart = screen.getByText('17').closest('article');
    expect(currentWeekStart).toHaveClass('border-l-[#779649]');
    expect(currentWeekStart?.className).not.toContain('shadow-[inset');
  });
});
