import type { KPIKey, Kpi, RawDataRow } from '@/lib/types';
import { kpiData as defaultKpiData } from './data';
import { formatCurrency, formatPercentage } from './utils';

type MetricSummary = {
  signedPremium: number;
  maturedLossRatio: number;
  expenseRatio: number;
  maturedMarginalContributionRate: number;
  maturedPremium: number;
  reportedClaim: number;
  expenseAmount: number;
  marginalContributionAmount: number;
};

type KpiCalculatorOptions = {
  description: string;
};

function summarizeMetrics(rows: RawDataRow[]): MetricSummary {
  if (!rows.length) {
    return {
      signedPremium: 0,
      maturedLossRatio: 0,
      expenseRatio: 0,
      maturedMarginalContributionRate: 0,
      maturedPremium: 0,
      reportedClaim: 0,
      expenseAmount: 0,
      marginalContributionAmount: 0,
    };
  }

  const signedPremium = rows.reduce((acc, row) => acc + (row.signed_premium_yuan || 0), 0);
  const maturedPremium = rows.reduce((acc, row) => acc + (row.matured_premium_yuan || 0), 0);
  const reportedClaim = rows.reduce((acc, row) => acc + (row.reported_claim_payment_yuan || 0), 0);
  const expenseAmount = rows.reduce((acc, row) => acc + (row.expense_amount_yuan || 0), 0);
  const marginalContributionAmount = rows.reduce((acc, row) => acc + (row.marginal_contribution_amount_yuan || 0), 0);

  const maturedLossRatio = maturedPremium > 0 ? reportedClaim / maturedPremium : 0;
  const expenseRatio = signedPremium > 0 ? expenseAmount / signedPremium : 0;
  const maturedMarginalContributionRate = maturedPremium > 0 ? marginalContributionAmount / maturedPremium : 0;

  return {
    signedPremium,
    maturedPremium,
    reportedClaim,
    expenseAmount,
    marginalContributionAmount,
    maturedLossRatio,
    expenseRatio,
    maturedMarginalContributionRate,
  };
}

function formatDiffAmount(diff: number) {
  return `${diff >= 0 ? '+' : ''}${Math.round(diff / 10000).toLocaleString('zh-CN')}万`;
}

function formatDiffPoint(diff: number) {
  return `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}pp`;
}

function computeChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 1 : current < 0 ? -1 : 0;
  }
  return (current - previous) / Math.abs(previous);
}

function formatRelativeChange(change: number) {
  const sign = change > 0 ? '+' : '';
  if (!Number.isFinite(change)) {
    return 'N/A';
  }
  return `${sign}${(change * 100).toFixed(2)}%`;
}

