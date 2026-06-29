import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BEStepActions } from './EtudeDetail';

// ─── Mock de uploadDocument (non utilisé dans les cas testés ici) ─────────────
vi.mock('../../api/document', () => ({
  uploadDocument: vi.fn(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Retourne une date ISO locale à +N jours par rapport à aujourd'hui.
 * On évite toISOString() qui convertit en UTC et peut décaler la date d'un jour
 * en fuseau UTC+N.
 */
function dateInDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const defaultProps = {
  isLoading: false,
  onProposerDate: vi.fn(),
  onInterventionEffectuee: vi.fn(),
  onTerminerRapport: vi.fn(),
};

function renderActions(overrides: Partial<React.ComponentProps<typeof BEStepActions>> = {}) {
  return render(<BEStepActions {...defaultProps} {...overrides} />);
}

// ─── État DATE_INTERVENTION_FIXEE — bouton principal ─────────────────────────

describe('BEStepActions — état DATE_INTERVENTION_FIXEE', () => {
  beforeEach(() => vi.clearAllMocks());

  it('affiche le bouton "Intervention réalisée"', () => {
    renderActions({ etat: 'DATE_INTERVENTION_FIXEE' });
    expect(screen.getByRole('button', { name: /intervention réalisée/i })).toBeTruthy();
  });

  it('ne déclenche PAS onInterventionEffectuee directement au clic (modale d\'abord)', () => {
    const onInterventionEffectuee = vi.fn();
    renderActions({ etat: 'DATE_INTERVENTION_FIXEE', onInterventionEffectuee });
    fireEvent.click(screen.getByRole('button', { name: /intervention réalisée/i }));
    expect(onInterventionEffectuee).not.toHaveBeenCalled();
  });

  it('ouvre la modale au clic sur le bouton', () => {
    renderActions({ etat: 'DATE_INTERVENTION_FIXEE' });
    fireEvent.click(screen.getByRole('button', { name: /intervention réalisée/i }));
    expect(screen.getByText(/confirmer l'intervention/i)).toBeTruthy();
  });

  it('affiche le message de confirmation dans la modale', () => {
    renderActions({ etat: 'DATE_INTERVENTION_FIXEE' });
    fireEvent.click(screen.getByRole('button', { name: /intervention réalisée/i }));
    expect(screen.getByText(/marquer cette intervention comme réalisée/i)).toBeTruthy();
  });
});

// ─── Modale — boutons Confirmer / Annuler ─────────────────────────────────────

describe('BEStepActions — modale de confirmation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('appelle onInterventionEffectuee après confirmation dans la modale', () => {
    const onInterventionEffectuee = vi.fn();
    renderActions({ etat: 'DATE_INTERVENTION_FIXEE', onInterventionEffectuee });

    fireEvent.click(screen.getByRole('button', { name: /intervention réalisée/i }));
    // Cliquer sur le bouton de confirmation dans la modale
    fireEvent.click(screen.getByRole('button', { name: /oui, marquer comme effectuée/i }));

    expect(onInterventionEffectuee).toHaveBeenCalledTimes(1);
  });

  it('ferme la modale sans appeler onInterventionEffectuee au clic sur Annuler', () => {
    const onInterventionEffectuee = vi.fn();
    renderActions({ etat: 'DATE_INTERVENTION_FIXEE', onInterventionEffectuee });

    fireEvent.click(screen.getByRole('button', { name: /intervention réalisée/i }));
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));

    expect(onInterventionEffectuee).not.toHaveBeenCalled();
    // La modale ne doit plus être présente
    expect(screen.queryByText(/confirmer l'intervention/i)).toBeNull();
  });

  it('la modale n\'est pas visible avant le premier clic', () => {
    renderActions({ etat: 'DATE_INTERVENTION_FIXEE' });
    expect(screen.queryByText(/confirmer l'intervention/i)).toBeNull();
  });

  it('la modale disparaît après confirmation', () => {
    renderActions({ etat: 'DATE_INTERVENTION_FIXEE' });
    fireEvent.click(screen.getByRole('button', { name: /intervention réalisée/i }));
    fireEvent.click(screen.getByRole('button', { name: /oui, marquer comme effectuée/i }));
    expect(screen.queryByText(/confirmer l'intervention/i)).toBeNull();
  });
});

// ─── Bandeau d'avertissement — date dans le futur ────────────────────────────

describe('BEStepActions — avertissement date future', () => {
  beforeEach(() => vi.clearAllMocks());

  it('affiche le bandeau d\'avertissement si la date d\'intervention est dans le futur', () => {
    renderActions({
      etat: 'DATE_INTERVENTION_FIXEE',
      dateIntervention: dateInDays(10),
    });
    fireEvent.click(screen.getByRole('button', { name: /intervention réalisée/i }));
    expect(screen.getByText(/la date d'intervention est prévue au/i)).toBeTruthy();
  });

  it('mentionne le nombre de jours restants dans le bandeau', () => {
    const { container } = renderActions({
      etat: 'DATE_INTERVENTION_FIXEE',
      dateIntervention: dateInDays(5),
    });
    fireEvent.click(screen.getByRole('button', { name: /intervention réalisée/i }));
    // Le bandeau orange contient le chiffre et le mot "jour"
    const bandeauOrange = container.querySelector('.bg-orange-50');
    expect(bandeauOrange).toBeTruthy();
    expect(bandeauOrange!.textContent).toContain('5');
    expect(bandeauOrange!.textContent).toMatch(/jours?/i);
  });

  it('mentionne "1 jour" (singulier) quand la date est à 1 jour', () => {
    const { container } = renderActions({
      etat: 'DATE_INTERVENTION_FIXEE',
      dateIntervention: dateInDays(1),
    });
    fireEvent.click(screen.getByRole('button', { name: /intervention réalisée/i }));
    const bandeauOrange = container.querySelector('.bg-orange-50');
    expect(bandeauOrange).toBeTruthy();
    // Le textContent normalisé doit contenir "1 jour" sans "1 jours"
    expect(bandeauOrange!.textContent).toContain('1 jour');
    expect(bandeauOrange!.textContent).not.toMatch(/\b1 jours\b/);
  });

  it('n\'affiche PAS le bandeau si la date est aujourd\'hui', () => {
    renderActions({
      etat: 'DATE_INTERVENTION_FIXEE',
      dateIntervention: dateInDays(0),
    });
    fireEvent.click(screen.getByRole('button', { name: /intervention réalisée/i }));
    expect(screen.queryByText(/la date d'intervention est prévue au/i)).toBeNull();
  });

  it('n\'affiche PAS le bandeau si la date est dans le passé', () => {
    renderActions({
      etat: 'DATE_INTERVENTION_FIXEE',
      dateIntervention: dateInDays(-3),
    });
    fireEvent.click(screen.getByRole('button', { name: /intervention réalisée/i }));
    expect(screen.queryByText(/la date d'intervention est prévue au/i)).toBeNull();
  });

  it('n\'affiche PAS le bandeau si aucune date n\'est définie', () => {
    renderActions({
      etat: 'DATE_INTERVENTION_FIXEE',
      dateIntervention: undefined,
    });
    fireEvent.click(screen.getByRole('button', { name: /intervention réalisée/i }));
    expect(screen.queryByText(/la date d'intervention est prévue au/i)).toBeNull();
  });
});

// ─── Variant visuel de la modale selon la date ───────────────────────────────

describe('BEStepActions — variant de la modale', () => {
  beforeEach(() => vi.clearAllMocks());

  it('la modale est en variant "warning" (bordure orange) quand la date est future', () => {
    const { container } = renderActions({
      etat: 'DATE_INTERVENTION_FIXEE',
      dateIntervention: dateInDays(10),
    });
    fireEvent.click(screen.getByRole('button', { name: /intervention réalisée/i }));
    expect(container.querySelector('.border-orange-300')).toBeTruthy();
  });

  it('la modale est en variant "default" (bordure slate) quand la date est passée', () => {
    const { container } = renderActions({
      etat: 'DATE_INTERVENTION_FIXEE',
      dateIntervention: dateInDays(-2),
    });
    fireEvent.click(screen.getByRole('button', { name: /intervention réalisée/i }));
    expect(container.querySelector('.border-slate-200')).toBeTruthy();
    expect(container.querySelector('.border-orange-300')).toBeNull();
  });

  it('la modale est en variant "default" quand aucune date n\'est définie', () => {
    const { container } = renderActions({
      etat: 'DATE_INTERVENTION_FIXEE',
      dateIntervention: undefined,
    });
    fireEvent.click(screen.getByRole('button', { name: /intervention réalisée/i }));
    expect(container.querySelector('.border-slate-200')).toBeTruthy();
    expect(container.querySelector('.border-orange-300')).toBeNull();
  });
});

// ─── Autres états (non liés à l'intervention) ─────────────────────────────────

describe('BEStepActions — autres états', () => {
  it('affiche le formulaire de date pour DEVIS_SIGNE', () => {
    renderActions({ etat: 'DEVIS_SIGNE' });
    expect(screen.getByRole('button', { name: /envoyer la date/i })).toBeTruthy();
  });

  it('affiche un message d\'attente pour DEVIS_VALIDE', () => {
    renderActions({ etat: 'DEVIS_VALIDE' });
    expect(screen.queryByRole('button', { name: /envoyer la date/i })).toBeNull();
    expect(screen.getByText(/en attente du devis sign/i)).toBeTruthy();
  });

  it('affiche la date proposée et bloque la reproposition pour DATE_INTERVENTION_PROPOSEE', () => {
    renderActions({
      etat: 'DATE_INTERVENTION_PROPOSEE',
      dateIntervention: '2026-07-15',
    });
    expect(screen.queryByRole('button', { name: /envoyer la date/i })).toBeNull();
    expect(screen.getByText(/date proposée au client/i)).toBeTruthy();
    expect(screen.getByText(/en attente de sa validation ou de son refus/i)).toBeTruthy();
  });

  it('affiche le formulaire pour DATE_INTERVENTION_PROPOSEE sans date après refus client', () => {
    renderActions({ etat: 'DATE_INTERVENTION_PROPOSEE' });
    expect(screen.getByText(/le client a refusé la date proposée/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /envoyer la date/i })).toBeTruthy();
  });

  it('ne rend rien pour un état inconnu', () => {
    const { container } = renderActions({ etat: undefined });
    expect(container.firstChild).toBeNull();
  });
});



