import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMyPlanning } from '../api/planning';
import { useBEPlanning } from './useBEPlanning';

vi.mock('../api/planning', () => ({ getMyPlanning: vi.fn() }));

describe('useBEPlanning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMyPlanning).mockResolvedValue({ start: '2026-08-17', end: '2026-08-24', events: [] });
  });

  it('defaults to the week view and loads its ISO range', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={['/be/planning?date=2026-08-20']}>{children}</MemoryRouter>
    );
    const { result } = renderHook(() => useBEPlanning(), { wrapper });

    expect(result.current.view).toBe('week');
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getMyPlanning).toHaveBeenCalledWith('2026-08-17', '2026-08-24');
  });

  it('changes view and navigates to adjacent periods', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter initialEntries={['/be/planning?view=week&date=2026-08-20']}>{children}</MemoryRouter>
    );
    const { result } = renderHook(() => useBEPlanning(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setView('month'));
    await waitFor(() => expect(result.current.view).toBe('month'));
    act(() => result.current.next());
    await waitFor(() => expect(result.current.anchor.getMonth()).toBe(8));
    act(() => result.current.previous());
    await waitFor(() => expect(result.current.anchor.getMonth()).toBe(7));
    act(() => result.current.goToDate(new Date(2027, 0, 12)));
    await waitFor(() => expect(result.current.anchor).toEqual(new Date(2027, 0, 12)));
  });

  it('exposes API failures', async () => {
    vi.mocked(getMyPlanning).mockRejectedValue(new Error('Planning indisponible'));
    const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;
    const { result } = renderHook(() => useBEPlanning(), { wrapper });
    await waitFor(() => expect(result.current.error).toBe('Planning indisponible'));
    expect(result.current.isLoading).toBe(false);
  });

  it('uses an empty event list when the API omits events and navigates to today', async () => {
    vi.mocked(getMyPlanning).mockResolvedValue({ start: '2026-08-17', end: '2026-08-24', events: undefined! });
    vi.setSystemTime(new Date(2026, 9, 8, 12));
    const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;
    const { result } = renderHook(() => useBEPlanning(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.events).toEqual([]);
    act(() => result.current.today());
    await waitFor(() => expect(result.current.anchor).toEqual(new Date(2026, 9, 8)));
  });

  it('ignores a successful response received after unmount', async () => {
    let resolveRequest!: (value: Awaited<ReturnType<typeof getMyPlanning>>) => void;
    vi.mocked(getMyPlanning).mockReturnValue(new Promise(resolve => { resolveRequest = resolve; }));
    const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;
    const { unmount } = renderHook(() => useBEPlanning(), { wrapper });
    unmount();
    resolveRequest({ start: '2026-08-17', end: '2026-08-24', events: [] });
    await Promise.resolve();
  });

  it('ignores an error received after unmount', async () => {
    let rejectRequest!: (reason: Error) => void;
    vi.mocked(getMyPlanning).mockReturnValue(new Promise((_, reject) => { rejectRequest = reject; }));
    const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;
    const { unmount } = renderHook(() => useBEPlanning(), { wrapper });
    unmount();
    rejectRequest(new Error('late failure'));
    await Promise.resolve();
  });
});
