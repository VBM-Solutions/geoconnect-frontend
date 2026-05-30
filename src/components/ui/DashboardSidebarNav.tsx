import React, { useMemo, useState } from 'react';
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export interface DashboardNavItem {
  id: string;
  label: string;
  count: number;
  icon?: React.ReactNode;
  hidden?: boolean;
}

export interface DashboardNavSection {
  id: string;
  title: string;
  items: DashboardNavItem[];
  defaultExpanded?: boolean;
}

interface DashboardSidebarNavProps {
  sections: DashboardNavSection[];
  activeItemId: string;
  onItemChange: (id: string) => void;
}

/**
 * Sidebar de navigation dashboard (desktop) + panneau mobile.
 */
export function DashboardSidebarNav({ sections, activeItemId, onItemChange }: Readonly<DashboardSidebarNavProps>) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const visibleSections = useMemo(
    () => sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => !item.hidden),
      }))
      .filter((section) => section.items.length > 0),
    [sections],
  );

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    return sections.reduce<Record<string, boolean>>((acc, section) => {
      acc[section.id] = section.defaultExpanded ?? true;
      return acc;
    }, {});
  });

  const handleItemClick = (id: string) => {
    onItemChange(id);
    setIsMobileOpen(false);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const renderSection = (section: DashboardNavSection) => {
    const expanded = expandedSections[section.id] ?? true;

    return (
      <section key={section.id} className="gc-surface-panel rounded-xl border border-slate-200/90 bg-white/90 shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={() => toggleSection(section.id)}
          className="gc-motion-fast w-full flex items-center justify-between px-3 py-2 border-b border-slate-100 transition-colors hover:bg-slate-50/80"
          aria-expanded={expanded}
          aria-controls={`dashboard-section-${section.id}`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{section.title}</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? '' : '-rotate-90'}`} />
        </button>

        {expanded && (
          <nav id={`dashboard-section-${section.id}`} className="p-2 space-y-1" aria-label={section.title}>
            {section.items.map((item) => {
              const isActive = activeItemId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`gc-motion-fast w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 ${
                    isActive
                      ? 'bg-linear-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-slate-600 border border-transparent hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <span className={`${isActive ? 'text-blue-600' : 'text-slate-400'}`}>{item.icon}</span>
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  <span
                    className={`inline-flex min-w-6 justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                      isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </nav>
        )}
      </section>
    );
  };

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="gc-motion-fast inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          aria-expanded={isMobileOpen}
          aria-controls="dashboard-mobile-sidebar"
        >
          {isMobileOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          Navigation
        </button>
      </div>

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/35 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        id="dashboard-mobile-sidebar"
        className={`gc-motion-base fixed left-0 top-14 bottom-0 z-50 w-[86vw] max-w-xs overflow-y-auto bg-slate-50/95 p-3 transition-transform lg:sticky lg:top-20 lg:z-auto lg:h-fit lg:w-72 lg:max-w-none lg:rounded-xl lg:border lg:border-slate-200 lg:bg-slate-50/80 lg:shadow-sm ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="space-y-3">{visibleSections.map(renderSection)}</div>
      </aside>
    </>
  );
}




