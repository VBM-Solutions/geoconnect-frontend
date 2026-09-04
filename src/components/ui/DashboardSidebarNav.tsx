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
  fullHeight?: boolean;
}

/**
 * Sidebar de navigation dashboard (desktop) + panneau mobile.
 */
export function DashboardSidebarNav({ sections, activeItemId, onItemChange, fullHeight = false }: Readonly<DashboardSidebarNavProps>) {
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

    const items = (
      <nav
        id={`dashboard-section-${section.id}`}
        className={fullHeight ? 'space-y-2 px-2 pt-5 lg:pt-20' : 'space-y-1 p-2'}
        aria-label={section.title}
      >
        {section.items.map((item) => {
          const isActive = activeItemId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`gc-motion-fast flex w-full items-center rounded-lg border py-2.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 ${fullHeight ? 'gap-3 px-3' : 'gap-2 px-2.5 text-left'} ${
                isActive
                  ? 'border-[#b8cf83] bg-[#f3f7e9] text-[#58742d] shadow-sm'
                  : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white/80'
              }`}
            >
              <span className={`shrink-0 ${isActive ? 'text-[#688239]' : 'text-slate-400'}`}>{item.icon}</span>
              <span className={`min-w-0 flex-1 overflow-hidden whitespace-nowrap text-left text-sm font-medium ${fullHeight ? 'transition-[max-width,opacity] duration-200 lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-48 lg:group-hover/sidebar:opacity-100' : ''}`}>
                {item.label}
              </span>
              <span className={`inline-flex shrink-0 justify-center overflow-hidden rounded-full py-0.5 text-[11px] font-bold ${fullHeight ? 'min-w-6 px-1.5 transition-[max-width,opacity,padding] duration-200 lg:max-w-0 lg:min-w-0 lg:px-0 lg:opacity-0 lg:group-hover/sidebar:max-w-12 lg:group-hover/sidebar:min-w-6 lg:group-hover/sidebar:px-1.5 lg:group-hover/sidebar:opacity-100' : 'min-w-6 px-1.5'} ${
                isActive ? 'bg-[#e4edcf] text-[#58742d]' : 'bg-slate-100 text-slate-500'
              }`}>
                {item.count}
              </span>
            </button>
          );
        })}
      </nav>
    );

    if (fullHeight) {
      return <React.Fragment key={section.id}>{items}</React.Fragment>;
    }

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

        {expanded && items}
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
        className={`group/sidebar fixed bottom-0 left-0 top-14 z-50 w-[86vw] max-w-xs overflow-x-hidden overflow-y-auto bg-[#f7f4ed]/98 p-3 shadow-xl transition-[width,transform] duration-300 ease-out lg:z-30 lg:max-w-none ${fullHeight ? 'lg:top-0 lg:bottom-0 lg:w-16 lg:border-r lg:border-stone-200 lg:p-1 lg:shadow-sm lg:hover:w-72' : 'lg:sticky lg:top-20 lg:h-fit lg:w-72 lg:rounded-xl lg:border lg:border-slate-200 lg:bg-slate-50/80 lg:shadow-sm'} ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className={fullHeight ? 'h-full' : 'space-y-3'}>{visibleSections.map(renderSection)}</div>
      </aside>
    </>
  );
}




