import { TypeDemandeDevis } from '../types';
import { normalizeReferencesCadastrales } from './cadastralReferences';

export interface DemandePayloadInput {
  clientId: number;
  delaiMaxSouhaite?: unknown;
  type: TypeDemandeDevis;
  description?: string;
  nombreLot?: unknown;
  referencesCadastrales: string[];
  superficie?: unknown;
  rueProjet: string;
  codePostalProjet: string;
  villeProjet: string;
}

export function buildDemandePayload(input: DemandePayloadInput) {
  return {
    clientId: input.clientId,
    delaiMaxSouhaite: input.delaiMaxSouhaite ? Number(input.delaiMaxSouhaite) : undefined,
    type: input.type,
    description: input.description,
    nombreLot: input.nombreLot ? Number(input.nombreLot) : undefined,
    referencesCadastrales: normalizeReferencesCadastrales(input.referencesCadastrales),
    superficie: input.superficie ? Number(input.superficie) : undefined,
    adresseProjet: {
      rue: input.rueProjet,
      codePostal: input.codePostalProjet,
      ville: input.villeProjet,
    },
  };
}
