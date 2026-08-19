import React, { useEffect, useState } from 'react';
import { Bell, Loader2, AlertCircle, Save } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { UseParametresNotificationsReturn } from '../../hooks/useParametresNotifications';
import { DepartementMultiSelect } from './DepartementMultiSelect';
import { NotificationPreferencesDTO } from '../../types';
import { ParametresSectionCard } from './ParametresSectionCard';
import { ParametresLoadErrorState, ParametresLoadingState } from './ParametresCommonUI';

interface SectionNotificationsProps
  extends Pick<
    UseParametresNotificationsReturn,
    'departements' | 'preferences' | 'isLoading' | 'isSaving' | 'loadError' | 'savePreferences'
  > {}

/**
 * Section "Notifications" de l'onglet Paramètres.
 *
 * Permet à un Bureau d'Études de choisir les départements pour lesquels
 * il souhaite être notifié lors d'une nouvelle demande de devis.
 */
export function SectionNotifications({
  departements,
  preferences,
  isLoading,
  isSaving,
  loadError,
  savePreferences,
}: Readonly<SectionNotificationsProps>) {
  const { toastSuccess, toastError } = useToast();

  // État du formulaire local — initialisé depuis les préférences chargées
  const [notifierTous, setNotifierTous] = useState(true);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [afficherTous, setAfficherTous] = useState(true);
  const [visibleDepts, setVisibleDepts] = useState<string[]>([]);

  useEffect(() => {
    if (preferences) {
      setNotifierTous(preferences.notifierTousDepartements);
      setSelectedDepts(preferences.departementsSuivis);
      setAfficherTous(preferences.afficherTousDepartements ?? true);
      setVisibleDepts(preferences.departementsVisibles ?? []);
    }
  }, [preferences]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation front : si mode sélection mais aucun dept choisi
    if (!notifierTous && selectedDepts.length === 0) {
      toastError('Aucun département sélectionné — vous ne recevrez aucune notification. Veuillez en sélectionner au moins un ou choisir "Tous les départements".');
      return;
    }
    if (!afficherTous && visibleDepts.length === 0) {
      toastError('Sélectionnez au moins un département visible ou choisissez « Toutes les missions ».');
      return;
    }

    const prefs: NotificationPreferencesDTO = {
      notifierTousDepartements: notifierTous,
      departementsSuivis: notifierTous ? [] : selectedDepts,
      afficherTousDepartements: afficherTous,
      departementsVisibles: afficherTous ? [] : visibleDepts,
    };

    const success = await savePreferences(prefs);
    if (success) {
      toastSuccess('Préférences de notification enregistrées ✓');
    } else {
      toastError('Impossible d\'enregistrer les préférences. Veuillez réessayer.');
    }
  };

  // ── États de chargement / erreur ─────────────────────────────────────────────

  if (isLoading) {
    return <ParametresLoadingState />;
  }

  if (loadError) {
    return <ParametresLoadErrorState message={loadError} />;
  }

  // ── Formulaire ───────────────────────────────────────────────────────────────

  return (
    <ParametresSectionCard
      icon={Bell}
      title="Préférences de notification"
      description="Choisissez les départements sur lesquels vous souhaitez être notifié."
    >
      <form onSubmit={handleSubmit} noValidate>
        {/* Choix du mode */}
        <fieldset className="space-y-3 mb-5">
          <legend className="sr-only">Mode de notification géographique</legend>

          {/* Option "Tous les départements" */}
          <label
            aria-label="Recevoir toutes les nouvelles demandes de devis (sans filtre géographique)"
            className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:border-blue-300 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
          >
            <input
              type="radio"
              name="modeNotification"
              value="tous"
              checked={notifierTous}
              onChange={() => setNotifierTous(true)}
              className="mt-0.5 accent-blue-600"
            />
            <span aria-hidden="true">
              <span className="block text-sm font-medium text-slate-800">
                Recevoir toutes les nouvelles demandes de devis
              </span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Sans filtre géographique — idéal si vous intervenez sur toute la France.
              </span>
            </span>
          </label>

          {/* Option "Sélection manuelle" */}
          <label
            aria-label="Recevoir uniquement les demandes dans les départements sélectionnés"
            className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:border-blue-300 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50"
          >
            <input
              type="radio"
              name="modeNotification"
              value="selection"
              checked={!notifierTous}
              onChange={() => setNotifierTous(false)}
              className="mt-0.5 accent-blue-600"
            />
            <span aria-hidden="true">
              <span className="block text-sm font-medium text-slate-800">
                Recevoir uniquement les demandes dans mes départements sélectionnés
              </span>
              <span className="block text-xs text-slate-500 mt-0.5">
                Choisissez précisément les départements qui vous intéressent.
              </span>
            </span>
          </label>
        </fieldset>

        {/* MultiSelect des départements */}
        <div className="mb-6">
          <p
            id="dept-select-label"
            className={`text-sm font-medium mb-2 ${notifierTous ? 'text-slate-400' : 'text-slate-700'}`}
          >
            Départements suivis
          </p>
          <DepartementMultiSelect
            departements={departements}
            selectedCodes={selectedDepts}
            onChange={setSelectedDepts}
            disabled={notifierTous}
            id="dept-select"
          />
          {!notifierTous && selectedDepts.length === 0 && (
            <p className="mt-2 text-xs text-amber-600 flex items-center gap-1.5" role="alert">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              Aucun département sélectionné — vous ne recevrez aucune notification.
            </p>
          )}
        </div>

        <fieldset className="space-y-3 mb-5 border-t border-slate-100 pt-5">
          <legend className="text-sm font-semibold text-slate-800 mb-2">Missions visibles par défaut</legend>
          <p className="text-xs text-slate-500 mb-3">
            Ce réglage filtre la carte et la liste sans restreindre l'accès aux autres missions.
          </p>
          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input type="radio" name="modeVisibilite" checked={afficherTous}
              onChange={() => setAfficherTous(true)} className="accent-blue-600" />
            Toutes les missions
          </label>
          <label className="flex items-center gap-3 text-sm text-slate-700">
            <input type="radio" name="modeVisibilite" checked={!afficherTous}
              onChange={() => setAfficherTous(false)} className="accent-blue-600" />
            Uniquement mes zones visibles
          </label>
          <div className="pt-2">
            <DepartementMultiSelect departements={departements} selectedCodes={visibleDepts}
              onChange={setVisibleDepts} disabled={afficherTous} id="dept-visible-select"
              ariaLabel="Sélectionner les départements visibles" />
          </div>
        </fieldset>

        {/* Bouton de sauvegarde */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                Enregistrement…
              </>
            ) : (
              <>
                <Save className="w-4 h-4" aria-hidden="true" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </form>
    </ParametresSectionCard>
  );
}


