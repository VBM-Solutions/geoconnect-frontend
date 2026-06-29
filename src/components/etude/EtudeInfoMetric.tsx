import { ReactNode } from 'react';

interface EtudeInfoMetricProps {
  label: string;
  children: ReactNode;
}

export function EtudeInfoMetric({ label, children }: Readonly<EtudeInfoMetricProps>) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="font-bold text-slate-800">{children}</p>
    </div>
  );
}
