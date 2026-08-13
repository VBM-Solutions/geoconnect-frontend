import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getBureauByUserId } from '../api/bureauEtude';
import { getBureauEtudeWorkItemsPaginated } from '../api/demandeDevis';
import { getEtudeDetailsByBureauIdPaginated } from '../api/etude';
import { getNotificationPreferences } from '../api/parametres';
import { BEDemandePageItemDTO, BureauEtudesDTO, DemandeDevisDTO, EtudeDetailDTO, NotificationPreferencesDTO, PropositionDevisDTO } from '../types';
import { extractErrorMessage } from '../lib/utils';

const PAGE_SIZE = 8;

export interface BEDashboardData {
  bureau: BureauEtudesDTO | null;
  demandes: DemandeDevisDTO[];
  allPropositionsPerDemande: PropositionDevisDTO[][];
  myPropositions: PropositionDevisDTO[];
  etudes: EtudeDetailDTO[];
  notificationPreferences: NotificationPreferencesDTO | null;
  filterByDept: boolean;
  availableTotal: number;
  pendingTotal: number;
  activeEtudeTotal: number;
  archivedEtudeTotal: number;
  availablePage: number;
  pendingPage: number;
  activeEtudePage: number;
  archivedEtudePage: number;
  availableTotalPages: number;
  pendingTotalPages: number;
  activeEtudeTotalPages: number;
  archivedEtudeTotalPages: number;
  setFilterByDept: (enabled: boolean) => Promise<void>;
  setAvailablePage: (page: number) => Promise<void>;
  setPendingPage: (page: number) => Promise<void>;
  setActiveEtudePage: (page: number) => Promise<void>;
  setArchivedEtudePage: (page: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBEDashboardData(): BEDashboardData {
  const { user } = useAuth();
  const [bureau, setBureau] = useState<BureauEtudesDTO | null>(null);
  const [availableItems, setAvailableItems] = useState<BEDemandePageItemDTO[]>([]);
  const [pendingItems, setPendingItems] = useState<BEDemandePageItemDTO[]>([]);
  const [activeEtudes, setActiveEtudes] = useState<EtudeDetailDTO[]>([]);
  const [archivedEtudes, setArchivedEtudes] = useState<EtudeDetailDTO[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferencesDTO | null>(null);
  const [filterByDept, setFilterByDeptState] = useState(false);
  const [availableMeta, setAvailableMeta] = useState({ page: 0, totalItems: 0, totalPages: 0 });
  const [pendingMeta, setPendingMeta] = useState({ page: 0, totalItems: 0, totalPages: 0 });
  const [activeMeta, setActiveMeta] = useState({ page: 0, totalItems: 0, totalPages: 0 });
  const [archivedMeta, setArchivedMeta] = useState({ page: 0, totalItems: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const departments = useCallback((enabled: boolean) => enabled ? notificationPreferences?.departementsSuivis ?? [] : [], [notificationPreferences]);

  const loadAvailable = useCallback(async (page: number, filtered = filterByDept) => {
    const response = await getBureauEtudeWorkItemsPaginated('AVAILABLE', page, PAGE_SIZE, departments(filtered));
    setAvailableItems(response.items);
    setAvailableMeta({ page: response.page, totalItems: response.totalItems, totalPages: response.totalPages });
  }, [departments, filterByDept]);

  const loadPending = useCallback(async (page: number) => {
    const response = await getBureauEtudeWorkItemsPaginated('PENDING', page, PAGE_SIZE);
    setPendingItems(response.items);
    setPendingMeta({ page: response.page, totalItems: response.totalItems, totalPages: response.totalPages });
  }, []);

  const loadEtudes = useCallback(async (category: 'ACTIVE' | 'ARCHIVED', page: number) => {
    if (!bureau?.id) return;
    const response = await getEtudeDetailsByBureauIdPaginated(bureau.id, category, page, PAGE_SIZE);
    if (category === 'ACTIVE') {
      setActiveEtudes(response.items);
      setActiveMeta({ page: response.page, totalItems: response.totalItems, totalPages: response.totalPages });
    } else {
      setArchivedEtudes(response.items);
      setArchivedMeta({ page: response.page, totalItems: response.totalItems, totalPages: response.totalPages });
    }
  }, [bureau?.id]);

  const run = async (operation: () => Promise<void>) => {
    setIsLoading(true);
    setError(null);
    try { await operation(); } catch (err) { setError(extractErrorMessage(err)); } finally { setIsLoading(false); }
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function fetchAll() {
      setIsLoading(true);
      setError(null);
      try {
        const [myBureau, prefs] = await Promise.all([
          getBureauByUserId(user!.userId),
          getNotificationPreferences().catch(() => null),
        ]);
        if (cancelled) return;
        setBureau(myBureau ?? null);
        setNotificationPreferences(prefs);
        const filtered = Boolean(prefs && !prefs.notifierTousDepartements && prefs.departementsSuivis.length);
        setFilterByDeptState(filtered);
        const depts = filtered ? prefs!.departementsSuivis : [];
        const [available, pending, active, archived] = await Promise.all([
          getBureauEtudeWorkItemsPaginated('AVAILABLE', 0, PAGE_SIZE, depts),
          getBureauEtudeWorkItemsPaginated('PENDING', 0, PAGE_SIZE),
          myBureau?.id ? getEtudeDetailsByBureauIdPaginated(myBureau.id, 'ACTIVE', 0, PAGE_SIZE) : null,
          myBureau?.id ? getEtudeDetailsByBureauIdPaginated(myBureau.id, 'ARCHIVED', 0, PAGE_SIZE) : null,
        ]);
        if (cancelled) return;
        setAvailableItems(available.items);
        setAvailableMeta({ page: available.page, totalItems: available.totalItems, totalPages: available.totalPages });
        setPendingItems(pending.items);
        setPendingMeta({ page: pending.page, totalItems: pending.totalItems, totalPages: pending.totalPages });
        if (active) { setActiveEtudes(active.items); setActiveMeta({ page: active.page, totalItems: active.totalItems, totalPages: active.totalPages }); }
        if (archived) { setArchivedEtudes(archived.items); setArchivedMeta({ page: archived.page, totalItems: archived.totalItems, totalPages: archived.totalPages }); }
      } catch (err) {
        if (!cancelled) setError(extractErrorMessage(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchAll();
    return () => { cancelled = true; };
  }, [user, tick]);

  const setFilterByDept = async (enabled: boolean) => run(async () => { setFilterByDeptState(enabled); await loadAvailable(0, enabled); });
  const setAvailablePage = async (page: number) => run(() => loadAvailable(page));
  const setPendingPage = async (page: number) => run(() => loadPending(page));
  const setActiveEtudePage = async (page: number) => run(() => loadEtudes('ACTIVE', page));
  const setArchivedEtudePage = async (page: number) => run(() => loadEtudes('ARCHIVED', page));

  const demandes = [...availableItems, ...pendingItems].map(item => item.demande);
  const myPropositions = pendingItems.flatMap(item => item.proposition ? [item.proposition] : []);
  const allPropositionsPerDemande = demandes.map(demande => {
    const proposition = pendingItems.find(item => item.demande.id === demande.id)?.proposition;
    return proposition ? [proposition] : [];
  });

  return {
    bureau, demandes, allPropositionsPerDemande, myPropositions,
    etudes: [...activeEtudes, ...archivedEtudes], notificationPreferences, filterByDept,
    availableTotal: availableMeta.totalItems, pendingTotal: pendingMeta.totalItems,
    activeEtudeTotal: activeMeta.totalItems, archivedEtudeTotal: archivedMeta.totalItems,
    availablePage: availableMeta.page, pendingPage: pendingMeta.page,
    activeEtudePage: activeMeta.page, archivedEtudePage: archivedMeta.page,
    availableTotalPages: availableMeta.totalPages, pendingTotalPages: pendingMeta.totalPages,
    activeEtudeTotalPages: activeMeta.totalPages, archivedEtudeTotalPages: archivedMeta.totalPages,
    setFilterByDept, setAvailablePage, setPendingPage, setActiveEtudePage, setArchivedEtudePage,
    isLoading, error, refetch: () => setTick(value => value + 1),
  };
}
