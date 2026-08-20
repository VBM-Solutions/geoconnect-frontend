import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CreateBureauEtudePage from './CreateBureauEtudePage';
import * as api from '../../api/contactsBureauEtude';

vi.mock('../../api/contactsBureauEtude');
vi.mock('../../components/shared/AddressAutocompleteField', () => ({
  AddressAutocompleteField: ({ onSelect }: { onSelect: (value: unknown) => void }) => (
    <button type="button" onClick={() => onSelect({ label: '1 rue de Paris', rue: '1 rue de Paris', codePostal: '75001', ville: 'Paris', latitude: 48.8, longitude: 2.3, score: 0.9 })}>
      Choisir une adresse
    </button>
  ),
}));

const navigate = vi.fn();
vi.mock('react-router-dom', async (original) => ({
  ...await original<typeof import('react-router-dom')>(),
  useNavigate: () => navigate,
}));

describe('CreateBureauEtudePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.createBureauEtudeAdmin).mockResolvedValue({ userId: 8, bureauEtudeId: 3, login: 'be@test.fr', role: 'BUREAU_ETUDE' });
  });

  it('affiche les validations et bloque un formulaire invalide', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><CreateBureauEtudePage /></MemoryRouter>);
    await user.click(screen.getByRole('button', { name: /créer et envoyer/i }));
    expect(await screen.findAllByText(/Champ obligatoire|Requis/)).toHaveLength(3);
    expect(api.createBureauEtudeAdmin).not.toHaveBeenCalled();
  });

  it('valide les formats et soumet une adresse sélectionnée', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><CreateBureauEtudePage /></MemoryRouter>);
    await user.type(screen.getByLabelText('Raison sociale'), 'Geo Expert');
    await user.type(screen.getByLabelText('Email'), 'be@test.fr');
    await user.type(screen.getByLabelText('Téléphone'), '06 12 34 56 78');
    await user.click(screen.getByRole('button', { name: 'Choisir une adresse' }));
    await user.click(screen.getByRole('button', { name: /créer et envoyer/i }));
    expect(api.createBureauEtudeAdmin).toHaveBeenCalledWith(expect.objectContaining({
      raisonSociale: 'Geo Expert', email: 'be@test.fr', telephone: '06 12 34 56 78',
      adresse: expect.objectContaining({ codePostal: '75001', ville: 'Paris' }),
    }));
  });
});
