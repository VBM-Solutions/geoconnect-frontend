import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowDownAZ, ArrowUpAZ, Search, UserPlus } from 'lucide-react';
import {
  activerUtilisateur,
  desactiverUtilisateur,
  listerUtilisateurs,
  reinitialiserMotDePasse,
} from '../../api/admin';
import { useToast } from '../../contexts/ToastContext';
import { Role, UtilisateurDTO } from '../../types';
import { Button } from '../../components/ui/Button';
import { UtilisateurStatusBadge } from '../../components/admin/UtilisateurStatusBadge';
import { ConfirmDesactiverModal } from '../../components/admin/ConfirmDesactiverModal';
import { ResetPasswordModal } from '../../components/admin/ResetPasswordModal';
import {
  getApiMessage,
  normalizeText,
  paginateUtilisateurs,
  roleBadgeClass,
  sortUtilisateurs,
  SortDirection,
  USER_PAGE_SIZE,
  UserSortKey,
} from '../../lib/adminUsers';

interface SortableHeaderProps {
  label: string;
  sortKey: UserSortKey;
  activeSort: UserSortKey;
  activeDirection: SortDirection;
  onToggle: (sortKey: UserSortKey) => void;
}

function SortableHeader({
  label,
  sortKey,
  activeSort,
  activeDirection,
  onToggle,
}: Readonly<SortableHeaderProps>) {
  const isActive = activeSort === sortKey;
  let sortIcon: React.ReactNode = null;

  if (isActive) {
    sortIcon = activeDirection === 'asc'
      ? <ArrowUpAZ className="h-3.5 w-3.5" />
      : <ArrowDownAZ className="h-3.5 w-3.5" />;
  }

  return (
    <button
      type="button"
      onClick={() => onToggle(sortKey)}
      className="inline-flex items-center gap-1 transition-colors hover:text-slate-800"
      aria-label={`Trier par ${label}`}
    >
      {label}
      {sortIcon}
    </button>
  );
}

