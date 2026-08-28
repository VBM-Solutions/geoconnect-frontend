import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VerifyEmail from './VerifyEmail';
import { confirmEmailCall } from '../api/auth';

vi.mock('../api/auth');

const navigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigate };
});

describe('VerifyEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.hash = '#token=verification-token';
  });

  it('affiche la confirmation de demande et donne accès au suivi après validation', async () => {
    vi.mocked(confirmEmailCall).mockResolvedValue();
    const user = userEvent.setup();
    render(<MemoryRouter><VerifyEmail /></MemoryRouter>);

    expect(await screen.findByRole('heading', { name: 'Votre demande de devis a bien été soumise' })).toBeTruthy();
    expect(screen.getByText(/Les bureaux d'étude du réseau mon etude de sol ont été notifiés/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Suivre ma demande' }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith('/login'));
  });
});
