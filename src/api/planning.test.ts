import { beforeEach, describe, expect, it, vi } from 'vitest';
import api from './index';
import { getMyPlanning } from './planning';

vi.mock('./index', () => ({ default: { get: vi.fn() } }));

describe('planning API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads the authenticated BE planning with an exclusive range', async () => {
    const payload = { start: '2026-08-17', end: '2026-08-24', events: [] };
    vi.mocked(api.get).mockResolvedValue({ data: payload });

    await expect(getMyPlanning('2026-08-17', '2026-08-24')).resolves.toEqual(payload);
    expect(api.get).toHaveBeenCalledWith('/planning/be/me', {
      params: { start: '2026-08-17', end: '2026-08-24' },
    });
  });
});
