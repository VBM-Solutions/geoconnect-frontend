import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requestUse: vi.fn(),
  csrfGet: vi.fn(() => Promise.resolve({ headers: { 'x-xsrf-token': 'csrf-token' } })),
  apiInstance: {
    interceptors: { request: { use: vi.fn() } },
  },
}));

vi.mock('axios', () => {
  mocks.apiInstance.interceptors.request.use = mocks.requestUse;
  return {
    default: {
      create: vi.fn(() => mocks.apiInstance),
      get: mocks.csrfGet,
    },
  };
});

await import('./index');

describe('API CSRF interceptor', () => {
  beforeEach(() => {
    mocks.csrfGet.mockClear();
  });

  it('initializes and sends the CSRF token before a mutating request', async () => {
    const interceptor = mocks.requestUse.mock.calls[0][0];
    const headers = new Map<string, string>();
    const config = {
      method: 'post',
      headers: {
        set: (name: string, value: string) => headers.set(name, value),
        get: (name: string) => headers.get(name),
      },
    };

    await expect(interceptor(config)).resolves.toBe(config);
    expect(mocks.csrfGet).toHaveBeenCalledWith('/api/auth/csrf', { withCredentials: true });
    expect(config.headers.get('X-XSRF-TOKEN')).toBe('csrf-token');
  });

  it('does not initialize CSRF for a safe request', async () => {
    const interceptor = mocks.requestUse.mock.calls[0][0];

    await interceptor({ method: 'get' });

    expect(mocks.csrfGet).not.toHaveBeenCalled();
  });
});
