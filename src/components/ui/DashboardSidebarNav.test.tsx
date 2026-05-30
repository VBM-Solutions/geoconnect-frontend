import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { FileText } from 'lucide-react';
import { DashboardSidebarNav } from './DashboardSidebarNav';

describe('DashboardSidebarNav', () => {
  it('affiche les items non masques et applique l etat actif', () => {
    render(
      <DashboardSidebarNav
        activeItemId="ETUDES"
        onItemChange={vi.fn()}
        sections={[
          {
            id: 'principal',
            title: 'Principal',
            items: [
              { id: 'DEMANDES', label: 'Demandes', count: 2, icon: <FileText className="w-4 h-4" />, hidden: true },
              { id: 'ETUDES', label: 'Etudes', count: 3, icon: <FileText className="w-4 h-4" /> },
            ],
          },
        ]}
      />,
    );

    expect(screen.queryByRole('button', { name: /Demandes/i })).toBeNull();
    expect(screen.getByRole('button', { name: /Etudes/i }).getAttribute('aria-current')).toBe('page');
  });

  it('declenche le changement d item au clic', () => {
    const onItemChange = vi.fn();

    render(
      <DashboardSidebarNav
        activeItemId="DEMANDES"
        onItemChange={onItemChange}
        sections={[
          {
            id: 'principal',
            title: 'Principal',
            items: [
              { id: 'DEMANDES', label: 'Demandes', count: 1 },
              { id: 'ETUDES', label: 'Etudes', count: 2 },
            ],
          },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Etudes/i }));
    expect(onItemChange).toHaveBeenCalledWith('ETUDES');
  });

  it('permet de replier puis de deplier une section', () => {
    render(
      <DashboardSidebarNav
        activeItemId="DEMANDES"
        onItemChange={vi.fn()}
        sections={[
          {
            id: 'principal',
            title: 'Principal',
            items: [{ id: 'DEMANDES', label: 'Demandes', count: 1 }],
          },
        ]}
      />,
    );

    const sectionToggle = screen.getByRole('button', { name: /Principal/i });
    expect(sectionToggle.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(sectionToggle);
    expect(sectionToggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('button', { name: /Demandes/i })).toBeNull();

    fireEvent.click(sectionToggle);
    expect(sectionToggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: /Demandes/i })).toBeTruthy();
  });
});

