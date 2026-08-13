import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBEDashboardData } from './useBEDashboardData';
import * as AuthContext from '../contexts/AuthContext';
import { getBureauByUserId } from '../api/bureauEtude';
import { getBureauEtudeWorkItemsPaginated } from '../api/demandeDevis';
import { getEtudeDetailsByBureauIdPaginated } from '../api/etude';
import { getNotificationPreferences } from '../api/parametres';

vi.mock('../api/bureauEtude', () => ({ getBureauByUserId: vi.fn() }));
vi.mock('../api/demandeDevis', () => ({ getBureauEtudeWorkItemsPaginated: vi.fn() }));
vi.mock('../api/etude', () => ({ getEtudeDetailsByBureauIdPaginated: vi.fn() }));
vi.mock('../api/parametres', () => ({ getNotificationPreferences: vi.fn() }));

const page = <T,>(items: T[], pageNumber = 0, totalItems = items.length, totalPages = totalItems ? 1 : 0) =>
  ({ items, page: pageNumber, size: 8, totalItems, totalPages, hasNext: pageNumber + 1 < totalPages });
const demande = { id: 1, description: 'Mission' };
const proposition = { id: 2, demandeDevisId: 1, statut: 'EN_ATTENTE' };
const etude = { id: 3, etat: 'DEVIS_VALIDE' };

