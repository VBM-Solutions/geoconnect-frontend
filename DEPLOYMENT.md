# Guide de déploiement — Staging & Production

## Vue d'ensemble du flux

```
push develop ──► CI (tests/sonar) ──► Build image Docker
                                             │
                                             ▼
                                  ghcr.io/.../geoconnect-frontend:staging
                                             │
                                             ▼
                                  Coolify pull & redémarre  ──► staging.mon-etude-de-sol.fr

push main ───► CI (tests/sonar) ──► Build image Docker
                                             │
                                             ▼
                                  ghcr.io/.../geoconnect-frontend:production
                                             │
                                             ▼
                                  Approbation manuelle GitHub
                                             │
                                             ▼
                                  Coolify pull & redémarre  ──► mon-etude-de-sol.fr
```

> **Principe clé** : GitHub Actions construit l'image une seule fois et la pousse sur
> le registre. Coolify ne fait que la télécharger et la démarrer — il ne build plus rien.

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

---

### 2.2 Ajouter les Variables (non-sensibles)

Dans chaque environment, ajoutez la variable `VITE_API_URL` :

**Settings → Environments → staging → Add variable**

| Variable       | Valeur                                      |
|----------------|---------------------------------------------|
| `VITE_API_URL` | `https://api-staging.mon-etude-de-sol.fr`   |

**Settings → Environments → production → Add variable**

| Variable       | Valeur                              |
|----------------|-------------------------------------|
| `VITE_API_URL` | `https://api.mon-etude-de-sol.fr`   |

---

### 2.3 Ajouter les Secrets Coolify

Les webhooks Coolify seront créés à l'étape 4. Revenez ici pour les remplir.

**Settings → Environments → staging → Add secret**

| Secret                    | Valeur                          |
|---------------------------|---------------------------------|
| `COOLIFY_WEBHOOK_STAGING` | *(URL copiée depuis Coolify)*   |

**Settings → Environments → production → Add secret**

| Secret                      | Valeur                          |
|-----------------------------|---------------------------------|
| `COOLIFY_WEBHOOK_PRODUCTION` | *(URL copiée depuis Coolify)*  |

---

## Étape 3 — Créer un Personal Access Token GitHub (pour Coolify)

Coolify a besoin d'un token pour télécharger l'image depuis `ghcr.io`.

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
2. **Repository access** : sélectionnez votre repo `geoconnect-frontend`
3. **Permissions** → *Packages* → **Read-only**
4. Cliquez **Generate token**
5. **Copiez le token** — vous en aurez besoin à l'étape 4.

---

## Étape 4 — Coolify : Configuration initiale

### 4.1 Ajouter le registre ghcr.io

Dans Coolify → **Settings → Container Registries → Add**

| Champ            | Valeur                            |
|------------------|-----------------------------------|
| **Name**         | `GitHub Container Registry`       |
| **Registry URL** | `ghcr.io`                         |
| **Username**     | votre username GitHub             |
| **Password**     | le PAT créé à l'étape 3           |

Cliquez **Save**.

---

### 4.2 Créer le Projet et les Environnements

Coolify → **Projects → New Project**
- **Name** : `GeoConnect`

Dans le projet, créez deux environnements :
- `staging`
- `production`

---

### 4.3 Créer le service Frontend — Staging (Docker Compose)

Dans l'environnement `staging` → **New Resource → Docker Compose**

**General :**
- **Name** : `geoconnect-frontend-staging`
- **Domains** : `https://staging.mon-etude-de-sol.fr`

**Compose File :**

```yaml
services:
  frontend:
    image: ghcr.io/<votre-github-username>/geoconnect-frontend:staging
    restart: unless-stopped
    environment:
      BACKEND_URL: http://geoconnect-backend-staging:8080
    ports:
      - "80:80"
```

> Important : utilisez bien `image:` (pas `build:`) pour que Coolify fasse uniquement un pull de l'image GHCR.

