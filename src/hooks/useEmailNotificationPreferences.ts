import { useCallback, useEffect, useState } from 'react';
import { getEmailNotificationPreferences, updateEmailNotificationPreferences } from '../api/parametres';
import { NotificationCategory } from '../types';

export interface UseEmailNotificationPreferencesReturn {
  categoriesActives: NotificationCategory[];
  isLoading: boolean;
  isSaving: boolean;
  loadError: string | null;
  save: (categories: NotificationCategory[]) => Promise<boolean>;
}

export function useEmailNotificationPreferences(): UseEmailNotificationPreferencesReturn {
  const [categoriesActives, setCategoriesActives] = useState<NotificationCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getEmailNotificationPreferences()
      .then(result => { if (active) setCategoriesActives(result.categoriesActives); })
      .catch(() => { if (active) setLoadError('Impossible de charger les préférences email.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);

  const save = useCallback(async (categories: NotificationCategory[]) => {
    setIsSaving(true);
    try {
      const result = await updateEmailNotificationPreferences({ categoriesActives: categories });
      setCategoriesActives(result.categoriesActives);
      return true;
    } catch {
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { categoriesActives, isLoading, isSaving, loadError, save };
}
