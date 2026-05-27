# ─────────────────────────────────────────────
# Étape 1 : Build du frontend avec Node.js
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copie des manifestes de dépendances en premier (meilleur cache Docker)
COPY package*.json ./

# Installation des dépendances (sans les devDependencies non nécessaires au build)
RUN npm ci

# Copie du reste du code source
COPY . .

# Variables d'environnement de build (surchargeables via --build-arg)
ARG VITE_API_URL=http://localhost:8080
# Mode de build Vite : "staging" | "production" (défaut: production)
ARG BUILD_MODE=production

ENV VITE_API_URL=$VITE_API_URL

# Build avec le mode Vite correspondant à l'environnement
RUN npm run build -- --mode $BUILD_MODE

# ─────────────────────────────────────────────
# Étape 2 : Serveur de production avec Nginx
# ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Suppression de la config Nginx par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Création du répertoire des templates Nginx
RUN mkdir -p /etc/nginx/templates

# Copie du template Nginx (sera traité par docker-entrypoint.sh au démarrage)
COPY nginx.conf /etc/nginx/templates/app.conf.template

# Copie des artefacts de build depuis l'étape précédente
COPY --from=builder /app/dist /usr/share/nginx/html

# Copie et préparation du script d'entrée
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# URL du backend Spring Boot (surchargeagle via -e ou docker-compose)
ENV BACKEND_URL=http://localhost:8080

# Nginx écoute sur le port 80
EXPOSE 80

# Lancement via le script d'entrée qui substitue BACKEND_URL dans la config Nginx
ENTRYPOINT ["/docker-entrypoint.sh"]


