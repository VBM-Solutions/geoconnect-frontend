export type StudyCard = Readonly<{
  code: string;
  title: string;
  description: string;
}>;

export type FaqItem = Readonly<{
  question: string;
  answer: string;
  imagePosition: string;
}>;

export const TRUST_ITEMS = [
  'Demande gratuite',
  'Sans engagement',
  'Bureaux d’études qualifiés',
  'Suivi en ligne',
  'Documents centralisés',
] as const;

export const STUDY_CARDS: readonly StudyCard[] = [
  { code: 'ASSAINISSEMENT', title: "Étude d'assainissement", description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
  { code: 'G0', title: 'G0 – Étude préliminaire de site', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.' },
  { code: 'G1_ES_PGC', title: 'G1 ES/PGC – Étude de site / Principes Généraux de Construction', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.' },
  { code: 'G1_ELAN', title: 'G1 ELAN – Étude géotechnique préalable (dispositif ELAN)', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.' },
  { code: 'G2_AVP', title: 'G2 AVP – Étude géotechnique de conception (Avant-Projet)', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.' },
  { code: 'G2_PRO', title: 'G2 PRO – Étude géotechnique de conception (Projet)', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Neque porro quisquam est qui dolorem ipsum quia dolor sit amet.' },
  { code: 'G5', title: 'G5 – Diagnostic géotechnique', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam.' },
] as const;

export const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: 'Qui réalisera mon étude de sol ?',
    answer: "Un bureau d’études partenaire disponible dans votre secteur pourra vous transmettre un devis. Un système de notation des bureaux d’études partenaires vous aidera à faire le meilleur choix.",
    imagePosition: 'center',
  },
  {
    question: 'Comment se passe la prise de rendez-vous ?',
    answer: "Vous proposez une période qui vous convient puis validez la date finale d’intervention avec le bureau d’études retenu. Les informations détaillées du bureau d’étude vous seront fournies pour faciliter les échanges, si des précisions sont à apporter.",
    imagePosition: 'left',
  },
  {
    question: 'Comment se déroule le suivi du projet ?',
    answer: 'Un système de suivi et de notification vous informe des diverses avancées de votre projet.',
    imagePosition: 'right',
  },
] as const;
