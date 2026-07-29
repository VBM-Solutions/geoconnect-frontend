/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { ApiInterceptorSetup } from './components/layout/ApiInterceptorSetup';
import { SessionTimeoutGuard } from './components/layout/SessionTimeoutGuard';

import Home from './pages/Home';
import Login from './pages/Login';
import Success from './pages/Success';
import Forbidden from './pages/Forbidden';

import ClientDashboard from './pages/client/Dashboard';
import ClientRequestDetail from './pages/client/RequestDetail';
import ClientEtudeDetail from './pages/client/EtudeDetail';
import NewRequest from './pages/client/NewRequest';
import ClientParametresPage from './pages/client/ParametresPage';

import BEDashboard from './pages/be/Dashboard';
import BERequestDetail from './pages/be/RequestDetail';
import BEEtudeDetail from './pages/be/EtudeDetail';
import BERegister from './pages/be/BERegister';
import BEParametresPage from './pages/be/ParametresPage';
import FicheBureauEtudePage from './pages/be/FicheBureauEtudePage';
import UtilisateursPage from './pages/admin/UtilisateursPage';
import UtilisateurDetailPage from './pages/admin/UtilisateurDetailPage';
import CreerUtilisateurPage from './pages/admin/CreerUtilisateurPage';

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
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
    </ToastProvider>
  );
}
