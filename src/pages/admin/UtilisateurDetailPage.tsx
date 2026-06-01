import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldUser } from 'lucide-react';
import { activerUtilisateur, desactiverUtilisateur, getUtilisateur, reinitialiserMotDePasse } from '../../api/admin';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { UtilisateurStatusBadge } from '../../components/admin/UtilisateurStatusBadge';
import { ResetPasswordModal } from '../../components/admin/ResetPasswordModal';
import { ConfirmDesactiverModal } from '../../components/admin/ConfirmDesactiverModal';
import { UtilisateurDTO } from '../../types';
import { getApiMessage } from '../../lib/adminUsers';

export default function UtilisateurDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toastError, toastSuccess } = useToast();
  const [utilisateur, setUtilisateur] = useState<UtilisateurDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    async function loadUtilisateur() {
      const numericId = Number(id);
      if (!numericId) {
        toastError('Identifiant utilisateur invalide');
        navigate('/admin/utilisateurs', { replace: true });
        return;
      }

      setIsLoading(true);
      try {
        const data = await getUtilisateur(numericId);
        setUtilisateur(data);
      } catch (error: any) {
        toastError(getApiMessage(error, 'Compte introuvable'));
        navigate('/admin/utilisateurs', { replace: true });
      } finally {
        setIsLoading(false);
      }
    }

    loadUtilisateur();
  }, [id, navigate, toastError]);

  const handleActiver = async () => {
    if (!utilisateur) return;
    setIsSubmitting(true);
    try {
      await activerUtilisateur(utilisateur.id);
      setUtilisateur({ ...utilisateur, enabled: true });
      toastSuccess('Compte active');
    } catch (error: any) {
      toastError(getApiMessage(error, 'Impossible d activer le compte'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDesactiver = async () => {
    if (!utilisateur) return;
    setIsSubmitting(true);
    try {
      await desactiverUtilisateur(utilisateur.id);
      setUtilisateur({ ...utilisateur, enabled: false });
      setShowDisableModal(false);
      toastSuccess('Compte desactive');
    } catch (error: any) {
      toastError(getApiMessage(error, 'Impossible de desactiver le compte'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (password: string) => {
    if (!utilisateur) return;
    setIsSubmitting(true);
    try {
      await reinitialiserMotDePasse(utilisateur.id, password);
      setShowResetModal(false);
      toastSuccess('Mot de passe reinitialise');
    } catch (error: any) {
      toastError(getApiMessage(error, 'Impossible de reinitialiser le mot de passe'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!utilisateur) return null;

  return (
    <div className="max-w-3xl space-y-4">
      <Link to="/admin/utilisateurs" className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Retour a la liste
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ShieldUser className="h-5 w-5 text-slate-500" />
          <h1 className="text-lg font-bold text-slate-900">Fiche utilisateur</h1>
        </div>

        <dl className="grid gap-4 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Login</dt>
            <dd className="mt-1 text-slate-800">{utilisateur.login}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Role</dt>
            <dd className="mt-1 text-slate-800">{utilisateur.role}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Statut</dt>
            <dd className="mt-1"><UtilisateurStatusBadge enabled={utilisateur.enabled} /></dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Date de creation</dt>
            <dd className="mt-1 text-slate-800">{new Date(utilisateur.createdAt).toLocaleString('fr-FR')}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {utilisateur.enabled ? (
            <Button variant="danger" onClick={() => setShowDisableModal(true)} disabled={isSubmitting}>
              Desactiver
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleActiver} isLoading={isSubmitting}>
              Activer
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowResetModal(true)} disabled={isSubmitting}>
            Reinitialiser le mot de passe
          </Button>
        </div>
      </div>

      {showDisableModal && (
        <ConfirmDesactiverModal
          login={utilisateur.login}
          isLoading={isSubmitting}
          onCancel={() => setShowDisableModal(false)}
          onConfirm={handleDesactiver}
        />
      )}

      {showResetModal && (
        <ResetPasswordModal
          login={utilisateur.login}
          isLoading={isSubmitting}
          onCancel={() => setShowResetModal(false)}
          onConfirm={handleResetPassword}
        />
      )}
    </div>
  );
}



