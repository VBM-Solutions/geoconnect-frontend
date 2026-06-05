import React from 'react';

interface DashboardMetricCardProps {
  readonly label: string;
  readonly value: number;
  readonly icon: React.ReactNode;
  readonly valueClassName: string;
}

export function DashboardMetricCard({ label, value, icon, valueClassName }: Readonly<DashboardMetricCardProps>) {
  return (
    <div className="gc-motion-base rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur transition-transform hover:-translate-y-0.5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <span className="rounded-md bg-slate-100 p-1.5 text-slate-500">{icon}</span>
      </div>
      <p className={`text-xl font-bold ${valueClassName}`}>{value}</p>
    </div>
  );
}

