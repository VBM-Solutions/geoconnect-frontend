# Déploiement SPA — Coolify / Nginx

## Problème corrigé

Lors d’un refresh (F5) sur une route protégée (ex. `/client/demande/123`), le serveur web tentait de résoudre un dossier physique et renvoyait **403** au lieu de servir `index.html`. Cela déclenchait le message *« droits insuffisants »*.

## Root cause

- React Router gère le routage côté client.
- Sans configuration SPA fallback, Nginx (ou le reverse-proxy Coolify) renvoie un 403/404 pour toute URL autre que `/`.

## Fix Nginx

Ajouter dans la configuration du serveur (block `location /`) :

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Cela garantit que **toutes** les routes tombent sur le bundle React, qui restaure ensuite la session depuis `sessionStorage` et affiche la bonne page.

## Fix Coolify (Docker / Static)

Si le déploiement Coolify utilise une image Nginx custom ou un service **Static Site**, il faut soit :

1. **Monter un `nginx.conf` custom** via un volume ou un Dockerfile :

   ```dockerfile
   FROM nginx:alpine
   COPY dist /usr/share/nginx/html
   COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
   EXPOSE 80
   ```

2. **Ou** configurer le reverse-proxy Coolify pour ajouter une règle de fallback vers `index.html`.

## Validation

1. Se connecter sur `/login`.
2. Naviguer vers `/client/dashboard`.
3. Appuyer sur **F5** → la page doit se recharger sans message d’erreur.
4. La session (cookie JWT HttpOnly + user en `sessionStorage`) doit être conservée.

## Fichiers modifiés / créés

- `deploy/nginx.conf` — configuration Nginx avec SPA fallback
- `docs/SPA_DEPLOY.md` — documentation déploiement
- `src/contexts/AuthContext.tsx` — robustification de la restauration de session