export default function UtilisateursPage() {
  const { toastSuccess, toastError } = useToast();
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
  const [sortKey, setSortKey] = useState<UserSortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [disableTarget, setDisableTarget] = useState<UtilisateurDTO | null>(null);
  const [resetTarget, setResetTarget] = useState<UtilisateurDTO | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadUtilisateurs() {
      setIsLoading(true);
      try {
        const data = await listerUtilisateurs();
        setUtilisateurs(data);
      } catch (error: any) {
        toastError(getApiMessage(error, 'Impossible de charger les utilisateurs'));
      } finally {
        setIsLoading(false);
      }
    }

    loadUtilisateurs();
  }, [toastError]);

  const filteredUtilisateurs = useMemo(() => {
    const searchValue = normalizeText(search);
    return utilisateurs.filter((utilisateur) => {
      const roleMatch = roleFilter === 'ALL' || utilisateur.role === roleFilter;
      const searchMatch = !searchValue || normalizeText(utilisateur.login).includes(searchValue);
      return roleMatch && searchMatch;
    });
  }, [utilisateurs, roleFilter, search]);

  const sortedUtilisateurs = useMemo(() => {
    return sortUtilisateurs(filteredUtilisateurs, sortKey, sortDirection);
  }, [filteredUtilisateurs, sortKey, sortDirection]);

  const pagination = useMemo(() => {
    return paginateUtilisateurs(sortedUtilisateurs, currentPage, USER_PAGE_SIZE);
  }, [sortedUtilisateurs, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, sortKey, sortDirection]);

  useEffect(() => {
    if (currentPage > pagination.totalPages) {
      setCurrentPage(pagination.totalPages);
    }
  }, [currentPage, pagination.totalPages]);

  const toggleSort = (nextSortKey: UserSortKey) => {
    if (sortKey === nextSortKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(nextSortKey);
    setSortDirection('asc');
  };

  const handleActiver = async (id: number) => {
    setIsSubmitting(true);
    try {
      await activerUtilisateur(id);
      setUtilisateurs((prev) => prev.map((item) => (item.id === id ? { ...item, enabled: true } : item)));
      toastSuccess('Compte active');
    } catch (error: any) {
      toastError(getApiMessage(error, 'Impossible d activer le compte'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDesactiver = async () => {
    if (!disableTarget) return;

    setIsSubmitting(true);
    try {
      await desactiverUtilisateur(disableTarget.id);
      setUtilisateurs((prev) => prev.map((item) => (item.id === disableTarget.id ? { ...item, enabled: false } : item)));
      toastSuccess('Compte desactive');
      setDisableTarget(null);
    } catch (error: any) {
      toastError(getApiMessage(error, 'Impossible de desactiver le compte'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (password: string) => {
    if (!resetTarget) return;

    setIsSubmitting(true);
    try {
      await reinitialiserMotDePasse(resetTarget.id, password);
      toastSuccess('Mot de passe reinitialise');
      setResetTarget(null);
    } catch (error: any) {
      toastError(getApiMessage(error, 'Impossible de reinitialiser le mot de passe'));
    } finally {
      setIsSubmitting(false);
    }
  };

  let tableContent: React.ReactNode;

  if (isLoading) {
    tableContent = (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  } else if (filteredUtilisateurs.length === 0) {
    tableContent = (
      <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
        <AlertCircle className="h-4 w-4" /> Aucun utilisateur ne correspond aux filtres.
      </div>
    );
  } else {
    tableContent = (
      <div className="overflow-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-slate-600">
                <SortableHeader
                  label="Login"
                  sortKey="login"
                  activeSort={sortKey}
                  activeDirection={sortDirection}
                  onToggle={toggleSort}
                />
              </th>
              <th className="px-4 py-3 font-semibold text-slate-600">
                <SortableHeader
                  label="Role"
                  sortKey="role"
                  activeSort={sortKey}
                  activeDirection={sortDirection}
                  onToggle={toggleSort}
                />
              </th>
              <th className="px-4 py-3 font-semibold text-slate-600">
                <SortableHeader
                  label="Statut"
                  sortKey="status"
                  activeSort={sortKey}
                  activeDirection={sortDirection}
                  onToggle={toggleSort}
                />
              </th>
              <th className="px-4 py-3 font-semibold text-slate-600">
                <SortableHeader
                  label="Cree le"
                  sortKey="createdAt"
                  activeSort={sortKey}
                  activeDirection={sortDirection}
                  onToggle={toggleSort}
                />
              </th>
              <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {pagination.items.map((utilisateur) => (
              <tr key={utilisateur.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3 text-slate-700">{utilisateur.login}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${roleBadgeClass(utilisateur.role)}`}>
                    {utilisateur.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <UtilisateurStatusBadge enabled={utilisateur.enabled} />
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(utilisateur.createdAt).toLocaleString('fr-FR')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/admin/utilisateurs/${utilisateur.id}`}>
                      <Button size="sm" variant="outline">Voir</Button>
                    </Link>
                    {utilisateur.enabled ? (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setDisableTarget(utilisateur)}
                        disabled={isSubmitting}
                      >
                        Desactiver
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleActiver(utilisateur.id)}
                        isLoading={isSubmitting}
                      >
                        Activer
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setResetTarget(utilisateur)}
                      disabled={isSubmitting}
                    >
                      Reset MDP
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <p className="text-[11px] text-slate-500">
            {sortedUtilisateurs.length} resultat{sortedUtilisateurs.length > 1 ? 's' : ''} - page {currentPage}/{pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              Precedent
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              disabled={currentPage >= pagination.totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Administration des comptes</h1>
            <p className="text-xs text-slate-500">Liste complete des utilisateurs GeoConnect.</p>
          </div>
          <Link to="/admin/utilisateurs/nouveau">
            <Button>
              <UserPlus className="mr-1.5 h-4 w-4" /> Nouveau compte
            </Button>
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_240px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Rechercher par email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-9 w-full rounded border border-slate-300 bg-white pl-9 pr-3 text-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as 'ALL' | Role)}
            className="h-9 rounded border border-slate-300 bg-white px-2 text-xs focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="ALL">Tous les roles</option>
            <option value="CLIENT">CLIENT</option>
            <option value="BUREAU_ETUDE">BUREAU_ETUDE</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {tableContent}
      </div>

      {disableTarget && (
        <ConfirmDesactiverModal
          login={disableTarget.login}
          isLoading={isSubmitting}
          onCancel={() => setDisableTarget(null)}
          onConfirm={handleDesactiver}
        />
      )}

      {resetTarget && (
        <ResetPasswordModal
          login={resetTarget.login}
          isLoading={isSubmitting}
          onCancel={() => setResetTarget(null)}
          onConfirm={handleResetPassword}
        />
      )}
    </div>
  );
}




