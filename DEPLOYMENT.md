# Guide de déploiement — Staging & Production

## Vue d'ensemble du flux

```
push develop ──► Job: ci (tests/sonar) ──► Job: build-staging (image → GHCR :staging)
                                                       │
                                                       ▼
                                           Job: deploy-staging (webhook Coolify)
                                                       │
                                                       ▼
                                           staging.mon-etude-de-sol.fr ✅

push main ───► Job: ci (tests/sonar) ──► Job: build-production (image → GHCR :production)
                                                       │
                                                       ▼
                                           ⏸ Approbation manuelle GitHub (environment: production)
                                                       │
                                                       ▼
                                           Job: deploy-production (webhook Coolify)
                                                       │
                                                       ▼
                                           mon-etude-de-sol.fr ✅
```

> **Principe clé** : tout est dans `.github/workflows/ci.yml`.  
> GitHub Actions construit l'image **une seule fois** avec les bons `build-args`
> (`VITE_API_URL` et `BUILD_MODE`) et la pousse sur `ghcr.io`.  
> Coolify ne fait que **pull + run** via un Docker Compose référençant l'image GHCR.

---

## Étape 1 — DNS chez OVH

Allez sur **OVH → Domaine `mon-etude-de-sol.fr` → Zone DNS → Ajouter une entrée**.

Créez les enregistrements de type **A** suivants (laissez le TTL par défaut) :

| Sous-domaine      | Cible           |
|-------------------|-----------------|
| *(vide = racine)* | IP de votre VPS |
| `www`             | IP de votre VPS |
| `staging`         | IP de votre VPS |
| `api`             | IP de votre VPS |
| `api-staging`     | IP de votre VPS |

> L'IP de votre VPS se trouve dans Coolify → **Servers** → cliquez sur votre serveur.

Attendez la propagation DNS (5 à 30 min) avant de continuer.

---

## Étape 2 — GitHub : Environments, Variables et Secrets

### 2.1 Créer les Environments

Allez dans votre repo GitHub → **Settings → Environments → New environment**.

**Environment `staging`** :
- Pas de règle de protection
- Cliquez **Save protection rules**

**Environment `production`** :
- Cochez **Required reviewers**
- Ajoutez-vous vous-même comme reviewer
- Cliquez **Save protection rules**

> C'est le job `build-production` dans `ci.yml` qui porte `environment: production`.  
> L'approbation bloque donc le build **avant** le push de l'image sur GHCR.

---

### 2.2 Ajouter les Variables (non-sensibles)

Ces variables sont injectées comme `build-arg` dans le `Dockerfile` (`VITE_API_URL`).

**Settings → Environments → staging → Environment variables → Add variable**

| Variable       | Valeur                                    |
|----------------|-------------------------------------------|
| `VITE_API_URL` | `https://api-staging.mon-etude-de-sol.fr` |

**Settings → Environments → production → Environment variables → Add variable**

| Variable       | Valeur                              |
|----------------|-------------------------------------|
| `VITE_API_URL` | `https://api.mon-etude-de-sol.fr`   |

---

### 2.3 Ajouter les Secrets Coolify

Les webhooks Coolify seront créés à l'étape 4. Revenez ici pour les remplir.

**Settings → Environments → staging → Add secret**

| Secret                    | Valeur                        |
|---------------------------|-------------------------------|
| `COOLIFY_WEBHOOK_STAGING` | *(URL webhook copiée depuis Coolify)* |

**Settings → Environments → production → Add secret**

| Secret                       | Valeur                              |
|------------------------------|-------------------------------------|
| `COOLIFY_WEBHOOK_PRODUCTION` | *(URL webhook copiée depuis Coolify)* |

> Le secret `GITHUB_TOKEN` est automatiquement fourni par GitHub Actions (pas besoin de le créer).

---

## Étape 3 — Créer un Personal Access Token GitHub (pour Coolify)

Coolify a besoin d'un PAT pour **télécharger** l'image depuis `ghcr.io`  
(GitHub Actions utilise `GITHUB_TOKEN` intégré pour le push, pas ce PAT).

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
2. **Repository access** : sélectionnez votre repo `geoconnect-frontend`
3. **Permissions** → *Packages* → **Read-only**
4. Cliquez **Generate token** et **copiez-le** — vous en aurez besoin à l'étape 4.

---

## Étape 4 — Coolify : Configuration initiale

### 4.1 Ajouter le registre ghcr.io

Dans Coolify → **Settings → Container Registries → Add**

