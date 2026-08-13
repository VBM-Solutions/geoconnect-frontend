import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useClientDashboardData } from './useClientDashboardData';
import * as AuthContextModule from '../contexts/AuthContext';

vi.mock('../api/client', () => ({ getClientByUserId: vi.fn() }));
vi.mock('../api/demandeDevis', () => ({ getOpenDemandesClientPaginated: vi.fn() }));
vi.mock('../api/propositionDevis', () => ({ getPropositionsByDemandeIds: vi.fn() }));
vi.mock('../api/etude', () => ({
  getEtudeIdsAEvaluer: vi.fn(),
  getEtudeDetailsByClientIdPaginated: vi.fn(),
}));

import { getClientByUserId } from '../api/client';
import { getOpenDemandesClientPaginated } from '../api/demandeDevis';
import { getPropositionsByDemandeIds } from '../api/propositionDevis';
import { getEtudeIdsAEvaluer, getEtudeDetailsByClientIdPaginated } from '../api/etude';

const fakeClient = { id: 3, nom: 'Dupont', prenom: 'Jean', utilisateurId: 1 };
const fakeDemande = { id: 7, description: 'Travaux toit' };
const fakePropo = { id: 12, demandeId: 7, statut: 'EN_ATTENTE' };
const activeEtude = { id: 20, etat: 'DEVIS_VALIDE' };
const archivedEtude = { id: 21, etat: 'PAIEMENT_EFFECTUE' };
const page = (items: any[], totalItems = items.length) => ({
  items, page: 0, size: 8, totalItems, totalPages: totalItems ? 1 : 0, hasNext: false,
});

function mockUseAuth() {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: { userId: 1, token: 'tok', role: 'CLIENT', email: 'client@test.com' },
    isAuthenticated: true, isLoading: false, login: vi.fn(), logout: vi.fn(),
  });
}

