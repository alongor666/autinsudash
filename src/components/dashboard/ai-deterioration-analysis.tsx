'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Brain, TrendingDown, TrendingUp } from 'lucide-react';
import type { RawDataRow } from '@/lib/types';

const DIMENSION_SEQUENCE = [
  { key: 'business_type_category', label: '业务类型' },
  { key: 'third_level_organization', label: '三级机构' },
  { key: 'terminal_source', label: '终端来源' },
  { key: 'vehicle_insurance_grade', label: '风险评分' },
] as const;

const SIGNED_DROP_THRESHOLD = -0.5; // 单位：万
const RATIO_RISE_THRESHOLD = 0.1; // 单位：pp

type DimensionKey = typeof DIMENSION_SEQUENCE[number]['key'];

type AggregatedStats = {
  signed: number;
  matured: number;
  claim: number;
  expense: number;
  policyCount: number;
  claimCases: number;
};

type DimensionItem = {
  value: string;
  changeDisplay: string;
  detail: string;
};

type DimensionAnalysis = {
  dimension: DimensionKey;
  dimensionLabel: string;
  items: DimensionItem[];
};

type MetricInsight = {
  key: 'signedPremium' | 'lossRatio' | 'expenseRatio';
  label: string;
  directionText: '上升' | '下降';
  absoluteChangeDisplay: string;
  relativeChangeDisplay: string;
  currentDisplay: string;
  previousDisplay: string;
  dimensionAnalyses: DimensionAnalysis[];
  lossRatioBreakdown?: {
    incidentRateChange: number;
    avgClaimChange: number;
  };
};

const createEmptyStats = (): AggregatedStats => ({
  signed: 0,
  matured: 0,
  claim: 0,
  expense: 0,
  policyCount: 0,
  claimCases: 0,
});

const safeLabel = (value: unknown) => {
  const formatted = String(value ?? '未知').trim();
  return formatted || '未知';
};

const aggregateStats = (data: RawDataRow[]): AggregatedStats => {
  return data.reduce<AggregatedStats>((acc, row) => {
    acc.signed += row.signed_premium_yuan || 0;
    acc.matured += row.matured_premium_yuan || 0;
    acc.claim += row.reported_claim_payment_yuan || 0;
    acc.expense += row.expense_amount_yuan || 0;
    acc.policyCount += row.policy_count || 0;
    acc.claimCases += row.claim_case_count || 0;
    return acc;
  }, createEmptyStats());
};

const aggregateDimensionStats = (data: RawDataRow[], dimensionKey: DimensionKey) => {
  const map = new Map<string, AggregatedStats>();

  data.forEach((row) => {
    const label = safeLabel(row[dimensionKey]);
    const stats = map.get(label) ?? createEmptyStats();
    stats.signed += row.signed_premium_yuan || 0;
    stats.matured += row.matured_premium_yuan || 0;
    stats.claim += row.reported_claim_payment_yuan || 0;
    stats.expense += row.expense_amount_yuan || 0;
    stats.policyCount += row.policy_count || 0;
    stats.claimCases += row.claim_case_count || 0;
    map.set(label, stats);
  });

  return map;
};

