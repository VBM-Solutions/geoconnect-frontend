# Implémentation des pages Paramètres — Guide Frontend

Ce document décrit comment intégrer les deux nouvelles pages **Paramètres** dans le frontend :
- **Page Paramètres Client** — téléphone, adresse de facturation, mot de passe
- **Paramètres BE (nouveautés)** — IBAN (s'ajoute aux notifications déjà existantes)

Tous les appels nécessitent un cookie JWT valide (`jwt`) posé lors du login.  
Le cookie est envoyé automatiquement par le navigateur (`credentials: 'include'`).

---

## Sommaire

1. [Page Paramètres Client](#1-page-paramètres-client)
   - [1.1 Lire le profil](#11-lire-le-profil)
   - [1.2 Modifier le téléphone](#12-modifier-le-téléphone)
   - [1.3 Modifier l'adresse de facturation](#13-modifier-ladresse-de-facturation)
   - [1.4 Modifier le mot de passe](#14-modifier-le-mot-de-passe)
2. [Page Paramètres BE — nouveautés](#2-page-paramètres-be--nouveautés)
   - [2.1 IBAN](#21-modifier-liban)
   - [2.2 Mot de passe](#22-modifier-le-mot-de-passe)
3. [Gestion des erreurs communes](#3-gestion-des-erreurs-communes)
4. [Structures de données](#4-structures-de-données)
5. [Exemple de routing / UX suggérée](#5-exemple-de-routing--ux-suggérée)

---

## 1. Page Paramètres Client

> **Rôle requis :** `CLIENT`  
> **Base URL :** `/api/parametres/client/me`

---

### 1.1 Lire le profil

Appelé au chargement de la page pour pré-remplir les formulaires.

```
GET /api/parametres/client/me/profil
```

**Réponse 200 — `ClientDTO`**
```json
{
  "id": 12,
  "civilite": "M",
  "nom": "Dupont",
  "prenom": "Jean",
  "emailContact": "jean.dupont@example.com",
  "telContact": "0612345678",
  "adresseFacturation": {
    "id": 5,
    "rue": "12 rue de la Paix",
    "codePostal": "75001",
    "ville": "Paris"
  },
  "utilisateurId": 42
}
```

**Codes d'erreur**

| Code | Cause |
|------|-------|
| `401` | Token absent ou expiré → rediriger vers `/login` |
| `403` | L'utilisateur n'a pas de profil client associé |

---

### 1.2 Modifier le téléphone

Formulaire dédié avec un seul champ. Soumettre uniquement si la valeur a changé.

```
PUT /api/parametres/client/me/telephone
Content-Type: application/json
```

**Corps de la requête**
```json
{
  "telephone": "0698765432"
}
```

**Validation côté front (à dupliquer côté serveur)**
- Obligatoire
- Format : `[0-9+\-\s()]{8,20}` — chiffres, `+`, `-`, espaces, parenthèses, 8 à 20 caractères

**Réponse 200** — `ClientDTO` mis à jour (même structure que le GET profil)

Mettre à jour le state local avec la réponse.

---

### 1.3 Modifier l'adresse de facturation

```
PUT /api/parametres/client/me/adresse-facturation
Content-Type: application/json
```

**Corps de la requête**
```json
{
  "rue": "8 avenue Montaigne",
  "codePostal": "75008",
  "ville": "Paris"
}
```

> ⚠️ Ne pas envoyer le champ `id` — il est ignoré par le backend.

**Validation côté front**

| Champ | Règle |
|-------|-------|
| `rue` | Obligatoire, non vide |
| `codePostal` | Obligatoire, exactement 5 chiffres `\d{5}` |
| `ville` | Obligatoire, non vide |

**Réponse 200** — `ClientDTO` mis à jour

---

### 1.4 Modifier le mot de passe

Section sensible — toujours dans un formulaire séparé des autres paramètres.

```
PUT /api/parametres/client/me/mot-de-passe
Content-Type: application/json
```

**Corps de la requête**
```json
{
  "ancienMotDePasse": "monAncienMdp",
  "nouveauMotDePasse": "monNouveauMdp2024!"
}
```

**Validation côté front**

| Champ | Règle |
|-------|-------|
| `ancienMotDePasse` | Obligatoire |
| `nouveauMotDePasse` | Obligatoire, minimum 8 caractères |
| Confirmation | Champ local uniquement — vérifier que `confirm === nouveauMotDePasse` avant d'envoyer |

**Réponse 204** — Pas de corps. Afficher un message de succès.

**Réponse 400** — L'ancien mot de passe est incorrect.  
Afficher un message d'erreur sur le champ `ancienMotDePasse`.

> 💡 **Bonne pratique UX :** après un changement de mot de passe réussi, vider les trois champs et afficher une bannière de confirmation. Ne pas déconnecter automatiquement (le token JWT reste valide).

---

## 2. Page Paramètres BE — nouveautés

> **Rôle requis :** `BUREAU_ETUDE`  
> **Base URL :** `/api/parametres/me`

Ces deux sections s'intègrent à la page Paramètres BE existante, aux côtés de la section Notifications.

---

### 2.1 Modifier l'IBAN

```
PUT /api/parametres/me/iban
Content-Type: application/json
```

**Corps de la requête**
```json
{
  "iban": "FR7630006000011234567890189"
}
```

**Validation côté front**

- Obligatoire (non vide)
- Format ISO 13616 : `^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$`
  - 2 lettres majuscules (code pays, ex. `FR`, `DE`, `ES`)
  - 2 chiffres de contrôle
  - 4 à 30 caractères alphanumériques majuscules (BBAN)
  - **Total : 8 à 34 caractères**
- Supprimer les espaces saisis par l'utilisateur avant l'envoi : `iban.replace(/\s/g, '').toUpperCase()`

```typescript
// Exemple de regex de validation
const IBAN_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;

function validerIban(valeur: string): boolean {
  const normalise = valeur.replace(/\s/g, '').toUpperCase();
  return IBAN_REGEX.test(normalise);
}
```

**Réponse 200 — `BureauEtudesDTO`**
```json
{
  "id": 3,
  "raisonSociale": "ABC Ingénierie",
  "emailContact": "contact@abc.fr",
  "telContact": "0145678901",
  "iban": "FR7630006000011234567890189",
  "adresse": {
    "rue": "15 rue des Ingénieurs",
    "codePostal": "69001",
    "ville": "Lyon"
  },
  "utilisateurId": 9
}
```

Mettre à jour l'affichage de l'IBAN dans le profil BE avec la valeur retournée.

> 💡 **Affichage :** formater l'IBAN en groupes de 4 caractères séparés par des espaces côté affichage uniquement : `FR76 3000 6000 0112 3456 7890 189`

---

### Récupérer l'IBAN existant au chargement

L'IBAN est retourné dans l'appel existant `GET /api/bureauEtude/me` (champ `iban` du `BureauEtudesDTO`). Il peut être `null` si le BE ne l'a pas encore renseigné.

```typescript
// Pré-remplissage du formulaire IBAN
const { data: profil } = await fetch('/api/bureauEtude/me');
ibanForm.setValue(profil.iban ?? '');
```

---

### 2.2 Modifier le mot de passe

Section sensible — toujours dans un formulaire séparé des autres paramètres.

```
PUT /api/parametres/me/mot-de-passe
Content-Type: application/json
```

**Corps de la requête**
```json
{
  "ancienMotDePasse": "monAncienMdp",
  "nouveauMotDePasse": "monNouveauMdp2024!"
}
```

**Validation côté front**

| Champ | Règle |
|-------|-------|
| `ancienMotDePasse` | Obligatoire |
| `nouveauMotDePasse` | Obligatoire, minimum 8 caractères |
| Confirmation | Champ local uniquement — vérifier que `confirm === nouveauMotDePasse` avant d'envoyer |

**Réponse 204** — Pas de corps. Afficher un message de succès.

**Réponse 400** — L'ancien mot de passe est incorrect.  
Afficher un message d'erreur sur le champ `ancienMotDePasse`.

> 💡 **Bonne pratique UX :** après un changement de mot de passe réussi, vider les trois champs et afficher une bannière de confirmation. Ne pas déconnecter automatiquement (le token JWT reste valide).

> ⚠️ **Différence avec le client :** cet endpoint est réservé au rôle `BUREAU_ETUDE` uniquement (pas d'accès ADMIN pour des raisons de sécurité).

---

## 3. Gestion des erreurs communes

### Erreur 400 — Validation

Le backend retourne un objet d'erreur structuré. Exemple :

```json
{
  "typeError": "VALIDATION_ERROR",
  "errors": {
    "telephone": "Le numéro de téléphone est invalide",
    "nouveauMotDePasse": "Le nouveau mot de passe doit contenir au moins 8 caractères"
  }
}
```

Afficher les messages d'erreur sous le champ correspondant.

### Erreur 400 — Ancien mot de passe incorrect

```json
{
  "typeError": "...",
  "message": "L'ancien mot de passe est incorrect"
}
```

Afficher sur le champ `ancienMotDePasse`.

### Erreur 401 — Token expiré

Intercepter globalement et rediriger vers `/login`.

### Erreur 403 — Profil manquant

Cas edge : l'utilisateur a le bon rôle mais aucun profil en base. Afficher un message générique et contacter le support.

---

## 4. Structures de données

### `ClientDTO`

```typescript
interface ClientDTO {
  id: number;
  civilite: 'M' | 'MME';
  nom: string;
  prenom: string;
  emailContact: string;
  telContact: string;
  adresseFacturation: AdresseDTO;
  utilisateurId: number;
}
```

### `AdresseDTO`

```typescript
interface AdresseDTO {
  id?: number;      // présent en lecture, ignoré en écriture
  rue: string;
  codePostal: string;  // 5 chiffres
  ville: string;
}
```

### `BureauEtudesDTO`

```typescript
interface BureauEtudesDTO {
  id: number;
  raisonSociale: string;
  emailContact: string;
  telContact: string;
  iban: string | null;  // null tant que non renseigné
  adresse: AdresseDTO;
  utilisateurId: number;
}
```

### `PreferencesNotificationsDTO` (existant — inchangé)

```typescript
interface PreferencesNotificationsDTO {
  notifierTousDepartements: boolean;
  departementsSuivis: string[];  // codes département ex. ["75", "92", "971"]
}
```

---

## 5. Exemple de routing / UX suggérée

### Page Paramètres Client (`/parametres`)

```
┌─────────────────────────────────────────┐
│  ⚙️  Mes Paramètres                      │
├─────────────────────────────────────────┤
│  📞 Téléphone                           │
│     [ 0612345678          ] [Modifier]  │
├─────────────────────────────────────────┤
│  🏠 Adresse de facturation              │
│     Rue    [ 12 rue de la Paix  ]       │
│     CP     [ 75001              ]       │
│     Ville  [ Paris              ]       │
│                            [Enregistrer]│
├─────────────────────────────────────────┤
│  🔒 Mot de passe                        │
│     Ancien MDP  [ ············ ]        │
│     Nouveau MDP [ ············ ]        │
│     Confirmer   [ ············ ]        │
│                            [Changer]    │
└─────────────────────────────────────────┘
```

### Page Paramètres BE (`/parametres`) — sections ajoutées

```
┌─────────────────────────────────────────┐
│  ⚙️  Mes Paramètres                      │
├─────────────────────────────────────────┤
│  🔔 Notifications  (existant)           │
│     ...                                 │
├─────────────────────────────────────────┤
│  🏦 IBAN                      (nouveau) │
│     [ FR76 3000 6000 0112...  ]         │
│                            [Enregistrer]│
├─────────────────────────────────────────┤
│  🔒 Mot de passe              (nouveau) │
│     Ancien MDP  [ ············ ]        │
│     Nouveau MDP [ ············ ]        │
│     Confirmer   [ ············ ]        │
│                            [Changer]    │
└─────────────────────────────────────────┘
```

### Appels à effectuer au chargement des pages

| Page | Appel(s) |
|------|----------|
| Paramètres Client | `GET /api/parametres/client/me/profil` |
| Paramètres BE | `GET /api/parametres/me/notifications` + `GET /api/bureauEtude/me` (pour l'IBAN) |

---

## Checklist d'intégration

### Paramètres Client
- [ ] Appel `GET /profil` au montage du composant pour pré-remplir les champs
- [ ] Formulaire téléphone avec validation regex avant envoi
- [ ] Formulaire adresse avec validation code postal 5 chiffres
- [ ] Formulaire mot de passe avec champ confirmation (local uniquement)
- [ ] Gestion du `204` sur changement de MDP (pas de corps à parser)
- [ ] Gestion du `400` avec message "ancien mot de passe incorrect"
- [ ] Mise à jour du state local avec le `ClientDTO` retourné par les PUT

### IBAN BE
- [ ] Pré-remplissage depuis `GET /api/bureauEtude/me` (champ `iban`, peut être `null`)
- [ ] Normalisation avant envoi : `replace(/\s/g, '').toUpperCase()`
- [ ] Validation regex `^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$`
- [ ] Formatage en affichage : groupes de 4 (ex. `FR76 3000 6000 ...`)
- [ ] Mise à jour du state avec le `BureauEtudesDTO` retourné

### Mot de passe BE
- [ ] Formulaire mot de passe avec champ confirmation (local uniquement)
- [ ] Gestion du `204` (pas de corps à parser)
- [ ] Gestion du `400` avec message "ancien mot de passe incorrect"
- [ ] Vider les champs après succès