| Champ            | Valeur                      |
|------------------|-----------------------------|
| **Name**         | `GitHub Container Registry` |
| **Registry URL** | `ghcr.io`                   |
| **Username**     | votre username GitHub        |
| **Password**     | le PAT créé à l'étape 3     |

Cliquez **Save**.

---

### 4.2 Créer le Projet et les Environnements

Coolify → **Projects → New Project**
- **Name** : `GeoConnect`

Dans le projet, créez deux environnements :
- `staging`
- `production`

---

### 4.3 Créer le service Frontend — Staging

Dans l'environnement `staging` → **New Resource → Docker Compose**

Le fichier `docker-compose.staging.yml` (à la racine du repo) est prêt à l'emploi.  
Collez son contenu dans l'éditeur Coolify **après avoir remplacé `<votre-github-username>`** :

```yaml
services:
  frontend:
    image: ghcr.io/<votre-github-username>/geoconnect-frontend:staging
    container_name: geoconnect-frontend-staging
    restart: unless-stopped
    ports:
      - "80:80"
    environment:
      BACKEND_URL: ${BACKEND_URL:-http://geoconnect-backend-staging:8080}
    networks:
      - geoconnect-net
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:80/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

networks:
  geoconnect-net:
    name: geoconnect-net
    external: true
```

> ⚠️ Utilisez **uniquement `image:`** (jamais `build:`).  
> Coolify pull l'image pré-construite par GitHub Actions — il ne compile rien.  
> Le réseau `geoconnect-net` doit exister sur le VPS (créé par le service backend staging).

**Configurez ensuite dans Coolify :**
- **Domains** : `https://staging.mon-etude-de-sol.fr`
- **Ports Exposes** : `80`
- **Environment Variables** → `BACKEND_URL` = `http://geoconnect-backend-staging:8080`

**Onglet Webhooks :**
1. Activez le webhook de déploiement
2. **Copiez l'URL** → collez-la dans le secret GitHub `COOLIFY_WEBHOOK_STAGING` (étape 2.3)

---

### 4.4 Créer le service Frontend — Production

Dans l'environnement `production` → **New Resource → Docker Compose**

Le fichier `docker-compose.production.yml` (à la racine du repo) est prêt à l'emploi.  
Collez son contenu dans l'éditeur Coolify **après avoir remplacé `<votre-github-username>`** :

```yaml
services:
  frontend:
    image: ghcr.io/<votre-github-username>/geoconnect-frontend:production
    container_name: geoconnect-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    environment:
      BACKEND_URL: ${BACKEND_URL:-http://geoconnect-backend:8080}
    networks:
      - geoconnect-net
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:80/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

networks:
  geoconnect-net:
    name: geoconnect-net
    external: true
```

> ⚠️ Utilisez **uniquement `image:`** (jamais `build:`).  
> Coolify pull l'image pré-construite par GitHub Actions — il ne compile rien.  
> Le réseau `geoconnect-net` doit exister sur le VPS (créé par le service backend production).

**Configurez ensuite dans Coolify :**
- **Domains** : `https://mon-etude-de-sol.fr`
- **Ports Exposes** : `80`
- **Environment Variables** → `BACKEND_URL` = `http://geoconnect-backend:8080`

**Onglet Webhooks :**
1. Activez le webhook de déploiement
2. **Copiez l'URL** → collez-la dans le secret GitHub `COOLIFY_WEBHOOK_PRODUCTION` (étape 2.3)

---

## Étape 5 — Comprendre le pipeline `ci.yml`

Le fichier `.github/workflows/ci.yml` contient **4 jobs** :

| Job               | Branche    | Rôle                                                                  |
|-------------------|------------|-----------------------------------------------------------------------|
| `ci`              | toutes     | Install, build Vite, tests avec coverage, analyse SonarCloud          |
| `build-staging`   | `develop`  | Build image Docker (`BUILD_MODE=staging`) + push GHCR `:staging`      |
| `deploy-staging`  | `develop`  | Appel webhook Coolify → redémarrage automatique staging               |
| `build-production`| `main`     | ⏸ Approbation manuelle → build image (`BUILD_MODE=production`) + push GHCR `:production` |
| `deploy-production`| `main`    | Appel webhook Coolify → redémarrage production                        |

### Variables injectées au build Docker

Le `Dockerfile` attend deux `build-args` :

| ARG            | Valeur (staging)                          | Valeur (production)              |
|----------------|-------------------------------------------|----------------------------------|
| `VITE_API_URL` | `https://api-staging.mon-etude-de-sol.fr` | `https://api.mon-etude-de-sol.fr`|
| `BUILD_MODE`   | `staging`                                 | `production`                     |

