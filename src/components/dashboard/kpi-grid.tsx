import { kpiData } from '@/lib/data';
import { KpiCard } from './kpi-card';

type KpiGridProps = {
  highlightedKpis: string[];
};

export function KpiGrid({ highlightedKpis }: KpiGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi) => (
        <KpiCard
          key={kpi.title}
          title={kpi.title}
          value={kpi.value}
          change={kpi.change}
          changeType={kpi.changeType}
          description={kpi.description}
          highlighted={highlightedKpis.includes(kpi.title)}
        />
      ))}
    </div>
  );
}
