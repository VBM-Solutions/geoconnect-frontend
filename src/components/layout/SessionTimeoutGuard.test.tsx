import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionTimeoutGuard } from './SessionTimeoutGuard';

const mockUseSessionTimeout = vi.fn();
const mockGetSessionConfig = vi.fn();
const mockConfirmModal = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

vi.mock('../../hooks/useSessionTimeout', () => ({
  useSessionTimeout: (options: unknown) => mockUseSessionTimeout(options),
}));

vi.mock('../../api/auth', () => ({
  getSessionConfigCall: () => mockGetSessionConfig(),
}));

vi.mock('../ui/ConfirmModal', () => ({
  ConfirmModal: (props: { title: string; dismissible?: boolean }) => {
    mockConfirmModal(props);
    return <div>{props.title}</div>;
  },
}));

describe('SessionTimeoutGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSessionTimeout.mockReturnValue({
      showWarning: true,
      secondsRemaining: 90,
      stayConnected: vi.fn(),
      logoutNow: vi.fn(),
    });
  });

  it('applique la politique de session fournie par le backend', async () => {
    const serverPolicy = {
      idleTimeoutMs: 1_200_000,
      warningDurationMs: 120_000,
      absoluteTimeoutMs: 36_000_000,
    };
    mockGetSessionConfig.mockResolvedValue(serverPolicy);

    render(<SessionTimeoutGuard />);

    await waitFor(() => {
      expect(mockUseSessionTimeout).toHaveBeenLastCalledWith({ policy: serverPolicy });
    });
    expect(screen.getByText('Session bientôt expirée')).toBeTruthy();
    expect(mockConfirmModal).toHaveBeenLastCalledWith(expect.objectContaining({ dismissible: false }));
  });

  it('conserve la politique locale de repli si le backend est indisponible', async () => {
    mockGetSessionConfig.mockRejectedValue(new Error('indisponible'));

    render(<SessionTimeoutGuard />);

    await waitFor(() => expect(mockGetSessionConfig).toHaveBeenCalledOnce());
    expect(mockUseSessionTimeout).toHaveBeenLastCalledWith({ policy: undefined });
  });
});
