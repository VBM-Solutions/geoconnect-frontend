import { useEffect, useMemo, useState } from 'react';
import { getBEMapData } from '../api/beMap';
import { BEMapDTO, BEMapFilters } from '../types';
import { extractErrorMessage } from '../lib/utils';

interface UseBEMapDataResult {
  data: BEMapDTO | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBEMapData(filters: BEMapFilters = {}): UseBEMapDataResult {
  const [data, setData] = useState<BEMapDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    let cancelled = false;

    async function fetchMapData() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getBEMapData(JSON.parse(filtersKey));
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(extractErrorMessage(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchMapData();
    return () => { cancelled = true; };
  }, [filtersKey, tick]);

  return {
    data,
    isLoading,
    error,
    refetch: () => setTick(value => value + 1),
  };
}
