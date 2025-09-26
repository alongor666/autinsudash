import { kpiData, kpiMeta } from '@/lib/data';
import { KpiCard } from './kpi-card';
import type { KPIKey } from '@/lib/types';

type KpiGridProps = {
  highlightedKpis: string[];
};

export function KpiGrid({ highlightedKpis }: KpiGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {(Object.keys(kpiData) as KPIKey[]).map((key) => {
        const kpi = kpiData[key];
        const meta = kpiMeta[key];
        return (
          <KpiCard
            key={key}
            title={meta.title}
            value={kpi.value}
            change={kpi.change}
            changeType={kpi.changeType}
            description={kpi.description}
            highlighted={highlightedKpis.includes(meta.title)}
          />
        );
      })}
    </div>
  );
}
