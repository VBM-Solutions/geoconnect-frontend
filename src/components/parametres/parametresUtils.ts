export const TELEPHONE_REGEX = /^[0-9+\-\s()]{8,20}$/;
export const CODE_POSTAL_REGEX = /^(?:\d{5}|2[AB]\d{3})$/;
export const IBAN_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function isValidTelephone(value: string): boolean {
  return TELEPHONE_REGEX.test(value.trim());
}

export function isValidCodePostal(value: string): boolean {
  return CODE_POSTAL_REGEX.test(value.trim());
}

export function normalizeIban(value: string): string {
  return value.replaceAll(/\s/g, '').toUpperCase();
}

export function formatIban(value: string): string {
  const normalized = normalizeIban(value);
  if (!normalized) {
    return '';
  }

  return normalized.match(/.{1,4}/g)?.join(' ') ?? normalized;
}

export interface BackendValidationPayload {
  typeError?: string;
  message?: string;
  errors?: Record<string, string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getBackendValidationPayload(error: unknown): BackendValidationPayload | null {
  if (!isRecord(error)) {
    return null;
  }

  const response = error.response;
  if (!isRecord(response)) {
    return null;
  }

  const data = response.data;
  if (!isRecord(data)) {
    return null;
  }

  return data as BackendValidationPayload;
}

export function getBackendFieldError(error: unknown, field: string): string | null {
  const payload = getBackendValidationPayload(error);
  if (!payload) {
    return null;
  }

  return payload.errors?.[field] ?? (field === 'ancienMotDePasse' ? payload.message ?? null : null);
}

export function getBackendErrorMessage(error: unknown, fallback: string): string {
  const payload = getBackendValidationPayload(error);
  return payload?.message ?? fallback;
}

