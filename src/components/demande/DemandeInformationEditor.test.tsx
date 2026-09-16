import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DemandeInformationEditor } from './DemandeInformationEditor';

const demande = { id: 1, superficie: 120, nombreLot: 2, delaiMaxSouhaite: 4,
  referencesCadastrales: ['AB 12'], description: 'Projet', presenceReseaux: 'OUI' as const,
  accessibiliteMachines: 'NON' as const };

describe('DemandeInformationEditor', () => {
  it('affiche tous les champs en lecture seule', () => {
    render(<DemandeInformationEditor demande={demande} editable={false} onSave={vi.fn()} />);
    expect(screen.getByText('120 m²')).toBeInTheDocument();
    expect(screen.getByText('AB 12')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Modifier' })).toBeNull();
  });

  it('affiche explicitement les valeurs absentes', () => {
    render(<DemandeInformationEditor demande={{}} editable={false} onSave={vi.fn()} />);
    expect(screen.getAllByText(/Non renseign/).length).toBeGreaterThanOrEqual(4);
    expect(screen.getAllByText('Ne sait pas')).toHaveLength(2);
  });

  it('permet de modifier, annuler puis enregistrer les informations normalisées', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<DemandeInformationEditor demande={demande} editable onSave={onSave} />);
    await user.click(screen.getByRole('button', { name: 'Modifier' }));
    await user.clear(screen.getByLabelText('Superficie (m²)'));
    await user.type(screen.getByLabelText('Superficie (m²)'), '250');
    await user.click(screen.getByRole('button', { name: /Annuler/ }));
    expect(screen.getByText('120 m²')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Modifier' }));
    await user.clear(screen.getByLabelText('Superficie (m²)'));
    await user.type(screen.getByLabelText('Superficie (m²)'), '250');
    await user.clear(screen.getByLabelText('Référence cadastrale 1'));
    await user.type(screen.getByLabelText('Référence cadastrale 1'), ' AB 1 ');
    await user.click(screen.getByRole('button', { name: 'Ajouter une référence' }));
    await user.type(screen.getByLabelText('Référence cadastrale 2'), ' CD 2 ');
    await user.selectOptions(screen.getByLabelText('Présence de réseaux'), 'NON');
    await user.click(screen.getByRole('button', { name: /Enregistrer/ }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ superficie: 250, referencesCadastrales: ['AB 1', 'CD 2'], presenceReseaux: 'NON' }));
  });

  it('permet de supprimer une référence cadastrale comme à la création', async () => {
    const user = userEvent.setup();
    render(<DemandeInformationEditor demande={{ ...demande, referencesCadastrales: ['AB 1', 'CD 2'] }} editable onSave={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Modifier' }));
    await user.click(screen.getByRole('button', { name: 'Supprimer la référence cadastrale 1' }));
    expect(screen.getByLabelText('Référence cadastrale 1')).toHaveValue('CD 2');
  });
});
