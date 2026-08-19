import React from 'react';
import { ParametresPageShell } from '../../components/parametres/ParametresPageShell';
import { SectionTelephone } from '../../components/parametres/SectionTelephone';
import { SectionAdresseFacturation } from '../../components/parametres/SectionAdresseFacturation';
import { SectionMotDePasse } from '../../components/parametres/SectionMotDePasse';
import { useClientParametres } from '../../hooks/useClientParametres';
import { useEmailNotificationPreferences } from '../../hooks/useEmailNotificationPreferences';
import { SectionEmailNotifications } from '../../components/parametres/SectionEmailNotifications';

export default function ClientParametresPage() {
  const parametres = useClientParametres();
  const emailNotifications = useEmailNotificationPreferences();

  return (
    <ParametresPageShell title="Paramètres" subtitle="Gérez vos informations personnelles et de sécurité">
      <SectionTelephone {...parametres} />
      <SectionEmailNotifications {...emailNotifications} />
      <SectionAdresseFacturation {...parametres} />
      <SectionMotDePasse {...parametres} />
    </ParametresPageShell>
  );
}

