import axios from 'axios';

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
let csrfInitialization: Promise<void> | null = null;
let csrfToken: string | null = null;

async function ensureCsrfToken(): Promise<void> {
  if (csrfToken) return;
  if (!csrfInitialization) {
    // Instance séparée pour ne pas rappeler cet intercepteur récursivement.
    csrfInitialization = axios.get('/api/auth/csrf', { withCredentials: true })
      .then(response => {
        const token = response.headers['x-xsrf-token'];
        if (!token) throw new Error('Jeton CSRF absent de la réponse');
        csrfToken = token;
      })
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
});

api.interceptors.request.use(async config => {
  const method = config.method?.toUpperCase();
  if (method && UNSAFE_METHODS.has(method)) {
    await ensureCsrfToken();
    config.headers.set('X-XSRF-TOKEN', csrfToken);
  }
  return config;
});

export default api;
