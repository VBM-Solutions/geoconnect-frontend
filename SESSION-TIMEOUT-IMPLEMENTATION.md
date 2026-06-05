# Session timeout - implementation frontend

## Objectif

Mettre en place une deconnexion automatique apres inactivite avec:

- un comportement UX propre (pre-warning + countdown)
- une logique centralisee et testable
- une synchronisation inter-onglets
- une integration propre avec l'architecture existante

## Ce qui a ete implemente

### 1) Politique de session centralisee

Fichier: `src/lib/sessionPolicy.ts`

- Creation d'une politique de session unique:
  - `idleTimeoutMs`
  - `warningDurationMs`
  - `absoluteTimeoutMs`
  - `activityThrottleMs`
- Lecture des variables d'environnement (avec fallback par defaut).
- Normalisation defensive de la fenetre de warning.
- Fonction pure `evaluateSessionState(...)` pour calculer:
  - la date d'expiration effective
  - la raison (`idle` ou `absolute`)
  - le temps restant
  - l'etat warning / expire

### 2) Infrastructure de stockage session

Fichier: `src/lib/authSessionStorage.ts`

- Centralisation des cles de session et helpers:
  - utilisateur en `sessionStorage`
  - metadonnees temporelles en `localStorage` (partage inter-onglets)
- Fonctions de lecture/ecriture/clear dediees.
- Publication et parsing des evenements de sync inter-onglets:
  - `activity`
  - `logout`

### 3) Hook applicatif de timeout

Fichier: `src/hooks/useSessionTimeout.ts`

- Hook unique qui orchestre:
  - detection d'activite utilisateur
  - evaluation periodique de l'expiration
  - affichage warning + countdown
  - deconnexion automatique
  - propagation inter-onglets (storage event)
- Gestion des cas edge:
  - utilisateur non authentifie
  - reprise de focus (`visibilitychange`)
  - deconnexion deja declenchee (idempotence)

### 4) Composant de garde global

Fichier: `src/components/layout/SessionTimeoutGuard.tsx`

- Affiche une modale d'avertissement dans les 2 dernieres minutes (par defaut).
- Propose:
  - `Rester connecte` (rearme l'activite)
  - `Se deconnecter` (logout immediat)
- Utilise `ConfirmModal` existante pour limiter la duplication UI.

### 5) Integration application

Fichier: `src/App.tsx`

- Montage global de `SessionTimeoutGuard` au meme niveau que `ApiInterceptorSetup`.
- Couverture de toutes les routes protegees sans duplication.

### 6) Cohesion AuthContext

Fichier: `src/contexts/AuthContext.tsx`

- Refactor du storage utilisateur via `authSessionStorage`.
- Initialisation des metadonnees session a la restauration de session.
- Seed explicite des horodatages au login.
- Nettoyage complet (session + metadonnees) au logout.

## Variables d'environnement supportees

- `VITE_IDLE_TIMEOUT_MS` (defaut: 20 min)
- `VITE_SESSION_WARNING_MS` (defaut: 2 min)
- `VITE_ABSOLUTE_SESSION_TIMEOUT_MS` (defaut: 10 h)
- `VITE_ACTIVITY_THROTTLE_MS` (defaut: 1000 ms)

## Tests ajoutes / modifies

- `src/lib/sessionPolicy.test.ts`
- `src/lib/authSessionStorage.test.ts`
- `src/hooks/useSessionTimeout.test.ts`
- `src/contexts/AuthContext.test.tsx` (etendu)

Commandes executees localement:

```powershell
npm run test -- src/lib/sessionPolicy.test.ts src/lib/authSessionStorage.test.ts src/hooks/useSessionTimeout.test.ts src/contexts/AuthContext.test.tsx
```

Resultat: 24/24 tests OK sur ce perimetre.

---

## Ce qu'il faut faire cote backend pour rester coherent (indispensable)

Le frontend ne doit jamais etre la source de verite securite. Le backend doit imposer les memes regles.

### A) Enforcer la session cote serveur

- Mettre un idle timeout serveur (invalidation session/token si inactif).
- Mettre un absolute timeout serveur (duree de vie max session).
- Retourner `401` (ou `419` selon convention API) quand la session est expiree.

### B) Strategie token robuste

- Access token court (ex: 5-15 min).
- Refresh token rotatif, revocable, trace (jti / rotation).
- Rejet explicite des refresh tokens reutilises (replay detection).

### C) Endpoint de refresh / extension

- Fournir un endpoint d'extension de session (si retenu par la politique securite).
- Si extension refusee (session absolue atteinte), renvoyer un code clair.
- Optionnel mais recommande: exposer l'expiration restante (`expiresAt` / `remainingMs`) pour aligner parfaitement le countdown frontend.

### D) Cookies et attributs de securite

- JWT/refresh en cookies `HttpOnly`, `Secure`, `SameSite` adaptes.
- Rotation et invalidation au logout.
- Nettoyage serveur fiable sur logout (blacklist/whitelist/session store selon architecture).

### E) Audit et observabilite

- Logger les expirations:
  - `AUTO_LOGOUT_IDLE`
  - `AUTO_LOGOUT_ABSOLUTE`
- Exposer des metriques (compteurs d'expiration, erreurs refresh, reuse detecte).

### F) Contrat API documente

- Documenter les codes de statut et payload d'erreur pour session expiree.
- Garantir la stabilite du contrat pour que le frontend gere les cas sans heuristique fragile.

---

## Recommandation finale de coherence

- Le frontend gere l'UX (warning + countdown + navigation).
- Le backend impose la securite (expiration effective + revocation).
- Les deux couches partagent une politique explicite et versionnee (timeouts, codes erreur, refresh behavior).