function buildKpiData(current: MetricSummary, previous: MetricSummary | null, options: KpiCalculatorOptions) {
  if (!current.signedPremium && !current.maturedPremium && !current.expenseAmount && !current.reportedClaim) {
    return defaultKpiData;
  }

  const hasPrevious = previous !== null;

  const signedPremiumChange = previous ? computeChange(current.signedPremium, previous.signedPremium) : 0;
  const signedPremiumDiff = previous ? current.signedPremium - previous.signedPremium : 0;

  const maturedLossRatioChange = previous ? computeChange(current.maturedLossRatio, previous.maturedLossRatio) : 0;
  const maturedLossRatioDiff = previous ? (current.maturedLossRatio - previous.maturedLossRatio) * 100 : 0;

  const expenseRatioChange = previous ? computeChange(current.expenseRatio, previous.expenseRatio) : 0;
  const expenseRatioDiff = previous ? (current.expenseRatio - previous.expenseRatio) * 100 : 0;

  const marginalContributionRateChange = previous
    ? computeChange(current.maturedMarginalContributionRate, previous.maturedMarginalContributionRate)
    : 0;
  const marginalContributionRateDiff = previous
    ? (current.maturedMarginalContributionRate - previous.maturedMarginalContributionRate) * 100
    : 0;

  const signedPremiumValue = `${formatCurrency(current.signedPremium, 'ten_thousand')}万`;
  const signedPremiumPrevious = previous
    ? `${formatCurrency(previous.signedPremium, 'ten_thousand')}万`
    : undefined;

  const maturedLossRatioValue = formatPercentage(current.maturedLossRatio);
  const maturedLossRatioPrevious = previous ? formatPercentage(previous.maturedLossRatio) : undefined;

  const expenseRatioValue = formatPercentage(current.expenseRatio);
  const expenseRatioPrevious = previous ? formatPercentage(previous.expenseRatio) : undefined;

  const marginalContributionRateValue = formatPercentage(current.maturedMarginalContributionRate);
  const marginalContributionRatePrevious = previous
    ? formatPercentage(previous.maturedMarginalContributionRate)
    : undefined;

  return {
    signedPremium: {
      value: signedPremiumValue,
      change: hasPrevious ? formatRelativeChange(signedPremiumChange) : 'N/A',
      changeType: signedPremiumDiff >= 0 ? 'increase' : 'decrease',
      description: options.description,
      previousValue: signedPremiumPrevious,
      changeValue: hasPrevious ? formatDiffAmount(signedPremiumDiff) : undefined,
      currentRawValue: current.signedPremium,
      previousRawValue: previous?.signedPremium,
    },
    maturedLossRatio: {
      value: maturedLossRatioValue,
      change: hasPrevious ? formatRelativeChange(maturedLossRatioChange) : 'N/A',
      changeType: maturedLossRatioDiff >= 0 ? 'increase' : 'decrease',
      description: options.description,
      previousValue: maturedLossRatioPrevious,
      changeValue: hasPrevious ? formatDiffPoint(maturedLossRatioDiff) : undefined,
      currentRawValue: current.maturedLossRatio * 100,
      previousRawValue: previous ? previous.maturedLossRatio * 100 : undefined,
    },
    expenseRatio: {
      value: expenseRatioValue,
      change: hasPrevious ? formatRelativeChange(expenseRatioChange) : 'N/A',
      changeType: expenseRatioDiff >= 0 ? 'increase' : 'decrease',
      description: options.description,
      previousValue: expenseRatioPrevious,
      changeValue: hasPrevious ? formatDiffPoint(expenseRatioDiff) : undefined,
      currentRawValue: current.expenseRatio * 100,
      previousRawValue: previous ? previous.expenseRatio * 100 : undefined,
    },
    maturedMarginalContributionRate: {
      value: marginalContributionRateValue,
      change: hasPrevious ? formatRelativeChange(marginalContributionRateChange) : 'N/A',
      changeType: marginalContributionRateDiff >= 0 ? 'increase' : 'decrease',
      description: options.description,
      previousValue: marginalContributionRatePrevious,
      changeValue: hasPrevious ? formatDiffPoint(marginalContributionRateDiff) : undefined,
      currentRawValue: current.maturedMarginalContributionRate * 100,
      previousRawValue: previous ? previous.maturedMarginalContributionRate * 100 : undefined,
    },
  } satisfies { [key in KPIKey]: Omit<Kpi, 'title' | 'id'> };
}

export function calculateWeeklyKPIs(currentRows: RawDataRow[], previousRows: RawDataRow[]): {
  [key in KPIKey]: Omit<Kpi, 'title' | 'id'>;
} {
  const current = summarizeMetrics(currentRows);
  const previous = previousRows.length ? summarizeMetrics(previousRows) : null;
  return buildKpiData(current, previous, { description: '较上周' });
}

export function calculateYearToDateKPIs(currentRows: RawDataRow[], previousRows: RawDataRow[]): {
  [key in KPIKey]: Omit<Kpi, 'title' | 'id'>;
} {
  const current = summarizeMetrics(currentRows);
  const previous = previousRows.length ? summarizeMetrics(previousRows) : null;
  return buildKpiData(current, previous, { description: '较前一周累计' });
}