describe('useClientDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth();
    (getClientByUserId as any).mockResolvedValue(fakeClient);
    (getOpenDemandesClientPaginated as any).mockResolvedValue(page([]));
    (getEtudeDetailsByClientIdPaginated as any).mockResolvedValue(page([]));
    (getEtudeIdsAEvaluer as any).mockResolvedValue([]);
    (getPropositionsByDemandeIds as any).mockResolvedValue({});
  });

  it('charge les pages, les totaux globaux et les propositions de la page courante', async () => {
    (getOpenDemandesClientPaginated as any).mockResolvedValue(page([fakeDemande], 12));
    (getPropositionsByDemandeIds as any).mockResolvedValue({ 7: [fakePropo] });
    (getEtudeDetailsByClientIdPaginated as any).mockImplementation((_id: number, category: string) => {
      if (category === 'ACTIVE') return Promise.resolve(page([activeEtude], 5));
      if (category === 'ARCHIVED') return Promise.resolve(page([archivedEtude], 2));
      return Promise.resolve(page([], 3));
    });
    (getEtudeIdsAEvaluer as any).mockResolvedValue([21]);

    const { result } = renderHook(() => useClientDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.demandes[0].propositions).toEqual([fakePropo]);
    expect(result.current.etudes).toEqual([activeEtude, archivedEtude]);
    expect(result.current.demandeTotal).toBe(12);
    expect(result.current.activeEtudeTotal).toBe(5);
    expect(result.current.archivedEtudeTotal).toBe(2);
    expect(result.current.completedEtudeTotal).toBe(3);
  });

  it('recharge la page demandée', async () => {
    const { result } = renderHook(() => useClientDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => { await result.current.setDemandePage(1); });
    await waitFor(() => expect(result.current.demandePage).toBe(1));
    expect(getOpenDemandesClientPaginated).toHaveBeenLastCalledWith(1);
  });

  it('expose une erreur de lecture paginée', async () => {
    (getOpenDemandesClientPaginated as any).mockRejectedValue(new Error('Serveur KO'));
    const { result } = renderHook(() => useClientDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toContain('Serveur KO');
  });

  it('arrête le chargement lorsqu’aucun profil client complet n’existe', async () => {
    (getClientByUserId as any).mockResolvedValue({ nom: 'Sans identifiant' });
    const { result } = renderHook(() => useClientDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getOpenDemandesClientPaginated).not.toHaveBeenCalled();
  });

  it('isole une panne du batch de propositions', async () => {
    (getOpenDemandesClientPaginated as any).mockResolvedValue(page([fakeDemande]));
    (getPropositionsByDemandeIds as any).mockRejectedValue(new Error('KO'));
    const { result } = renderHook(() => useClientDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.demandes[0].propositions).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('isole une panne de la liste des évaluations', async () => {
    (getEtudeIdsAEvaluer as any).mockRejectedValue(new Error('KO'));
    const { result } = renderHook(() => useClientDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.etudeIdsAEvaluer).toEqual([]);
  });

  it('refetch redéclenche toutes les lectures', async () => {
    const { result } = renderHook(() => useClientDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const calls = (getClientByUserId as any).mock.calls.length;
    act(() => result.current.refetch());
    await waitFor(() => expect((getClientByUserId as any).mock.calls.length).toBeGreaterThan(calls));
  });

  it('ne charge rien sans utilisateur', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null, isAuthenticated: false, isLoading: false, login: vi.fn(), logout: vi.fn(),
    });
    renderHook(() => useClientDashboardData());
    expect(getClientByUserId).not.toHaveBeenCalled();
  });

  it('recharge séparément les études actives et archivées', async () => {
    const { result } = renderHook(() => useClientDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    (getEtudeDetailsByClientIdPaginated as any)
      .mockResolvedValueOnce(page([activeEtude]))
      .mockResolvedValueOnce(page([archivedEtude]));
    await act(() => result.current.setActiveEtudePage(2));
    await waitFor(() => expect(result.current.etudes).toEqual([activeEtude]));
    await act(() => result.current.setArchivedEtudePage(3));
    expect(getEtudeDetailsByClientIdPaginated).toHaveBeenCalledWith(3, 'ACTIVE', 2);
    expect(getEtudeDetailsByClientIdPaginated).toHaveBeenCalledWith(3, 'ARCHIVED', 3);
    expect(result.current.etudes).toEqual([activeEtude, archivedEtude]);
  });

  it('capture les erreurs des changements de pages', async () => {
    const { result } = renderHook(() => useClientDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    (getEtudeDetailsByClientIdPaginated as any).mockRejectedValueOnce(new Error('Etude KO'));
    await act(() => result.current.setActiveEtudePage(1));
    expect(result.current.error).toContain('Etude KO');
  });

  it('ignore les changements de page sans profil client', async () => {
    (getClientByUserId as any).mockResolvedValue(null);
    const { result } = renderHook(() => useClientDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(() => result.current.setDemandePage(1));
    await act(() => result.current.setArchivedEtudePage(1));
    expect(getOpenDemandesClientPaginated).not.toHaveBeenCalled();
  });

  it('enrichit une nouvelle page de demandes avec ses propositions', async () => {
    const { result } = renderHook(() => useClientDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    (getOpenDemandesClientPaginated as any).mockResolvedValue(page([fakeDemande], 9));
    (getPropositionsByDemandeIds as any).mockResolvedValue({ 7: [fakePropo] });
    await act(() => result.current.setDemandePage(2));
    expect(result.current.demandes[0].propositions).toEqual([fakePropo]);
    expect(result.current.demandeTotal).toBe(9);
  });

  it('isole une panne du batch de propositions lors d’un changement de page', async () => {
    const { result } = renderHook(() => useClientDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    (getOpenDemandesClientPaginated as any).mockResolvedValue(page([fakeDemande]));
    (getPropositionsByDemandeIds as any).mockRejectedValue(new Error('Batch KO'));
    await act(() => result.current.setDemandePage(1));
    expect(result.current.demandes[0].propositions).toEqual([]);
  });

  it('capture une erreur de changement de page des demandes', async () => {
    const { result } = renderHook(() => useClientDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    (getOpenDemandesClientPaginated as any).mockRejectedValueOnce(new Error('Demandes KO'));
    await act(() => result.current.setDemandePage(4));
    expect(result.current.error).toContain('Demandes KO');
  });

  it('ignore une réponse profil arrivée après démontage', async () => {
    let resolveClient!: (value: unknown) => void;
    (getClientByUserId as any).mockReturnValue(new Promise(resolve => { resolveClient = resolve; }));
    const { unmount } = renderHook(() => useClientDashboardData());
    unmount();
    resolveClient(fakeClient);
    await Promise.resolve();
    expect(getOpenDemandesClientPaginated).not.toHaveBeenCalled();
  });

  it('ignore les pages arrivées après démontage', async () => {
    let resolvePage!: (value: unknown) => void;
    (getOpenDemandesClientPaginated as any).mockReturnValue(new Promise(resolve => { resolvePage = resolve; }));
    const { unmount } = renderHook(() => useClientDashboardData());
    await waitFor(() => expect(getOpenDemandesClientPaginated).toHaveBeenCalled());
    unmount();
    resolvePage(page([]));
    await Promise.resolve();
  });

  it('ignore le batch de propositions arrivé après démontage', async () => {
    let resolvePropositions!: (value: unknown) => void;
    (getOpenDemandesClientPaginated as any).mockResolvedValue(page([fakeDemande]));
    (getPropositionsByDemandeIds as any).mockReturnValue(new Promise(resolve => { resolvePropositions = resolve; }));
    const { unmount } = renderHook(() => useClientDashboardData());
    await waitFor(() => expect(getPropositionsByDemandeIds).toHaveBeenCalled());
    unmount();
    resolvePropositions({ 7: [fakePropo] });
    await Promise.resolve();
  });

  it('ignore une erreur initiale après démontage', async () => {
    let rejectClient!: (reason: unknown) => void;
    (getClientByUserId as any).mockReturnValue(new Promise((_resolve, reject) => { rejectClient = reject; }));
    const { result, unmount } = renderHook(() => useClientDashboardData());
    unmount();
    rejectClient(new Error('Trop tard'));
    await Promise.resolve();
    expect(result.current.error).toBeNull();
  });
});
