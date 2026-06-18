import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useClientDashboardData } from './useClientDashboardData';
import * as AuthContextModule from '../contexts/AuthContext';

vi.mock('../api/client', () => ({
  getClientByUserId: vi.fn(),
}));
vi.mock('../api/demandeDevis', () => ({
  getAllDemandeDevis: vi.fn(),
}));
vi.mock('../api/propositionDevis', () => ({
  getPropositionDevisByDemandeId: vi.fn(),
}));
vi.mock('../api/etude', () => ({
  getEtudesByClientId: vi.fn(),
  fetchEtudeDetails:   vi.fn(),
}));

import { getClientByUserId } from '../api/client';
import { getAllDemandeDevis } from '../api/demandeDevis';
import { getPropositionDevisByDemandeId } from '../api/propositionDevis';
import { getEtudesByClientId, fetchEtudeDetails } from '../api/etude';

const fakeClient  = { id: 3, nom: 'Dupont', prenom: 'Jean', utilisateurId: 1 };
const fakeDemande = { id: 7, description: 'Travaux toit' };
const fakePropo   = { id: 12, demandeId: 7, statut: 'EN_ATTENTE' };
const fakeEtude   = { id: 20, etat: 'DEVIS_VALIDE' };

function mockUseAuth(userId = 1) {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: { userId, token: 'tok', role: 'CLIENT', email: 'client@test.com' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  });
}

describe('useClientDashboardData', () => {
  beforeEach(() => vi.clearAllMocks());

  it('ne charge rien si user est null', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    const { result } = renderHook(() => useClientDashboardData());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.client).toBeNull();
  });

  it('arrête le chargement si le client n\'a pas d\'id', async () => {
    mockUseAuth();
    (getClientByUserId as any).mockResolvedValue({ nom: 'Sans ID' });

    const { result } = renderHook(() => useClientDashboardData());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.client).toBeNull();
  });

  it('charge toutes les données en cas nominal', async () => {
    mockUseAuth();
    (getClientByUserId as any).mockResolvedValue(fakeClient);
    (getAllDemandeDevis as any).mockResolvedValue([fakeDemande]);
    (getPropositionDevisByDemandeId as any).mockResolvedValue([fakePropo]);
    (getEtudesByClientId as any).mockResolvedValue([fakeEtude]);
    (fetchEtudeDetails as any).mockResolvedValue([fakeEtude]);

    const { result } = renderHook(() => useClientDashboardData());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.client).toEqual(fakeClient);
    expect(result.current.demandes).toHaveLength(1);
    expect(result.current.demandes[0].propositions).toEqual([fakePropo]);
    expect(result.current.etudes).toEqual([fakeEtude]);
    expect(result.current.error).toBeNull();
  });

  it('positionne error si getClientByUserId rejette', async () => {
    mockUseAuth();
    (getClientByUserId as any).mockRejectedValue(new Error('Serveur KO'));

    const { result } = renderHook(() => useClientDashboardData());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeTruthy();
    expect(result.current.client).toBeNull();
  });

  it('retourne propositions=[] si getPropositionDevisByDemandeId échoue (catch silencieux)', async () => {
    mockUseAuth();
    (getClientByUserId as any).mockResolvedValue(fakeClient);
    (getAllDemandeDevis as any).mockResolvedValue([fakeDemande]);
    (getPropositionDevisByDemandeId as any).mockRejectedValue(new Error('KO'));
    (getEtudesByClientId as any).mockResolvedValue([]);
    (fetchEtudeDetails as any).mockResolvedValue([]);

    const { result } = renderHook(() => useClientDashboardData());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.demandes[0].propositions).toEqual([]);
  });

  it('retourne etudes=[] si getEtudesByClientId échoue (catch silencieux)', async () => {
    mockUseAuth();
    (getClientByUserId as any).mockResolvedValue(fakeClient);
    (getAllDemandeDevis as any).mockResolvedValue([]);
    (getEtudesByClientId as any).mockRejectedValue(new Error('KO'));
    (fetchEtudeDetails as any).mockResolvedValue([]);

    const { result } = renderHook(() => useClientDashboardData());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.etudes).toEqual([]);
  });

  it('refetch() redéclenche le chargement', async () => {
    mockUseAuth();
    (getClientByUserId as any).mockResolvedValue(fakeClient);
    (getAllDemandeDevis as any).mockResolvedValue([]);
    (getEtudesByClientId as any).mockResolvedValue([]);
    (fetchEtudeDetails as any).mockResolvedValue([]);

    const { result, rerender } = renderHook(() => useClientDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const callsBefore = (getClientByUserId as any).mock.calls.length;

    result.current.refetch();
    rerender();

    await waitFor(() =>
      expect((getClientByUserId as any).mock.calls.length).toBeGreaterThan(callsBefore)
    );
  });
});