`VITE_API_URL` est lue depuis la variable d'environment GitHub (étape 2.2).  
`BUILD_MODE` est codé en dur dans le `ci.yml` selon la branche.

---

## Étape 6 — Rendre l'image GHCR publique (optionnel)

Pour éviter que Coolify ait besoin du PAT (étape 3) :

GitHub → votre profil → **Packages** → `geoconnect-frontend` → **Package settings → Change visibility → Public**

---

## Étape 7 — Premier déploiement

```bash
# Déployer sur staging
git checkout develop
git push origin develop
# → ci → build-staging → deploy-staging → Coolify redémarre

# Déployer en production (après validation staging)
git checkout main
git merge develop
git push origin main
# → ci → approbation manuelle requise dans GitHub
# → build-production → deploy-production → Coolify redémarre
```

---

## Workflow Git quotidien

```bash
# Feature
git checkout -b feature/ma-fonctionnalite
# ... développement ...
git push origin feature/ma-fonctionnalite
# → Ouvrir une PR vers develop (le job ci tourne automatiquement)

# Merge vers staging
git checkout develop && git merge feature/ma-fonctionnalite
git push origin develop
# → Déploiement automatique staging ✅

# Mise en production (après validation sur staging)
git checkout main && git merge develop
git push origin main
git tag v1.x.y && git push --tags
# → Approbation requise → déploiement production ✅
```

---

## Checklist complète avant premier déploiement

**OVH / DNS**
- [ ] Enregistrements A créés pour la racine, `www`, `staging`, `api`, `api-staging`
- [ ] DNS propagé (vérifier sur [dnschecker.org](https://dnschecker.org))

**GitHub**
- [ ] Environment `staging` créé (sans protection)
- [ ] Environment `production` créé avec reviewer obligatoire
- [ ] Variable `VITE_API_URL` définie dans chaque environment
- [ ] PAT GitHub créé avec permission `Packages: Read-only`
- [ ] Branche `develop` créée et pushée
- [ ] Secret `SONAR_TOKEN` ajouté dans les secrets du repo (si SonarCloud activé)

**Coolify**
- [ ] Registre `ghcr.io` configuré avec le PAT
- [ ] Projet `GeoConnect` créé avec 2 environnements
- [ ] Service staging : Docker Compose avec `image: ...frontend:staging`, domaine configuré, port `80`
- [ ] Service production : Docker Compose avec `image: ...frontend:production`, domaine configuré, port `80`
- [ ] `BACKEND_URL` renseignée dans le Compose de chaque service
- [ ] SSL Let's Encrypt activé sur les deux services
- [ ] Secrets `COOLIFY_WEBHOOK_STAGING` et `COOLIFY_WEBHOOK_PRODUCTION` copiés dans GitHub

**Test final**
- [ ] `push origin develop` → les 3 jobs (`ci`, `build-staging`, `deploy-staging`) passent ✅
- [ ] Image visible dans GitHub → **Packages** du repo avec le tag `staging`
- [ ] Frontend staging accessible sur `https://staging.mon-etude-de-sol.fr`
- [ ] Route `/api/...` fonctionne (proxy Nginx → backend via `BACKEND_URL`)
- [ ] `push origin main` → approbation déclenchée dans GitHub ✅

---

## Dépannage

### Voir les logs d'un conteneur
Coolify UI → Service → onglet **Logs**

### Vérifier la variable BACKEND_URL injectée au runtime
```bash
# SSH sur le VPS ou via le terminal intégré Coolify
docker exec <nom-du-conteneur> printenv BACKEND_URL
```

### Vérifier la config Nginx générée
```bash
docker exec <nom-du-conteneur> cat /etc/nginx/conf.d/app.conf
```

### Forcer le re-pull de l'image sans cache
Coolify → Service → **Deploy** → activer **Force Rebuild**

### L'image n'est pas trouvée (401 Unauthorized)
Vérifiez que le PAT GitHub a bien la permission `Packages: Read-only` et qu'il n'a pas expiré.  
Coolify → **Settings → Container Registries** → modifiez le registre `ghcr.io`.

### Le job `build-production` est bloqué sans demande d'approbation
Vérifiez que l'environment `production` a bien **Required reviewers** configuré dans GitHub →  
**Settings → Environments → production**.

### `VITE_API_URL` incorrecte dans l'image buildée
La variable est lue depuis l'**environment variable** GitHub au moment du build (`vars.VITE_API_URL`).  
Vérifiez **Settings → Environments → staging/production → Variables**.  
Relancez ensuite un nouveau push pour reconstruire l'image avec la bonne valeur.
