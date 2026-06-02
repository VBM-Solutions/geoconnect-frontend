import React from 'react';
import { useParametresNotifications } from '../../hooks/useParametresNotifications';
import { SectionNotifications } from '../../components/parametres/SectionNotifications';
import { useBureauEtudeIban } from '../../hooks/useBureauEtudeIban';
import { SectionIban } from '../../components/parametres/SectionIban';
import { SectionMotDePasse } from '../../components/parametres/SectionMotDePasse';
import { ParametresPageShell } from '../../components/parametres/ParametresPageShell';

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

  return (
    <ParametresPageShell title="Paramètres" subtitle="Gérez vos préférences et informations">
      <SectionNotifications {...parametresNotifications} />
      <SectionIban {...parametresIban} />
      <SectionMotDePasse {...parametresIban} />
    </ParametresPageShell>
  );
}

