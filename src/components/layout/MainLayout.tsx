import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { getClientByUserId } from '../../api/client';
import { getBureauByUserId } from '../../api/bureauEtude';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationBell } from '../ui/NotificationBell';
import { ParametresButton } from '../ui/ParametresButton';

export default function MainLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identityLabel, setIdentityLabel] = useState<string>('');

  const notifications = useNotifications(isAuthenticated);

  useEffect(() => {
    async function loadIdentityLabel() {
      if (!isAuthenticated || !user?.userId) {
        setIdentityLabel('');
        return;
      }

      try {
        if (user.role === 'CLIENT') {
          const myClient = await getClientByUserId(user.userId);
          const fullName = [myClient?.prenom, myClient?.nom].filter(Boolean).join(' ').trim();
          setIdentityLabel(fullName || 'Client');
          return;
        }

        if (user.role === 'BUREAU_ETUDE') {
          const myBureau = await getBureauByUserId(user.userId);
          setIdentityLabel(myBureau?.raisonSociale || 'Bureau d\'Études');
          return;
        }

        setIdentityLabel(user.login || 'Utilisateur');
      } catch {
        if (user.role === 'BUREAU_ETUDE') {
          setIdentityLabel('Bureau d\'Études');
        } else if (user.role === 'CLIENT') {
          setIdentityLabel('Client');
        } else {
          setIdentityLabel('Administrateur');
        }
      }
    }

    loadIdentityLabel();
  }, [isAuthenticated, user]);

  const roleLabel = useMemo(() => {
    if (user?.role === 'ADMIN') return 'Administrateur';
    if (user?.role === 'BUREAU_ETUDE') return 'Bureau d\'Études';
    if (user?.role === 'CLIENT') return 'Client';
    return 'Utilisateur';
  }, [user?.role]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  let parametresPath: string | null = null;
  if (user?.role === 'CLIENT') {
    parametresPath = '/client/parametres';
  } else if (user?.role === 'BUREAU_ETUDE') {
    parametresPath = '/be/parametres';
  }

  let navItems: Array<{ label: string; path: string }> = [];
  if (user?.role === 'CLIENT') {
    navItems = [{ label: 'Mon espace', path: '/client/dashboard' }];
  } else if (user?.role === 'BUREAU_ETUDE') {
    navItems = [{ label: 'Acceuil', path: '/be/dashboard' }];
  } else if (user?.role === 'ADMIN') {
    navItems = [{ label: 'Admin', path: '/admin/utilisateurs' }];
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900 font-sans flex flex-col overflow-hidden">
      <nav className="h-14 bg-slate-900 text-white flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-xl italic">G</div>
            <span className="font-bold tracking-tight text-lg">MON ÉTUDE DE SOL</span>
          </Link>

          {isAuthenticated && (
            <div className="hidden md:flex gap-6 text-sm font-medium text-slate-300">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`mt-4 pb-4 transition-colors ${
                      isActive
                        ? 'text-white border-b-2 border-blue-500'
                        : 'hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold leading-none">{identityLabel || roleLabel}</p>
                <p className="text-[10px] text-slate-400">{user?.login} • {roleLabel}</p>
              </div>
              {parametresPath && <ParametresButton to={parametresPath} />}
              <NotificationBell
                unreadCount={notifications.unreadCount}
                notifications={notifications.notifications}
                isLoadingList={notifications.isLoadingList}
                listError={notifications.listError}
                loadNotifications={notifications.loadNotifications}
                markAsRead={notifications.markAsRead}
                markAllAsRead={notifications.markAllAsRead}
              />
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center hover:bg-slate-600 transition-colors"
                title="Se déconnecter"
              >
                <LogOut className="w-4 h-4 text-slate-300" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-xs font-bold text-white hover:text-blue-400 tracking-wider"
            >
              CONNEXION
            </Link>
          )}
        </div>
      </nav>

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 pb-20 md:pb-6 overflow-auto">
        <Outlet />
      </main>

      <footer className="h-6 bg-slate-100 border-t border-slate-200 px-4 flex items-center justify-between text-[10px] text-slate-500 shrink-0 z-10 w-full fixed bottom-0 md:relative">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Serveur Opérationnel</span>
        </div>
        <div className="font-medium">v1.0.0 • © 2026 Mon Étude de Sol SAS</div>
      </footer>
    </div>
  );
}
