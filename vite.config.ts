import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import {defineConfig, loadEnv} from 'vite';
/// <reference types="vitest" />

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        // Toutes les requêtes /api/* sont transmises au backend Spring Boot.
        // Le préfixe /api est conservé car le backend a un context-path: /api.
        //
        // Le hook proxyReq convertit le cookie temporaire pdf_token en header
        // Authorization: Bearer, ce qui permet à window.open() d'accéder aux
        // endpoints sécurisés sans exposer le JWT dans l'URL.
        // Toutes les requêtes /api/* sont transmises au backend Spring Boot.
        // Le cookie HttpOnly jwt est transmis automatiquement par le navigateur —
        // aucun hook proxyReq nécessaire depuis la migration vers les cookies.
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          // Fichiers d'infrastructure / entrée
          'src/main.tsx',
          'src/vite-env.d.ts',
          // Types purs TypeScript — aucune logique exécutable
          'src/types/**',
          // Routing — configuration déclarative, pas de logique métier
          'src/App.tsx',
          // Pages — composants UI de haut niveau, couverts par tests E2E
          'src/pages/**',
          // Composants présentationnels — couverts par tests E2E/visuels
          'src/components/**',
        ],
      },
    },
  };
});
