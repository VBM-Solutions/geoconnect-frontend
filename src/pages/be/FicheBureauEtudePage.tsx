import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, Eye, Pencil, RefreshCw } from 'lucide-react';
import { getDepartements } from '../../api/referentiel';
import { ProfilBureauEtudeForm } from '../../components/profil-be/ProfilBureauEtudeForm';
import { ProfilBureauEtudePreview } from '../../components/profil-be/ProfilBureauEtudePreview';
import { ProfilBureauEtudeStats } from '../../components/profil-be/ProfilBureauEtudeStats';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import { useFicheBureauEtude } from '../../hooks/useFicheBureauEtude';
import { useTypesEtude } from '../../hooks/useTypesEtude';
import {
  getProfilValidationErrors,
  getPublicationRequirements,
  toProfilPublicPayload,
} from '../../lib/profilBureauEtude';
import { extractErrorMessage } from '../../lib/utils';
import { DepartementDTO, UpdateProfilPublicBureauEtudePayload } from '../../types';

type ViewMode = 'edit' | 'preview';

export default function FicheBureauEtudePage() {
  const { fiche, isLoading, loadError, action, reload, save, publish, unpublish } =
    useFicheBureauEtude();
  const { typesEtude, loading: isLoadingTypes } = useTypesEtude();
  const { toastSuccess, toastError } = useToast();
  const [departements, setDepartements] = useState<DepartementDTO[]>([]);
  const [draft, setDraft] = useState<UpdateProfilPublicBureauEtudePayload | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDepartements()
      .then(result => {
        if (!cancelled) setDepartements(result);
      })
      .catch(error => {
        if (!cancelled) {
          toastError(extractErrorMessage(error, 'Impossible de charger les départements.'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [toastError]);

  useEffect(() => {
    if (fiche) setDraft(toProfilPublicPayload(fiche.profilPublic));
  }, [fiche]);

  const initialPayload = useMemo(
    () => fiche ? toProfilPublicPayload(fiche.profilPublic) : null,
    [fiche],
  );
  const isDirty = draft != null
    && initialPayload != null
    && JSON.stringify(draft) !== JSON.stringify(initialPayload);
  const validationErrors = draft ? getProfilValidationErrors(draft) : [];
  const publicationRequirements = draft ? getPublicationRequirements(draft) : [];
  const isBusy = action !== null;

  const handleSave = async () => {
    if (!draft || validationErrors.length > 0) return;
    try {
      await save(draft);
      toastSuccess('Votre fiche a été enregistrée.');
    } catch (error) {
      toastError(extractErrorMessage(error, 'Impossible d’enregistrer votre fiche.'));
    }
  };

  const handlePublish = async () => {
    if (!draft || publicationRequirements.length > 0) return;
    try {
      await publish(draft);
      toastSuccess('Votre fiche est maintenant publiée.');
    } catch (error) {
      toastError(extractErrorMessage(error, 'Impossible de publier votre fiche.'));
    }
  };

  const handleUnpublish = async () => {
    if (!draft || validationErrors.length > 0) return;
    try {
      await unpublish(draft);
      setShowUnpublishConfirm(false);
      toastSuccess('Votre fiche a été retirée de l’espace public.');
    } catch (error) {
      toastError(extractErrorMessage(error, 'Impossible de dépublier votre fiche.'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        Chargement de votre fiche…
      </div>
    );
  }

  if (loadError || !fiche || !draft) {
    return (
      <Card className="mx-auto mt-12 max-w-xl">
        <CardContent className="py-10 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-500" aria-hidden="true" />
          <h1 className="mt-3 text-lg font-bold">Votre fiche n’a pas pu être chargée</h1>
          <p className="mt-1 text-sm text-slate-500">{loadError}</p>
          <Button className="mt-5" variant="outline" onClick={() => void reload()}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isPublished = fiche.profilPublic.statut === 'PUBLIE';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">Ma fiche bureau d’études</h1>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}>
              {isPublished ? 'Publiée' : 'Brouillon'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Présentez votre expertise aux particuliers et maîtrisez les informations rendues publiques.
          </p>
          {isPublished && (
            <a
              href={`/bureaux-etudes/${fiche.profilPublic.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-800 hover:underline"
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Voir ma page publique
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
          >
            {viewMode === 'edit'
              ? <><Eye className="mr-2 h-4 w-4" />Aperçu</>
              : <><Pencil className="mr-2 h-4 w-4" />Modifier</>}
          </Button>
          <Button
            variant="outline"
            disabled={!isDirty || validationErrors.length > 0 || isBusy}
            isLoading={action === 'save'}
            onClick={() => void handleSave()}
          >
            Enregistrer
          </Button>
          {isPublished ? (
            <Button
              variant="danger"
              disabled={validationErrors.length > 0 || isBusy}
              onClick={() => setShowUnpublishConfirm(true)}
            >
              Dépublier
            </Button>
          ) : (
            <Button
              disabled={publicationRequirements.length > 0 || isBusy}
              isLoading={action === 'publish'}
              onClick={() => void handlePublish()}
            >
              Publier ma fiche
            </Button>
          )}
        </div>
      </header>

      <ProfilBureauEtudeStats stats={fiche.activite} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>{viewMode === 'edit' ? 'Informations publiques' : 'Aperçu de votre page'}</CardTitle>
          </CardHeader>
          <CardContent>
            {viewMode === 'edit' ? (
              <ProfilBureauEtudeForm
                value={draft}
                typesEtude={typesEtude}
                departements={departements}
                disabled={isBusy || isLoadingTypes}
                onChange={setDraft}
              />
            ) : (
              <ProfilBureauEtudePreview
                profil={fiche.profilPublic}
                draft={draft}
                typesEtude={typesEtude}
                departements={departements}
              />
            )}
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Publication</CardTitle>
            </CardHeader>
            <CardContent>
              {publicationRequirements.length === 0 ? (
                <p className="flex items-start gap-2 text-xs text-green-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  Votre fiche contient toutes les informations nécessaires à sa publication.
                </p>
              ) : (
                <>
                  <p className="mb-3 text-xs text-slate-600">À compléter avant publication :</p>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {publicationRequirements.map(requirement => (
                      <li key={requirement} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>

          {isDirty && (
            <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
              Vous avez des modifications non enregistrées.
            </p>
          )}
        </aside>
      </div>

      {showUnpublishConfirm && (
        <ConfirmModal
          title="Dépublier votre fiche ?"
          message="Votre page ne sera plus accessible aux particuliers ni indexable tant que vous ne la republiez pas."
          variant="warning"
          confirmLabel="Dépublier"
          isLoading={action === 'unpublish'}
          onConfirm={() => void handleUnpublish()}
          onCancel={() => setShowUnpublishConfirm(false)}
        />
      )}
    </div>
  );
}
