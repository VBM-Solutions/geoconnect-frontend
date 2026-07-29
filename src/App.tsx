/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { ApiInterceptorSetup } from './components/layout/ApiInterceptorSetup';
import { SessionTimeoutGuard } from './components/layout/SessionTimeoutGuard';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Success = lazy(() => import('./pages/Success'));
const Forbidden = lazy(() => import('./pages/Forbidden'));
const ClientDashboard = lazy(() => import('./pages/client/Dashboard'));
const ClientRequestDetail = lazy(() => import('./pages/client/RequestDetail'));
const ClientEtudeDetail = lazy(() => import('./pages/client/EtudeDetail'));
const NewRequest = lazy(() => import('./pages/client/NewRequest'));
const ClientParametresPage = lazy(() => import('./pages/client/ParametresPage'));
const BEDashboard = lazy(() => import('./pages/be/Dashboard'));
const BERequestDetail = lazy(() => import('./pages/be/RequestDetail'));
const BEEtudeDetail = lazy(() => import('./pages/be/EtudeDetail'));
const BERegister = lazy(() => import('./pages/be/BERegister'));
const BEParametresPage = lazy(() => import('./pages/be/ParametresPage'));
const FicheBureauEtudePage = lazy(() => import('./pages/be/FicheBureauEtudePage'));
const UtilisateursPage = lazy(() => import('./pages/admin/UtilisateursPage'));
const UtilisateurDetailPage = lazy(() => import('./pages/admin/UtilisateurDetailPage'));
const CreerUtilisateurPage = lazy(() => import('./pages/admin/CreerUtilisateurPage'));
const ModerationEvaluationsPage = lazy(() => import('./pages/admin/ModerationEvaluationsPage'));

function PageFallback() {
  return (
    <div className="flex min-h-48 items-center justify-center text-sm text-slate-500" role="status">
      Chargement de la page…
    </div>
  );
}

// Redirige automatiquement selon le rôle si connecté, sinon affiche Home
function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Home />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin/utilisateurs" replace />;
  if (user?.role === 'CLIENT') return <Navigate to="/client/dashboard" replace />;
  if (user?.role === 'BUREAU_ETUDE') return <Navigate to="/be/dashboard" replace />;
  return <Home />;
}

function ParametresRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'CLIENT') return <Navigate to="/client/parametres" replace />;
  if (user?.role === 'BUREAU_ETUDE') return <Navigate to="/be/parametres" replace />;
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <ApiInterceptorSetup />
          <SessionTimeoutGuard />
          <Suspense fallback={<PageFallback />}>
            <Routes>
            <Route element={<MainLayout />}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/success" element={<Success />} />
            <Route path="/403" element={<Forbidden />} />
            <Route path="/bureau-etudes/inscription" element={<BERegister />} />
            <Route path="/parametres" element={<ParametresRedirect />} />

            {/* Client Routes */}
            <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
              <Route path="/client/dashboard" element={<ClientDashboard />} />
              <Route path="/client/demande/new" element={<NewRequest />} />
              <Route path="/client/demande/:id" element={<ClientRequestDetail />} />
              <Route path="/client/etude/:id" element={<ClientEtudeDetail />} />
              <Route path="/client/parametres" element={<ClientParametresPage />} />
            </Route>

            {/* BE Routes */}
            <Route element={<ProtectedRoute allowedRoles={['BUREAU_ETUDE']} />}>
              <Route path="/be/dashboard" element={<BEDashboard />} />
              <Route path="/be/demande/:id" element={<BERequestDetail />} />
              <Route path="/be/etude/:id" element={<BEEtudeDetail />} />
              <Route path="/be/ma-fiche" element={<FicheBureauEtudePage />} />
              <Route path="/be/parametres" element={<BEParametresPage />} />
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin/utilisateurs" element={<UtilisateursPage />} />
              <Route path="/admin/utilisateurs/nouveau" element={<CreerUtilisateurPage />} />
              <Route path="/admin/utilisateurs/:id" element={<UtilisateurDetailPage />} />
              <Route path="/admin/evaluations/moderation" element={<ModerationEvaluationsPage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            </Routes>
          </Suspense>
      </Router>
    </AuthProvider>
    </ToastProvider>
  );
}