const formatWan = (value: number) => `${Math.round(value).toLocaleString('zh-CN')}万`;
const formatWanDelta = (value: number) => `${value >= 0 ? '+' : ''}${Math.round(value).toLocaleString('zh-CN')}万`;
const formatPoint = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}pp`;
const formatPointMagnitude = (value: number) => `${Math.abs(value).toFixed(2)}pp`;
const formatRelative = (value: number | null) => (value === null ? '—' : `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`);

const computeLossRatio = (stats: AggregatedStats) => (stats.matured > 0 ? (stats.claim / stats.matured) * 100 : 0);
const computeExpenseRatio = (stats: AggregatedStats) => (stats.signed > 0 ? (stats.expense / stats.signed) * 100 : 0);

const buildSignedDimension = (
  dimensionKey: DimensionKey,
  dimensionLabel: string,
  currentMap: Map<string, AggregatedStats>,
  previousMap: Map<string, AggregatedStats>
): DimensionAnalysis => {
  const items = Array.from(currentMap.entries())
    .map(([value, currentStats]) => {
      const previousStats = previousMap.get(value) ?? createEmptyStats();
      const currentVal = currentStats.signed / 10000;
      const previousVal = previousStats.signed / 10000;
      const delta = currentVal - previousVal;

      return {
        value,
        currentVal,
        previousVal,
        delta,
      };
    })
    .filter((item) => item.delta < SIGNED_DROP_THRESHOLD)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 5)
    .map((item) => ({
      value: safeLabel(item.value),
      changeDisplay: formatWanDelta(item.delta),
      detail: `本周 ${formatWan(item.currentVal)} · 上周 ${formatWan(item.previousVal)}`,
    }));

  return {
    dimension: dimensionKey,
    dimensionLabel,
    items,
  };
};

const buildRatioDimension = (
  dimensionKey: DimensionKey,
  dimensionLabel: string,
  currentMap: Map<string, AggregatedStats>,
  previousMap: Map<string, AggregatedStats>,
  metric: 'lossRatio' | 'expenseRatio'
): DimensionAnalysis => {
  const computeRatio = metric === 'lossRatio' ? computeLossRatio : computeExpenseRatio;
  const volumeAccessor = metric === 'lossRatio' ? (stats: AggregatedStats) => stats.matured / 10000 : (stats: AggregatedStats) => stats.signed / 10000;

  const items = Array.from(currentMap.entries())
    .map(([value, currentStats]) => {
      const previousStats = previousMap.get(value) ?? createEmptyStats();
      const currentVal = computeRatio(currentStats);
      const previousVal = computeRatio(previousStats);
      const delta = currentVal - previousVal;
      const volume = volumeAccessor(currentStats);

      return {
        value,
        currentVal,
        previousVal,
        delta,
        volume,
      };
    })
    .filter((item) => item.delta > RATIO_RISE_THRESHOLD)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5)
    .map((item) => ({
      value: safeLabel(item.value),
      changeDisplay: formatPoint(item.delta),
      detail: `当前 ${item.currentVal.toFixed(2)}% · 上周 ${item.previousVal.toFixed(2)}% · 规模 ${formatWan(item.volume)}`,
    }));

  return {
    dimension: dimensionKey,
    dimensionLabel,
    items,
  };
};

const calculateLossRatioBreakdown = (currentWeekData: RawDataRow[], previousWeekData: RawDataRow[]) => {
  const calc = (data: RawDataRow[]) => {
    const totals = aggregateStats(data);
    const incidentRate = totals.policyCount > 0 ? (totals.claimCases / totals.policyCount) * 100 : 0;
    const avgClaim = totals.claimCases > 0 ? totals.claim / totals.claimCases : 0;
    return { incidentRate, avgClaim };
  };

  const current = calc(currentWeekData);
  const previous = calc(previousWeekData);

  return {
    incidentRateChange: current.incidentRate - previous.incidentRate,
    avgClaimChange: previous.avgClaim > 0 ? ((current.avgClaim - previous.avgClaim) / previous.avgClaim) * 100 : 0,
  };
};

const formatSignedMagnitude = (value: number) => `${Math.abs(Math.round(value)).toLocaleString('zh-CN')}万`;

export function AIDeteriorationAnalysis({ currentWeekData, previousWeekData }: { currentWeekData: RawDataRow[]; previousWeekData: RawDataRow[] }) {
  const [showModuleSelection, setShowModuleSelection] = useState(false);

  const analysis = useMemo<MetricInsight[]>(() => {
    if (!currentWeekData.length || !previousWeekData.length) {
      return [];
    }

    const currentTotals = aggregateStats(currentWeekData);
    const previousTotals = aggregateStats(previousWeekData);

    const dimensionMaps = DIMENSION_SEQUENCE.map((dimension) => ({
      dimension,
      current: aggregateDimensionStats(currentWeekData, dimension.key),
      previous: aggregateDimensionStats(previousWeekData, dimension.key),
    }));

    const signedCurrent = currentTotals.signed / 10000;
    const signedPrevious = previousTotals.signed / 10000;
    const signedDelta = signedCurrent - signedPrevious;
    const signedRelative = signedPrevious === 0 ? null : ((signedCurrent - signedPrevious) / Math.abs(signedPrevious)) * 100;

    const insights: MetricInsight[] = [];

    if (signedDelta < SIGNED_DROP_THRESHOLD) {
      const dimensions = dimensionMaps
        .map(({ dimension, current, previous }) => buildSignedDimension(dimension.key, dimension.label, current, previous))
        .filter((entry) => entry.items.length > 0);

      insights.push({
        key: 'signedPremium',
        label: '签单保费',
        directionText: '下降',
        absoluteChangeDisplay: formatSignedMagnitude(signedDelta),
        relativeChangeDisplay: formatRelative(signedRelative),
        currentDisplay: formatWan(signedCurrent),
        previousDisplay: formatWan(signedPrevious),
        dimensionAnalyses: dimensions,
      });
    }

    const lossCurrent = computeLossRatio(currentTotals);
    const lossPrevious = computeLossRatio(previousTotals);
    const lossDelta = lossCurrent - lossPrevious;
    const lossRelative = lossPrevious === 0 ? null : ((lossCurrent - lossPrevious) / Math.abs(lossPrevious)) * 100;

    if (lossDelta > RATIO_RISE_THRESHOLD) {
      const dimensions = dimensionMaps
        .map(({ dimension, current, previous }) => buildRatioDimension(dimension.key, dimension.label, current, previous, 'lossRatio'))
        .filter((entry) => entry.items.length > 0);

      insights.push({
        key: 'lossRatio',
        label: '满期赔付率',
        directionText: '上升',
        absoluteChangeDisplay: formatPointMagnitude(lossDelta),
        relativeChangeDisplay: formatRelative(lossRelative),
        currentDisplay: `${lossCurrent.toFixed(2)}%`,
        previousDisplay: `${lossPrevious.toFixed(2)}%`,
        dimensionAnalyses: dimensions,
        lossRatioBreakdown: calculateLossRatioBreakdown(currentWeekData, previousWeekData),
      });
    }

    const expenseCurrent = computeExpenseRatio(currentTotals);
    const expensePrevious = computeExpenseRatio(previousTotals);
    const expenseDelta = expenseCurrent - expensePrevious;
    const expenseRelative = expensePrevious === 0 ? null : ((expenseCurrent - expensePrevious) / Math.abs(expensePrevious)) * 100;

    if (expenseDelta > RATIO_RISE_THRESHOLD) {
      const dimensions = dimensionMaps
        .map(({ dimension, current, previous }) => buildRatioDimension(dimension.key, dimension.label, current, previous, 'expenseRatio'))
        .filter((entry) => entry.items.length > 0);

      insights.push({
        key: 'expenseRatio',
        label: '费用率',
        directionText: '上升',
        absoluteChangeDisplay: formatPointMagnitude(expenseDelta),
        relativeChangeDisplay: formatRelative(expenseRelative),
        currentDisplay: `${expenseCurrent.toFixed(2)}%`,
        previousDisplay: `${expensePrevious.toFixed(2)}%`,
        dimensionAnalyses: dimensions,
      });
    }

    return insights;
  }, [currentWeekData, previousWeekData]);

  const hasAnalysis = analysis.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-500" />
            AI 问题归因
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowModuleSelection((prev) => !prev)}
          >
            选择分析板块
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showModuleSelection && (
          <Alert>
            <AlertDescription>
              模块化分析入口规划中，后续可在此选择经营概览、趋势洞察等板块，AI 将自动拉取对应数据完成归因分析。
            </AlertDescription>
          </Alert>
        )}

        {!hasAnalysis ? (
          <Alert>
            <TrendingDown className="h-4 w-4" />
            <AlertDescription>本周未检测到签单保费、满期赔付率或费用率的显著恶化趋势。</AlertDescription>
          </Alert>
        ) : (
          analysis.map((metric) => {
            const SummaryIcon = metric.directionText === '下降' ? TrendingDown : TrendingUp;

            return (
              <div key={metric.key} className="space-y-4">
                <Alert className="border-none bg-violet-50/80">
                  <SummaryIcon className="h-4 w-4 text-violet-600" />
                  <AlertDescription>
                    <strong>{metric.label}</strong>较上周{metric.directionText}
                    <strong className="px-1">{metric.absoluteChangeDisplay}</strong>
                    （{metric.relativeChangeDisplay}），本周 {metric.currentDisplay}，上周 {metric.previousDisplay}。
                  </AlertDescription>
                </Alert>

                {metric.dimensionAnalyses.length > 0 ? (
                  metric.dimensionAnalyses.map((dimension) => (
                    <div key={dimension.dimension} className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                          {DIMENSION_SEQUENCE.findIndex((item) => item.key === dimension.dimension) + 1}
                        </span>
                        {dimension.dimensionLabel}关键影响因子
                      </h4>
                      <div className="space-y-2">
                        {dimension.items.map((item) => (
                          <div
                            key={item.value}
                            className="flex items-center justify-between rounded-2xl border border-violet-100 bg-white/80 p-3 shadow-[0_8px_22px_rgba(76,29,149,0.08)] backdrop-blur"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">{item.value}</span>
                              <span className="text-xs text-muted-foreground">{item.detail}</span>
                            </div>
                            <span className="text-sm font-semibold text-violet-700">{item.changeDisplay}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-violet-200 bg-white/80 p-4 text-sm text-muted-foreground">
                    未筛选出显著的维度贡献，需要更多数据才能定位问题。
                  </div>
                )}

                {metric.lossRatioBreakdown && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className={`rounded-2xl border p-4 ${metric.lossRatioBreakdown.incidentRateChange > RATIO_RISE_THRESHOLD ? 'border-violet-200 bg-violet-50/60' : 'border-border bg-muted/30'}`}>
                      <div className="text-xs text-muted-foreground">满期出险率变化</div>
                      <div className={`text-lg font-semibold ${metric.lossRatioBreakdown.incidentRateChange > RATIO_RISE_THRESHOLD ? 'text-violet-700' : 'text-foreground'}`}>
                        {formatPoint(metric.lossRatioBreakdown.incidentRateChange)}
                      </div>
                    </div>
                    <div className={`rounded-2xl border p-4 ${metric.lossRatioBreakdown.avgClaimChange > 5 ? 'border-violet-200 bg-violet-50/60' : 'border-border bg-muted/30'}`}>
                      <div className="text-xs text-muted-foreground">案均赔款变化</div>
                      <div className={`text-lg font-semibold ${metric.lossRatioBreakdown.avgClaimChange > 5 ? 'text-violet-700' : 'text-foreground'}`}>
                        {metric.lossRatioBreakdown.avgClaimChange >= 0 ? '+' : ''}{metric.lossRatioBreakdown.avgClaimChange.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
