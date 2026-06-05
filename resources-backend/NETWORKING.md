# 🌐 Networking — Geoconnect sur Coolify

Ce document explique l'architecture réseau Docker utilisée pour les environnements déployés sur Coolify (staging, production), et comment le frontend doit s'y connecter.

---

## Architecture des réseaux Docker

Deux réseaux Docker sont en jeu :

| Réseau | Type | Rôle |
|---|---|---|
| `geoconnect-staging` | interne (bridge) | Communication privée entre les composants de la stack backend |
| `coolify` | externe (géré par Coolify) | Réseau partagé entre toutes les applications du serveur Coolify |

```
┌──────────────────────────────────────────────────────────────┐
│                   Réseau Docker « coolify »                  │
│       (partagé par toutes les apps déployées sur Coolify)    │
│                                                              │
│      [frontend]  ──────────►  [geoconnect-staging-backend]   │
│                                                              │
└────────────────────────────┬─────────────────────────────────┘
                             │ aussi connecté à :
              ┌──────────────▼──────────────────────┐
              │    Réseau « geoconnect-staging »     │
              │    (interne à la stack backend)      │
              │                                      │
              │  [backend] ──► [postgres:5432]       │
              │  [backend] ──► [minio:9000]          │
              │  [backend] ──► [mailpit:1025]        │
              └──────────────────────────────────────┘
```

### Règles d'isolation

- `postgres`, `minio` et `mailpit` sont **uniquement** sur le réseau interne `geoconnect-staging`  
  → Jamais accessibles depuis le frontend ou l'extérieur ✅

- `backend` est connecté aux **deux réseaux**  
  → Peut joindre la base de données, MinIO et Mailpit en interne  
  → Peut être joint par le frontend via le réseau `coolify` ✅

---

## Comment le frontend appelle le backend

### Deux contextes d'appel à distinguer

| Contexte | Qui fait l'appel | URL à utiliser |
|---|---|---|
| **Navigateur** (client-side) | Le navigateur de l'utilisateur | URL publique HTTPS |
| **Serveur** (SSR / proxy) | Le conteneur frontend lui-même | URL interne Docker |

---

### URL interne (appels serveur → serveur)

Depuis le conteneur frontend déployé sur Coolify, le backend est joignable via son `container_name` sur le réseau `coolify` :

```
http://geoconnect-staging-backend:8080
```

> Le `container_name` (`geoconnect-staging-backend`) fait office de hostname DNS sur le réseau `coolify`. Aucune configuration supplémentaire n'est nécessaire.

---

### URL publique (appels depuis le navigateur)

Les appels initiés par le navigateur de l'utilisateur ne passent pas par le réseau Docker. Ils utilisent le domaine public configuré dans Coolify, ex :

```
https://api.staging.mon-etude-de-sol.fr
```

---

## Configuration côté frontend (variables d'environnement)

Selon votre framework frontend, adaptez les variables d'environnement dans Coolify :

### Next.js (App Router / SSR)

```env
# Appels depuis le serveur Next.js (SSR, Server Actions, Route Handlers)
BACKEND_INTERNAL_URL=http://geoconnect-staging-backend:8080

# Appels depuis le navigateur (client components)
NEXT_PUBLIC_BACKEND_URL=https://api.staging.mon-etude-de-sol.fr
```

Dans votre code :

```ts
// Appel serveur (Server Component, Route Handler...)
const res = await fetch(`${process.env.BACKEND_INTERNAL_URL}/api/...`)

// Appel client (Client Component)
const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/...`)
```

### Nuxt.js

```env
# Appels serveur (SSR)
NUXT_PRIVATE_BACKEND_URL=http://geoconnect-staging-backend:8080

# Appels client
NUXT_PUBLIC_BACKEND_URL=https://api.staging.mon-etude-de-sol.fr
```

### SPA pure (Vite, React sans SSR…)

Une SPA ne fait des appels que depuis le navigateur. Seule l'URL publique est nécessaire :

```env
VITE_BACKEND_URL=https://api.staging.mon-etude-de-sol.fr
```

---

## Rattacher le frontend au réseau `coolify` dans Coolify UI

Par défaut, Coolify connecte automatiquement ses applications au réseau `coolify` — **aucune configuration manuelle n'est nécessaire** pour le frontend déployé via l'interface Coolify.

Si votre frontend est un Docker Compose séparé, ajoutez simplement :

```yaml
services:
  frontend:
    # ...
    networks:
      - coolify

networks:
  coolify:
    external: true
```

---

## Résumé — Checklist côté frontend

- [ ] Le frontend est déployé sur le **même serveur Coolify** que le backend
- [ ] La variable d'environnement pour les appels **serveur** pointe sur `http://geoconnect-staging-backend:8080`
- [ ] La variable d'environnement pour les appels **navigateur** pointe sur l'URL publique HTTPS
- [ ] Le domaine public du backend est bien configuré dans Coolify (avec HTTPS)
- [ ] Si le frontend est un Docker Compose custom, le réseau `coolify` est déclaré en `external: true`

