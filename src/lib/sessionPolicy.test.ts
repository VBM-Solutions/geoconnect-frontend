import { afterEach, describe, expect, it, vi } from 'vitest';
import { evaluateSessionState, resolveSessionPolicy } from './sessionPolicy';

describe('sessionPolicy', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('utilise la valeur par defaut lorsque la variable est invalide', () => {
    vi.stubEnv('VITE_IDLE_TIMEOUT_MS', 'invalide');
    expect(resolveSessionPolicy().idleTimeoutMs).toBe(20 * 60 * 1000);
  });
  it('normalise warningDurationMs pour rester strictement inférieur au délai idle', () => {
    const policy = resolveSessionPolicy({
      idleTimeoutMs: 10_000,
      warningDurationMs: 50_000,
      absoluteTimeoutMs: 100_000,
      activityThrottleMs: 1_000,
    });

    expect(policy.warningDurationMs).toBe(9_000);
  });

  it('évalue une expiration idle quand lastActivity atteint le délai avant la limite absolue', () => {
    const policy = resolveSessionPolicy({
      idleTimeoutMs: 10_000,
      warningDurationMs: 3_000,
      absoluteTimeoutMs: 60_000,
      activityThrottleMs: 1_000,
    });

    const now = 21_000;
    const startedAt = 1_000;
    const lastActivityAt = 10_000;

    const result = evaluateSessionState(now, startedAt, lastActivityAt, policy);

    expect(result.isExpired).toBe(true);
    expect(result.reason).toBe('idle');
    expect(result.remainingMs).toBe(0);
  });

  it('évalue une expiration absolue avant le timeout d\'inactivité', () => {
    const policy = resolveSessionPolicy({
      idleTimeoutMs: 30_000,
      warningDurationMs: 5_000,
      absoluteTimeoutMs: 20_000,
      activityThrottleMs: 1_000,
    });

    const now = 30_000;
    const startedAt = 10_000;
    const lastActivityAt = 25_000;

    const result = evaluateSessionState(now, startedAt, lastActivityAt, policy);

    expect(result.isExpired).toBe(true);
    expect(result.reason).toBe('absolute');
  });

  it('active le warning quand le compte à rebours entre dans la fenêtre de pré-alerte', () => {
    const policy = resolveSessionPolicy({
      idleTimeoutMs: 20_000,
      warningDurationMs: 5_000,
      absoluteTimeoutMs: 80_000,
      activityThrottleMs: 1_000,
    });

    const result = evaluateSessionState(18_000, 0, 3_000, policy);

    expect(result.isExpired).toBe(false);
    expect(result.shouldWarn).toBe(true);
    expect(result.remainingMs).toBe(5_000);
  });
});

