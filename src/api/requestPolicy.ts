import axios from 'axios';

export const REQUEST_TIMEOUT_MS = 30_000;
export const CSRF_TIMEOUT_MS = 15_000;
export const UPLOAD_TIMEOUT_MS = 120_000;
export const VERIFICATION_TIMEOUT_MS = 15_000;

export function isRequestTimeout(error: unknown): boolean {
  return axios.isAxiosError(error)
    && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT');
}

export function createRequestId(): string {
  const uuid = globalThis.crypto.randomUUID?.();
  if (uuid) return uuid;
  const random = globalThis.crypto.getRandomValues(new Uint32Array(2));
  return `${Date.now().toString(36)}-${random[0].toString(36)}${random[1].toString(36)}`;
}
