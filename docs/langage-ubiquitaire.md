# Langage ubiquitaire GeoConnect

Ce document fixe les termes affichés dans l'application et leur correspondance avec le domaine. Toute nouvelle fonctionnalité doit réutiliser ces termes ou documenter explicitement une exception.

## Parcours principal

| Terme canonique | Définition | Termes à éviter | Référence technique |
| --- | --- | --- | --- |
| Demande | Besoin déposé par un client et encore ouvert aux réponses des bureaux d'études. | Affaire, commande, offre client | `DemandeDevis` |
| Mission disponible | Demande à laquelle un bureau d'études peut répondre. | Opportunité, devis disponible | `OUVERT` |
| Proposition | Réponse commerciale d'un bureau d'études : prix, délais et devis PDF. | Offre, réponse au devis | `PropositionDevis` |
| Étude | Dossier créé après acceptation d'une proposition par le client. | Affaire, mission en production | `Etude` |
| Étude en cours | Étude comprise entre l'acceptation de la proposition et le paiement final. | Étude active, progression | États de `DEVIS_VALIDE` à `RAPPORT_TERMINE` |
| Étude archivée | Étude terminée, payée et conservée dans l'historique. | Étude finalisée, étude terminée, livrable finalisé | `PAIEMENT_EFFECTUE` |

## Documents et jalons

| Terme canonique | Définition | Termes à éviter | Référence technique |
| --- | --- | --- | --- |
| Devis PDF | Devis émis par le bureau d'études lors de sa proposition. | Pièce jointe du BE | `DEVIS_PDF` |
| Devis signé | Devis accepté, signé puis déposé par le client. | Devis validé | `DEVIS_SIGNE` (document) |
| Proposition acceptée | Proposition choisie par le client ; l'étude est alors créée. | Devis signé, commande validée | `ACCEPTEE` / `DEVIS_VALIDE` |
| Date d'intervention | Date proposée par le BE puis acceptée ou refusée par le client. | Date de mission | `dateIntervention` |
| Rapport final | Livrable produit par le BE à l'issue de l'étude. | Document final, livrable finalisé | `RAPPORT` |

## Règles rédactionnelles

- Employer « bureau d'études » dans les textes et `BE` uniquement dans les espaces très contraints.
- Présenter systématiquement les données commerciales dans l'ordre : montant, délai d'intervention, délai de rendu.
- Employer « archivée » uniquement après paiement ; avant paiement, l'étude reste « en cours » même si le rapport est disponible.
- Employer « proposition acceptée » pour le choix commercial et « devis signé » uniquement lorsqu'un PDF signé a effectivement été déposé.
- Les noms techniques existants ne doivent pas être renommés pour une simple correction de libellé.
