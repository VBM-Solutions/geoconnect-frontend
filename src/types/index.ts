export interface AdresseDTO {
  id?: number;
  rue?: string;
  codePostal?: string;
  ville?: string;
  latitude?: number;
  longitude?: number;
  geocodingScore?: number;
  geocodingStatus?: 'NOT_GEOCODED' | 'GEOCODED' | 'FAILED' | 'AMBIGUOUS';
  geocodedAt?: string;
}

export interface AddressSuggestionDTO {
  label: string;
  rue?: string;
  codePostal?: string;
  ville?: string;
  latitude?: number;
  longitude?: number;
  score?: number;
  source?: string;
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
  iban?: string | null;
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

export interface DelaiProjectionDTO {
  min?: string;
  max?: string;
  label?: string;
  joursRestants?: number;
  semainesRestantes?: number;
}

export interface PropositionDevisDTO {
  id?: number;
  bureauEtudeId?: number;
  demandeDevisId?: number;
  delaiMaxIntervention?: number;
  delaiProjectionIntervention?: DelaiProjectionDTO;
  delaiMaxRendu?: number;
  delaiProjectionRendu?: DelaiProjectionDTO;
  prix?: number;
  documentId?: number;
  statut?: StatutProposition;

  // Relations embarquées (usage front uniquement)
  bureauEtude?: {
    id: number;
    raisonSociale: string;
    ville?: string;
    profilPublicSlug?: string;
  };
  demandeDevis?: DemandeDevisDTO;
}

export type EtatEtude =
  | 'DEVIS_VALIDE'
  | 'DEVIS_SIGNE'
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

export interface EtudeDocumentsDTO {
  documentsDemandeDevis: DocumentDTO[];
  devisPdf?: DocumentDTO;
  devisSigne?: DocumentDTO;
  rapport?: DocumentDTO;
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
  delaiProjectionIntervention?: DelaiProjectionDTO;
  delaiMaxRendu?: number;
  delaiProjectionRendu?: DelaiProjectionDTO;
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

export interface EvaluationEtudePayload {
  qualiteEchanges: number;
  respectDelais: number;
  qualiteRapport: number;
  adequationBesoin: number;
  commentaire?: string;
}

export interface EvaluationEtudeDTO extends EvaluationEtudePayload {
  id: number;
  etudeId: number;
  noteGlobale: number;
  createdAt: string;
}

export interface StatutEvaluationEtudeDTO {
  eligible: boolean;
  evaluation?: EvaluationEtudeDTO;
}

// ─── Fiche publique Bureau d'Études ────────────────────────────────────────

export type StatutPublicationProfil = 'BROUILLON' | 'PUBLIE' | 'SUSPENDU';

export interface ProfilPublicBureauEtudeDTO {
  slug: string;
  statut: StatutPublicationProfil;
  raisonSociale: string;
  adresse?: AdresseDTO;
  adherentDepuis?: string;
  descriptionCourte?: string;
  descriptionLongue?: string;
  siteWeb?: string;
  anneesExperience?: number;
  telephonePublic?: string;
  emailPublic?: string;
  afficherAdresseComplete: boolean;
  typesEtude: TypeDemandeDevis[];
  zonesIntervention: string[];
  publishedAt?: string;
  updatedAt?: string;
}

export interface UpdateProfilPublicBureauEtudePayload {
  descriptionCourte?: string;
  descriptionLongue?: string;
  siteWeb?: string;
  anneesExperience?: number;
  telephonePublic?: string;
  emailPublic?: string;
  afficherAdresseComplete: boolean;
  typesEtude: TypeDemandeDevis[];
  zonesIntervention: string[];
}

export interface StatistiquesActiviteBureauEtudeDTO {
  nombreDemandesRepondues: number;
  nombrePropositionsEnvoyees: number;
  nombrePropositionsAcceptees: number;
  tauxAcceptation: number;
  nombreRapportsRendus: number;
  nombreRapportsRendusMoisCourant: number;
}

export interface FicheBureauEtudeDTO {
  profilPublic: ProfilPublicBureauEtudeDTO;
  activite: StatistiquesActiviteBureauEtudeDTO;
  evaluations: SyntheseEvaluationsDTO;
}

export interface SyntheseEvaluationsDTO {
  nombreEvaluations: number;
  noteGlobale?: number;
  qualiteEchanges?: number;
  respectDelais?: number;
  qualiteRapport?: number;
  adequationBesoin?: number;
  avis: Array<{
    evaluationId?: number;
    noteGlobale: number;
    commentaire: string;
    createdAt: string;
    etudeVerifiee: boolean;
    statutSignalement?: StatutSignalementEvaluation;
  }>;
}

export type MotifSignalementEvaluation =
  | 'DONNEES_PERSONNELLES'
  | 'PROPOS_INJURIEUX'
  | 'CONTENU_HORS_SUJET'
  | 'INFORMATION_FAUSSE'
  | 'AUTRE';

export type StatutSignalementEvaluation =
  | 'AUCUN'
  | 'EN_ATTENTE'
  | 'COMMENTAIRE_MASQUE'
  | 'REJETE';

export interface EvaluationSignaleeDTO {
  id: number;
  etudeId: number;
  noteGlobale: number;
  commentaire: string;
  motif: MotifSignalementEvaluation;
  details?: string;
  statut: StatutSignalementEvaluation;
  signaleAt: string;
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

export type BEMapMarkerKind =
  | 'DEMANDE_DISPONIBLE'
  | 'PROPOSITION_EN_ATTENTE'
  | 'ETUDE_EN_COURS'
  | 'ETUDE_ARCHIVEE';

export interface BEMapMarkerDTO {
  id: number;
  kind: BEMapMarkerKind;
  demandeDevisId?: number;
  propositionDevisId?: number;
  etudeId?: number;
  type?: TypeDemandeDevis;
  etatEtude?: EtatEtude;
  statutProposition?: StatutProposition;
  adresseProjet?: AdresseDTO;
  ville?: string;
  codePostal?: string;
  description?: string;
  prix?: number;
  dateIntervention?: string;
  dateRenduPrevue?: string;
  actionUrl?: string;
}

export interface BEMapDTO {
  bureau?: BureauEtudesDTO;
  markers: BEMapMarkerDTO[];
}

export interface BEMapFilters {
  type?: TypeDemandeDevis;
  etatEtude?: EtatEtude;
  kind?: BEMapMarkerKind;
  withArchived?: boolean;
}

