import React, { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';

interface ParametresSectionCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
}

export function ParametresSectionCard({ icon: Icon, title, description, children }: Readonly<ParametresSectionCardProps>) {
  return (
    <section className="space-y-5" aria-labelledby={`${title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}-title`}>
      <div className="flex items-start gap-2.5">
        <Icon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold text-slate-800" id={`${title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}-title`}>
            {title}
          </h2>
          {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>

      {children}
    </section>
  );
}

