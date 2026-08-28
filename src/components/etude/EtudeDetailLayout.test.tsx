import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { EtudeDetailLayout, resolveEtudeSection } from './EtudeDetailLayout';

const etude = {
  id: 4,
  etat: 'RAPPORT_TERMINE',
  propositionDevis: {
    prix: 1200,
    demandeDevis: { description: 'Projet', presenceReseaux: 'OUI', accessibiliteMachines: 'NON' },
  },
} as never;

function renderLayout(url = '/client/etude/4') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <EtudeDetailLayout
        etude={etude}
        error={null}
        backTo="/client/dashboard"
        headerLabel="Suivi"
        infoCard={<div>Intervenant</div>}
        etatRole="CLIENT"
        renderActions={() => <button type="button">Payer</button>}
      />
    </MemoryRouter>,
  );
}

describe('EtudeDetailLayout — navigation profonde', () => {
  it('traduit les vues de notification en sections UI', () => {
    expect(resolveEtudeSection('calendrier')).toBe('dates');
    expect(resolveEtudeSection('documents')).toBe('documents');
    expect(resolveEtudeSection('paiement')).toBe('paiement');
    expect(resolveEtudeSection('progression')).toBe('progression');
    expect(resolveEtudeSection('intervenants')).toBe('intervenants');
    expect(resolveEtudeSection('inconnue')).toBe('synthese');
    expect(resolveEtudeSection(null)).toBe('synthese');
  });

  it('ouvre directement la section calendrier', () => {
    renderLayout('/client/etude/4?section=calendrier');
    expect(screen.getByRole('heading', { name: 'Dates' })).toBeTruthy();
    expect(screen.queryByText('Réseaux sur la parcelle')).toBeNull();
  });

  it('affiche les conditions d’intervention dans la description', () => {
    renderLayout('/client/etude/4?section=description');

    expect(screen.getByRole('heading', { name: 'Description' })).toBeTruthy();
    expect(screen.getByText('Réseaux sur la parcelle')).toBeTruthy();
    expect(screen.getByText('Accès pour les machines')).toBeTruthy();
    expect(screen.getByText('Oui')).toBeTruthy();
    expect(screen.getByText('Non')).toBeTruthy();
  });

  it('conserve les sections progression et intervenants après un clic', () => {
    renderLayout();

    fireEvent.click(screen.getByRole('button', { name: 'Progression' }));
    expect(screen.getByRole('heading', { name: 'Progression du dossier' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Bureau' }));
    expect(screen.getByRole('heading', { name: "Bureau d'etudes" })).toBeTruthy();
  });

  it('ouvre la section paiement et conserve la navigation manuelle', () => {
    renderLayout('/client/etude/4?section=paiement');
    expect(screen.getByRole('heading', { name: 'Paiement' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Payer' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Documents' }));
    expect(screen.getByRole('heading', { name: 'Documents' })).toBeTruthy();
  });
});
