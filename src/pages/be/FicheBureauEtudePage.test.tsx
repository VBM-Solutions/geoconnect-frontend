import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FicheBureauEtudePage from './FicheBureauEtudePage';

const useFicheMock = vi.fn();
const publishMock = vi.fn();

vi.mock('../../hooks/useFicheBureauEtude', () => ({
  useFicheBureauEtude: () => useFicheMock(),
}));

vi.mock('../../hooks/useTypesEtude', () => ({
  useTypesEtude: () => ({
    typesEtude: [{ code: 'G2_AVP', libelle: 'G2 AVP – Avant-Projet' }],
    loading: false,
  }),
}));

vi.mock('../../api/referentiel', () => ({
  getDepartements: vi.fn().mockResolvedValue([{ code: '44', libelle: 'Loire-Atlantique' }]),
}));

const toastSuccess = vi.fn();
const toastError = vi.fn();
vi.mock('../../contexts/ToastContext', () => ({
  useToast: () => ({ toastSuccess, toastError }),
}));

const fiche = {
  profilPublic: {
    slug: 'geo-atlantique-nantes-42',
    statut: 'BROUILLON',
    raisonSociale: 'Géo Atlantique',
    adresse: { rue: '1 rue du Sol', codePostal: '44000', ville: 'Nantes' },
    descriptionCourte: 'Bureau spécialisé dans les études géotechniques pour vos projets.',
    descriptionLongue: 'Nous accompagnons les particuliers.',
    siteWeb: 'https://geo-atlantique.example',
    anneesExperience: 12,
    telephonePublic: '0200000000',
    emailPublic: 'contact@geo.example',
    afficherAdresseComplete: false,
    typesEtude: ['G2_AVP'],
    zonesIntervention: ['44'],
  },
  activite: {
    nombreDemandesRepondues: 8,
    nombrePropositionsEnvoyees: 10,
    nombrePropositionsAcceptees: 5,
    tauxAcceptation: 50,
    nombreRapportsRendus: 4,
    nombreRapportsRendusMoisCourant: 1,
  },
};

describe('FicheBureauEtudePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    publishMock.mockResolvedValue({ ...fiche.profilPublic, statut: 'PUBLIE' });
    useFicheMock.mockReturnValue({
      fiche,
      isLoading: false,
      loadError: null,
      action: null,
      reload: vi.fn(),
      save: vi.fn(),
      publish: publishMock,
      unpublish: vi.fn(),
    });
  });

  it('affiche les statistiques privées et le formulaire du profil', () => {
    render(<FicheBureauEtudePage />);

    expect(screen.getByRole('heading', { name: /ma fiche bureau d’études/i })).toBeTruthy();
    expect(screen.getByText('8')).toBeTruthy();
    expect(screen.getByText('50 %')).toBeTruthy();
    expect(screen.getByLabelText(/présentation courte/i)).toHaveValue(
      fiche.profilPublic.descriptionCourte,
    );
  });

  it('affiche un aperçu local sans sauvegarder', async () => {
    const user = userEvent.setup();
    render(<FicheBureauEtudePage />);

    await user.click(screen.getByRole('button', { name: /aperçu/i }));

    expect(screen.getByRole('heading', { name: 'Géo Atlantique' })).toBeTruthy();
    expect(screen.getByText('Nous accompagnons les particuliers.')).toBeTruthy();
    expect(publishMock).not.toHaveBeenCalled();
  });

  it('sauvegarde le brouillon avant de demander sa publication', async () => {
    const user = userEvent.setup();
    render(<FicheBureauEtudePage />);

    await user.click(screen.getByRole('button', { name: /publier ma fiche/i }));

    expect(publishMock).toHaveBeenCalledWith(expect.objectContaining({
      descriptionCourte: fiche.profilPublic.descriptionCourte,
      typesEtude: ['G2_AVP'],
      zonesIntervention: ['44'],
    }));
    expect(toastSuccess).toHaveBeenCalledWith('Votre fiche est maintenant publiée.');
  });

  it('explique les prérequis lorsque le profil est incomplet', () => {
    useFicheMock.mockReturnValue({
      ...useFicheMock(),
      fiche: {
        ...fiche,
        profilPublic: {
          ...fiche.profilPublic,
          descriptionCourte: 'Trop court',
          typesEtude: [],
          zonesIntervention: [],
        },
      },
    });

    render(<FicheBureauEtudePage />);

    expect(screen.getByText(/rédiger une présentation courte/i)).toBeTruthy();
    expect(screen.getByText(/sélectionner au moins un type d’étude/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /publier ma fiche/i })).toBeDisabled();
  });

  it('propose un lien vers la page SSR lorsque le profil est publié', () => {
    useFicheMock.mockReturnValue({
      ...useFicheMock(),
      fiche: {
        ...fiche,
        profilPublic: { ...fiche.profilPublic, statut: 'PUBLIE' },
      },
    });

    render(<FicheBureauEtudePage />);

    expect(screen.getByRole('link', { name: /voir ma page publique/i }))
      .toHaveAttribute(
        'href',
        '/bureaux-etudes/geo-atlantique-nantes-42?retour=%2Fbe%2Fma-fiche',
      );
    expect(screen.getByRole('link', { name: /voir ma page publique/i }))
      .toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: /voir ma page publique/i }))
      .toHaveAttribute('rel', 'noopener noreferrer');
  });
});
