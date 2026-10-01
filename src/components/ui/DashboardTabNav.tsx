import React from 'react';

export interface DashboardTab {
  id: string;
  label: string;
  count: number;
  hidden?: boolean;
}

interface DashboardTabNavProps {
  readonly tabs: DashboardTab[];
  readonly activeTab: string;
  readonly onTabChange: (id: string) => void;
}

/**
 * Barre d'onglets partagée entre les tableaux de bord (client & BE).
 */
export function DashboardTabNav({ tabs, activeTab, onTabChange }: DashboardTabNavProps) {
  return (
    <div className="border-b border-slate-200">
      <nav className="-mb-px flex space-x-6">
        {tabs.filter(tab => !tab.hidden).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 text-xs font-bold uppercase tracking-wider flex items-center
                ${isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                }`}
            >
              {tab.label}
              <span className={`ml-2 py-0.5 px-2 rounded-full text-[10px] ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

