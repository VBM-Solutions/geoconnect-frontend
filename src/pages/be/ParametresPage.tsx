import React from 'react';
import { useParametresNotifications } from '../../hooks/useParametresNotifications';
import { SectionNotifications } from '../../components/parametres/SectionNotifications';
import { useBureauEtudeIban } from '../../hooks/useBureauEtudeIban';
import { SectionIban } from '../../components/parametres/SectionIban';
import { SectionMotDePasse } from '../../components/parametres/SectionMotDePasse';
import { ParametresPageShell } from '../../components/parametres/ParametresPageShell';
import { useEmailNotificationPreferences } from '../../hooks/useEmailNotificationPreferences';
import { SectionEmailNotifications } from '../../components/parametres/SectionEmailNotifications';

/**
 * Page principale de l'onglet Paramètres pour les Bureaux d'Études.
 * Route : /be/parametres  (protégée par rôle BUREAU_ETUDE)
 *
 * Organisée en sections extensibles :
 *   - Notifications  ← implémentée
 *   - Mon profil     ← à venir
 *   - Sécurité       ← à venir
 */
export default function BEParametresPage() {
  const parametresNotifications = useParametresNotifications();
  const parametresIban = useBureauEtudeIban();
  const emailNotifications = useEmailNotificationPreferences();

  return (
    <ParametresPageShell title="Paramètres" subtitle="Gérez vos préférences et informations">
      <SectionNotifications {...parametresNotifications} />
      <SectionEmailNotifications {...emailNotifications} recipientRole="BUREAU_ETUDE" />
      <SectionIban {...parametresIban} />
      <SectionMotDePasse {...parametresIban} />
    </ParametresPageShell>
  );
}

