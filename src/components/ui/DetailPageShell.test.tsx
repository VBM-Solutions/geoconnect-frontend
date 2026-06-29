import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DetailPageShell } from './DetailPageShell';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderShell(tone: 'client' | 'be' = 'client') {
  return render(
    <MemoryRouter>
      <DetailPageShell
        tone={tone}
        backTo="/client/dashboard?tab=DEMANDES"
        backLabel="Retour aux demandes"
        eyebrow="Demande #MES-42"
        title="Paris"
        description="Projet G2 - 75001"
        status={<span>En attente</span>}
        actions={<button type="button">Action rapide</button>}
      >
        <div>Contenu detail</div>
      </DetailPageShell>
    </MemoryRouter>,
  );
}

describe('DetailPageShell', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('affiche le header, les actions et le contenu', () => {
    renderShell();

    expect(screen.getByText('Demande #MES-42')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Paris' })).toBeInTheDocument();
    expect(screen.getByText('Projet G2 - 75001')).toBeInTheDocument();
    expect(screen.getByText('En attente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action rapide' })).toBeInTheDocument();
    expect(screen.getByText('Contenu detail')).toBeInTheDocument();
  });

  it('navigue vers la route de retour', () => {
    renderShell();

    fireEvent.click(screen.getByRole('button', { name: /retour aux demandes/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/client/dashboard?tab=DEMANDES');
  });

  it('applique le ton bureau d etudes', () => {
    const { container } = renderShell('be');

    expect(container.querySelector('.from-slate-900')).not.toBeNull();
    expect(container.querySelector('.to-blue-700')).not.toBeNull();
  });
});
