import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getMyPlanning } from '../api/planning';
import { PlanningEventDTO } from '../types';
import { extractErrorMessage } from '../lib/utils';
import {
  getPlanningRange,
  movePlanningAnchor,
  parseAnchor,
  PlanningView,
  toApiDate,
} from '../lib/planningCalendar';

function parseView(value: string | null): PlanningView {
  return value === 'month' ? 'month' : 'week';
}

export function useBEPlanning() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = parseView(searchParams.get('view'));
  const anchor = parseAnchor(searchParams.get('date'), new Date());
  const range = useMemo(() => getPlanningRange(anchor, view), [anchor.getTime(), view]);
  const [events, setEvents] = useState<PlanningEventDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getMyPlanning(toApiDate(range.start), toApiDate(range.endExclusive))
      .then(response => { if (!cancelled) setEvents(response.events ?? []); })
      .catch(err => { if (!cancelled) setError(extractErrorMessage(err)); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [range.start.getTime(), range.endExclusive.getTime()]);

  const navigate = useCallback((nextAnchor: Date, nextView: PlanningView = view) => {
    setSearchParams({ view: nextView, date: toApiDate(nextAnchor) });
  }, [setSearchParams, view]);

  return {
    view,
    anchor,
    range,
    events,
    isLoading,
    error,
    setView: (nextView: PlanningView) => navigate(anchor, nextView),
    previous: () => navigate(movePlanningAnchor(anchor, view, -1)),
    next: () => navigate(movePlanningAnchor(anchor, view, 1)),
    today: () => navigate(new Date()),
    goToDate: (date: Date) => navigate(date),
  };
}
