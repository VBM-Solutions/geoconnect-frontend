import React, { type ReactNode } from 'react';
import { Settings } from 'lucide-react';

interface ParametresPageShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function ParametresPageShell({ title, subtitle, children }: Readonly<ParametresPageShellProps>) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
          <Settings className="w-5 h-5 text-slate-300" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-8">{children}</div>
    </div>
  );
}

