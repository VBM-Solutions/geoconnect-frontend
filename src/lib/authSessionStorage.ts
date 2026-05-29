import { AuthResponseDTO } from '../types';

export const SESSION_USER_KEY = 'user';
export const SESSION_STARTED_AT_KEY = 'gc:session-started-at';
export const LAST_ACTIVITY_AT_KEY = 'gc:last-activity-at';
export const SESSION_SYNC_EVENT_KEY = 'gc:session-sync-event';

export type SessionSyncEventType = 'activity' | 'logout';

export interface SessionSyncEvent {
  type: SessionSyncEventType;
  at: number;
}

const INVALID_TIMESTAMP = -1;

function parseTimestamp(value: string | null): number {
  if (value === null) {
    return INVALID_TIMESTAMP;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return INVALID_TIMESTAMP;
  }

  return parsed;
}

function parseUser(value: string | null): AuthResponseDTO | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as AuthResponseDTO;
  } catch {
    console.error('Failed to parse user from session storage');
    sessionStorage.removeItem(SESSION_USER_KEY);
    return null;
  }
}

export function readStoredUser(): AuthResponseDTO | null {
  return parseUser(sessionStorage.getItem(SESSION_USER_KEY));
}

export function writeStoredUser(user: AuthResponseDTO): void {
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function readSessionStartedAt(): number | null {
  const parsed = parseTimestamp(localStorage.getItem(SESSION_STARTED_AT_KEY));
  return parsed === INVALID_TIMESTAMP ? null : parsed;
}

export function readLastActivityAt(): number | null {
  const parsed = parseTimestamp(localStorage.getItem(LAST_ACTIVITY_AT_KEY));
  return parsed === INVALID_TIMESTAMP ? null : parsed;
}

export function seedSessionMetadata(now: number = Date.now()): void {
  localStorage.setItem(SESSION_STARTED_AT_KEY, String(now));
  localStorage.setItem(LAST_ACTIVITY_AT_KEY, String(now));
}

export function ensureSessionMetadata(now: number = Date.now()): void {
  if (!readSessionStartedAt()) {
    localStorage.setItem(SESSION_STARTED_AT_KEY, String(now));
  }
  if (!readLastActivityAt()) {
    localStorage.setItem(LAST_ACTIVITY_AT_KEY, String(now));
  }
}

export function touchLastActivity(now: number = Date.now()): void {
  localStorage.setItem(LAST_ACTIVITY_AT_KEY, String(now));
}

export function clearAuthSessionStorage(): void {
  sessionStorage.removeItem(SESSION_USER_KEY);
  localStorage.removeItem(SESSION_STARTED_AT_KEY);
  localStorage.removeItem(LAST_ACTIVITY_AT_KEY);
}

export function publishSessionSyncEvent(event: SessionSyncEvent): void {
  localStorage.setItem(SESSION_SYNC_EVENT_KEY, JSON.stringify(event));
}

export function parseSessionSyncEvent(raw: string | null): SessionSyncEvent | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SessionSyncEvent;
    if ((parsed.type !== 'activity' && parsed.type !== 'logout') || !Number.isFinite(parsed.at)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

