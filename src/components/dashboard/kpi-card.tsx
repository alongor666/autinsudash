import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { KPIKey, RawDataRow } from '@/lib/types';
import { useData } from '@/contexts/data-context';

type KpiCardProps = {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  description: string;
  highlighted?: boolean;
  kpiKey?: KPIKey;
  previousValue?: string;
  currentWeekData?: RawDataRow[];
  previousWeekData?: RawDataRow[];
};

type DrillDownData = {
  label: string;
  value: string;
  description: string;
  change?: string;
  changeValue?: string;
  changeType?: 'increase' | 'decrease';
};

export function KpiCard({ title, value, change, changeType, description, highlighted = false, kpiKey, previousValue, currentWeekData, previousWeekData }: KpiCardProps) {
  const isIncrease = changeType === 'increase';
  const [showDrillDown, setShowDrillDown] = useState(false);
  const { filteredData } = useData();

  const getDrillDownData = (): DrillDownData[] => {
    const dataToUse = currentWeekData && currentWeekData.length > 0 ? currentWeekData : filteredData;
    const prevData = previousWeekData || [];

    if (!dataToUse.length || !kpiKey) return [];

    // 计算本周数据
    const totalSigned = dataToUse.reduce((acc, row) => acc + (row.signed_premium_yuan || 0), 0);
    const totalMatured = dataToUse.reduce((acc, row) => acc + (row.matured_premium_yuan || 0), 0);
    const totalClaim = dataToUse.reduce((acc, row) => acc + (row.reported_claim_payment_yuan || 0), 0);
    const totalExpense = dataToUse.reduce((acc, row) => acc + (row.expense_amount_yuan || 0), 0);
    const totalMarginal = dataToUse.reduce((acc, row) => acc + (row.marginal_contribution_amount_yuan || 0), 0);
    const totalPolicies = dataToUse.reduce((acc, row) => acc + (row.policy_count || 0), 0);
    const totalClaims = dataToUse.reduce((acc, row) => acc + (row.claim_case_count || 0), 0);

    // 计算上周数据
    const prevSigned = prevData.reduce((acc, row) => acc + (row.signed_premium_yuan || 0), 0);
    const prevMatured = prevData.reduce((acc, row) => acc + (row.matured_premium_yuan || 0), 0);
    const prevClaim = prevData.reduce((acc, row) => acc + (row.reported_claim_payment_yuan || 0), 0);
    const prevExpense = prevData.reduce((acc, row) => acc + (row.expense_amount_yuan || 0), 0);
    const prevMarginal = prevData.reduce((acc, row) => acc + (row.marginal_contribution_amount_yuan || 0), 0);
    const prevPolicies = prevData.reduce((acc, row) => acc + (row.policy_count || 0), 0);
    const prevClaims = prevData.reduce((acc, row) => acc + (row.claim_case_count || 0), 0);

    const formatChange = (current: number, previous: number, isRate: boolean = false): { change: string, changeValue: string, changeType: 'increase' | 'decrease' } | undefined => {
      if (!prevData.length || previous === 0) return undefined;
      const diff = current - previous;
      const pct = (diff / previous) * 100;
      return {
        change: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`,
        changeValue: isRate ? `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}pp` : `${diff >= 0 ? '+' : ''}${Math.round(diff / 10000).toLocaleString('zh-CN')}万`,
        changeType: diff >= 0 ? 'increase' : 'decrease'
      };
    };

    switch (kpiKey) {
      case 'signedPremium':
        const avgPremium = totalPolicies > 0 ? totalSigned / totalPolicies : 0;
        const prevAvgPremium = prevPolicies > 0 ? prevSigned / prevPolicies : 0;
        return [
          { label: '满期保费', value: `${Math.round(totalMatured / 10000).toLocaleString('zh-CN')}万`, description: '满期保费总额', ...formatChange(totalMatured, prevMatured) },
          { label: '保单件数', value: Math.round(totalPolicies).toLocaleString('zh-CN'), description: '保单总数量', ...(prevData.length > 0 ? {
            change: `${((totalPolicies - prevPolicies) / prevPolicies * 100).toFixed(2)}%`,
            changeValue: `${totalPolicies - prevPolicies >= 0 ? '+' : ''}${Math.round(totalPolicies - prevPolicies).toLocaleString('zh-CN')}件`,
            changeType: totalPolicies - prevPolicies >= 0 ? 'increase' as const : 'decrease' as const
          } : {}) },
          { label: '件均保费', value: `${Math.round(avgPremium).toLocaleString('zh-CN')}元`, description: '平均单保保费', ...(prevData.length > 0 && prevAvgPremium > 0 ? {
            change: `${((avgPremium - prevAvgPremium) / prevAvgPremium * 100).toFixed(2)}%`,
            changeValue: `${avgPremium - prevAvgPremium >= 0 ? '+' : ''}${Math.round(avgPremium - prevAvgPremium).toLocaleString('zh-CN')}元`,
            changeType: avgPremium - prevAvgPremium >= 0 ? 'increase' as const : 'decrease' as const
          } : {}) }
        ];
      case 'maturedLossRatio':
        const avgClaim = totalClaims > 0 ? totalClaim / totalClaims : 0;
        const prevAvgClaim = prevClaims > 0 ? prevClaim / prevClaims : 0;
        const incidentRate = totalPolicies > 0 ? (totalClaims / totalPolicies) * 100 : 0;
        const prevIncidentRate = prevPolicies > 0 ? (prevClaims / prevPolicies) * 100 : 0;
        return [
          { label: '满期保费', value: `${Math.round(totalMatured / 10000).toLocaleString('zh-CN')}万`, description: '满期保费总额', ...formatChange(totalMatured, prevMatured) },
          { label: '已报告赔款', value: `${Math.round(totalClaim / 10000).toLocaleString('zh-CN')}万`, description: '赔付总额', ...formatChange(totalClaim, prevClaim) },
          { label: '案均赔款', value: `${Math.round(avgClaim).toLocaleString('zh-CN')}元`, description: '平均案件赔款', ...(prevData.length > 0 && prevAvgClaim > 0 ? {
            change: `${((avgClaim - prevAvgClaim) / prevAvgClaim * 100).toFixed(2)}%`,
            changeValue: `${avgClaim - prevAvgClaim >= 0 ? '+' : ''}${Math.round(avgClaim - prevAvgClaim).toLocaleString('zh-CN')}元`,
            changeType: avgClaim - prevAvgClaim >= 0 ? 'increase' as const : 'decrease' as const
          } : {}) },
          { label: '满期出险率', value: `${incidentRate.toFixed(2)}%`, description: '出险案件比例', ...formatChange(incidentRate, prevIncidentRate, true) }
        ];
      case 'expenseRatio':
        const avgExpense = totalPolicies > 0 ? totalExpense / totalPolicies : 0;
        const prevAvgExpense = prevPolicies > 0 ? prevExpense / prevPolicies : 0;
        return [
          { label: '签单保费', value: `${Math.round(totalSigned / 10000).toLocaleString('zh-CN')}万`, description: '签单保费总额', ...formatChange(totalSigned, prevSigned) },
          { label: '费用金额', value: `${Math.round(totalExpense / 10000).toLocaleString('zh-CN')}万`, description: '费用总额', ...formatChange(totalExpense, prevExpense) },
          { label: '单均费用', value: `${Math.round(avgExpense).toLocaleString('zh-CN')}元`, description: '平均单保费用', ...(prevData.length > 0 && prevAvgExpense > 0 ? {
            change: `${((avgExpense - prevAvgExpense) / prevAvgExpense * 100).toFixed(2)}%`,
            changeValue: `${avgExpense - prevAvgExpense >= 0 ? '+' : ''}${Math.round(avgExpense - prevAvgExpense).toLocaleString('zh-CN')}元`,
            changeType: avgExpense - prevAvgExpense >= 0 ? 'increase' as const : 'decrease' as const
          } : {}) }
        ];
      case 'maturedMarginalContributionRate':
        const lossRatio = totalMatured > 0 ? (totalClaim / totalMatured) * 100 : 0;
        const expenseRatio = totalSigned > 0 ? (totalExpense / totalSigned) * 100 : 0;
        const variableCostRatio = lossRatio + expenseRatio;
        const prevLossRatio = prevMatured > 0 ? (prevClaim / prevMatured) * 100 : 0;
        const prevExpenseRatio = prevSigned > 0 ? (prevExpense / prevSigned) * 100 : 0;
        const prevVariableCostRatio = prevLossRatio + prevExpenseRatio;
        return [
          { label: '变动成本率', value: `${variableCostRatio.toFixed(2)}%`, description: '赔付率+费用率', ...formatChange(variableCostRatio, prevVariableCostRatio, true) },
          { label: '边际贡献额', value: `${Math.round(totalMarginal / 10000).toLocaleString('zh-CN')}万`, description: '边际贡献总额', ...formatChange(totalMarginal, prevMarginal) }
        ];
      default:
        return [];
    }
  };

  const drillDownData = getDrillDownData();
  const canDrillDown = drillDownData.length > 0;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(15,23,42,0.18)]',
        highlighted && 'ring-2 ring-primary/60 shadow-[0_30px_80px_rgba(109,40,217,0.18)]',
        canDrillDown && 'cursor-pointer'
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{
        background:
          'radial-gradient(120% 120% at 100% 0%, rgba(109, 40, 217, 0.12), transparent), radial-gradient(160% 160% at 0% 100%, rgba(15, 23, 42, 0.08), transparent)'
      }} />
      <CardHeader
        className="relative z-10 flex flex-row items-center justify-between space-y-0 p-6 pb-0"
        onClick={() => canDrillDown && setShowDrillDown(!showDrillDown)}
      >
        <CardTitle className="text-base font-medium tracking-[-0.01em] text-foreground">
          {title}
        </CardTitle>
        {canDrillDown && (
          <ChevronRight className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            showDrillDown && "rotate-90"
          )} />
        )}
      </CardHeader>
      <CardContent className="relative z-10 p-6 pt-6">
        <div className="space-y-2">
          <div className="flex items-baseline gap-3">
            <div className="text-[34px] font-semibold tracking-[-0.03em] text-foreground">{value}</div>
            {previousValue && (
              <div className="text-sm text-muted-foreground/60">
                上周: {previousValue}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
              changeType === 'increase'
                ? 'bg-violet-50 text-violet-700'
                : 'bg-slate-50 text-slate-700'
            )}>
              {isIncrease ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {change}
            </span>
            <span className="text-xs text-muted-foreground/70">{description}</span>
          </div>
        </div>

        {showDrillDown && drillDownData.length > 0 && (
          <div className="mt-6 space-y-3 rounded-2xl border panel-surface p-4 shadow-inner">
            <div className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground/70">
              下钻数据
            </div>
            {drillDownData.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground/80">{item.label}</span>
                  <div className="text-right text-muted-foreground/90">
                    <div className="text-sm font-medium text-foreground">{item.value}</div>
                  </div>
                </div>
                {item.change && item.changeValue && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground/60">{item.description}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        'inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-medium',
                        item.changeType === 'increase'
                          ? 'bg-violet-50 text-violet-600'
                          : 'bg-slate-50 text-slate-600'
                      )}>
                        {item.changeType === 'increase' ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                        {item.change}
                      </span>
                      <span className="text-muted-foreground/70">{item.changeValue}</span>
                    </div>
                  </div>
                )}
                {!item.change && (
                  <div className="text-[10px] text-right text-muted-foreground/60">{item.description}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
