import React from 'react';
import {
  Waves,
  ScanSearch,
  HardHat,
  Zap,
  DraftingCompass,
  Building2,
  Microscope,
  FlaskConical,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { TypeDemandeDevis } from '../../types';

type IconComponent = React.FC<LucideProps>;

/**
 * Associe chaque type d'étude géotechnique à une icône Lucide spécifique.
 */
export const TYPE_ICONS: Record<TypeDemandeDevis, IconComponent> = {
  ASSAINISSEMENT: Waves,       // Eau / réseau d'assainissement
  G0:            ScanSearch,   // Étude préalable / reconnaissance
  G1_ES_PGC:     HardHat,      // Étude de site - coordination sécurité (PGC)
  G1_ELAN:       Zap,          // Étude de site - dispositif ÉLAN
  G2_AVP:        DraftingCompass, // Mission G2 Avant-Projet (conception)
  G2_PRO:        Building2,    // Mission G2 Projet (réalisation)
  G5:            Microscope,   // Mission G5 - Diagnostic géotechnique
};

/** Icône de repli si le type est inconnu ou absent. */
export const FallbackEtudeIcon = FlaskConical;

interface EtudeTypeIconProps extends LucideProps {
  readonly type?: string | null;
}

/**
 * Rend l'icône correspondant au type d'étude passé en prop.
 * Retombe sur FlaskConical si le type est inconnu ou absent.
 */
export const EtudeTypeIcon: React.FC<EtudeTypeIconProps> = ({ type, ...props }) => {
  const Icon =
    type && type in TYPE_ICONS
      ? TYPE_ICONS[type as TypeDemandeDevis]
      : FallbackEtudeIcon;
  return <Icon {...props} />;
};

