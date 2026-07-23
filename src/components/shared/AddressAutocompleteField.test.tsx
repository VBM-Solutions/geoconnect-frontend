import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddressAutocompleteField } from './AddressAutocompleteField';
import { searchAddressSuggestions } from '../../api/addressAutocomplete';

vi.mock('../../api/addressAutocomplete', () => ({
  searchAddressSuggestions: vi.fn(),
}));

describe('AddressAutocompleteField', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('recherche avec debounce et appelle onSelect au clic sur une suggestion', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    vi.mocked(searchAddressSuggestions).mockResolvedValueOnce([
      { label: '12 Rue de la Paix 75001 Paris', rue: '12 Rue de la Paix', codePostal: '75001', ville: 'Paris' },
    ]);

    render(<AddressAutocompleteField id="address" label="Adresse" onSelect={onSelect} />);

    await user.type(screen.getByLabelText('Adresse'), '12 rue paix');

    await waitFor(() => expect(searchAddressSuggestions).toHaveBeenCalledWith('12 rue paix', 8));
    await user.click(await screen.findByText('12 Rue de la Paix 75001 Paris'));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({
      rue: '12 Rue de la Paix',
      codePostal: '75001',
      ville: 'Paris',
    }));
  });

  it('ne lance pas de recherche avant trois caracteres', async () => {
    const user = userEvent.setup();
    render(<AddressAutocompleteField id="address" label="Adresse" onSelect={vi.fn()} />);

    await user.type(screen.getByLabelText('Adresse'), 'pa');

    expect(searchAddressSuggestions).not.toHaveBeenCalled();
  });
});
