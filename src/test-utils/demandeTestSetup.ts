import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';

import * as referentielApi from '../api/referentiel';
import * as clientApi from '../api/client';
import * as demandeDevisApi from '../api/demandeDevis';
import * as documentApi from '../api/document';
import * as addressAutocompleteApi from '../api/addressAutocomplete';

export const MOCK_TYPES = [
  { code: 'G0', libelle: 'G0 — Étude préalable' },
  { code: 'G2_PRO', libelle: 'G2 PRO — Projet' },
];

export const MOCK_USER = { userId: 1, token: 'tok', role: 'CLIENT' as const, email: 'c@test.com' };
export const MOCK_CLIENT = { id: 10 };

/**
 * Configure les mocks par défaut pour les tests de formulaire de demande.
 * À appeler dans beforeEach.
 */
export function setupDefaultDemandeMocks(options?: {
  types?: typeof MOCK_TYPES;
  client?: typeof MOCK_CLIENT;
  demandeResponse?: unknown;
  documentResponse?: number[];
}) {
  vi.clearAllMocks();
  vi.mocked(referentielApi.getTypesEtude).mockResolvedValue(options?.types ?? MOCK_TYPES);
  vi.mocked(clientApi.getClientByUserId).mockResolvedValue(options?.client ?? MOCK_CLIENT);
  vi.mocked(demandeDevisApi.createDemandeDevis).mockResolvedValue(options?.demandeResponse ?? {});
  vi.mocked(documentApi.uploadDocuments).mockResolvedValue(options?.documentResponse ?? []);
  vi.mocked(addressAutocompleteApi.searchAddressSuggestions).mockResolvedValue([]);
}

/**
 * Remplit les champs projet obligatoires communs à tous les formulaires de demande.
 * Usage : appeler après waitFor(() => screen.getByText('G0 — Étude préalable'))
 */
export async function fillRequiredProjectFields(
  user: ReturnType<typeof userEvent.setup>,
  values?: Partial<{ type: string; rue: string; cp: string; ville: string }>
) {
  const type = values?.type ?? 'G0';
  const rue = values?.rue ?? '10 Rue de la Paix';
  const cp = values?.cp ?? '75001';
  const ville = values?.ville ?? 'Paris';

  await user.selectOptions(screen.getByLabelText(/Type de mission/i), type);
  await user.type(screen.getByPlaceholderText(/15 Avenue des Champs/i), rue);
  await user.type(screen.getByPlaceholderText('Ex : 75001'), cp);
  await user.type(screen.getByPlaceholderText('Ex : Paris'), ville);
  await user.click(screen.getByLabelText('Oui', { selector: 'input[name="presenceReseaux"]' }));
  await user.click(screen.getByLabelText('Oui', { selector: 'input[name="accessibiliteMachines"]' }));
}
