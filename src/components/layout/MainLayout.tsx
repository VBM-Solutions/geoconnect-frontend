import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import { getClientByUserId } from '../../api/client';
import { getBureauByUserId } from '../../api/bureauEtude';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationBell } from '../ui/NotificationBell';
import { ParametresButton } from '../ui/ParametresButton';
import { BrandLogo } from '../brand/BrandLogo';

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
    navigate('/login', { replace: true, state: null });
    logout();
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
    navItems = [
      { label: 'Accueil', path: '/be/dashboard' },
      { label: 'Planning', path: '/be/planning' },
      { label: 'Ma fiche', path: '/be/ma-fiche' },
    ];
  } else if (user?.role === 'ADMIN') {
    navItems = [
      { label: 'Contacts BE', path: '/admin/contacts-bureaux-etudes' },
      { label: 'Utilisateurs', path: '/admin/utilisateurs' },
      { label: 'Modération', path: '/admin/evaluations/moderation' },
    ];
  }

  return (
    <div className={`min-h-screen bg-[#f7f4ed] text-slate-900 font-sans flex flex-col ${isAuthenticated ? 'overflow-hidden' : ''}`}>
      <nav aria-label="Navigation principale" className={`${isAuthenticated ? 'h-14' : 'sticky top-0 min-h-16'} z-40 border-b border-stone-200/80 bg-white/95 text-stone-900 backdrop-blur flex items-center justify-between px-4 sm:px-6 shrink-0`}>
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <BrandLogo priority className="h-12 w-40 object-cover object-center" />
          </Link>

          {isAuthenticated && (
            <div className="hidden md:flex gap-6 text-sm font-medium text-stone-600">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`mt-4 pb-4 transition-colors ${
                      isActive
                        ? 'text-[#688239] border-b-2 border-[#779649]'
                        : 'hover:text-stone-950'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
          {!isAuthenticated && (
            <div className="hidden gap-6 text-sm font-bold text-stone-600 lg:flex">
              <a href="/#fonctionnement" className="hover:text-[#688239]">Comment ça marche ?</a>
              <a href="/#quelle-etude" className="hover:text-[#688239]">Quelle étude choisir ?</a>
              <a href="/#questions" className="hover:text-[#688239]">Questions fréquentes</a>
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
                className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-700 bg-blue-600 transition-colors hover:bg-blue-700"
                title="Se déconnecter"
              >
                <LogOut className="h-4 w-4 text-white" />
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full border border-stone-300 px-4 py-2 text-xs font-bold text-stone-800 hover:border-[#779649] hover:text-[#688239] tracking-wider"
            >
              CONNEXION
            </Link>
          )}
        </div>
      </nav>

      <main className={isAuthenticated
        ? 'flex-1 w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-6 pb-20 md:pb-6 overflow-auto'
        : 'w-full flex-1 overflow-x-clip pb-10'}>
        <Outlet />
      </main>

      {isAuthenticated ? (
        <footer className="fixed bottom-0 z-10 flex h-6 w-full shrink-0 items-center justify-between border-t border-slate-200 bg-slate-100 px-4 text-[10px] text-slate-500 md:relative">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" /> Serveur opérationnel</span>
          </div>
          <div className="font-medium">v1.0.0 • © 2026 Mon Étude de Sol SAS</div>
        </footer>
      ) : (
        <footer className="border-t border-stone-200 bg-white px-5 py-7 text-xs text-stone-500">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-black text-stone-800">Mon étude de sol.fr</p><p className="mt-1">Votre projet, les bons spécialistes, un suivi simple.</p></div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <a href="#conditions" aria-label="Conditions générales, contenu provisoire">Conditions générales</a>
              <a href="#mentions-legales">Mentions légales</a>
              <a href="#confidentialite">Confidentialité</a>
              <a href="#linkedin">LinkedIn</a>
            </div>
            <div className="font-medium">© 2026 Mon Étude de Sol SAS</div>
          </div>
        </footer>
      )}
    </div>
  );
}
