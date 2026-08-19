import { describe, expect, it } from 'vitest';
import { resolveNotificationPath } from './notificationTarget';
import { NotificationDTO } from '../types';

const base: NotificationDTO = {
  id: 1,
  type: 'NOUVELLE_PROPOSITION_DEVIS',
  categorie: 'PROPOSITIONS',
  message: 'test',
  lue: false,
  occurredAt: '2026-08-19T12:00:00Z',
  createdAt: '2026-08-19T12:00:01Z',
};

describe('resolveNotificationPath', () => {
  it('construit une demande client avec proposition sélectionnée', () => {
    expect(resolveNotificationPath({ ...base, cibleType: 'DEMANDE', cibleId: 4,
      cibleVue: 'PROPOSITIONS', cibleReferenceId: 9 }, 'CLIENT'))
      .toBe('/client/demande/4?section=propositions&proposition=9');
  });

  it('construit une section calendrier BE', () => {
    expect(resolveNotificationPath({ ...base, cibleType: 'ETUDE', cibleId: 7,
      cibleVue: 'CALENDRIER' }, 'BUREAU_ETUDE'))
      .toBe('/be/etude/7?section=calendrier');
  });

  it('conserve le lien historique sans cible ou pour un administrateur', () => {
    expect(resolveNotificationPath({ ...base, lienAction: '/legacy' }, 'CLIENT')).toBe('/legacy');
    expect(resolveNotificationPath({ ...base, cibleType: 'ETUDE', lienAction: '/legacy' }, 'CLIENT')).toBe('/legacy');
    expect(resolveNotificationPath({ ...base, cibleType: 'ETUDE', cibleId: 1, lienAction: '/legacy' })).toBe('/legacy');
    expect(resolveNotificationPath({ ...base, cibleType: 'ETUDE', cibleId: 1, lienAction: '/legacy' }, 'ADMIN'))
      .toBe('/legacy');
  });

  it('construit une cible de détail sans paramètres', () => {
    expect(resolveNotificationPath({ ...base, cibleType: 'ETUDE', cibleId: 8, cibleVue: 'DETAILS' }, 'CLIENT'))
      .toBe('/client/etude/8');
  });
});
