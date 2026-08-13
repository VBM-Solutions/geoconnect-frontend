import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAuthSessionStorage,
  ensureSessionMetadata,
  LAST_ACTIVITY_AT_KEY,
  parseSessionSyncEvent,
  publishSessionSyncEvent,
  readLastActivityAt,
  readSessionStartedAt,
  readStoredUser,
  seedSessionMetadata,
  SESSION_STARTED_AT_KEY,
  SESSION_SYNC_EVENT_KEY,
  SESSION_USER_KEY,
  touchLastActivity,
  writeStoredUser,
} from './authSessionStorage';

describe('authSessionStorage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it('écrit et relit l\'utilisateur stocké', () => {
    writeStoredUser({ userId: 12, login: 'john@doe.com', role: 'CLIENT' });

    const user = readStoredUser();

    expect(user).toEqual({ userId: 12, login: 'john@doe.com', role: 'CLIENT' });
  });

  it('retourne null et nettoie le storage si user corrompu', () => {
    sessionStorage.setItem(SESSION_USER_KEY, '{broken-json');

    const user = readStoredUser();

    expect(user).toBeNull();
    expect(sessionStorage.getItem(SESSION_USER_KEY)).toBeNull();
  });

  it('seedSessionMetadata initialise les deux horodatages', () => {
    seedSessionMetadata(123456);

    expect(readSessionStartedAt()).toBe(123456);
    expect(readLastActivityAt()).toBe(123456);
  });

  it('ensureSessionMetadata conserve des valeurs existantes', () => {
    localStorage.setItem(SESSION_STARTED_AT_KEY, '111');
    localStorage.setItem(LAST_ACTIVITY_AT_KEY, '222');

    ensureSessionMetadata(999);

    expect(readSessionStartedAt()).toBe(111);
    expect(readLastActivityAt()).toBe(222);
  });

  it('remplace les horodatages invalides', () => {
    localStorage.setItem(SESSION_STARTED_AT_KEY, 'invalide');
    localStorage.setItem(LAST_ACTIVITY_AT_KEY, '0');
    ensureSessionMetadata(999);
    expect(readSessionStartedAt()).toBe(999);
    expect(readLastActivityAt()).toBe(999);
  });

  it('touchLastActivity met à jour uniquement la dernière activité', () => {
    localStorage.setItem(SESSION_STARTED_AT_KEY, '100');
    localStorage.setItem(LAST_ACTIVITY_AT_KEY, '200');

    touchLastActivity(300);

    expect(readSessionStartedAt()).toBe(100);
    expect(readLastActivityAt()).toBe(300);
  });

  it('clearAuthSessionStorage supprime les clés de session', () => {
    writeStoredUser({ userId: 1, login: 'test@test.com', role: 'CLIENT' });
    seedSessionMetadata(999);

    clearAuthSessionStorage();

    expect(sessionStorage.getItem(SESSION_USER_KEY)).toBeNull();
    expect(localStorage.getItem(SESSION_STARTED_AT_KEY)).toBeNull();
    expect(localStorage.getItem(LAST_ACTIVITY_AT_KEY)).toBeNull();
  });

  it('parseSessionSyncEvent valide les événements supportés', () => {
    publishSessionSyncEvent({ type: 'activity', at: 77 });

    const parsed = parseSessionSyncEvent(localStorage.getItem(SESSION_SYNC_EVENT_KEY));

    expect(parsed).toEqual({ type: 'activity', at: 77 });
  });

  it('parseSessionSyncEvent retourne null pour un payload invalide', () => {
    expect(parseSessionSyncEvent('{"type":"noop","at":10}')).toBeNull();
    expect(parseSessionSyncEvent('invalid')).toBeNull();
    expect(parseSessionSyncEvent(null)).toBeNull();
  });
});

