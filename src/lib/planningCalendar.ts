import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  eachDayOfInterval,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { PlanningEventDTO } from '../types';

export type PlanningView = 'week' | 'month';

export interface PlanningRange {
  start: Date;
  endExclusive: Date;
  days: Date[];
}

const ISO_WEEK_OPTIONS = { weekStartsOn: 1 as const };

export function getPlanningRange(anchor: Date, view: PlanningView): PlanningRange {
  if (view === 'week') {
    const start = startOfWeek(anchor, ISO_WEEK_OPTIONS);
    const endExclusive = addWeeks(start, 1);
    return { start, endExclusive, days: eachDayOfInterval({ start, end: addDays(endExclusive, -1) }) };
  }
  const start = startOfWeek(startOfMonth(anchor), ISO_WEEK_OPTIONS);
  const endExclusive = addDays(endOfWeek(endOfMonth(anchor), ISO_WEEK_OPTIONS), 1);
  return { start, endExclusive, days: eachDayOfInterval({ start, end: addDays(endExclusive, -1) }) };
}

export function movePlanningAnchor(anchor: Date, view: PlanningView, direction: -1 | 1): Date {
  return view === 'week' ? addWeeks(anchor, direction) : addMonths(anchor, direction);
}

export function toApiDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function eventOccursOn(event: PlanningEventDTO, day: Date): boolean {
  const isoDay = toApiDate(day);
  return event.startDate <= isoDay && event.endDate >= isoDay;
}

export function isEventStart(event: PlanningEventDTO, day: Date): boolean {
  return event.startDate === toApiDate(day);
}

export function parseAnchor(value: string | null, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}
