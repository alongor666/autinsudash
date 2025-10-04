'use client';
import { kpiMeta } from '@/lib/data';
import { KpiCard } from './kpi-card';
import type { KPIKey } from '@/lib/types';
import { useData } from '@/contexts/data-context';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { useMemo } from 'react';

export function KpiGrid() {
  const { kpiData, highlightedKpis, filteredData } = useData();

  const kpiInsight = useMemo(() => {
    if (!filteredData.length) {
      return "当前无数据可分析";
    }

    // 计算核心指标
    const totalSigned = filteredData.reduce((acc, row) => acc + (row.signed_premium_yuan || 0), 0);
    const totalMatured = filteredData.reduce((acc, row) => acc + (row.matured_premium_yuan || 0), 0);
    const totalClaim = filteredData.reduce((acc, row) => acc + (row.reported_claim_payment_yuan || 0), 0);
    const totalExpense = filteredData.reduce((acc, row) => acc + (row.expense_amount_yuan || 0), 0);
    const totalMarginal = filteredData.reduce((acc, row) => acc + (row.marginal_contribution_amount_yuan || 0), 0);

    const lossRatio = totalMatured > 0 ? (totalClaim / totalMatured) * 100 : 0;
    const expenseRatio = totalSigned > 0 ? (totalExpense / totalSigned) * 100 : 0;
    const marginalRate = totalMatured > 0 ? (totalMarginal / totalMatured) * 100 : 0;

    // 分析需要关注的问题
    const issues = [];
    if (lossRatio > 70) issues.push("赔付率超高");
    if (expenseRatio > 18) issues.push("费用率偏高");
    if (marginalRate < 8) issues.push("边际贡献率偏低");

    if (issues.length > 0) {
      return `经营效率待提升，重点关注${issues.join("、")}问题`;
    }

    if (marginalRate > 12) {
      return "经营效率良好，保持稳健发展态势";
    }

    return "经营指标总体健康，有进一步优化空间";
  }, [filteredData]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>KPI看板：{kpiInsight}</CardTitle>
        </CardHeader>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(kpiData) as KPIKey[]).map((key) => {
          const kpi = kpiData[key];
          const meta = kpiMeta[key];
          return (
            <KpiCard
              key={key}
              kpiKey={key}
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
    </div>
  );
}
