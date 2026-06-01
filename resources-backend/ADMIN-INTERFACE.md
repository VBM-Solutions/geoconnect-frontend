# Interface Admin — Plan de mise en œuvre

> Document de référence décrivant les travaux réalisés côté **backend** et le plan détaillé
> à implémenter côté **frontend** pour l'interface d'administration des comptes.

---

## Table des matières

1. [Contexte](#1-contexte)
2. [Ce qui a été fait côté backend](#2-ce-qui-a-été-fait-côté-backend)
   - 2.1 [Nouveau champ `enabled` sur les comptes](#21-nouveau-champ-enabled-sur-les-comptes)
   - 2.2 [Extension du `UtilisateurRepository`](#22-extension-du-utilisateurrepository)
   - 2.3 [Service et contrôleur admin](#23-service-et-contrôleur-admin)
   - 2.4 [Correction du bug de sécurité `GET /bureauEtude/{id}`](#24-correction-du-bug-de-sécurité-get-bureauctude-id)
   - 2.5 [Règle globale `/admin/**` dans le SecurityConfig](#25-règle-globale-admin-dans-le-securityconfig)
3. [Référence API — Endpoints admin](#3-référence-api--endpoints-admin)
4. [Plan d'implémentation frontend](#4-plan-dimplémentation-frontend)
   - 4.1 [Prérequis et architecture](#41-prérequis-et-architecture)
   - 4.2 [Garde de route](#42-garde-de-route)
   - 4.3 [Service API `adminService`](#43-service-api-adminservice)
   - 4.4 [Pages et composants à créer](#44-pages-et-composants-à-créer)
   - 4.5 [Gestion des états et flux UX](#45-gestion-des-états-et-flux-ux)
   - 4.6 [Gestion des erreurs](#46-gestion-des-erreurs)
   - 4.7 [Sécurité côté front](#47-sécurité-côté-front)
5. [Checklist de livraison](#5-checklist-de-livraison)

---

## 1. Contexte

L'application GeoConnect dispose de trois rôles : `CLIENT`, `BUREAU_ETUDE` et `ADMIN`.
Jusqu'à présent, aucune interface d'administration n'existait pour gérer les comptes.
Cette feature ajoute :

- la capacité pour un admin d'**activer/désactiver** un compte sans le supprimer ;
- la possibilité de **créer des comptes** avec n'importe quel rôle (y compris `ADMIN`) ;
- la **réinitialisation du mot de passe** d'un utilisateur ;
- une **vue listant tous les comptes** avec leurs métadonnées.

---

## 2. Ce qui a été fait côté backend

### 2.1 Nouveau champ `enabled` sur les comptes

| Fichier modifié | Changement |
|---|---|
| `domain-layer/.../UtilisateurBO.java` | `boolean enabled` (`@Builder.Default = true`) + `LocalDateTime createdAt` |
| `infrastructure-layer/.../UtilisateurEntity.java` | Colonne JPA `enabled boolean NOT NULL DEFAULT TRUE` |
| `infrastructure-layer/.../UserDetailsAdapter.java` | `isEnabled()` délègue désormais à `utilisateurBO.isEnabled()` — Spring Security bloque automatiquement les comptes désactivés à l'authentification |
| `infrastructure-layer/.../UtilisateurEntityMapper.java` | MapStruct auto-mappe `enabled` et `createdAt` dans les deux sens |
| `db/migration/V4__utilisateur_enabled.sql` | `ALTER TABLE utilisateur ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT TRUE` |

> **Impact sécurité** : un compte désactivé ne peut plus s'authentifier.
> Spring Security retourne un `401` avec `DisabledException` si `isEnabled()` renvoie `false`.

---

### 2.2 Extension du `UtilisateurRepository`

```java
// domain-layer — port/UtilisateurRepository.java (nouvelles méthodes)
Optional<UtilisateurBO> findById(Long id);
List<UtilisateurBO>    findAll();
```

L'implémentation `UtilisateurRepositoryAdapter` délègue à `JpaRepository`
(déjà fournis par Spring Data JPA sans requête supplémentaire).

---

### 2.3 Service et contrôleur admin

**Nouveaux artefacts :**

| Artefact | Couche | Rôle |
|---|---|---|
| `AdminServiceException` | domain | Exception métier → HTTP 404 |
| `AdminService` (interface) | domain | Contrat hexagonal |
| `AdminServiceImpl` | domain | Implémentation (log, guard, toBuilder) |
| `UtilisateurDTO` | application | DTO public (sans mot de passe) |
| `CreerUtilisateurRequestDTO` | application | Corps POST création |
| `ResetPasswordRequestDTO` | application | Corps PATCH reset password |
| `UtilisateurMapper` | application | MapStruct BO → DTO |
| `AdminController` | application | REST `/admin/utilisateurs/**` |
| `ApiExceptionHandlerAdvice` | application | Handler `AdminServiceException` → 404 |

**TU ajoutés : 35 tests, 0 échec.**

---

### 2.4 Correction du bug de sécurité `GET /bureauEtude/{id}`

```java
// Avant — aucune restriction (tout utilisateur authentifié pouvait accéder)
public ResponseEntity<BureauEtudesDTO> getBureauEtudeByID(@PathVariable Long id)

// Après
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<BureauEtudesDTO> getBureauEtudeByID(@PathVariable Long id)
```

---

### 2.5 Règle globale `/admin/**` dans le SecurityConfig

```java
// infrastructure-layer — SecurityConfig.java
.requestMatchers("/admin/**").hasRole("ADMIN")   // ← défense en profondeur
.anyRequest().authenticated()
```

Double protection : règle globale dans le `SecurityConfig` **+** `@PreAuthorize` sur chaque
méthode du contrôleur (principe de défense en profondeur).

---

## 3. Référence API — Endpoints admin

> Base : `POST /api/` — Auth : cookie `jwt` (HttpOnly, SameSite=Strict)

### 3.1 Lister tous les comptes

```
GET /api/admin/utilisateurs
Authorization: ADMIN uniquement
```

**Réponse 200 :**
```json
[
  {
    "id": 1,
    "login": "client@example.com",
    "role": "CLIENT",
    "enabled": true,
    "createdAt": "2025-03-15T10:30:00"
  },
  {
    "id": 2,
    "login": "bureau@example.com",
    "role": "BUREAU_ETUDE",
    "enabled": false,
    "createdAt": "2025-04-01T08:00:00"
  }
]
```

---

### 3.2 Détail d'un compte

```
GET /api/admin/utilisateurs/{id}
```

**Réponse 200 :** même structure qu'un élément de la liste.
**Réponse 404 :** compte introuvable.

---

### 3.3 Créer un compte (tous rôles)

```
POST /api/admin/utilisateurs
Content-Type: application/json
```

**Corps :**
```json
{
  "login": "nouvel-admin@example.com",
  "motDePasse": "MotDePasse123",
  "role": "ADMIN"           // CLIENT | BUREAU_ETUDE | ADMIN
}
```

**Réponse 201 :** `UtilisateurDTO` du compte créé.
**Réponse 400 :** validation (email invalide, mot de passe manquant, rôle nul).
**Réponse 409 :** login déjà utilisé (contrainte unicité BDD).

---

### 3.4 Activer un compte

```
PATCH /api/admin/utilisateurs/{id}/activer
```

**Réponse 204 :** succès (no body).
**Réponse 404 :** compte introuvable.

---

### 3.5 Désactiver un compte

```
PATCH /api/admin/utilisateurs/{id}/desactiver
```

**Réponse 204 :** succès (no body).
**Réponse 404 :** compte introuvable.

> ⚠️ Un compte désactivé sera rejeté à la prochaine tentative de login
> avec une erreur `401`. Les tokens JWT déjà émis restent valides jusqu'à expiration (15 min).
> Si un blocage immédiat est nécessaire, envisager une blacklist de tokens (évolution future).

---

### 3.6 Réinitialiser le mot de passe

```
PATCH /api/admin/utilisateurs/{id}/password
Content-Type: application/json
```

**Corps :**
```json
{
  "nouveauMotDePasse": "NouveauSecret8"   // min. 8 caractères
}
```

**Réponse 204 :** succès (no body).
**Réponse 400 :** mot de passe vide ou trop court (< 8 caractères).
**Réponse 404 :** compte introuvable.

---

## 4. Plan d'implémentation frontend

### 4.1 Prérequis et architecture

- La réponse du login (`AuthResponseDTO`) expose déjà le champ `role`.
- Stocker le rôle dans le **store global** (Pinia/Redux/Context selon le framework).
- L'accès à la zone admin doit être conditionné **côté frontend** par `role === 'ADMIN'`
  (jamais seul — le backend reste la source de vérité).

**Structure de fichiers suggérée :**

```
src/
  pages/
    admin/
      AdminLayout.vue          ← layout avec sidebar admin
      UtilisateursPage.vue     ← liste paginée de tous les comptes
      UtilisateurDetailPage.vue ← détail + actions (activer/désactiver/reset)
      CreerUtilisateurPage.vue  ← formulaire de création
  services/
    adminService.ts            ← appels API admin
  components/
    admin/
      UtilisateurTable.vue     ← tableau avec tri/filtre/recherche
      UtilisateurStatusBadge.vue ← badge "Actif" / "Désactivé"
      ResetPasswordModal.vue   ← modal de reset mot de passe
      ConfirmDesactiverModal.vue ← modal de confirmation désactivation
  router/
    adminRoutes.ts             ← routes protégées par le rôle ADMIN
```

---

### 4.2 Garde de route

```typescript
// router/adminRoutes.ts
const adminRoutes = [
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAdmin: true },
    children: [
      { path: 'utilisateurs',         component: UtilisateursPage },
      { path: 'utilisateurs/:id',     component: UtilisateurDetailPage },
      { path: 'utilisateurs/nouveau', component: CreerUtilisateurPage },
    ],
  },
];

// Navigation guard global
router.beforeEach((to) => {
  if (to.meta.requiresAdmin && authStore.role !== 'ADMIN') {
    return { path: '/403' }; // ou redirection vers /dashboard
  }
});
```

---

### 4.3 Service API `adminService`

```typescript
// services/adminService.ts

const BASE = '/api/admin/utilisateurs';

export const adminService = {

  /** Liste tous les comptes */
  listerUtilisateurs(): Promise<Utilisateur[]> {
    return http.get(BASE);
  },

  /** Détail d'un compte */
  getUtilisateur(id: number): Promise<Utilisateur> {
    return http.get(`${BASE}/${id}`);
  },

  /** Créer un compte (tous rôles) */
  creerUtilisateur(payload: CreerUtilisateurPayload): Promise<Utilisateur> {
    return http.post(BASE, payload);
  },

  /** Activer un compte */
  activer(id: number): Promise<void> {
    return http.patch(`${BASE}/${id}/activer`);
  },

  /** Désactiver un compte */
  desactiver(id: number): Promise<void> {
    return http.patch(`${BASE}/${id}/desactiver`);
  },

  /** Réinitialiser le mot de passe */
  reinitialiserMotDePasse(id: number, nouveauMotDePasse: string): Promise<void> {
    return http.patch(`${BASE}/${id}/password`, { nouveauMotDePasse });
  },
};

// Types
export interface Utilisateur {
  id: number;
  login: string;
  role: 'CLIENT' | 'BUREAU_ETUDE' | 'ADMIN';
  enabled: boolean;
  createdAt: string; // ISO 8601
}

export interface CreerUtilisateurPayload {
  login: string;
  motDePasse: string;
  role: 'CLIENT' | 'BUREAU_ETUDE' | 'ADMIN';
}
```

---

### 4.4 Pages et composants à créer

#### `UtilisateursPage` — liste principale

**Fonctionnalités :**
- [ ] Tableau paginé (côté client, la liste n'a pas de pagination serveur)
- [ ] Colonne : Login, Rôle (badge coloré), Statut (Actif/Désactivé), Date de création
- [ ] Filtre par rôle (`CLIENT` / `BUREAU_ETUDE` / `ADMIN`)
- [ ] Recherche par email (filtrage local)
- [ ] Bouton **"Nouveau compte"** → `CreerUtilisateurPage`
- [ ] Actions par ligne : Voir / Activer / Désactiver / Reset MDP

**Codes couleur suggérés pour les rôles :**

| Rôle | Badge |
|---|---|
| `CLIENT` | Bleu |
| `BUREAU_ETUDE` | Violet |
| `ADMIN` | Rouge |

---

#### `UtilisateurDetailPage` — fiche d'un compte

**Informations affichées :**
- Login, Rôle, Statut, Date de création
- Profil associé : si `CLIENT` → lien vers le profil client ; si `BUREAU_ETUDE` → lien vers le profil bureau

**Actions disponibles :**
- **Activer** / **Désactiver** (toggle avec confirmation)
- **Réinitialiser le mot de passe** (ouvre `ResetPasswordModal`)
- **Retour** vers la liste

---

#### `CreerUtilisateurPage` — formulaire de création

**Champs du formulaire :**
| Champ | Type | Validation frontend |
|---|---|---|
| Login (email) | `<input type="email">` | Email valide, non vide |
| Mot de passe | `<input type="password">` | Min. 8 caractères |
| Confirmation MDP | `<input type="password">` | Identique au mot de passe |
| Rôle | `<select>` | Valeur requise parmi CLIENT / BUREAU_ETUDE / ADMIN |

**Comportement post-soumission :**
- Succès (201) → toast succès + redirection vers `UtilisateurDetailPage` du nouveau compte
- Erreur 409 → message inline "Cette adresse e-mail est déjà utilisée"
- Erreur 400 → afficher les messages de validation retournés par l'API

---

#### `ResetPasswordModal` — modal de réinitialisation

**Champs :**
- Nouveau mot de passe (min. 8 caractères)
- Confirmation du nouveau mot de passe

**Comportement :**
- Succès (204) → toast "Mot de passe réinitialisé" + fermeture modale
- Erreur 400 → message inline

---

#### `ConfirmDesactiverModal` — modal de confirmation

```
⚠️  Désactiver le compte de client@example.com ?

Ce compte ne pourra plus se connecter.
Les sessions actives expireront dans 15 minutes maximum (durée du JWT).

[Annuler]   [Désactiver]
```

---

### 4.5 Gestion des états et flux UX

**Flux création d'un compte admin :**
```
Admin clique "Nouveau compte"
  → CreerUtilisateurPage
  → Saisie login + mot de passe + rôle = ADMIN
  → POST /api/admin/utilisateurs
  → Réponse 201
  → Toast "Compte créé" + redirection UtilisateurDetailPage
```

**Flux désactivation :**
```
Admin clique "Désactiver" sur la ligne du tableau
  → ConfirmDesactiverModal
  → Admin confirme
  → PATCH /api/admin/utilisateurs/{id}/desactiver
  → Réponse 204
  → Mise à jour optimiste du badge "Désactivé" dans le tableau
  → Toast "Compte désactivé"
```

**Flux reset mot de passe :**
```
Admin clique "Réinitialiser MDP" sur la fiche
  → ResetPasswordModal (champs nouveau MDP + confirmation)
  → Admin saisit et valide
  → PATCH /api/admin/utilisateurs/{id}/password
  → Réponse 204
  → Toast "Mot de passe réinitialisé avec succès"
```

---

### 4.6 Gestion des erreurs

| Code HTTP | Cause | Message à afficher |
|---|---|---|
| `400` | Validation (email invalide, MDP trop court, rôle manquant) | Message retourné par l'API dans le champ `message` |
| `401` | Session expirée | Redirection vers `/login` (déjà géré par l'intercepteur global) |
| `403` | Non admin (accès refusé) | Redirection vers `/403` ou `/dashboard` |
| `404` | Compte introuvable | Toast d'erreur "Compte introuvable" |
| `409` | Login déjà utilisé | Message inline sur le champ email |
| `5xx` | Erreur serveur | Toast "Une erreur est survenue, veuillez réessayer" |

**Format de l'erreur API :**
```json
{
  "typeError": "FIELD_VALIDATION",
  "message": "Cette adresse e-mail est déjà utilisée"
}
```

---

### 4.7 Sécurité côté front

> Le frontend **ne remplace pas** le backend comme source de vérité.
> Toutes ces mesures sont complémentaires aux contrôles serveur.

- [ ] **Masquer** le menu admin dans la navbar si `role !== 'ADMIN'`
- [ ] **Garde de route** bloquante avant chaque navigation vers `/admin/**`
- [ ] **Ne jamais afficher** le mot de passe en clair dans l'interface
- [ ] **Champ mot de passe** : masquer par défaut, toggle "voir mot de passe" avec icône œil
- [ ] **Ne pas afficher** le rôle `ADMIN` dans les menus de sélection d'auto-inscription
  (le register public reste limité à `CLIENT` / `BUREAU_ETUDE`)
- [ ] **Confirmation explicite** avant toute désactivation de compte

---

## 5. Checklist de livraison

### Backend ✅ (déjà livré)

- [x] Champ `enabled` sur `utilisateur` (Flyway V4 + BO + Entity + Adapter)
- [x] `UserDetailsAdapter.isEnabled()` branché sur `UtilisateurBO.enabled`
- [x] `UtilisateurRepository.findAll()` et `findById()`
- [x] `AdminService` + `AdminServiceImpl` (lister, get, créer, activer, désactiver, reset MDP)
- [x] `AdminController` — 6 endpoints sécurisés `ADMIN`
- [x] `AdminServiceException` → handler 404 dans `ApiExceptionHandlerAdvice`
- [x] Fix bug sécurité `GET /bureauEtude/{id}` (ajout `@PreAuthorize("hasRole('ADMIN')")`)
- [x] Règle globale `/admin/**` dans `SecurityConfig`
- [x] TU à 100% sur les nouveaux chemins (35 tests ajoutés, 0 échec)

### Frontend 🔲 (à implémenter)

- [ ] Type `Utilisateur` + `CreerUtilisateurPayload` dans les modèles TypeScript
- [ ] `adminService.ts` — 6 méthodes calées sur les endpoints
- [ ] Route `/admin/**` avec garde `requiresAdmin`
- [ ] `AdminLayout` avec sidebar navigation admin
- [ ] `UtilisateursPage` — tableau filtrable/recherchable
- [ ] `UtilisateurStatusBadge` — composant badge Actif/Désactivé
- [ ] `UtilisateurDetailPage` — fiche détaillée + actions
- [ ] `CreerUtilisateurPage` — formulaire avec validation
- [ ] `ResetPasswordModal` — modal reset MDP
- [ ] `ConfirmDesactiverModal` — modal de confirmation
- [ ] Lien "Admin" dans la navbar (visible uniquement pour `role === 'ADMIN'`)
- [ ] Gestion erreurs 400/403/404/409 par composant
- [ ] Toast notifications (succès / erreur)
- [ ] Tests unitaires des composants et du service

