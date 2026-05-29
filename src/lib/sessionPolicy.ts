export interface SessionPolicy {
  idleTimeoutMs: number;
  warningDurationMs: number;
  absoluteTimeoutMs: number;
  activityThrottleMs: number;
}

export type ExpirationReason = 'idle' | 'absolute';

export interface SessionEvaluation {
  expiresAt: number;
  reason: ExpirationReason;
  remainingMs: number;
  shouldWarn: boolean;
  isExpired: boolean;
}

const DEFAULT_POLICY: SessionPolicy = {
  idleTimeoutMs: 20 * 60 * 1000,
  warningDurationMs: 2 * 60 * 1000,
  absoluteTimeoutMs: 10 * 60 * 60 * 1000,
  activityThrottleMs: 1000,
};

function readDurationFromEnv(key: string, fallback: number): number {
  const env = import.meta.env[key as keyof ImportMetaEnv];
  const parsed = Number(env);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function normalizeWarningDuration(idleTimeoutMs: number, warningDurationMs: number): number {
  const maxWarning = Math.max(1000, idleTimeoutMs - 1000);
  return Math.min(Math.max(1000, warningDurationMs), maxWarning);
}

export function getDefaultSessionPolicy(): SessionPolicy {
  const idleTimeoutMs = readDurationFromEnv('VITE_IDLE_TIMEOUT_MS', DEFAULT_POLICY.idleTimeoutMs);
  const warningDurationMs = readDurationFromEnv('VITE_SESSION_WARNING_MS', DEFAULT_POLICY.warningDurationMs);

  return {
    idleTimeoutMs,
    warningDurationMs: normalizeWarningDuration(idleTimeoutMs, warningDurationMs),
    absoluteTimeoutMs: readDurationFromEnv('VITE_ABSOLUTE_SESSION_TIMEOUT_MS', DEFAULT_POLICY.absoluteTimeoutMs),
    activityThrottleMs: readDurationFromEnv('VITE_ACTIVITY_THROTTLE_MS', DEFAULT_POLICY.activityThrottleMs),
  };
}

export function resolveSessionPolicy(overrides?: Partial<SessionPolicy>): SessionPolicy {
  const base = getDefaultSessionPolicy();
  const merged = {
    ...base,
    ...overrides,
  };

  return {
    ...merged,
    warningDurationMs: normalizeWarningDuration(merged.idleTimeoutMs, merged.warningDurationMs),
  };
}

export function evaluateSessionState(
  now: number,
  sessionStartedAt: number,
  lastActivityAt: number,
  policy: SessionPolicy,
): SessionEvaluation {
  const absoluteDeadline = sessionStartedAt + policy.absoluteTimeoutMs;
  const idleDeadline = lastActivityAt + policy.idleTimeoutMs;

  const reason: ExpirationReason = absoluteDeadline <= idleDeadline ? 'absolute' : 'idle';
  const expiresAt = Math.min(absoluteDeadline, idleDeadline);
  const remainingMs = Math.max(0, expiresAt - now);
  const isExpired = remainingMs <= 0;
  const shouldWarn = !isExpired && remainingMs <= policy.warningDurationMs;

  return {
    expiresAt,
    reason,
    remainingMs,
    shouldWarn,
    isExpired,
  };
}

