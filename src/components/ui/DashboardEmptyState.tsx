import React from 'react';
import { Card, CardContent } from './Card';

interface DashboardEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

/**
 * État vide générique pour les onglets du tableau de bord client.
 */
export function DashboardEmptyState({ icon, title, description, action }: Readonly<DashboardEmptyStateProps>) {
  return (
    <Card className="border-dashed border-slate-300/90 bg-gradient-to-b from-white to-slate-50/60 py-12 text-center shadow-inner">
      <CardContent>
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
          {icon}
        </div>
        <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
        <p className={`text-slate-500 ${action ? 'mb-6' : ''}`}>{description}</p>
        {action}
      </CardContent>
    </Card>
  );
}
