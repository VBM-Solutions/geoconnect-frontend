import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DetailSectionPanel } from './DetailSectionPanel';

describe('DetailSectionPanel', () => {
  it('affiche un titre et le contenu dans le cadre commun des pages de détail', () => {
    render(
      <DetailSectionPanel title="Documents" className="panel-test" contentClassName="content-test">
        <p>Contenu de l'onglet</p>
      </DetailSectionPanel>,
    );

    const title = screen.getByRole('heading', { name: 'Documents' });
    const panel = title.parentElement?.parentElement;
    expect(panel).toHaveClass('rounded-lg', 'border', 'bg-white', 'shadow-sm', 'panel-test');
    expect(screen.getByText("Contenu de l'onglet").parentElement).toHaveClass('content-test');
  });
});
