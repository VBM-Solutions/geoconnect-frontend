# CGU — cadrage technique de la clause anti-contournement

## Statut

Ce sujet est en attente d'une clause rédigée et validée par les responsables juridique et produit. Aucun texte contractuel ni mécanisme d'acceptation ne doit être mis en production avant cette validation.

## Décisions attendues avant développement

- texte définitif de la clause et périmètre des utilisateurs concernés ;
- moment de l'acceptation : inscription, première connexion ou prochaine action engageante ;
- traitement des comptes existants et règle de réacceptation lors d'une nouvelle version ;
- durée de conservation de la preuve et modalités d'accès ou d'export ;
- données de preuve autorisées après revue RGPD (par exemple date, utilisateur, version, adresse IP ou agent utilisateur) ;
- comportement lorsque l'utilisateur refuse ou n'a pas encore accepté.

## Architecture cible proposée

La règle d'acceptation appartient au domaine et ne doit dépendre ni de l'interface web ni du stockage choisi.

- Un cas d'usage applicatif orchestre la présentation et l'acceptation des CGU.
- Le domaine manipule une version immuable des CGU et une preuve d'acceptation.
- Un port de persistance enregistre l'identifiant utilisateur, la version acceptée et l'horodatage ; les métadonnées complémentaires restent conditionnées à la validation RGPD.
- Un adaptateur expose l'état d'acceptation à l'interface et bloque uniquement les actions définies par le produit.
- Le contenu juridique est versionné hors du code métier, avec un identifiant stable et, si nécessaire, une empreinte permettant d'établir le contenu accepté.
- Les événements techniques et journaux ne doivent pas contenir le texte complet ni de données personnelles non nécessaires.

## Critères de préparation au développement

Le ticket pourra passer en développement lorsque les éléments suivants seront fournis :

1. clause et parcours fonctionnel validés ;
2. modèle de preuve et politique de conservation validés ;
3. stratégie de migration des utilisateurs existants ;
4. critères d'acceptation couvrant acceptation, refus, réacceptation et indisponibilité du contenu ;
5. maquettes des écrans et règles d'accessibilité ;
6. scénarios de tests métier, API, persistance et non-régression.

## Vérifications prévues lors de l'implémentation

- impossibilité de contourner une acceptation obligatoire par appel direct de l'API ;
- idempotence de l'acceptation d'une même version ;
- conservation des preuves des versions précédentes ;
- réacceptation exigée uniquement selon la règle produit ;
- contrôle des droits d'accès à la preuve ;
- tests de migration, de concurrence et de reprise sur erreur.
