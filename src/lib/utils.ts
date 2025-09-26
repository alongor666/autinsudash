import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { RawDataRow, Kpi, KPIKey, ChartDataPoint } from './types';
import { kpiData as defaultKpiData } from './data';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, unit: 'yuan' | 'ten_thousand' = 'ten_thousand') {
  const valueInUnit = unit === 'yuan' ? value : value / 10000;
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valueInUnit).replace('¥', '¥ ');
}

export function formatPercentage(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function calculateMetrics(data: RawDataRow[]) {
  const totalSignedPremium = data.reduce((acc, row) => acc + (row.signed_premium_yuan || 0), 0);
  const totalMaturedPremium = data.reduce((acc, row) => acc + (row.matured_premium_yuan || 0), 0);
  const totalReportedClaim = data.reduce((acc, row) => acc + (row.reported_claim_payment_yuan || 0), 0);
  const totalExpense = data.reduce((acc, row) => acc + (row.expense_amount_yuan || 0), 0);
  const totalMarginalContribution = data.reduce((acc, row) => acc + (row.marginal_contribution_amount_yuan || 0), 0);

  const maturedLossRatio = totalMaturedPremium > 0 ? totalReportedClaim / totalMaturedPremium : 0;
  const expenseRatio = totalSignedPremium > 0 ? totalExpense / totalSignedPremium : 0;
  const maturedMarginalContributionRate = totalMaturedPremium > 0 ? totalMarginalContribution / totalMaturedPremium : 0;

  return {
    signedPremium: totalSignedPremium,
    maturedLossRatio,
    expenseRatio,
    maturedMarginalContributionRate,
  };
}


export function calculateKPIs(currentData: RawDataRow[], previousData: RawDataRow[]): { [key in KPIKey]: Omit<Kpi, 'title' | 'id'> } {
  if (!currentData || currentData.length === 0) {
    return defaultKpiData;
  }
    
  const currentMetrics = calculateMetrics(currentData);
  const previousMetrics = calculateMetrics(previousData);

  const getChange = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? 1 : (current < 0 ? -1 : 0);
    }
    return (current - previous) / Math.abs(previous);
  };
  
  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    if (isFinite(change)) {
        return `${sign}${(change * 100).toFixed(1)}%`;
    }
    return 'N/A';
  };

  const signedPremiumChange = getChange(currentMetrics.signedPremium, previousMetrics.signedPremium);
  const maturedLossRatioChange = currentMetrics.maturedLossRatio - previousMetrics.maturedLossRatio; // Rate change is absolute
  const expenseRatioChange = currentMetrics.expenseRatio - previousMetrics.expenseRatio; // Rate change is absolute
  const maturedMarginalContributionRateChange = currentMetrics.maturedMarginalContributionRate - previousMetrics.maturedMarginalContributionRate; // Rate change is absolute


  return {
    signedPremium: {
      value: `${formatCurrency(currentMetrics.signedPremium, 'ten_thousand')}万`,
      change: formatChange(signedPremiumChange),
      changeType: signedPremiumChange >= 0 ? 'increase' : 'decrease',
      description: '较上周',
    },
    maturedLossRatio: {
      value: formatPercentage(currentMetrics.maturedLossRatio),
      change: `${(maturedLossRatioChange * 100).toFixed(2)}pp`,
      changeType: maturedLossRatioChange >= 0 ? 'increase' : 'decrease',
      description: '较上周',
    },
    expenseRatio: {
      value: formatPercentage(currentMetrics.expenseRatio),
      change: `${(expenseRatioChange * 100).toFixed(2)}pp`,
      changeType: expenseRatioChange >= 0 ? 'increase' : 'decrease',
      description: '较上周',
    },
    maturedMarginalContributionRate: {
      value: formatPercentage(currentMetrics.maturedMarginalContributionRate),
      change: `${(maturedMarginalContributionRateChange * 100).toFixed(2)}pp`,
      changeType: maturedMarginalContributionRateChange >= 0 ? 'increase' : 'decrease',
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
