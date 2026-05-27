# Guide de déploiement Coolify — Staging & Production

## Vue d'ensemble

```
Branche Git         →  Environnement Coolify   →  Domaine
─────────────────────────────────────────────────────────────
develop             →  staging                 →  staging.geoconnect.fr
main                →  production              →  geoconnect.fr (ou app.geoconnect.fr)
```

---

## 1. Prérequis

- Un VPS avec **Coolify** installé (cf. [coolify.io/docs](https://coolify.io/docs))
- Un dépôt Git accessible depuis votre VPS (GitHub, GitLab, Gitea…)
- Deux sous-domaines DNS pointant vers votre VPS :
  - `staging.geoconnect.fr` → IP du VPS
  - `geoconnect.fr` (ou `app.geoconnect.fr`) → IP du VPS

---

## 2. Structure du Projet Coolify

Dans Coolify, créez **1 Projet** avec **2 Environnements** :

```
Projet : GeoConnect
  ├── Environnement : staging
  │     ├── Service : geoconnect-frontend   ← cette app
  │     └── Service : geoconnect-backend    ← votre API Spring Boot
  └── Environnement : production
        ├── Service : geoconnect-frontend   ← cette app
        └── Service : geoconnect-backend    ← votre API Spring Boot
```

---

## 3. Création des services Frontend

### 3.1 Service Staging

1. Dans Coolify → **New Resource** → **Application**
2. Sélectionner votre dépôt Git
3. **Branch** : `develop`
4. **Build Pack** : `Dockerfile`
5. **Dockerfile Path** : `./Dockerfile`
6. **Port** : `80`

#### Build Arguments (staging) :
| Nom             | Valeur                              |
|-----------------|-------------------------------------|
| `VITE_API_URL`  | `https://api-staging.geoconnect.fr` |
| `GEMINI_API_KEY`| `<votre clé staging>`               |
| `BUILD_MODE`    | `staging`                           |

#### Variables d'environnement Runtime (staging) :
| Nom            | Valeur                                    |
|----------------|-------------------------------------------|
| `BACKEND_URL`  | `http://geoconnect-backend-staging:8080`  |

> **Astuce** : En Coolify, si le backend est dans le même réseau Docker,
> utilisez son nom de service interne plutôt que son URL publique.

#### Domaine (staging) :
- `https://staging.geoconnect.fr`
- Activer **Let's Encrypt** (SSL automatique)

---

### 3.2 Service Production

Identique au staging, avec les différences suivantes :

- **Branch** : `main`

#### Build Arguments (production) :
| Nom             | Valeur                      |
|-----------------|-----------------------------|
| `VITE_API_URL`  | `https://api.geoconnect.fr` |
| `GEMINI_API_KEY`| `<votre clé production>`    |
| `BUILD_MODE`    | `production`                |

#### Variables d'environnement Runtime (production) :
| Nom            | Valeur                                |
|----------------|---------------------------------------|
| `BACKEND_URL`  | `http://geoconnect-backend:8080`      |

#### Domaine (production) :
- `https://geoconnect.fr` et/ou `https://app.geoconnect.fr`
- Activer **Let's Encrypt**

---

## 4. Auto-déploiement (Webhooks Git)

Dans Coolify, activez le **webhook** pour chaque service :

1. Aller dans **Settings** du service → **Webhooks**
2. Copier l'URL webhook fournie par Coolify
3. Dans GitHub/GitLab → **Settings** → **Webhooks** → Ajouter l'URL
4. Événement déclencheur : **push**

Résultat :
- `git push origin develop` → redéploiement automatique du **staging**
- `git push origin main` (ou merge PR) → redéploiement automatique de la **production**

---

## 5. Workflow Git recommandé

```bash
# Développement quotidien
git checkout develop
git pull origin develop
# ... vos modifications ...
git push origin develop        # → déploie automatiquement sur staging

# Mise en production
git checkout main
git merge develop              # ou via Pull Request
git push origin main           # → déploie automatiquement en production
git tag v1.x.y && git push --tags  # bonne pratique : tagger chaque release
```

---

## 6. Variables Vite par mode (optionnel, avancé)

Si vous avez des comportements différents entre staging et production
(feature flags, messages de debug, etc.), utilisez les fichiers `.env` de Vite :

```
.env                  ← partagé tous modes (valeurs non-secrètes)
.env.staging          ← staging uniquement  (NE PAS committer si contient des secrets)
.env.production       ← production          (NE PAS committer si contient des secrets)
.env.staging.example  ← template à committer ✓
.env.production.example ← template à committer ✓
```

Exemple de `.env.staging` (local uniquement, non commité) :
```env
VITE_SHOW_DEBUG_BANNER=true
VITE_ENV_LABEL=STAGING
```

Utilisation dans le code :
```ts
const isStaging = import.meta.env.MODE === 'staging';
const label = import.meta.env.VITE_ENV_LABEL ?? '';
```

---

## 7. Checklist avant premier déploiement

- [ ] DNS configurés (`staging.geoconnect.fr` et `geoconnect.fr` → IP VPS)
- [ ] Branche `develop` créée et pushée
- [ ] Service staging créé dans Coolify avec les bons build args
- [ ] Service production créé dans Coolify avec les bons build args
- [ ] Backend staging déployé et `BACKEND_URL` staging correcte
- [ ] Backend production déployé et `BACKEND_URL` production correcte
- [ ] SSL Let's Encrypt activé sur les deux services
- [ ] Webhooks Git configurés
- [ ] Test de la route `/api/...` en staging (vérifier le proxy Nginx)

---

## 8. En cas de problème

### Voir les logs d'un conteneur
Dans Coolify UI → Service → **Logs** tab

### Vérifier les variables injectées au runtime
```bash
# Depuis le terminal Coolify ou via SSH sur le VPS
docker exec geoconnect-frontend printenv | grep -E "BACKEND_URL"
```

### Vérifier la config Nginx générée
```bash
docker exec geoconnect-frontend cat /etc/nginx/conf.d/app.conf
```

### Re-builder sans cache
Dans Coolify → Service → **Deploy** → cocher **Force Rebuild**

