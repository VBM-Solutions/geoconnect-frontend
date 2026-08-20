import { describe, expect, it } from 'vitest';
import {
  eventOccursOn,
  getPlanningRange,
  isEventStart,
  movePlanningAnchor,
  parseAnchor,
  toApiDate,
} from './planningCalendar';
import { PlanningEventDTO } from '../types';

const weeklyEvent: PlanningEventDTO = {
  id: 'RENDU-1', etudeId: 1, type: 'RENDU', precision: 'SEMAINE', statut: 'CONTRACTUEL',
  startDate: '2026-08-17', endDate: '2026-08-23',
};

describe('planning calendar', () => {
  it('builds an ISO week from Monday to an exclusive next Monday', () => {
    const range = getPlanningRange(new Date(2026, 7, 20), 'week');
    expect(toApiDate(range.start)).toBe('2026-08-17');
    expect(toApiDate(range.endExclusive)).toBe('2026-08-24');
    expect(range.days).toHaveLength(7);
  });

  it('builds a complete month grid with at most 42 days', () => {
    const range = getPlanningRange(new Date(2026, 7, 20), 'month');
    expect(toApiDate(range.start)).toBe('2026-07-27');
    expect(toApiDate(range.endExclusive)).toBe('2026-09-07');
    expect(range.days).toHaveLength(42);
  });

  it('moves by the selected calendar unit', () => {
    const anchor = new Date(2026, 7, 20);
    expect(toApiDate(movePlanningAnchor(anchor, 'week', -1))).toBe('2026-08-13');
    expect(toApiDate(movePlanningAnchor(anchor, 'month', 1))).toBe('2026-09-20');
  });

  it('detects event coverage and its first day', () => {
    expect(eventOccursOn(weeklyEvent, new Date(2026, 7, 17))).toBe(true);
    expect(eventOccursOn(weeklyEvent, new Date(2026, 7, 23))).toBe(true);
    expect(eventOccursOn(weeklyEvent, new Date(2026, 7, 24))).toBe(false);
    expect(isEventStart(weeklyEvent, new Date(2026, 7, 17))).toBe(true);
    expect(isEventStart(weeklyEvent, new Date(2026, 7, 18))).toBe(false);
  });

  it('parses a valid anchor and falls back for absent or invalid values', () => {
    const fallback = new Date(2026, 0, 1);
    expect(toApiDate(parseAnchor('2026-08-20', fallback))).toBe('2026-08-20');
    expect(parseAnchor(null, fallback)).toBe(fallback);
    expect(parseAnchor('invalid', fallback)).toBe(fallback);
  });
});
