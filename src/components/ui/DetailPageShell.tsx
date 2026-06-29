import React from 'react';
import { Sparkles } from 'lucide-react';
import { BackButton } from './BackButton';
import { cn } from '../../lib/utils';

type DetailPageShellTone = 'client' | 'be';

interface DetailPageShellProps {
  readonly tone: DetailPageShellTone;
  readonly backTo: string;
  readonly backLabel: string;
  readonly eyebrow: string;
  readonly title: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly status?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly contentClassName?: string;
}

const toneClasses: Record<DetailPageShellTone, string> = {
  client: 'border-blue-100 bg-linear-to-r from-blue-600 via-blue-600 to-cyan-500 shadow-blue-200/70',
  be: 'border-slate-800/10 bg-linear-to-r from-slate-900 via-slate-800 to-blue-700 shadow-slate-300/60',
};

export function DetailPageShell({
  tone,
  backTo,
  backLabel,
  eyebrow,
  title,
  description,
  status,
  actions,
  children,
  className,
  contentClassName,
}: DetailPageShellProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className={cn('rounded-2xl border p-5 text-white shadow-lg', toneClasses[tone])}>
        <BackButton
          to={backTo}
          label={backLabel}
          className="mb-4 text-white/75 hover:text-white"
        />

        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              {eyebrow}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <h1 className="min-w-0 text-2xl font-bold tracking-tight">{title}</h1>
              {status}
            </div>
            {description && (
              <div className="max-w-4xl text-sm text-white/90">
                {description}
              </div>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>

      <div className={cn('gc-surface-panel min-w-0 rounded-2xl p-4 md:p-5', contentClassName)}>
        {children}
      </div>
    </div>
  );
}
