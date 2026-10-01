import React from 'react';

export const COLOR_MAP: Record<string, string> = {
  blue:   'bg-blue-50 border-blue-200 text-blue-800',
  orange: 'bg-orange-50 border-orange-200 text-orange-800',
  teal:   'bg-teal-50 border-teal-200 text-teal-800',
  green:  'bg-green-50 border-green-200 text-green-800',
  slate:  'bg-slate-50 border-slate-200 text-slate-700',
};

interface InfoMsgProps {
  readonly icon: React.ReactNode;
  readonly color: string;
  readonly children: React.ReactNode;
}

export function InfoMsg({ icon, color, children }: InfoMsgProps) {
  return (
    <div className={`flex items-start gap-2 p-2.5 rounded-lg border text-[11px] font-medium ${COLOR_MAP[color] ?? COLOR_MAP.slate}`}>
      <span className="shrink-0 mt-0.5">{icon}</span>
      <span>{children}</span>
    </div>
  );
}

