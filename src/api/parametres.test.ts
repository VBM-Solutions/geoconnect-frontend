import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getClientProfil,
  getNotificationPreferences,
  updateBureauEtudeIban,
  updateBureauEtudeMotDePasse,
  updateClientAdresseFacturation,
  updateClientMotDePasse,
  updateClientTelephone,
  updateNotificationPreferences,
} from './parametres';

vi.mock('./index', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

const fakePrefs = {
  notifierTousDepartements: false,
  departementsSuivis: ['75', '92', '93'],
};

const fakeClient = {
  id: 12,
  civilite: 'MME',
  nom: 'Dupont',
  prenom: 'Jeanne',
  emailContact: 'jeanne.dupont@example.com',
  telContact: '0612345678',
  adresseFacturation: {
    id: 5,
    rue: '12 rue de la Paix',
    codePostal: '75001',
    ville: 'Paris',
  },
  utilisateurId: 42,
};

const fakeBureau = {
  id: 3,
  raisonSociale: 'ABC Ingénierie',
  emailContact: 'contact@abc.fr',
  telContact: '0145678901',
  iban: 'FR7630006000011234567890189',
  adresse: {
    id: 1,
    rue: '15 rue des Ingénieurs',
    codePostal: '69001',
    ville: 'Lyon',
  },
  utilisateurId: 9,
};

describe('parametres API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── getNotificationPreferences ────────────────────────────────────────────────

  describe('getNotificationPreferences', () => {
    it('appelle GET /parametres/bureau/me/notifications et retourne les données', async () => {
      const { default: api } = await import('./index');
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: fakePrefs });

      const result = await getNotificationPreferences();

      expect(api.get).toHaveBeenCalledOnce();
      expect(api.get).toHaveBeenCalledWith('/parametres/bureau/me/notifications');
      expect(result).toEqual(fakePrefs);
    });

    it('retourne notifierTousDepartements=true avec liste vide par défaut', async () => {
      const defaultPrefs = { notifierTousDepartements: true, departementsSuivis: [] };
      const { default: api } = await import('./index');
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: defaultPrefs });

      const result = await getNotificationPreferences();

      expect(result.notifierTousDepartements).toBe(true);
      expect(result.departementsSuivis).toEqual([]);
    });

    it('laisse remonter l\'erreur si l\'API échoue', async () => {
      const { default: api } = await import('./index');
      (api.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('401 Unauthorized'));

      await expect(getNotificationPreferences()).rejects.toThrow('401 Unauthorized');
    });
  });

  // ── updateNotificationPreferences ────────────────────────────────────────────

  describe('updateNotificationPreferences', () => {
    it('appelle PUT /parametres/bureau/me/notifications avec le corps et retourne la réponse', async () => {
      const { default: api } = await import('./index');
      (api.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: fakePrefs });

      const result = await updateNotificationPreferences(fakePrefs);

      expect(api.put).toHaveBeenCalledOnce();
      expect(api.put).toHaveBeenCalledWith('/parametres/bureau/me/notifications', fakePrefs);
      expect(result).toEqual(fakePrefs);
    });

    it('envoie notifierTousDepartements=true avec departementsSuivis vide', async () => {
      const allDepts = { notifierTousDepartements: true, departementsSuivis: [] };
      const { default: api } = await import('./index');
      (api.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: allDepts });

      const result = await updateNotificationPreferences(allDepts);

      expect(api.put).toHaveBeenCalledWith('/parametres/bureau/me/notifications', allDepts);
      expect(result.notifierTousDepartements).toBe(true);
    });

    it('gère les codes Corse (2A, 2B) et DOM-TOM (971, 972…)', async () => {
      const corseDomTom = {
        notifierTousDepartements: false,
        departementsSuivis: ['2A', '2B', '971', '972'],
      };
      const { default: api } = await import('./index');
      (api.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: corseDomTom });

      const result = await updateNotificationPreferences(corseDomTom);

      expect(result.departementsSuivis).toContain('2A');
      expect(result.departementsSuivis).toContain('971');
    });

    it('laisse remonter l\'erreur si l\'API répond 400', async () => {
      const { default: api } = await import('./index');
      (api.put as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('400 Bad Request'));

      await expect(updateNotificationPreferences({ notifierTousDepartements: false, departementsSuivis: [] })).rejects.toThrow('400 Bad Request');
    });
  });

  describe('client / bureau paramètres', () => {
    it('appelle GET /parametres/client/me/profil', async () => {
      const { default: api } = await import('./index');
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: fakeClient });

      const result = await getClientProfil();

      expect(api.get).toHaveBeenCalledWith('/parametres/client/me/profil');
      expect(result).toEqual(fakeClient);
    });

    it('appelle PUT /parametres/client/me/telephone avec le numéro fourni', async () => {
      const { default: api } = await import('./index');
      (api.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: fakeClient });

      const result = await updateClientTelephone('0698765432');

      expect(api.put).toHaveBeenCalledWith('/parametres/client/me/telephone', { telephone: '0698765432' });
      expect(result).toEqual(fakeClient);
    });

    it('appelle PUT /parametres/client/me/adresse-facturation sans id', async () => {
      const { default: api } = await import('./index');
      (api.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: fakeClient });

      const result = await updateClientAdresseFacturation({ rue: '8 avenue Montaigne', codePostal: '75008', ville: 'Paris' });

      expect(api.put).toHaveBeenCalledWith('/parametres/client/me/adresse-facturation', {
        rue: '8 avenue Montaigne',
        codePostal: '75008',
        ville: 'Paris',
      });
      expect(result).toEqual(fakeClient);
    });

    it('appelle PUT /parametres/client/me/mot-de-passe et ne renvoie pas de body', async () => {
      const { default: api } = await import('./index');
      (api.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      await expect(
        updateClientMotDePasse({ ancienMotDePasse: 'ancien', nouveauMotDePasse: 'nouveau123' }),
      ).resolves.toBeUndefined();
      expect(api.put).toHaveBeenCalledWith('/parametres/client/me/mot-de-passe', {
        ancienMotDePasse: 'ancien',
        nouveauMotDePasse: 'nouveau123',
      });
    });

    it('appelle PUT /parametres/bureau/me/iban avec un payload normalisé côté appelant', async () => {
      const { default: api } = await import('./index');
      (api.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: fakeBureau });

      const result = await updateBureauEtudeIban('FR7630006000011234567890189');

      expect(api.put).toHaveBeenCalledWith('/parametres/bureau/me/iban', { iban: 'FR7630006000011234567890189' });
      expect(result).toEqual(fakeBureau);
    });

    it('appelle PUT /parametres/bureau/me/mot-de-passe et ne renvoie pas de body', async () => {
      const { default: api } = await import('./index');
      (api.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({});

      await expect(
        updateBureauEtudeMotDePasse({ ancienMotDePasse: 'ancien', nouveauMotDePasse: 'Nouveau123!' }),
      ).resolves.toBeUndefined();
      expect(api.put).toHaveBeenCalledWith('/parametres/bureau/me/mot-de-passe', {
        ancienMotDePasse: 'ancien',
        nouveauMotDePasse: 'Nouveau123!',
      });
    });
  });
});

