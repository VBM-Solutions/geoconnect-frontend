import axios from 'axios';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
let csrfInitialization: Promise<void> | null = null;

function hasCsrfCookie(): boolean {
  return typeof document !== 'undefined'
    && document.cookie.split(';').some(cookie => cookie.trim().startsWith('XSRF-TOKEN='));
}

async function ensureCsrfCookie(): Promise<void> {
  if (hasCsrfCookie()) return;
  if (!csrfInitialization) {
    // Instance séparée pour ne pas rappeler cet intercepteur récursivement.
    csrfInitialization = axios.get('/api/auth/csrf', { withCredentials: true })
      .then(() => undefined)
      .finally(() => {
        csrfInitialization = null;
      });
  }
  await csrfInitialization;
}

const api = axios.create({
  // Toutes les requêtes passent par le proxy Vite (/api → http://localhost:8080).
  // Cela garantit que le cookie HttpOnly jwt (même origine) est toujours envoyé.
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  withXSRFToken: true,
});

api.interceptors.request.use(async config => {
  const method = config.method?.toUpperCase();
  if (method && UNSAFE_METHODS.has(method)) {
    await ensureCsrfCookie();
  }
  return config;
});

export default api;