describe('useBEDashboardData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: { userId: 7 } } as never);
    vi.mocked(getBureauByUserId).mockResolvedValue({ id: 10 } as never);
    vi.mocked(getNotificationPreferences).mockResolvedValue({ notifierTousDepartements: false, departementsSuivis: ['75'] } as never);
    vi.mocked(getBureauEtudeWorkItemsPaginated).mockImplementation(async category =>
      category === 'AVAILABLE' ? page([{ demande, proposition: null }]) as never : page([{ demande, proposition }]) as never);
    vi.mocked(getEtudeDetailsByBureauIdPaginated).mockImplementation(async (_id, category) =>
      page(category === 'ACTIVE' ? [etude] : []) as never);
  });

  it('charge les quatre listes paginées et applique les départements suivis côté serveur', async () => {
    const { result } = renderHook(() => useBEDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.filterByDept).toBe(true);
    expect(result.current.demandes).toHaveLength(2);
    expect(result.current.myPropositions).toEqual([proposition]);
    expect(result.current.etudes).toEqual([etude]);
    expect(getBureauEtudeWorkItemsPaginated).toHaveBeenCalledWith('AVAILABLE', 0, 8, ['75']);
    expect(getEtudeDetailsByBureauIdPaginated).toHaveBeenCalledTimes(2);
  });

  it('ne filtre pas lorsque tous les départements sont suivis', async () => {
    vi.mocked(getNotificationPreferences).mockResolvedValue({ notifierTousDepartements: true, departementsSuivis: [] } as never);
    const { result } = renderHook(() => useBEDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.filterByDept).toBe(false);
    expect(getBureauEtudeWorkItemsPaginated).toHaveBeenCalledWith('AVAILABLE', 0, 8, []);
  });

  it('recharge uniquement la catégorie dont la page change', async () => {
    const { result } = renderHook(() => useBEDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    vi.mocked(getBureauEtudeWorkItemsPaginated).mockClear();
    await act(() => result.current.setPendingPage(1));
    expect(getBureauEtudeWorkItemsPaginated).toHaveBeenCalledOnce();
    expect(getBureauEtudeWorkItemsPaginated).toHaveBeenCalledWith('PENDING', 1, 8);
  });

  it('réinitialise la page des missions quand le filtre change', async () => {
    const { result } = renderHook(() => useBEDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    vi.mocked(getBureauEtudeWorkItemsPaginated).mockClear();
    await act(() => result.current.setFilterByDept(false));
    expect(getBureauEtudeWorkItemsPaginated).toHaveBeenCalledWith('AVAILABLE', 0, 8, []);
  });

  it('expose une erreur sans conserver le chargement actif', async () => {
    vi.mocked(getBureauByUserId).mockRejectedValue(new Error('Réseau KO'));
    const { result } = renderHook(() => useBEDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toContain('Réseau KO');
  });

  it('recharge les pages disponible, active et archivée', async () => {
    const { result } = renderHook(() => useBEDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(() => result.current.setAvailablePage(2));
    await act(() => result.current.setActiveEtudePage(1));
    await act(() => result.current.setArchivedEtudePage(3));
    expect(getBureauEtudeWorkItemsPaginated).toHaveBeenLastCalledWith('AVAILABLE', 2, 8, ['75']);
    expect(getEtudeDetailsByBureauIdPaginated).toHaveBeenCalledWith(10, 'ACTIVE', 1, 8);
    expect(getEtudeDetailsByBureauIdPaginated).toHaveBeenCalledWith(10, 'ARCHIVED', 3, 8);
  });

  it('gère un profil BE sans identifiant et une préférence indisponible', async () => {
    vi.mocked(getBureauByUserId).mockResolvedValue({ raisonSociale: 'Sans id' } as never);
    vi.mocked(getNotificationPreferences).mockRejectedValue(new Error('KO'));
    const { result } = renderHook(() => useBEDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.notificationPreferences).toBeNull();
    await act(() => result.current.setActiveEtudePage(1));
    expect(getEtudeDetailsByBureauIdPaginated).not.toHaveBeenCalled();
    await act(() => result.current.setFilterByDept(true));
    expect(getBureauEtudeWorkItemsPaginated).toHaveBeenLastCalledWith('AVAILABLE', 0, 8, []);
  });

  it('gère une absence complète de profil BE', async () => {
    vi.mocked(getBureauByUserId).mockResolvedValue(null as never);
    const { result } = renderHook(() => useBEDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.bureau).toBeNull();
  });

  it('capture une erreur lors du changement de page', async () => {
    const { result } = renderHook(() => useBEDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    vi.mocked(getBureauEtudeWorkItemsPaginated).mockRejectedValueOnce(new Error('Page KO'));
    await act(() => result.current.setPendingPage(2));
    expect(result.current.error).toContain('Page KO');
  });

  it('ne déclenche aucun chargement sans utilisateur', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: null } as never);
    renderHook(() => useBEDashboardData());
    expect(getBureauByUserId).not.toHaveBeenCalled();
  });

  it('refetch relance le chargement initial', async () => {
    const { result } = renderHook(() => useBEDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const calls = vi.mocked(getBureauByUserId).mock.calls.length;
    act(() => result.current.refetch());
    await waitFor(() => expect(vi.mocked(getBureauByUserId).mock.calls.length).toBeGreaterThan(calls));
  });

  it('ignore une réponse arrivée après démontage', async () => {
    let resolveBureau!: (value: unknown) => void;
    vi.mocked(getBureauByUserId).mockReturnValue(new Promise(resolve => { resolveBureau = resolve; }) as never);
    const { unmount } = renderHook(() => useBEDashboardData());
    unmount();
    resolveBureau({ id: 10 });
    await Promise.resolve();
    expect(getBureauEtudeWorkItemsPaginated).not.toHaveBeenCalled();
  });

  it('ignore les pages arrivées après démontage', async () => {
    let resolvePage!: (value: unknown) => void;
    vi.mocked(getBureauEtudeWorkItemsPaginated).mockReturnValue(new Promise(resolve => { resolvePage = resolve; }) as never);
    const { unmount } = renderHook(() => useBEDashboardData());
    await waitFor(() => expect(getBureauEtudeWorkItemsPaginated).toHaveBeenCalled());
    unmount();
    resolvePage(page([]));
    await Promise.resolve();
    expect(getEtudeDetailsByBureauIdPaginated).toHaveBeenCalledTimes(2);
  });

  it('ignore une erreur initiale survenue après démontage', async () => {
    let rejectBureau!: (reason: unknown) => void;
    vi.mocked(getBureauByUserId).mockReturnValue(new Promise((_resolve, reject) => { rejectBureau = reject; }) as never);
    const { result, unmount } = renderHook(() => useBEDashboardData());
    unmount();
    rejectBureau(new Error('Trop tard'));
    await Promise.resolve();
    expect(result.current.error).toBeNull();
  });

  it('conserve une proposition nulle hors de la liste des propositions', async () => {
    vi.mocked(getBureauEtudeWorkItemsPaginated).mockResolvedValue(page([{ demande, proposition: null }]) as never);
    const { result } = renderHook(() => useBEDashboardData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.myPropositions).toEqual([]);
    expect(result.current.allPropositionsPerDemande).toEqual([[], []]);
  });
});
