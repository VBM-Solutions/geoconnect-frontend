import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface DashboardActivityItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly toneClassName: string;
  readonly actionLabel: string;
  readonly onAction: () => void;
}

interface DashboardActivityFeedProps {
  readonly items: DashboardActivityItem[];
}

export function DashboardActivityFeed({ items }: Readonly<DashboardActivityFeedProps>) {
  return (
    <section className="grid grid-cols-1 gap-3 xl:grid-cols-3" aria-label="Fil d'activité">
      {items.map((item) => (
        <article
          key={item.id}
          className="gc-surface-panel gc-motion-base rounded-2xl p-4 transition-[transform,box-shadow,border-color,background-color] hover:-translate-y-0.5"
        >
          <div className="flex items-start gap-3">
            <span className={`inline-flex rounded-xl border px-2.5 py-2 ${item.toneClassName}`}>
              {item.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm leading-5 text-slate-500">{item.description}</p>
              <button
                type="button"
                onClick={item.onAction}
                className="gc-motion-fast mt-3 inline-flex items-center text-xs font-semibold uppercase tracking-wider text-blue-600 hover:text-blue-700"
              >
                {item.actionLabel}
                <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

