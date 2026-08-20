import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from './Login';
import { loginCall } from '../api/auth';

const login = vi.fn();
vi.mock('../api/auth', () => ({ loginCall: vi.fn() }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ login }) }));

function renderLogin(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state }]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/client/demande/:id" element={<div>Destination notification</div>} />
        <Route path="/client/dashboard" element={<div>Tableau de bord client</div>} />
        <Route path="/be/dashboard" element={<div>Tableau de bord BE</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function authenticate() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/identifiant/i), 'client@test.fr');
  await user.type(screen.getByLabelText(/mot de passe/i), 'Password!123');
  await user.click(screen.getByRole('button', { name: /connexion securisee/i }));
}

describe('Login — retour après authentification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(loginCall).mockResolvedValue({ role: 'CLIENT', onboardingFinalized: false } as never);
  });

  it('retourne vers le lien profond demandé, paramètres inclus', async () => {
    renderLogin({ returnTo: '/client/demande/12?section=propositions&proposition=43' });
    await authenticate();
    expect(await screen.findByText('Destination notification')).toBeTruthy();
    expect(login).toHaveBeenCalled();
  });

  it('refuse une redirection externe et utilise la destination du rôle', async () => {
    renderLogin({ returnTo: '//site-malveillant.test/path' });
    await authenticate();
    await waitFor(() => expect(screen.getByText('Tableau de bord client')).toBeTruthy());
  });

  it('ignore la destination d’un autre rôle lors d’une nouvelle connexion', async () => {
    renderLogin({ returnTo: '/be/demande/12' });
    await authenticate();
    await waitFor(() => expect(screen.getByText('Tableau de bord client')).toBeTruthy());
  });
});
