import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ToastProvider } from '../../contexts/ToastContext';
import { EtudeDetailLayout, resolveEtudeSection, resolveEtudeSectionForRole } from './EtudeDetailLayout';

const etude = {
  id: 4,
  etat: 'RAPPORT_TERMINE',
  dateIntervention: '2026-08-12',
  dateRendu: '2026-08-20',
  propositionDevis: { prix: 1200, demandeDevis: { description: 'Projet', createdAt: '2026-07-01T10:00:00' } },
} as never;

function renderLayout(url = '/client/etude/4') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ToastProvider>
        <EtudeDetailLayout
          etude={etude}
          documents={{ documentsDemandeDevis: [], devisSigne: { id: 8, createdAt: '2026-07-05T12:00:00' } }}
          error={null}
          backTo="/client/dashboard"
          headerLabel="Suivi"
          infoCard={<div>Intervenant</div>}
          etatRole="CLIENT"
          renderActions={() => <button type="button">Payer</button>}
        />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('EtudeDetailLayout — navigation profonde', () => {
  it('traduit les vues de notification en sections UI', () => {
    expect(resolveEtudeSection('calendrier')).toBe('description');
    expect(resolveEtudeSection('documents')).toBe('documents');
    expect(resolveEtudeSection('paiement')).toBe('synthese');
    expect(resolveEtudeSection('inconnue')).toBe('synthese');
    expect(resolveEtudeSection(null)).toBe('synthese');
  });

  it('redirige les anciens onglets client vers les quatre sections autorisées', () => {
    expect(resolveEtudeSectionForRole('calendrier', 'CLIENT')).toBe('description');
    expect(resolveEtudeSectionForRole('paiement', 'CLIENT')).toBe('synthese');
    expect(resolveEtudeSectionForRole('bureau', 'CLIENT')).toBe('bureau');
    expect(resolveEtudeSectionForRole('calendrier', 'BE')).toBe('description');
  });

  it('ouvre les dates dans la section Description côté client', () => {
    renderLayout('/client/etude/4?section=calendrier');
    expect(screen.getByRole('heading', { name: 'Description' })).toBeTruthy();
  });

  it('redirige le paiement vers la synthèse et conserve la navigation manuelle', () => {
    renderLayout('/client/etude/4?section=paiement');
    expect(screen.getByRole('heading', { name: /synthese du dossier/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Payer' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Documents/ }));
    expect(screen.getByRole('heading', { name: 'Documents' })).toBeTruthy();
  });

  it('limite la navigation client aux quatre sections et affiche les dates métier', () => {
    renderLayout();
    expect(screen.queryByRole('button', { name: 'Progression' })).toBeNull();
    expect(screen.queryByText('1200 EUR')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Description' }));
    expect(screen.getByText('Création de la demande')).toBeTruthy();
    expect(screen.getByText('01 juillet 2026')).toBeTruthy();
    expect(screen.getByText('05 juillet 2026')).toBeTruthy();
    expect(screen.getAllByText('12 août 2026')).toHaveLength(2);
    expect(screen.getByText('20 août 2026')).toBeTruthy();
  });
});
