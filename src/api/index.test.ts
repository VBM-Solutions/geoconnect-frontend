import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requestUse: vi.fn(),
  csrfGet: vi.fn(() => Promise.resolve()),
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
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; Path=/';
  });

  it('initializes the CSRF cookie before a mutating request', async () => {
    const interceptor = mocks.requestUse.mock.calls[0][0];
    const config = { method: 'post' };

    await expect(interceptor(config)).resolves.toBe(config);
    expect(mocks.csrfGet).toHaveBeenCalledWith('/api/auth/csrf', { withCredentials: true });
  });

  it('does not initialize CSRF for a safe request', async () => {
    const interceptor = mocks.requestUse.mock.calls[0][0];

    await interceptor({ method: 'get' });

    expect(mocks.csrfGet).not.toHaveBeenCalled();
  });
});
