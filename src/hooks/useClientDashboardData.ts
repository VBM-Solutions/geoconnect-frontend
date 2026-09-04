import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getClientByUserId } from '../api/client';
import { getOpenDemandesClientPaginated } from '../api/demandeDevis';
import { getPropositionsByDemandeIds } from '../api/propositionDevis';
import { getEtudeIdsAEvaluer, getEtudeDetailsByClientIdPaginated } from '../api/etude';
import { ClientDTO, DemandeDevisDTO, PropositionDevisDTO, EtudeDetailDTO } from '../types';
import { extractErrorMessage } from '../lib/utils';

export type DemandeWithPropositions = DemandeDevisDTO & { propositions: PropositionDevisDTO[] };

export interface ClientDashboardData {
  client: ClientDTO | null;
  demandes: DemandeWithPropositions[];
  etudes: EtudeDetailDTO[];
  etudeIdsAEvaluer: number[];
  demandePage: number;
  activeEtudePage: number;
  archivedEtudePage: number;
  demandeTotal: number;
  activeEtudeTotal: number;
  archivedEtudeTotal: number;
  completedEtudeTotal: number;
  demandeTotalPages: number;
  activeEtudeTotalPages: number;
  archivedEtudeTotalPages: number;
  setDemandePage: (page: number) => Promise<void>;
  setActiveEtudePage: (page: number) => Promise<void>;
  setArchivedEtudePage: (page: number) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useClientDashboardData(): ClientDashboardData {
  const { user } = useAuth();
  const [client, setClient] = useState<ClientDTO | null>(null);
  const [demandes, setDemandes] = useState<DemandeWithPropositions[]>([]);
  const [etudes, setEtudes] = useState<EtudeDetailDTO[]>([]);
  const [etudeIdsAEvaluer, setEtudeIdsAEvaluer] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [demandePageValue, setDemandePageValue] = useState(0);
  const [activeEtudePageValue, setActiveEtudePageValue] = useState(0);
  const [archivedEtudePageValue, setArchivedEtudePageValue] = useState(0);
  const [demandeTotal, setDemandeTotal] = useState(0);
  const [activeEtudeTotal, setActiveEtudeTotal] = useState(0);
  const [archivedEtudeTotal, setArchivedEtudeTotal] = useState(0);
  const [completedEtudeTotal, setCompletedEtudeTotal] = useState(0);
  const [demandeTotalPages, setDemandeTotalPages] = useState(0);
  const [activeEtudeTotalPages, setActiveEtudeTotalPages] = useState(0);
  const [archivedEtudeTotalPages, setArchivedEtudeTotalPages] = useState(0);

  const refetch = () => setTick(t => t + 1);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function fetchAll() {
      setIsLoading(true);
      setError(null);
      try {
        const myClient = await getClientByUserId(user!.userId);
        if (cancelled) return;

        if (!myClient?.id) {
          setIsLoading(false);
          return;
        }

        setClient(myClient);

        const [demandesPage, activePage, archivedPage, completedPage, idsAEvaluer] = await Promise.all([
          getOpenDemandesClientPaginated(demandePageValue),
          getEtudeDetailsByClientIdPaginated(myClient.id, 'ACTIVE', activeEtudePageValue),
          getEtudeDetailsByClientIdPaginated(myClient.id, 'ARCHIVED', archivedEtudePageValue),
          getEtudeDetailsByClientIdPaginated(myClient.id, 'COMPLETED', 0, 1),
          getEtudeIdsAEvaluer().catch((): number[] => []),
        ]);

        if (cancelled) return;
        const propositionsByDemande = demandesPage.items.length === 0
          ? {}
          : await getPropositionsByDemandeIds(demandesPage.items.map(demande => demande.id)).catch(() => ({}));
        if (cancelled) return;
        setDemandes(demandesPage.items.map(demande => ({
          ...demande,
          propositions: propositionsByDemande[demande.id] ?? [],
        })));
        setDemandeTotal(demandesPage.totalItems);
        setDemandeTotalPages(demandesPage.totalPages);
        setActiveEtudeTotal(activePage.totalItems);
        setActiveEtudeTotalPages(activePage.totalPages);
        setArchivedEtudeTotal(archivedPage.totalItems);
        setArchivedEtudeTotalPages(archivedPage.totalPages);
        setCompletedEtudeTotal(completedPage.totalItems);
        setEtudeIdsAEvaluer(idsAEvaluer);
        setEtudes([...activePage.items, ...archivedPage.items]);
      } catch (err: any) {
        if (!cancelled) {
          setError(extractErrorMessage(err));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchAll();
    return () => { cancelled = true; };
  }, [user, tick]);

  const setDemandePage = async (page: number) => {
    if (!client) return;
    setIsLoading(true);
    try {
      const response = await getOpenDemandesClientPaginated(page);
      const propositions = response.items.length === 0 ? {} : await getPropositionsByDemandeIds(
        response.items.map(demande => demande.id),
      ).catch(() => ({}));
      setDemandes(response.items.map(demande => ({
        ...demande,
        propositions: propositions[demande.id] ?? [],
      })));
      setDemandePageValue(page);
      setDemandeTotal(response.totalItems);
      setDemandeTotalPages(response.totalPages);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadEtudePage = async (category: 'ACTIVE' | 'ARCHIVED', page: number) => {
    if (!client) return;
    setIsLoading(true);
    try {
      const response = await getEtudeDetailsByClientIdPaginated(client.id, category, page);
      if (category === 'ACTIVE') {
        setEtudes(previous => [...response.items, ...previous.filter(etude => etude.etat === 'PAIEMENT_EFFECTUE')]);
        setActiveEtudePageValue(page);
        setActiveEtudeTotal(response.totalItems);
        setActiveEtudeTotalPages(response.totalPages);
      } else {
        setEtudes(previous => [...previous.filter(etude => etude.etat !== 'PAIEMENT_EFFECTUE'), ...response.items]);
        setArchivedEtudePageValue(page);
        setArchivedEtudeTotal(response.totalItems);
        setArchivedEtudeTotalPages(response.totalPages);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveEtudePage = (page: number) => loadEtudePage('ACTIVE', page);
  const setArchivedEtudePage = (page: number) => loadEtudePage('ARCHIVED', page);

  return {
    client, demandes, etudes, etudeIdsAEvaluer, isLoading, error, refetch,
    demandePage: demandePageValue,
    activeEtudePage: activeEtudePageValue,
    archivedEtudePage: archivedEtudePageValue,
    demandeTotal, activeEtudeTotal, archivedEtudeTotal, completedEtudeTotal,
    demandeTotalPages, activeEtudeTotalPages, archivedEtudeTotalPages,
    setDemandePage, setActiveEtudePage, setArchivedEtudePage,
  };
}

