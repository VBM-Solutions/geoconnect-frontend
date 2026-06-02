import React from 'react';
import { ParametresPageShell } from '../../components/parametres/ParametresPageShell';
import { SectionTelephone } from '../../components/parametres/SectionTelephone';
import { SectionAdresseFacturation } from '../../components/parametres/SectionAdresseFacturation';
import { SectionMotDePasse } from '../../components/parametres/SectionMotDePasse';
import { useClientParametres } from '../../hooks/useClientParametres';

export default function ClientParametresPage() {
  const parametres = useClientParametres();

  return (
    <ParametresPageShell title="Paramètres" subtitle="Gérez vos informations personnelles et de sécurité">
      <SectionTelephone {...parametres} />
      <SectionAdresseFacturation {...parametres} />
      <SectionMotDePasse {...parametres} />
    </ParametresPageShell>
  );
}

