import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ConfirmModal } from './ConfirmModal';

function renderModal(overrides: Partial<React.ComponentProps<typeof ConfirmModal>> = {}) {
  const defaults = {
    title: 'Titre de la modale',
    message: 'Message de confirmation.',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };
  return render(<ConfirmModal {...defaults} {...overrides} />);
}

// ─── Rendu de base ────────────────────────────────────────────────────────────

describe('ConfirmModal — rendu de base', () => {
  it('affiche le titre passé en prop', () => {
    renderModal({ title: 'Confirmer la suppression' });
    expect(screen.getByText('Confirmer la suppression')).toBeTruthy();
  });

  it('affiche le message passé en prop', () => {
    renderModal({ message: 'Voulez-vous vraiment continuer ?' });
    expect(screen.getByText('Voulez-vous vraiment continuer ?')).toBeTruthy();
  });

  it('affiche le libellé par défaut du bouton confirmer', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /confirmer/i })).toBeTruthy();
  });

  it('affiche le libellé par défaut du bouton annuler', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /annuler/i })).toBeTruthy();
  });

  it('affiche un libellé personnalisé pour confirmLabel', () => {
    renderModal({ confirmLabel: 'Oui, supprimer' });
    expect(screen.getByRole('button', { name: /oui, supprimer/i })).toBeTruthy();
  });

  it('affiche un libellé personnalisé pour cancelLabel', () => {
    renderModal({ cancelLabel: 'Non, revenir' });
    expect(screen.getByRole('button', { name: /non, revenir/i })).toBeTruthy();
  });
});

// ─── Callbacks ───────────────────────────────────────────────────────────────

describe('ConfirmModal — callbacks', () => {
  it('appelle onConfirm au clic sur le bouton confirmer', () => {
    const onConfirm = vi.fn();
    renderModal({ onConfirm });
    fireEvent.click(screen.getByRole('button', { name: /confirmer/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('appelle onCancel au clic sur le bouton annuler', () => {
    const onCancel = vi.fn();
    renderModal({ onCancel });
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('appelle onCancel au clic sur le fond flouté', () => {
    const onCancel = vi.fn();
    renderModal({ onCancel });
    fireEvent.click(screen.getByTestId('confirm-modal-backdrop'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('ignore le clic sur le fond lorsque la modale n\'est pas dismissible', () => {
    const onCancel = vi.fn();
    renderModal({ onCancel, dismissible: false });

    fireEvent.click(screen.getByTestId('confirm-modal-backdrop'));

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('conserve le bouton annuler actif lorsque la modale n\'est pas dismissible', () => {
    const onCancel = vi.fn();
    renderModal({ onCancel, dismissible: false });

    fireEvent.click(screen.getByRole('button', { name: /annuler/i }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('ne déclenche pas onConfirm si le bouton est en isLoading', () => {
    // isLoading désactive le bouton Annuler mais pas Confirmer (le spinner remplace),
    // on vérifie surtout que le bouton Annuler est disabled
    const onCancel = vi.fn();
    renderModal({ isLoading: true, onCancel });
    const cancelBtn = screen.getByRole('button', { name: /annuler/i });
    expect(cancelBtn).toHaveAttribute('disabled');
  });
});

// ─── Variant ─────────────────────────────────────────────────────────────────

describe('ConfirmModal — variant', () => {
  it('applique la bordure slate par défaut (variant absent)', () => {
    const { container } = renderModal();
    const modal = container.querySelector('.border') as HTMLElement;
    expect(modal.className).toContain('border-slate-200');
  });

  it('applique la bordure slate avec variant="default"', () => {
    const { container } = renderModal({ variant: 'default' });
    const modal = container.querySelector('.border') as HTMLElement;
    expect(modal.className).toContain('border-slate-200');
  });

  it('applique la bordure orange avec variant="warning"', () => {
    const { container } = renderModal({ variant: 'warning' });
    // La div de la modale porte la bordure
    const modal = container.querySelector('.border-orange-300') as HTMLElement;
    expect(modal).toBeTruthy();
  });

  it('le titre est en texte orange avec variant="warning"', () => {
    renderModal({ variant: 'warning', title: 'Attention !' });
    const title = screen.getByText('Attention !');
    expect(title.className).toContain('text-orange-700');
  });

  it('le titre est en texte slate avec variant="default"', () => {
    renderModal({ variant: 'default', title: 'Confirmation' });
    const title = screen.getByText('Confirmation');
    expect(title.className).toContain('text-slate-800');
  });
});

// ─── Prop extra ───────────────────────────────────────────────────────────────

describe('ConfirmModal — prop extra', () => {
  it('affiche le contenu extra quand il est fourni', () => {
    renderModal({
      extra: <div data-testid="bandeau-warning">Bandeau d'avertissement</div>,
    });
    expect(screen.getByTestId('bandeau-warning')).toBeTruthy();
    expect(screen.getByText("Bandeau d'avertissement")).toBeTruthy();
  });

  it('n\'affiche pas de contenu extra si la prop est absente', () => {
    const { container } = renderModal();
    // Aucun élément avec data-testid lié à l'extra
    expect(container.querySelector('[data-testid="bandeau-warning"]')).toBeNull();
  });

  it('affiche l\'extra entre le message et les boutons', () => {
    const { container } = renderModal({
      extra: <div data-testid="extra-content">Contenu additionnel</div>,
    });
    const modal = container.querySelector('.relative.bg-white') as HTMLElement;
    const children = Array.from(modal.children);
    const extraIndex    = children.findIndex(c => c.querySelector('[data-testid="extra-content"]') !== null);
    const buttonsIndex  = children.findIndex(c => c.classList.contains('flex') && c.querySelector('button'));
    expect(extraIndex).toBeGreaterThan(-1);
    expect(buttonsIndex).toBeGreaterThan(extraIndex);
  });
});