**Onglet Webhooks :**
1. Activez le webhook de déploiement
2. **Copiez l'URL** → retournez dans GitHub et collez-la dans le secret `COOLIFY_WEBHOOK_STAGING` (étape 2.3)

---

### 4.4 Créer le service Frontend — Production (Docker Compose)

Dans l'environnement `production` → **New Resource → Docker Compose**

**General :**
- **Name** : `geoconnect-frontend`
- **Domains** : `https://mon-etude-de-sol.fr`

**Compose File :**

```yaml
services:
  frontend:
    image: ghcr.io/<votre-github-username>/geoconnect-frontend:production
    restart: unless-stopped
    environment:
      BACKEND_URL: http://geoconnect-backend:8080
    ports:
      - "80:80"
```

> Important : utilisez bien `image:` (pas `build:`) pour que Coolify fasse uniquement un pull de l'image GHCR.

**Onglet Webhooks :**
1. Activez le webhook de déploiement
2. **Copiez l'URL** → retournez dans GitHub et collez-la dans le secret `COOLIFY_WEBHOOK_PRODUCTION` (étape 2.3)

---

## Étape 5 — Premier déploiement

Une fois tout configuré, déclenchez le premier build :

```bash
# Déployer sur staging
git checkout develop
git push origin develop
# → GitHub Actions lance CI + build image + push ghcr.io + notifie Coolify

# Déployer en production (après validation sur staging)
git checkout main
git merge develop
git push origin main
# → GitHub Actions lance CI + build image + push ghcr.io
# → Vous recevez une notification GitHub pour approuver
# → Après approbation : Coolify redémarre avec la nouvelle image
```

---

## Workflow Git quotidien

```bash
# Feature
git checkout -b feature/ma-fonctionnalite
# ... développement ...
git push origin feature/ma-fonctionnalite
# → Ouvrir une PR vers develop (les tests CI tournent automatiquement)

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
- [ ] Environment `staging` créé
- [ ] Environment `production` créé avec reviewer obligatoire
- [ ] Variable `VITE_API_URL` ajoutée dans chaque environment
- [ ] PAT GitHub créé avec scope `read:packages`
- [ ] Branche `develop` créée et pushée

**Coolify**
- [ ] Registre `ghcr.io` configuré avec le PAT
- [ ] Projet `GeoConnect` créé avec 2 environnements
- [ ] Service frontend staging configuré en Docker Compose (image tag: `staging`, port: `80`)
- [ ] Service frontend production configuré en Docker Compose (image tag: `production`, port: `80`)
- [ ] `BACKEND_URL` renseignée dans chaque service
- [ ] SSL Let's Encrypt activé sur les deux services
- [ ] Webhooks copiés dans les secrets GitHub

**Test final**
- [ ] Premier `push origin develop` → vérifier que le pipeline GitHub passe ✅
- [ ] Image visible dans GitHub → **Packages** du repo
- [ ] Frontend staging accessible sur `https://staging.mon-etude-de-sol.fr`
- [ ] Route `/api/...` fonctionne (proxy Nginx → backend)

---

## Dépannage

### Voir les logs d'un conteneur
Coolify UI → Service → onglet **Logs**

### Vérifier la variable BACKEND_URL injectée
```bash
# SSH sur le VPS ou terminal Coolify
docker exec <container_name> printenv BACKEND_URL
```

### Vérifier la config Nginx générée
```bash
docker exec <container_name> cat /etc/nginx/conf.d/app.conf
```

### Forcer le re-pull de l'image sans cache
Coolify → Service → **Deploy** → activer **Force Rebuild**

### L'image n'est pas trouvée (401 Unauthorized)
Vérifiez que le PAT GitHub a bien le scope `read:packages` et qu'il n'a pas expiré.
Coolify → **Settings → Container Registries** → modifiez le registre ghcr.io.
