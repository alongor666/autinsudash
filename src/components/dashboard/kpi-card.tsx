import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { KPIKey } from '@/lib/types';
import { useData } from '@/contexts/data-context';

type KpiCardProps = {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  description: string;
  highlighted?: boolean;
  kpiKey?: KPIKey;
};

type DrillDownData = {
  label: string;
  value: string;
  description: string;
};

export function KpiCard({ title, value, change, changeType, description, highlighted = false, kpiKey }: KpiCardProps) {
  const isIncrease = changeType === 'increase';
  const [showDrillDown, setShowDrillDown] = useState(false);
  const { filteredData } = useData();

  const getDrillDownData = (): DrillDownData[] => {
    if (!filteredData.length || !kpiKey) return [];

    const totalSigned = filteredData.reduce((acc, row) => acc + (row.signed_premium_yuan || 0), 0);
    const totalMatured = filteredData.reduce((acc, row) => acc + (row.matured_premium_yuan || 0), 0);
    const totalClaim = filteredData.reduce((acc, row) => acc + (row.reported_claim_payment_yuan || 0), 0);
    const totalExpense = filteredData.reduce((acc, row) => acc + (row.expense_amount_yuan || 0), 0);
    const totalMarginal = filteredData.reduce((acc, row) => acc + (row.marginal_contribution_amount_yuan || 0), 0);
    const totalPolicies = filteredData.reduce((acc, row) => acc + (row.policy_count || 0), 0);
    const totalClaims = filteredData.reduce((acc, row) => acc + (row.claim_case_count || 0), 0);

    switch (kpiKey) {
      case 'signedPremium':
        return [
          { label: '满期保费', value: `${Math.round(totalMatured / 10000).toLocaleString('zh-CN')}万`, description: '满期保费总额' },
          { label: '保单件数', value: Math.round(totalPolicies).toLocaleString('zh-CN'), description: '保单总数量' },
          { label: '件均保费', value: `${Math.round(totalPolicies > 0 ? totalSigned / totalPolicies : 0).toLocaleString('zh-CN')}元`, description: '平均单保保费' }
        ];
      case 'maturedLossRatio':
        return [
          { label: '满期保费', value: `${Math.round(totalMatured / 10000).toLocaleString('zh-CN')}万`, description: '满期保费总额' },
          { label: '已报告赔款', value: `${Math.round(totalClaim / 10000).toLocaleString('zh-CN')}万`, description: '赔付总额' },
          { label: '案均赔款', value: `${Math.round(totalClaims > 0 ? totalClaim / totalClaims : 0).toLocaleString('zh-CN')}元`, description: '平均案件赔款' },
          { label: '满期出险率', value: `${(totalPolicies > 0 ? (totalClaims / totalPolicies) * 100 : 0).toFixed(1)}%`, description: '出险案件比例' }
        ];
      case 'expenseRatio':
        return [
          { label: '签单保费', value: `${Math.round(totalSigned / 10000).toLocaleString('zh-CN')}万`, description: '签单保费总额' },
          { label: '费用金额', value: `${Math.round(totalExpense / 10000).toLocaleString('zh-CN')}万`, description: '费用总额' },
          { label: '单均费用', value: `${Math.round(totalPolicies > 0 ? totalExpense / totalPolicies : 0).toLocaleString('zh-CN')}元`, description: '平均单保费用' }
        ];
      case 'maturedMarginalContributionRate':
        const lossRatio = totalMatured > 0 ? (totalClaim / totalMatured) * 100 : 0;
        const expenseRatio = totalSigned > 0 ? (totalExpense / totalSigned) * 100 : 0;
        const variableCostRatio = lossRatio + expenseRatio;
        return [
          { label: '变动成本率', value: `${variableCostRatio.toFixed(1)}%`, description: '赔付率+费用率' },
          { label: '边际贡献额', value: `${Math.round(totalMarginal / 10000).toLocaleString('zh-CN')}万`, description: '边际贡献总额' }
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
        highlighted && 'ring-2 ring-primary/60 shadow-[0_30px_80px_rgba(37,99,235,0.2)]',
        canDrillDown && 'cursor-pointer'
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{
        background:
          'radial-gradient(120% 120% at 100% 0%, rgba(37, 99, 235, 0.12), transparent), radial-gradient(160% 160% at 0% 100%, rgba(15, 23, 42, 0.08), transparent)'
      }} />
      <CardHeader
        className="relative z-10 flex flex-row items-center justify-between space-y-0 p-6 pb-0"
        onClick={() => canDrillDown && setShowDrillDown(!showDrillDown)}
      >
        <CardTitle className="text-base font-medium tracking-[-0.01em] text-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2 text-muted-foreground/70">
          {isIncrease ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {canDrillDown && (
            <ChevronRight className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              showDrillDown && "rotate-90"
            )} />
          )}
        </div>
      </CardHeader>
      <CardContent className="relative z-10 p-6 pt-6">
        <div className="text-[34px] font-semibold tracking-[-0.03em] text-foreground">{value}</div>
        <p className="mt-1 text-sm text-muted-foreground/80">
          <span className={cn(changeType === 'decrease' && 'text-destructive')}>
            {change}
          </span>
          {' '}{description}
        </p>

        {showDrillDown && drillDownData.length > 0 && (
          <div className="mt-6 space-y-3 rounded-2xl border border-white/50 bg-white/70 p-4 shadow-inner">
            <div className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground/70">
              下钻数据
            </div>
            {drillDownData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground/80">{item.label}</span>
                <div className="text-right text-muted-foreground/90">
                  <div className="text-sm font-medium text-foreground">{item.value}</div>
                  <div className="text-[10px]">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
