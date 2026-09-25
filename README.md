# Mon Étude de Sol — Front-end

> Portail web de mise en relation entre **clients** (particuliers / maîtres d'ouvrage) et **bureaux d'études géotechniques**.  
> Développé en React 19 + TypeScript, il communique avec un backend Spring Boot via une API REST sécurisée.

---

## Qualité du code — SonarCloud

[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=navyDog_Front-geoconnectV2&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=navyDog_Front-geoconnectV2)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=navyDog_Front-geoconnectV2&metric=coverage)](https://sonarcloud.io/summary/new_code?id=navyDog_Front-geoconnectV2)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=navyDog_Front-geoconnectV2&metric=bugs)](https://sonarcloud.io/summary/new_code?id=navyDog_Front-geoconnectV2)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=navyDog_Front-geoconnectV2&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=navyDog_Front-geoconnectV2)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=navyDog_Front-geoconnectV2&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=navyDog_Front-geoconnectV2)

| Propriété | Valeur |
|-----------|--------|
| **Clé de projet** | `navyDog_Front-geoconnectV2` |
| **Organisation** | `navydog` |
| **Sources analysées** | `src/` |
| **Rapport de couverture** | `coverage/lcov.info` (généré par `npm run test:coverage`) |
| **Exclusions d'analyse** | `src/types/**`, `src/vite-env.d.ts`, `src/index.css` |
| **Exclusions de couverture** | `src/types/**`, `src/main.tsx`, `src/App.tsx`, `src/pages/**`, `src/components/**` |

### Lancer une analyse locale

```bash
# 1. Générer le rapport de couverture
npm run test:coverage

# 2. Lancer l'analyse SonarScanner (nécessite sonar-scanner installé)
sonar-scanner -Dsonar.token=<SONAR_TOKEN>
```

> Le token d'analyse peut être généré depuis [SonarCloud → Mon compte → Tokens de sécurité](https://sonarcloud.io/account/security).

---

## Sommaire

1. [Vue d'ensemble fonctionnelle](#1-vue-densemble-fonctionnelle)
2. [Rôles & parcours utilisateurs](#2-rôles--parcours-utilisateurs)
3. [Structure des pages & routing](#3-structure-des-pages--routing)
4. [Cycle de vie d'une étude](#4-cycle-de-vie-dune-étude)
5. [Système de notifications](#5-système-de-notifications)
6. [Gestion des documents](#6-gestion-des-documents)
7. [Architecture technique](#7-architecture-technique)
8. [Sécurité & authentification](#8-sécurité--authentification)
9. [Configuration & variables d'environnement](#9-configuration--variables-denvironnement)
10. [Installation & lancement](#10-installation--lancement)
11. [Scripts disponibles](#11-scripts-disponibles)
12. [Tests](#12-tests)
13. [Stack & dépendances](#13-stack--dépendances)
14. [Déploiement Docker](#14-déploiement-docker)

---

## 1. Vue d'ensemble fonctionnelle

L'application propose un **tunnel de mise en relation** pour les études géotechniques de sol :

1. Un **client** soumet une demande de devis en quelques étapes (sans compte préalable).
2. Les **bureaux d'études** inscrits reçoivent les demandes, formulent une offre et conduisent l'étude.
3. Le client accepte une offre, le dossier entre alors dans un **cycle de suivi en 6 étapes** jusqu'au paiement.

### Types de missions géotechniques supportées

| Code             | Libellé                   |
|------------------|---------------------------|
| `ASSAINISSEMENT` | Assainissement            |
| `G0`             | Mission G0                |
| `G1`             | G1 — Étude de site        |
| `G1_ES_PGC`      | G1 ES PGC                 |
| `G1_ELAN`        | G1 ÉLAN                   |
| `G2_AVP`         | G2 AVP — Avant-projet     |
| `G2_PRO`         | G2 PRO — Projet           |
| `G5`             | Mission G5                |

---

## 2. Rôles & parcours utilisateurs

### Rôle `CLIENT`

| Étape | Action |
|-------|--------|
| **Accueil** | Suit un tunnel en **3 étapes** (besoin → détails projet → coordonnées) qui crée simultanément le compte, le profil client et la première demande de devis. |
| **Dashboard** | Vue tabulée : onglet **Mes Demandes** (demandes sans proposition acceptée) + onglet **Études en cours** (KPIs : total / en cours / terminées). L'onglet actif est persisté dans l'URL (`?tab=`). |
| **Détail Demande** | Tableau des propositions reçues avec prix, bureau d'études et délai. Boutons **Accepter** / **Refuser** avec modale de confirmation. L'acceptation d'une offre refuse automatiquement toutes les autres. |
| **Détail Étude** | Stepper 6 étapes avec actions contextuelles : valider/refuser une date d'intervention, confirmer le paiement. Visualisation et téléchargement des documents attachés. |

### Rôle `BUREAU_ETUDE`

| Étape | Action |
|-------|--------|
| **Inscription** | Formulaire dédié (`/bureau-etudes/inscription`) : informations entreprise, adresse, identifiants. Le compte nécessite une validation admin. |
| **Dashboard** | Vue tabulée en **3 onglets** : *Missions Disponibles* (demandes ouvertes sans proposition du BE), *En attente* (mes offres EN_ATTENTE ou REFUSÉE reproposables), *Études en cours*. |
| **Détail Demande** | Fiche complète de la demande + formulaire d'offre (prix HT, délai rendu, délai intervention, PDF optionnel). Historique des offres précédemment refusées. Resoumettre possible si refusé et aucune offre acceptée. |
| **Détail Étude** | Stepper avec actions : proposer une date d'intervention, marquer l'intervention effectuée, uploader le rapport final (PDF) + indiquer la date de remise. |

---

## 3. Structure des pages & routing

```
/                               → Redirection selon rôle (si connecté) ou page d'accueil / tunnel
/login                          → Connexion (tous rôles)
/success                        → Page de confirmation post-tunnel client
/bureau-etudes/inscription      → Inscription bureau d'études (public)

/client/dashboard               → Dashboard client
/client/demande/new             → Nouvelle demande de devis
/client/demande/:id             → Détail demande + propositions reçues
/client/etude/:id               → Suivi d'une étude (stepper client)

/be/dashboard                   → Dashboard bureau d'études
/be/demande/:id                 → Détail demande + formulaire d'offre
/be/etude/:id                   → Gestion d'une étude (stepper BE)
```

Les routes `/client/*` et `/be/*` sont protégées par `ProtectedRoute` qui vérifie le rôle de l'utilisateur. Toute URL inconnue redirige vers `/`.

---

## 4. Cycle de vie d'une étude

Une étude est créée automatiquement par le backend lorsqu'un client accepte une proposition de devis. Elle progresse à travers **6 états** :

```
DEVIS_VALIDE
    ↓ (BE propose une date)
DATE_INTERVENTION_PROPOSEE
    ↓ (Client valide) ou ↺ (Client refuse → BE repropose)
DATE_INTERVENTION_FIXEE
    ↓ (BE marque intervention effectuée)
INTERVENTION_EFFECTUEE
    ↓ (BE uploade le rapport)
RAPPORT_TERMINE
    ↓ (Client confirme le paiement)
PAIEMENT_EFFECTUE  ← dossier clôturé
```

### Actions requises par état

| État                          | Action CLIENT                        | Action BE                                |
|-------------------------------|--------------------------------------|------------------------------------------|
| `DEVIS_VALIDE`                | —                                    | Proposer une date d'intervention         |
| `DATE_INTERVENTION_PROPOSEE`  | Valider ou refuser la date           | (en attente) — peut reproposer une date  |
| `DATE_INTERVENTION_FIXEE`     | —                                    | Marquer l'intervention effectuée         |
| `INTERVENTION_EFFECTUEE`      | —                                    | Uploader le rapport + date de remise     |
| `RAPPORT_TERMINE`             | Confirmer le paiement                | —                                        |
| `PAIEMENT_EFFECTUE`           | —                                    | —                                        |

Un **badge orange "action requise"** apparaît dans le dashboard et la page de détail lorsqu'une action est attendue de l'utilisateur connecté.

---

## 5. Système de notifications

- **Badge** : polling toutes les **30 secondes** via `GET /api/notifications/non-lues/count`. S'arrête automatiquement si l'utilisateur se déconnecte.
- **Liste** : chargée **à la demande** au clic sur la cloche (panneau coulissant).
- **Marquage comme lu** : mise à jour **optimiste** (UI immédiate), resynchronisation du badge en cas d'erreur.
- **Types de notifications gérés** :
  - `NOUVELLE_DEMANDE_DEVIS`, `NOUVELLE_PROPOSITION_DEVIS`
  - `PROPOSITION_ACCEPTEE`
  - `DATE_INTERVENTION_PROPOSEE`, `DATE_INTERVENTION_VALIDEE`, `DATE_INTERVENTION_REFUSEE`
  - `RAPPORT_DISPONIBLE`
  - `PAIEMENT_CONFIRME`

---

## 6. Gestion des documents

Les documents sont gérés via l'API `/api/documents`. Chaque étude peut porter plusieurs pièces jointes :

| Document                | Qui l'attache    | Quand                         |
|-------------------------|------------------|-------------------------------|
| Docs de demande         | Client           | Lors de la soumission         |
| Devis PDF (proposition) | Bureau d'études  | Lors de la soumission d'offre |
| Devis signé             | Bureau d'études  | Après acceptation             |
| Rapport final           | Bureau d'études  | Fin d'intervention            |

### Visualisation en onglet navigateur

Pour ouvrir un PDF sans exposer le JWT dans l'URL :
1. Le token est posé dans un **cookie temporaire** (`pdf_token`, durée 30 s, `SameSite=Strict`).
2. `window.open()` déclenche la navigation — le navigateur envoie le cookie.
3. Le **proxy Vite** intercepte la requête (`proxyReq`) et injecte le header `Authorization: Bearer <token>`.
4. Le backend reçoit sa requête standard, sans modification.

---

## 7. Architecture technique

```
src/
├── api/              # Couche HTTP (axios) — un fichier par domaine
│   ├── index.ts      # Instance axios (baseURL /api, withCredentials, XSRF)
│   ├── auth.ts       # login, register, logout
│   ├── client.ts     # profil client
│   ├── bureauEtude.ts
│   ├── demandeDevis.ts
│   ├── propositionDevis.ts
│   ├── etude.ts      # transitions d'état + fetchEtudeDetails
│   ├── document.ts   # upload, download, openDocument
│   ├── notification.ts
│   └── referentiel.ts
│
├── components/
│   ├── etude/
│   │   ├── DocumentList.tsx       # Liste docs avec actions ouvrir/télécharger
│   │   ├── EtudeDetailLayout.tsx  # Layout partagé CLIENT + BE (stepper + infos)
│   │   ├── EtudeStatusBadge.tsx   # Badge coloré + helpers clientMustAct / beMustAct
│   │   ├── EtudeStepper.tsx       # Stepper 6 étapes avec actions contextuelles
│   │   └── InfoMsg.tsx
│   ├── layout/
│   │   ├── MainLayout.tsx         # Navbar, footer, NotificationBell, routing Outlet
│   │   └── ProtectedRoute.tsx     # Garde de route par rôle
│   └── ui/
│       ├── Button.tsx, Card.tsx, Input.tsx
│       ├── BackButton.tsx
│       ├── ConfirmModal.tsx       # Modale de confirmation générique
│       └── NotificationBell/Panel/Item.tsx
│
├── contexts/
│   ├── AuthContext.tsx     # SessionStorage, login, logout, isAuthenticated
│   └── ToastContext.tsx    # Toasts (success/error/info) auto-dismiss 5 s
│
├── hooks/
│   ├── useClientDashboardData.ts  # Chargement parallèle client + demandes + études
│   ├── useBEDashboardData.ts      # Chargement parallèle bureau + demandes + études
│   ├── useEtudeDetail.ts          # Détail étude + withAction (PATCH + refetch)
│   └── useNotifications.ts        # Polling badge + liste + optimistic updates
│
├── pages/
│   ├── Home.tsx           # Accueil public + tunnel 3 étapes
│   ├── Login.tsx
│   ├── Success.tsx
│   ├── client/            # Dashboard, RequestDetail, EtudeDetail, NewRequest
│   └── be/                # Dashboard, RequestDetail, EtudeDetail, BERegister
│
├── types/index.ts         # DTOs TypeScript (AdresseDTO, EtudeDetailDTO, NotificationDTO…)
├── constants/labels.ts    # ETAT_LABELS, STATUT_LABELS, TYPE_LABELS
└── lib/
    ├── formatters.ts      # formatDateShort, formatDateLong, buildEtudeDocuments
    └── utils.ts           # extractErrorMessage
```

### Patterns architecturaux notables

- **Hooks de données agrégées** : `useClientDashboardData` et `useBEDashboardData` orchestrent plusieurs appels parallèles (`Promise.all`) avec un flag `cancelled` pour éviter les `setState` après démontage du composant.
- **`withAction`** dans `useEtudeDetail` : exécute un PATCH puis re-fetche le détail complet — on ne fait pas confiance à la réponse partielle du PATCH pour mettre à jour l'UI.
- **Layout partagé** `EtudeDetailLayout` : les pages CLIENT et BE partagent la même mise en page (stepper, dates, documents) et n'injectent que leurs props spécifiques (`infoCard`, `renderActions`, `backTo`).
- **Onglets persistés dans l'URL** : les dashboards utilisent `useSearchParams` pour conserver l'onglet actif après navigation ou rechargement.
- **Refetch intelligent** : les hooks de dashboard exposent une fonction `refetch()` (incrément d'un tick) pour déclencher manuellement un rechargement sans remontage du composant.

---

## 8. Sécurité & authentification

| Mécanisme | Détail |
|-----------|--------|
| **JWT** | Stocké en cookie `HttpOnly` par le backend. Le front ne lit jamais le JWT directement. |
| **Session front** | `sessionStorage` stocke `{ token, userId, login, role }` après login. Effacé à la fermeture de l'onglet. |
| **XSRF** | Axios envoie automatiquement le cookie `XSRF-TOKEN` dans le header `X-XSRF-TOKEN`. |
| **Routes protégées** | `ProtectedRoute` redirige vers `/login` si non authentifié, vers `/` si le rôle est insuffisant. |
| **Logout** | Appel `POST /api/auth/logout` (supprime le cookie côté backend) + nettoyage sessionStorage. |
| **PDF viewer** | Cookie temporaire `pdf_token` (30 s) converti en header `Authorization` par le proxy, sans jamais exposer le JWT dans l'URL. |

---

## 9. Configuration & variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
# URL du backend Spring Boot (défaut : http://localhost:8080)
VITE_API_URL=http://localhost:8080

# Clé API Gemini (si intégration IA activée)
GEMINI_API_KEY=your_key_here
```

Le proxy Vite redirige tous les appels `/api/*` vers `VITE_API_URL`. Le préfixe `/api` est **conservé** car le backend Spring Boot est configuré avec `context-path: /api`.

---

## 10. Installation & lancement

### Prérequis

- **Node.js** ≥ 18
- **npm** ≥ 9 (ou pnpm / yarn)
- Backend Spring Boot opérationnel sur le port 8080 (ou configurer `VITE_API_URL`)

### Étapes

```bash
# Cloner le dépôt
git clone <url-du-repo>
cd Front-geoconnectV2

# Installer les dépendances
npm install

# Lancer en développement (port 3000, HMR activé)
npm run dev

# Build de production
npm run build

# Prévisualiser le build
npm run preview
```

L'application est accessible sur **http://localhost:3000**.

---

## 11. Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement (port 3000, `0.0.0.0`) |
| `npm run build` | Build de production dans `dist/` |
| `npm run preview` | Prévisualisation du build de production |
| `npm run clean` | Supprime le dossier `dist/` |
| `npm run lint` | Vérification TypeScript (`tsc --noEmit`) |
| `npm test` | Lancement des tests (Vitest, run unique) |
| `npm run test:watch` | Tests en mode watch |
| `npm run test:coverage` | Tests avec rapport de couverture (HTML + LCOV) |

---

## 12. Tests

Les tests utilisent **Vitest** + **@testing-library/react** avec environnement **jsdom**.

### Périmètre de couverture

| Inclus dans la couverture | Exclus |
|---------------------------|--------|
| `src/api/**` | `src/main.tsx` (point d'entrée) |
| `src/contexts/**` | `src/types/**` (types purs, aucune logique) |
| `src/hooks/**` | `src/App.tsx` (routing déclaratif) |
| `src/lib/**` | `src/pages/**` (couverts par tests E2E) |
| `src/constants/**` | `src/components/**` (couverts par tests visuels) |

Rapport de couverture disponible dans `coverage/lcov-report/index.html` après exécution de :

```bash
npm run test:coverage
```

---

## 13. Stack & dépendances

### Runtime

| Package | Version | Rôle |
|---------|---------|------|
| `react` | ^19.0.1 | Framework UI |
| `react-dom` | ^19.0.1 | Rendu DOM |
| `react-router-dom` | ^7.14.2 | Routing SPA |
| `axios` | ^1.16.0 | Client HTTP |
| `react-hook-form` | ^7.75.0 | Gestion des formulaires |
| `lucide-react` | ^0.546.0 | Icônes |
| `date-fns` | ^4.1.0 | Formatage des dates (locale `fr`) |
| `clsx` + `tailwind-merge` | — | Composition de classes CSS |
| `motion` | ^12.23.24 | Animations |
| `leaflet` + `react-leaflet` | — | Cartographie interactive |

### Outillage

| Package | Rôle |
|---------|------|
| `vite` ^6 | Bundler + serveur de développement |
| `@vitejs/plugin-react` | Support JSX / Fast Refresh |
| `@tailwindcss/vite` | Plugin Tailwind CSS v4 pour Vite |
| `tailwindcss` ^4 | Génération des styles utilitaires |
| `typescript` ~5.8 | Typage statique |
| `vitest` ^4 | Framework de tests |
| `@testing-library/react` | Tests composants React |
| `@vitest/coverage-v8` | Couverture de code |
| `jsdom` | Environnement DOM pour les tests |

---

## 14. Déploiement Docker

L'application se déploie via un **build multi-stage** : Node.js compile le frontend, puis Nginx Alpine sert les assets statiques et agit en proxy inverse vers le backend Spring Boot.

```
 ┌──────────────────────────────────────────────────────┐
 │  Conteneur Docker (port 80)                          │
 │                                                      │
 │   Navigateur → Nginx ──┬── /api/* ──► Backend :8080  │
 │                        └── /*    ──► index.html (SPA)│
 └──────────────────────────────────────────────────────┘
```

### Prérequis

- **Docker** ≥ 24
- **Docker Compose** ≥ 2.20 (inclus dans Docker Desktop)

### Démarrage rapide

```bash
# 1. Copier et adapter le fichier de variables d'environnement
cp .env.docker .env

# 2. Éditer .env avec vos valeurs (voir section Variables ci-dessous)
#    Au minimum : BACKEND_URL et VITE_API_URL

# 3. Construire l'image et démarrer le conteneur
docker compose --env-file .env up -d --build

# L'application est accessible sur http://localhost:3000
```

### Variables d'environnement

> ⚠️ **Deux variables distinctes** contrôlent l'URL du backend selon le moment où elles sont utilisées.

| Variable | Moment | Rôle |
|----------|--------|------|
| `VITE_API_URL` | **Build** (dans `npm run build`) | URL résolue par Vite et injectée dans le bundle JS. Doit être l'URL **publique** du backend accessible depuis le navigateur. |
| `BACKEND_URL` | **Runtime** (dans Nginx au démarrage) | URL utilisée par Nginx pour `proxy_pass /api`. Peut être une adresse réseau interne (nom de service Docker). |
| `FRONTEND_PORT` | Runtime | Port de la machine hôte exposé (défaut : `3000`). |
| `GEMINI_API_KEY` | Build | Clé API Gemini (optionnelle). |

**Exemple `.env` avec backend dans le même réseau Docker :**

```env
# URL publique vue par le navigateur (build-time)
VITE_API_URL=https://api.mon-domaine.fr

# Adresse interne du backend dans le réseau Docker (runtime)
BACKEND_URL=http://geoconnect-backend:8080

# Port exposé sur la machine hôte
FRONTEND_PORT=80
```

**Exemple `.env` pour développement local sans Docker backend :**

```env
VITE_API_URL=http://localhost:8080
BACKEND_URL=http://host.docker.internal:8080
FRONTEND_PORT=3000
```

> Sur Linux, remplacer `host.docker.internal` par l'adresse IP de l'hôte (ex: `172.17.0.1`).

### Commandes utiles

```bash
# Démarrer (sans rebuild si l'image existe déjà)
docker compose --env-file .env up -d

# Forcer un rebuild complet
docker compose --env-file .env up -d --build --force-recreate

# Suivre les logs en temps réel
docker compose logs -f frontend

# Arrêter et supprimer le conteneur
docker compose down

# Arrêter, supprimer le conteneur ET l'image
docker compose down --rmi local
```

### Build manuel (sans docker-compose)

```bash
# Construire l'image en passant les ARG de build
docker build \
  --build-arg VITE_API_URL=http://localhost:8080 \
  --build-arg GEMINI_API_KEY="" \
  -t geoconnect-frontend:latest .

# Lancer le conteneur
docker run -d \
  -p 3000:80 \
  -e BACKEND_URL=http://localhost:8080 \
  --name geoconnect-frontend \
  geoconnect-frontend:latest
```

### Fonctionnement du proxy Nginx en production

En développement, le proxy est géré par Vite (`vite.config.ts`). En production Docker, **Nginx remplace entièrement ce proxy** avec un comportement identique :

- Toutes les requêtes `/api/*` sont transmises vers `BACKEND_URL` (le préfixe `/api` est conservé, comme requis par le `context-path` Spring Boot).
- Si une requête ne porte pas de header `Authorization` mais contient un cookie `pdf_token`, Nginx reconstitue automatiquement le header `Authorization: Bearer <token>` — même logique que le `proxyReq` Vite pour l'ouverture des PDF via `window.open()`.
- Toutes les routes inconnues renvoient `index.html` pour le fonctionnement du routing React (SPA fallback).

### Connecter le frontend à un backend Docker existant

Si le backend tourne dans un compose séparé, connectez les deux sur le même réseau Docker :

```yaml
# Dans docker-compose.yml, décommenter la ligne :
networks:
  geoconnect-net:
    external: true   # ← réseau partagé avec le backend
```

```bash
# Créer le réseau partagé (une seule fois)
docker network create geoconnect-net

# Puis démarrer les deux stacks
docker compose --env-file .env up -d --build
```

La variable `BACKEND_URL` doit alors pointer vers le **nom du service backend** défini dans son propre `docker-compose.yml` (ex: `http://geoconnect-backend:8080`).

---

## Auteurs & licence

© 2026 Mon Étude de Sol SAS — v1.0.0  
Licence : Apache-2.0
