import { Archive, FileText, FlaskConical } from 'lucide-react';
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useClientDashboardData } from '../../hooks/useClientDashboardData';
import { DashboardSidebarNav, type DashboardNavSection } from '../ui/DashboardSidebarNav';

export type ClientSpaceTab = 'DEMANDES' | 'ETUDES' | 'ARCHIVES';

export function ClientSpaceLayout() {
  const dashboardData = useClientDashboardData();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const activeItemId: ClientSpaceTab = location.pathname.includes('/etude/')
    ? (searchParams.get('source') === 'ARCHIVES' ? 'ARCHIVES' : 'ETUDES')
    : location.pathname.includes('/demande/')
      ? 'DEMANDES'
      : (searchParams.get('tab') as ClientSpaceTab | null) ?? 'DEMANDES';

  const sections: DashboardNavSection[] = [{
    id: 'mon-espace',
    title: 'Mon espace',
    defaultExpanded: true,
    items: [
      { id: 'DEMANDES', label: 'Mes demandes', count: dashboardData.demandeTotal, icon: <FileText className="h-4 w-4" /> },
      { id: 'ETUDES', label: 'Mes études', count: dashboardData.activeEtudeTotal, icon: <FlaskConical className="h-4 w-4" /> },
      { id: 'ARCHIVES', label: 'Mes archives', count: dashboardData.archivedEtudeTotal, icon: <Archive className="h-4 w-4" /> },
    ],
  }];

  return (
    <div className="min-h-[calc(100vh-7rem)] lg:pl-16">
      <DashboardSidebarNav
        sections={sections}
        activeItemId={activeItemId}
        onItemChange={tab => navigate(`/client/dashboard?tab=${tab}`)}
        fullHeight
      />
      <div className="min-w-0">
        <Outlet context={dashboardData} />
      </div>
    </div>
  );
}
