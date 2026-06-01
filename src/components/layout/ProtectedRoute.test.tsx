import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import * as AuthContextModule from '../../contexts/AuthContext';

// Helper pour monter le composant avec un faux contexte auth
function renderWithAuth(
  authValue: Partial<ReturnType<typeof AuthContextModule.useAuth>>,
  allowedRoles?: string[]
) {
  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...authValue,
  } as ReturnType<typeof AuthContextModule.useAuth>);

  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={allowedRoles as any} />}>
          <Route path="/protected" element={<div>Contenu protégé</div>} />
        </Route>
        <Route path="/login" element={<div>Page login</div>} />
        <Route path="/403" element={<div>Page 403</div>} />
        <Route path="/" element={<div>Page accueil</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('affiche un spinner pendant le chargement', () => {
    renderWithAuth({ isLoading: true, isAuthenticated: false });
    // Le spinner est un div avec animate-spin
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('redirige vers /login si non authentifié', () => {
    renderWithAuth({ isLoading: false, isAuthenticated: false });
    expect(screen.getByText('Page login')).toBeTruthy();
  });

  it('affiche le contenu si authentifié sans restriction de rôle', () => {
    renderWithAuth({
      isLoading: false,
      isAuthenticated: true,
      user: { userId: 1, login: 'a@b.com', role: 'CLIENT' },
    });
    expect(screen.getByText('Contenu protégé')).toBeTruthy();
  });

  it('affiche le contenu si le rôle est autorisé', () => {
    renderWithAuth(
      {
        isLoading: false,
        isAuthenticated: true,
        user: { userId: 1, login: 'a@b.com', role: 'CLIENT' },
      },
      ['CLIENT']
    );
    expect(screen.getByText('Contenu protégé')).toBeTruthy();
  });

  it('redirige vers /403 si le rôle n\'est pas autorisé', () => {
    renderWithAuth(
      {
        isLoading: false,
        isAuthenticated: true,
        user: { userId: 1, login: 'a@b.com', role: 'CLIENT' },
      },
      ['BUREAU_ETUDE']
    );
    expect(screen.getByText('Page 403')).toBeTruthy();
  });
});

