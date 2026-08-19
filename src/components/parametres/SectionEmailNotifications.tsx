import { Mail, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NotificationCategory } from '../../types';
import { UseEmailNotificationPreferencesReturn } from '../../hooks/useEmailNotificationPreferences';
import { ParametresSectionCard } from './ParametresSectionCard';
import { ParametresLoadErrorState, ParametresLoadingState } from './ParametresCommonUI';
import { useToast } from '../../contexts/ToastContext';

const CATEGORIES: Array<{ value: NotificationCategory; label: string; description: string }> = [
  { value: 'OPPORTUNITES', label: 'Opportunités', description: 'Nouvelles missions dans vos zones notifiées.' },
  { value: 'PROPOSITIONS', label: 'Propositions', description: 'Propositions reçues, acceptées ou refusées.' },
  { value: 'PLANIFICATION', label: 'Planification', description: "Dates d'intervention proposées, validées ou refusées." },
  { value: 'DOCUMENTS_LIVRABLES', label: 'Documents et livrables', description: 'Devis signés et rapports disponibles.' },
  { value: 'PAIEMENT_CLOTURE', label: 'Paiement et clôture', description: 'Paiements confirmés et clôture des études.' },
];

export function SectionEmailNotifications(props: Readonly<UseEmailNotificationPreferencesReturn>) {
  const { toastSuccess, toastError } = useToast();
  const [selected, setSelected] = useState<NotificationCategory[]>(props.categoriesActives);
  useEffect(() => setSelected(props.categoriesActives), [props.categoriesActives]);

  if (props.isLoading) return <ParametresLoadingState />;
  if (props.loadError) return <ParametresLoadErrorState message={props.loadError} />;

  const toggle = (category: NotificationCategory) => setSelected(current =>
    current.includes(category) ? current.filter(item => item !== category) : [...current, category]);

  const submit = async () => {
    if (await props.save(selected)) toastSuccess('Préférences email enregistrées ✓');
    else toastError("Impossible d'enregistrer les préférences email.");
  };

  return (
    <ParametresSectionCard icon={Mail} title="Notifications par email"
      description="Choisissez les catégories métier pour lesquelles vous souhaitez recevoir un email.">
      <div className="space-y-3">
        {CATEGORIES.map(category => (
          <label key={category.value} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-3">
            <span>
              <span className="block text-sm font-medium text-slate-800">{category.label}</span>
              <span className="block text-xs text-slate-500">{category.description}</span>
            </span>
            <input type="checkbox" checked={selected.includes(category.value)}
              onChange={() => toggle(category.value)} className="mt-1 h-4 w-4 accent-blue-600" />
          </label>
        ))}
        <p className="text-xs text-slate-500">
          Les emails de sécurité et de gestion du compte restent toujours actifs.
        </p>
        <div className="flex justify-end">
          <button type="button" onClick={submit} disabled={props.isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:bg-blue-400">
            <Save className="h-4 w-4" /> {props.isSaving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </ParametresSectionCard>
  );
}
