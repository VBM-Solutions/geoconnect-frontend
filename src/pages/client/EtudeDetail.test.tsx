import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../../contexts/ToastContext';
import ClientEtudeDetail from './EtudeDetail';

const mockUseEtudeDetail = vi.fn();

vi.mock('../../hooks/useEtudeDetail', () => ({
  useEtudeDetail: (id: string | undefined) => mockUseEtudeDetail(id),
}));

vi.mock('../../components/etude/EvaluationEtudeCard', () => ({
  EvaluationEtudeCard: () => <div data-testid="evaluation-etude-card" />,
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderPage(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <Routes>
          <Route path="/client/etude/:id" element={<ClientEtudeDetail />} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
}

function makeDocuments(rapport?: { id: number; nomTelechargement: string }) {
  return {
    documentsDemandeDevis: [],
    rapport,
  };
}

function makeEtude(etat: string, rapportId?: number) {
  return {
    id: 42,
    etat,
    propositionDevis: {
      bureauEtude: { raisonSociale: 'Geo Test', profilPublicSlug: 'geo-test' },
      prix: 1200,
      delaiMaxRendu: 3,
      demandeDevis: {
        adresseProjet: { ville: 'Nantes', codePostal: '44000' },
      },
    },
    devisSigneId: 1,
    rapportId: rapportId ?? null,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ClientEtudeDetail — RapportDownloadCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEtudeDetail.mockReturnValue({
      etude: makeEtude('PAIEMENT_EFFECTUE', 99),
      documents: makeDocuments({ id: 99, nomTelechargement: 'Projet_Rapport_BE.pdf' }),
      isLoading: false,
      actionLoading: false,
      actionKey: null,
      error: null,
      withAction: vi.fn(),
    });
  });

  it('affiche le RapportDownloadCard quand etat = PAIEMENT_EFFECTUE et rapport présent', () => {
    renderPage('/client/etude/42');
    expect(screen.getByRole('button', { name: /Télécharger mon rapport/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /consulter la fiche de geo test/i }).getAttribute('href'))
      .toBe('/bureaux-etudes/geo-test?retour=%2Fclient%2Fetude%2F42');
  });

  it('n\'affiche PAS le RapportDownloadCard quand etat != PAIEMENT_EFFECTUE', () => {
    mockUseEtudeDetail.mockReturnValue({
      etude: makeEtude('RAPPORT_TERMINE', 99),
      documents: makeDocuments({ id: 99, nomTelechargement: 'Projet_Rapport_BE.pdf' }),
      isLoading: false,
      actionLoading: false,
      actionKey: null,
      error: null,
      withAction: vi.fn(),
    });
    renderPage('/client/etude/42');
    // Le titre "Rapport final" existe dans le layout documents existant — on vérifie
    // l'absence du bouton CTA spécifique
    expect(screen.queryByRole('button', { name: /Télécharger mon rapport/i })).toBeNull();
  });

  it('n\'affiche PAS le RapportDownloadCard quand le rapport est absent', () => {
    mockUseEtudeDetail.mockReturnValue({
      etude: makeEtude('PAIEMENT_EFFECTUE'),
      documents: makeDocuments(),
      isLoading: false,
      actionLoading: false,
      actionKey: null,
      error: null,
      withAction: vi.fn(),
    });
    renderPage('/client/etude/42');
    expect(screen.queryByRole('button', { name: /Télécharger mon rapport/i })).toBeNull();
  });
});
