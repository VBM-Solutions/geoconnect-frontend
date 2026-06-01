export interface AdresseDTO {
  id?: number;
  rue?: string;
  codePostal?: string;
  ville?: string;
}

export type Civilite = 'MR' | 'MME' | 'AUTRE';

export interface ClientDTO {
  id?: number;
  civilite?: Civilite;
  nom?: string;
  prenom?: string;
  emailContact?: string;
  telContact?: string;
  adresseFacturation?: AdresseDTO;
  utilisateurId?: number;
}

export interface BureauEtudesDTO {
  id?: number;
  raisonSociale?: string;
  emailContact?: string;
  telContact?: string;
  adresse?: AdresseDTO;
  utilisateurId?: number;
}

export type TypeDemandeDevis =
  | 'ASSAINISSEMENT'
  | 'G0'
  | 'G1_ES_PGC'
  | 'G1_ELAN'
  | 'G2_AVP'
  | 'G2_PRO'
  | 'G5';

/** Objet retourné par le référentiel : code technique + libellé lisible. */
export interface EnumValueDTO {
  code: string;
  libelle: string;
}

export interface DemandeDevisDTO {
  id?: number;
  delaiMaxSouhaite?: number;
  adresseProjet?: AdresseDTO;
  clientId?: number;
  type?: TypeDemandeDevis;
  nombreLot?: number;
  /** @deprecated Utiliser referencesCadastrales */
  referenceCadastrale?: string;
  referencesCadastrales?: string[];
  superficie?: number;
  description?: string;
  docsDevisIds?: number[];
}

export type StatutProposition = 'EN_ATTENTE' | 'ACCEPTEE' | 'REFUSEE';

export interface PropositionDevisDTO {
  id?: number;
  bureauEtudeId?: number;
  demandeDevisId?: number;
  delaiMaxIntervention?: number;
  delaiMaxRendu?: number;
  prix?: number;
  documentId?: number;
  statut?: StatutProposition;

  // Relations embarquées (usage front uniquement)
  bureauEtude?: BureauEtudesDTO;
  demandeDevis?: DemandeDevisDTO;
}

export type EtatEtude =
  | 'DEVIS_VALIDE'
  | 'DATE_INTERVENTION_PROPOSEE'
  | 'DATE_INTERVENTION_FIXEE'
  | 'INTERVENTION_EFFECTUEE'
  | 'RAPPORT_TERMINE'
  | 'PAIEMENT_EFFECTUE';

export interface EtudeDTO {
  id?: number;
  propositionDevisId?: number;
  etat?: EtatEtude;
  devisSigneId?: number;
  rapportId?: number;
  chargeAffaire?: string;
  dateIntervention?: string;
  dateRendu?: string;
  dateRenduPrevue?: string;
}

export type StatutDocument = 'ORPHELIN' | 'ATTACHE';

export interface DocumentDTO {
  id?: number;
  nomFichierOriginal?: string;
  /** Nom lisible à afficher à l'utilisateur et à utiliser pour le téléchargement. */
  nomTelechargement?: string;
  typeContenu?: string;
  tailleFichier?: number;
  bucketName?: string;
  statut?: StatutDocument;
  expireAt?: string;
}

export interface AuthResponseDTO {
  /** @deprecated Le JWT est désormais posé en cookie HttpOnly par le backend — absent du body. */
  token?: string;
  userId: number;
  login: string;
  role: 'CLIENT' | 'BUREAU_ETUDE' | 'ADMIN';
}

export type Role = AuthResponseDTO['role'];

export interface UtilisateurDTO {
  id: number;
  login: string;
  role: Role;
  enabled: boolean;
  createdAt: string;
}

export interface CreerUtilisateurPayload {
  login: string;
  motDePasse: string;
  role: Role;
}

// ─── Types enrichis (endpoint /etude/{id}/detail) ────────────────────────────

export interface ClientDetail {
  id?: number;
  civilite?: Civilite;
  nom?: string;
  prenom?: string;
  tel?: string;
  adresseFacturation?: AdresseDTO;
}

export interface BureauEtudesDetail {
  id?: number;
  raisonSociale?: string;
  emailContact?: string;
  telContact?: string;
  adresse?: AdresseDTO;
}

export interface DemandeDevisDetail {
  id?: number;
  delaiMaxSouhaite?: number;
  type?: TypeDemandeDevis;
  nombreLot?: number;
  /** @deprecated Utiliser referencesCadastrales */
  referenceCadastrale?: string;
  referencesCadastrales?: string[];
  superficie?: number;
  description?: string;
  docsDevisIds?: number[];
  adresseProjet?: AdresseDTO;
  client?: ClientDetail;
}

export interface PropositionDevisDetail {
  id?: number;
  statut?: StatutProposition;
  prix?: number;
  delaiMaxIntervention?: number;
  delaiMaxRendu?: number;
  devisPdfId?: number;
  bureauEtude?: BureauEtudesDetail;
  demandeDevis?: DemandeDevisDetail;
}

/** Représente un document nommé lié à une étude, prêt à être affiché. */
export interface DocumentRef {
  id: number;
  label: string;
}

export interface EtudeDetailDTO {
  id?: number;
  etat?: EtatEtude;
  chargeAffaire?: string;
  dateIntervention?: string;
  dateRendu?: string;
  dateRenduPrevue?: string;
  devisSigneId?: number;
  rapportId?: number;
  propositionDevis?: PropositionDevisDetail;
}

// ─── Référentiel ─────────────────────────────────────────────────────────────

/** Département français (code INSEE + libellé). */
export interface DepartementDTO {
  code: string;
  libelle: string;
}

// ─── Paramètres ───────────────────────────────────────────────────────────────

/** Préférences de notification géographique d'un Bureau d'Études. */
export interface NotificationPreferencesDTO {
  /** true = reçoit toutes les demandes sans filtre (mode par défaut). */
  notifierTousDepartements: boolean;
  /** Codes des départements souscrits — pertinent uniquement si notifierTousDepartements = false. */
  departementsSuivis: string[];
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'NOUVELLE_DEMANDE_DEVIS'
  | 'DEVIS_SIGNE_UPLOADE'
  | 'PROPOSITION_ACCEPTEE'
  | 'DATE_INTERVENTION_VALIDEE'
  | 'DATE_INTERVENTION_REFUSEE'
  | 'PAIEMENT_CONFIRME'
  | 'NOUVELLE_PROPOSITION_DEVIS'
  | 'DATE_INTERVENTION_PROPOSEE'
  | 'RAPPORT_DISPONIBLE';

export interface NotificationDTO {
  id: number;
  type: NotificationType;
  message: string;
  lienAction?: string;
  lue: boolean;
  createdAt: string;
}

