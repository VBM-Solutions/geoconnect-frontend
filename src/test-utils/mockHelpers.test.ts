import { describe, it, expect } from 'vitest';
import { getLastMockCallPayload } from './mockHelpers';

describe('getLastMockCallPayload', () => {
  it('retourne le premier argument du dernier appel', () => {
    const mockFn = {
      mock: { calls: [[1, 2], [{ id: 42 }, 'extra']] },
    } as unknown as { mock: { calls: unknown[][] } };

    const result = getLastMockCallPayload(mockFn);
    expect(result).toStrictEqual({ id: 42 });
  });

  it('retourne undefined si aucun appel', () => {
    const mockFn = { mock: { calls: [] } } as unknown as { mock: { calls: unknown[][] } };

    expect(getLastMockCallPayload(mockFn)).toBeUndefined();
  });

  it('permet le typage générique', () => {
    const mockFn = {
      mock: { calls: [[{ count: 7 }]] },
    } as unknown as { mock: { calls: unknown[][] } };

    const result = getLastMockCallPayload<{ count: number }>(mockFn);
    expect(result?.count).toBe(7);
  });
});
