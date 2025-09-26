import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { RawDataRow, Kpi, KPIKey, ChartDataPoint } from './types';
import { kpiData as defaultKpiData } from './data';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, unit: 'yuan' | 'ten_thousand' = 'ten_thousand') {
  const valueInYuan = unit === 'yuan' ? value : value / 10000;
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: unit === 'yuan' ? 0 : 2,
    maximumFractionDigits: unit === 'yuan' ? 0 : 2,
  }).format(valueInYuan).replace('¥', '¥ ');
}

export function formatPercentage(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

export function calculateKPIs(data: RawDataRow[]): { [key in KPIKey]: Omit<Kpi, 'title' | 'id'> } {
  if (data.length === 0) {
    return defaultKpiData;
  }

  const totalSignedPremium = data.reduce((acc, row) => acc + row.signed_premium_yuan, 0);
  const totalMaturedPremium = data.reduce((acc, row) => acc + row.matured_premium_yuan, 0);
  const totalReportedClaim = data.reduce((acc, row) => acc + row.reported_claim_payment_yuan, 0);
  const totalExpense = data.reduce((acc, row) => acc + row.expense_amount_yuan, 0);
  const totalMarginalContribution = data.reduce((acc, row) => acc + row.marginal_contribution_amount_yuan, 0);
  const totalPolicyCount = data.reduce((acc, row) => acc + row.policy_count, 0);

  const lossRatio = totalMaturedPremium > 0 ? totalReportedClaim / totalMaturedPremium : 0;
  const expenseRatio = totalSignedPremium > 0 ? totalExpense / totalSignedPremium : 0;
  const underwritingProfitMargin = totalMaturedPremium > 0 ? totalMarginalContribution / totalMaturedPremium : 0;

  return {
    totalPremium: {
      value: `${formatCurrency(totalSignedPremium, 'ten_thousand')}万`,
      change: '+20.1%', // Placeholder
      changeType: 'increase',
      description: '较上周',
    },
    lossRatio: {
      value: formatPercentage(lossRatio),
      change: '-1.2%', // Placeholder
      changeType: 'decrease',
      description: '较上周',
    },
    underwritingProfitMargin: {
      value: formatPercentage(underwritingProfitMargin),
      change: '+3.4%', // Placeholder
      changeType: 'increase',
      description: '较上周',
    },
    customerCount: { // Assuming policy count is customer count for now
      value: totalPolicyCount.toLocaleString(),
      change: '+50', // Placeholder
      changeType: 'increase',
      description: '较上周',
    },
  };
}

export function aggregateChartData(data: RawDataRow[]): ChartDataPoint[] {
  const weeklyData: { [week: number]: { signed_premium_yuan: number; reported_claim_payment_yuan: number } } = {};

  data.forEach(row => {
    if (!weeklyData[row.week_number]) {
      weeklyData[row.week_number] = { signed_premium_yuan: 0, reported_claim_payment_yuan: 0 };
    }
    weeklyData[row.week_number].signed_premium_yuan += row.signed_premium_yuan;
    weeklyData[row.week_number].reported_claim_payment_yuan += row.reported_claim_payment_yuan;
  });

  return Object.entries(weeklyData)
    .map(([week, values]) => ({
      week_number: parseInt(week, 10),
      ...values,
    }))
    .sort((a, b) => a.week_number - b.week_number);
}
