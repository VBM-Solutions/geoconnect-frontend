/**
 * Helpers pour extraire les payloads des mocks Vitest de manière type-safe et lisible.
 */

export function getLastMockCallPayload<T = Record<string, any>>(
  mockFn: { mock: { calls: unknown[][] } }
): T | undefined {
  const last = mockFn.mock.calls.at(-1);
  return last ? (last[0] as T) : undefined;
}
