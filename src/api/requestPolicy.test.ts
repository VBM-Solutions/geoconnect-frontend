import axios from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRequestId, isRequestTimeout } from './requestPolicy';

describe('requestPolicy', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each(['ECONNABORTED', 'ETIMEDOUT'])('identifie le timeout Axios %s', (code) => {
    vi.spyOn(axios, 'isAxiosError').mockReturnValueOnce(true);
    expect(isRequestTimeout({ code })).toBe(true);
  });

  it('rejette les erreurs non Axios et les autres codes', () => {
    vi.spyOn(axios, 'isAxiosError').mockReturnValueOnce(false);
    expect(isRequestTimeout(new Error('network'))).toBe(false);
    vi.spyOn(axios, 'isAxiosError').mockReturnValueOnce(true);
    expect(isRequestTimeout({ code: 'ERR_NETWORK' })).toBe(false);
  });

  it('génère un UUID avec Web Crypto', () => {
    expect(createRequestId()).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('génère un identifiant de repli pour les navigateurs sans randomUUID', () => {
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValueOnce('' as `${string}-${string}-${string}-${string}-${string}`);
    vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementationOnce((array) => {
      const values = array as Uint32Array;
      values[0] = 1;
      values[1] = 2;
      return array;
    });
    vi.spyOn(Date, 'now').mockReturnValueOnce(1_000);

    expect(createRequestId()).toBe('rs-12');
  });
});
