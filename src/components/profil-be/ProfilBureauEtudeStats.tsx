import { CheckCircle2, FileCheck2, FileText, Send } from 'lucide-react';
import { StatistiquesActiviteBureauEtudeDTO } from '../../types';
import { Card, CardContent } from '../ui/Card';

interface ProfilBureauEtudeStatsProps {
  stats: StatistiquesActiviteBureauEtudeDTO;
}

export function ProfilBureauEtudeStats({ stats }: Readonly<ProfilBureauEtudeStatsProps>) {
  const metrics = [
    {
      label: 'Demandes traitées',
      value: stats.nombreDemandesRepondues,
      detail: 'demandes distinctes',
      icon: FileText,
    },
    {
      label: 'Propositions envoyées',
      value: stats.nombrePropositionsEnvoyees,
      detail: `${stats.nombrePropositionsAcceptees} acceptée${stats.nombrePropositionsAcceptees > 1 ? 's' : ''}`,
      icon: Send,
    },
    {
      label: 'Taux d’acceptation',
      value: `${Math.round(stats.tauxAcceptation)} %`,
      detail: 'sur les propositions',
      icon: CheckCircle2,
    },
    {
      label: 'Rapports rendus',
      value: stats.nombreRapportsRendus,
      detail: `${stats.nombreRapportsRendusMoisCourant} ce mois-ci`,
      icon: FileCheck2,
    },
  ];

  return (
    <section aria-labelledby="activite-title">
      <div className="mb-3">
        <h2 id="activite-title" className="text-base font-bold text-slate-900">Votre activité</h2>
        <p className="text-xs text-slate-500">Ces données restent privées et ne sont pas affichées aux particuliers.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, detail, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
                <p className="mt-1 text-[11px] text-slate-500">{detail}</p>
              </div>
              <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
