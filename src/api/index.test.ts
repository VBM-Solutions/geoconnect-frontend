import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requestUse: vi.fn(),
  responseUse: vi.fn(),
  csrfGet: vi.fn(),
  apiRequest: vi.fn(),
  apiInstance: {
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    request: vi.fn(),
  },
}));

vi.mock('axios', () => {
  mocks.apiInstance.interceptors.request.use = mocks.requestUse;
  mocks.apiInstance.interceptors.response.use = mocks.responseUse;
  mocks.apiInstance.request = mocks.apiRequest;
  return {
    default: {
      create: vi.fn(() => mocks.apiInstance),
      get: mocks.csrfGet,
    },
  };
});

type RequestConfig = ReturnType<typeof mutatingConfig>;
type RequestInterceptor = (config: RequestConfig) => Promise<RequestConfig>;
type ResponseErrorInterceptor = (error: any) => Promise<unknown>;

function mutatingConfig(method: string | undefined = 'post') {
  const headers = new Map<string, string>();
  return {
    method,
    headers: {
      set: (name: string, value: string) => headers.set(name, value),
      get: (name: string) => headers.get(name),
    },
  };
}

describe('API CSRF interceptor', () => {
  let interceptor: RequestInterceptor;
  let responseErrorInterceptor: ResponseErrorInterceptor;

  beforeEach(async () => {
    vi.resetModules();
    mocks.requestUse.mockReset();
    mocks.responseUse.mockReset();
    mocks.apiRequest.mockReset();
    mocks.csrfGet.mockReset().mockResolvedValue({
      headers: { 'x-xsrf-token': 'csrf-token' },
    });
    await import('./index');
    interceptor = mocks.requestUse.mock.calls[0][0];
    responseErrorInterceptor = mocks.responseUse.mock.calls[0][1];
  });

  it('initializes, caches and sends the CSRF token for mutating requests', async () => {
    const firstConfig = mutatingConfig();
    const secondConfig = mutatingConfig('delete');

    await expect(interceptor(firstConfig)).resolves.toBe(firstConfig);
    await expect(interceptor(secondConfig)).resolves.toBe(secondConfig);

    expect(mocks.csrfGet).toHaveBeenCalledTimes(1);
    expect(mocks.csrfGet).toHaveBeenCalledWith('/api/auth/csrf', { withCredentials: true });
    expect(firstConfig.headers.get('X-XSRF-TOKEN')).toBe('csrf-token');
    expect(secondConfig.headers.get('X-XSRF-TOKEN')).toBe('csrf-token');
  });

  it('shares an ongoing CSRF initialization between concurrent requests', async () => {
    let resolveInitialization!: (response: { headers: Record<string, string> }) => void;
    mocks.csrfGet.mockImplementation(() => new Promise(resolve => {
      resolveInitialization = resolve;
    }));
    const firstRequest = interceptor(mutatingConfig());
    const secondRequest = interceptor(mutatingConfig('put'));

    expect(mocks.csrfGet).toHaveBeenCalledTimes(1);
    resolveInitialization({ headers: { 'x-xsrf-token': 'csrf-token' } });

    await Promise.all([firstRequest, secondRequest]);
  });

  it('rejects initialization when the backend omits the CSRF token', async () => {
    mocks.csrfGet.mockResolvedValue({ headers: {} });

    await expect(interceptor(mutatingConfig()))
      .rejects.toThrow('Jeton CSRF absent de la réponse');
  });

  it('does not initialize CSRF for a safe or unspecified method', async () => {
    await interceptor(mutatingConfig('get'));
    await interceptor({ ...mutatingConfig('get'), method: undefined });

    expect(mocks.csrfGet).not.toHaveBeenCalled();
  });

  it('renouvelle le jeton et rejoue une fois une requête refusée par le filtre CSRF', async () => {
    const config = mutatingConfig();
    mocks.apiRequest.mockResolvedValue({ status: 200 });

    await expect(responseErrorInterceptor({
      config,
      response: { status: 403, data: { typeError: 'CSRF_TOKEN_INVALID' } },
    })).resolves.toEqual({ status: 200 });

    expect(mocks.csrfGet).toHaveBeenCalledTimes(1);
    expect(mocks.apiRequest).toHaveBeenCalledWith(expect.objectContaining({
      _retryAfterCsrfRefresh: true,
    }));
  });

  it('ne rejoue ni un vrai refus d\'autorisation ni un second refus CSRF', async () => {
    const authorizationError = {
      config: mutatingConfig(),
      response: { status: 403, data: { typeError: 'ACCESS_DENIED' } },
    };
    const repeatedCsrfError = {
      config: { ...mutatingConfig(), _retryAfterCsrfRefresh: true },
      response: { status: 403, data: { typeError: 'CSRF_TOKEN_INVALID' } },
    };

    await expect(responseErrorInterceptor(authorizationError)).rejects.toBe(authorizationError);
    await expect(responseErrorInterceptor(repeatedCsrfError)).rejects.toBe(repeatedCsrfError);
    expect(mocks.apiRequest).not.toHaveBeenCalled();
  });
});
