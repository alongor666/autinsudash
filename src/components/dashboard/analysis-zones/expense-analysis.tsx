'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn, buildWeeklyDeltaSlice } from '@/lib/utils';
import { useData } from '@/contexts/data-context';
import { RawDataRow } from '@/lib/types';
import { Calculator, TrendingUp, PieChart, Sparkles, Target, DollarSign, ArrowUpDown, Copy } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { buildDeepDivePayload, type DeepDivePayload } from '@/lib/deep-dive';
import { AIAnalysisDisplay } from '../ai-analysis-display';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell,
} from 'recharts';
import { getExpenseContributionColor } from '@/lib/color-scale';
import { useToast } from '@/hooks/use-toast';
import {
  getOptimizedTruckScore,
  getDimensionValue,
  getMissingLabel,
  shouldSkipMissingDimension,
  normalizeLabel,
  dimensionConfigs,
  dimensionGroups,
  hasDimensionData,
  type DimensionKey,
} from '../customer-performance';
import {
  CONTROL_BUTTON_CLASS,
  CONTROL_FIELD_CLASS,
  CONTROL_TRIGGER_CLASS,
  CONTROL_WRAPPER_CLASS,
} from '../control-styles';

// 费用结余对比图数据类型
type ExpenseContributionDatum = {
  dimension: string;
  contribution: number;
  contributionWan: number;
  displayContribution: number;
  actualRate: number;
  deltaRate: number;
  contributionRate: number;
  color: string;
  signedPremium: number;
  isClamped: boolean;
};

type ExpenseTooltipPayload = {
  payload: ExpenseContributionDatum;
  value: number;
};

// 辅助函数：限制极值
function clampAbsoluteMax<T>(
  items: T[],
  getValue: (item: T) => number,
  applyDisplay: (item: T, displayValue: number, isClamped: boolean) => T,
  ratio = 2,
) {
  if (items.length === 0) return [] as T[];
  if (items.length === 1) {
    const value = getValue(items[0]);
    return [applyDisplay(items[0], value, false)];
  }

  const sortedByAbs = [...items].sort(
    (a, b) => Math.abs(getValue(b)) - Math.abs(getValue(a)),
  );

  const largest = Math.abs(getValue(sortedByAbs[0]));
  const second = Math.abs(getValue(sortedByAbs[1]));

  if (largest === 0 || second === 0) {
    return items.map((item) => {
      const value = getValue(item);
      return applyDisplay(item, value, false);
    });
  }

  const threshold = second * ratio;

  return items.map((item) => {
    const value = getValue(item);
    const absValue = Math.abs(value);
    if (absValue <= threshold) {
      return applyDisplay(item, value, false);
    }
    const clampedValue = Math.sign(value) * threshold;
    return applyDisplay(item, clampedValue, true);
  });
}

// 辅助函数：格式化值
function formatValue(value: number) {
  return Math.round(value / 10000).toLocaleString("zh-CN");
}

/**
 * 费用分析区组件 - 包含费用结余对比图和费用多维分析两个标签
 */
export function ExpenseAnalysis() {
  const { rawData, filteredData, matchedData, timePeriod, filters, trendFilteredData } = useData();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'balance' | 'multi' | 'deep-dive'>('balance');

  // 费用结余对比图状态
  const [expenseDimension, setExpenseDimension] = useState<DimensionKey>('customer_category_3');
  const [expenseViewMode, setExpenseViewMode] = useState<'chart' | 'table'>('chart');
  const [expenseSortOrder, setExpenseSortOrder] = useState<'asc' | 'desc'>('desc');
  const [analysisCache, setAnalysisCache] = useState<Map<string, { analysis: string; prompt?: string; metadata?: Record<string, unknown> }>>(new Map());
  const [analyzingChart, setAnalyzingChart] = useState<string | null>(null);

  const datasetForOptions = useMemo(() => {
    if (timePeriod === 'ytd') {
      return filteredData.length ? filteredData : rawData;
    }
    if (matchedData.length) {
      return matchedData;
    }
    if (trendFilteredData.length) {
      return trendFilteredData;
    }
    return rawData;
  }, [timePeriod, filteredData, matchedData, trendFilteredData, rawData]);

  // 根据timePeriod动态选择有效数据源
  const weeklyBaseRows = useMemo(() => (matchedData.length ? matchedData : rawData), [matchedData, rawData]);

  const weeklySlice = useMemo(() => {
    if (timePeriod !== 'weekly') {
      return null;
    }
    return buildWeeklyDeltaSlice(weeklyBaseRows, filters.weekNumber ?? undefined);
  }, [timePeriod, weeklyBaseRows, filters.weekNumber]);

  const effectiveData = useMemo(() => {
    if (timePeriod === 'ytd') {
      return datasetForOptions;
    }
    return weeklySlice?.deltaRows ?? [];
  }, [timePeriod, datasetForOptions, weeklySlice]);

  // 可用维度选项
  const availableExpenseOptions = useMemo(() => {
    if (!effectiveData.length) {
      return dimensionConfigs;
    }
    const options = dimensionConfigs.filter((option) => hasDimensionData(effectiveData, option.value));
    return options.length ? options : dimensionConfigs;
  }, [effectiveData]);

  const groupedExpenseOptions = useMemo(() => {
    const availableSet = new Set(availableExpenseOptions.map((option) => option.value));
    return dimensionGroups
      .map((group) => ({
        label: group.label,
        options: group.values
          .map((value) => dimensionConfigs.find((config) => config.value === value))
          .filter((option): option is { value: DimensionKey; label: string } =>
            option !== undefined && availableSet.has(option.value),
          ),
      }))
      .filter((group) => group.options.length > 0);
  }, [availableExpenseOptions]);

  useEffect(() => {
    if (availableExpenseOptions.length === 0) return;
    if (!availableExpenseOptions.some((option) => option.value === expenseDimension)) {
      setExpenseDimension(availableExpenseOptions[0].value);
    }
  }, [availableExpenseOptions, expenseDimension]);

  // 费用结余对比图数据
  const expenseData: ExpenseContributionDatum[] = useMemo(() => {
    if (!effectiveData.length) return [];

    const baseline = 0.14;

    const grouped = effectiveData.reduce((acc, row) => {
      const rawValue = (expenseDimension === 'large_truck_score' || expenseDimension === 'small_truck_score')
        ? getOptimizedTruckScore(row, expenseDimension)
        : getDimensionValue(row, expenseDimension);
      const fallback = getMissingLabel(expenseDimension);
      const { key, label } = normalizeLabel(rawValue, fallback);
      if (shouldSkipMissingDimension(expenseDimension) && label === fallback) {
        return acc;
      }
      const current = acc.get(key);
      if (current) {
        current.signed += row.signed_premium_yuan ?? 0;
        current.expense += row.expense_amount_yuan ?? 0;
      } else {
        acc.set(key, {
          label,
          signed: row.signed_premium_yuan ?? 0,
          expense: row.expense_amount_yuan ?? 0,
        });
      }
      return acc;
    }, new Map<string, { label: string; signed: number; expense: number }>());

    const aggregated = Array.from(grouped.values())
      .map(({ label, signed, expense }) => {
        const actualRate = signed === 0 ? 0 : expense / signed;
        const deltaRate = actualRate - baseline;
        const contributionRate = baseline - actualRate;
        const contribution = signed * contributionRate;
        const color = getExpenseContributionColor(deltaRate);
        return {
          dimension: label,
          contribution,
          contributionWan: contribution / 10000,
          displayContribution: contribution,
          actualRate,
          deltaRate,
          contributionRate,
          color,
          signedPremium: signed,
          isClamped: false,
        };
      })
      .sort((a, b) => (expenseSortOrder === 'desc' ? b.contribution - a.contribution : a.contribution - b.contribution));

    return clampAbsoluteMax(
      aggregated,
      (item) => item.contribution,
      (item, displayValue, isClamped) => ({
        ...item,
        displayContribution: displayValue,
        isClamped,
      }),
    );
  }, [effectiveData, expenseDimension, expenseSortOrder]);

  // 费用多维分析数据
  const expenseMetrics = useMemo(() => {
    if (!effectiveData.length) return null;

    const totalPremium = effectiveData.reduce((sum: number, item: RawDataRow) => sum + (item.signed_premium_yuan || 0), 0);
    const totalExpense = effectiveData.reduce((sum: number, item: RawDataRow) => sum + (item.expense_amount_yuan || 0), 0);
    const totalCommission = effectiveData.reduce((sum: number, item: RawDataRow) => sum + (item.expense_amount_yuan * 0.7 || 0), 0);
    const totalOperatingExpense = totalExpense - totalCommission;

    const expenseRatio = totalPremium > 0 ? (totalExpense / totalPremium) : 0;
    const commissionRatio = totalPremium > 0 ? (totalCommission / totalPremium) : 0;
    const operatingExpenseRatio = totalPremium > 0 ? (totalOperatingExpense / totalPremium) : 0;

    const byChannel = effectiveData.reduce((acc: Record<string, { premium: number; expense: number; commission: number }>, item: RawDataRow) => {
      const channel = item.terminal_source || '未知';
      if (!acc[channel]) acc[channel] = { premium: 0, expense: 0, commission: 0 };
      acc[channel].premium += item.signed_premium_yuan || 0;
      acc[channel].expense += item.expense_amount_yuan || 0;
      acc[channel].commission += (item.expense_amount_yuan * 0.7) || 0;
      return acc;
    }, {});

    const byInsuranceType = effectiveData.reduce((acc: Record<string, { premium: number; expense: number; commission: number }>, item: RawDataRow) => {
      const type = item.insurance_type || '未知';
      if (!acc[type]) acc[type] = { premium: 0, expense: 0, commission: 0 };
      acc[type].premium += item.signed_premium_yuan || 0;
      acc[type].expense += item.expense_amount_yuan || 0;
      acc[type].commission += (item.expense_amount_yuan * 0.7) || 0;
      return acc;
    }, {});

    const channelAnalysis = Object.entries(byChannel)
      .map(([channel, metrics]) => ({
        channel,
        expenseRatio: metrics.premium > 0 ? metrics.expense / metrics.premium : 0,
        commissionRatio: metrics.premium > 0 ? metrics.commission / metrics.premium : 0,
        operatingExpenseRatio: metrics.premium > 0 ? (metrics.expense - metrics.commission) / metrics.premium : 0,
        ...metrics
      }))
      .sort((a, b) => b.expenseRatio - a.expenseRatio)
      .slice(0, 5);

    const insuranceTypeAnalysis = Object.entries(byInsuranceType)
      .map(([type, metrics]) => ({
        type,
        expenseRatio: metrics.premium > 0 ? metrics.expense / metrics.premium : 0,
        commissionRatio: metrics.premium > 0 ? metrics.commission / metrics.premium : 0,
        operatingExpenseRatio: metrics.premium > 0 ? (metrics.expense - metrics.commission) / metrics.premium : 0,
        ...metrics
      }))
      .sort((a, b) => b.expenseRatio - a.expenseRatio)
      .slice(0, 5);

    const expenseStructure = {
      commission: {
        amount: totalCommission,
        ratio: commissionRatio,
        label: '手续费'
      },
      operating: {
        amount: totalOperatingExpense,
        ratio: operatingExpenseRatio,
        label: '营业费用'
      }
    };

    return {
      totalPremium,
      totalExpense,
      totalCommission,
      totalOperatingExpense,
      expenseRatio,
      commissionRatio,
      operatingExpenseRatio,
      channelAnalysis,
      insuranceTypeAnalysis,
      expenseStructure,
    };
  }, [effectiveData]);

  const expenseCacheKey = useMemo(() => {
    return `expense_${expenseDimension}_${expenseSortOrder}_${expenseData.length}`;
  }, [expenseDimension, expenseSortOrder, expenseData.length]);

  const expenseAnalysis = useMemo(() => {
    return analysisCache.get(expenseCacheKey) || null;
  }, [analysisCache, expenseCacheKey]);

  const expenseChartHeight = useMemo(() => {
    if (!expenseData.length) return 320;
    const perItem = 32;
    return Math.max(320, expenseData.length * perItem);
  }, [expenseData]);

  const expenseYAxisWidth = useMemo(() => {
    if (!expenseData.length) return 140;
    const longestLabel = expenseData.reduce((max, item) => Math.max(max, item.dimension.length), 0);
    const estimatedWidth = longestLabel * 16;
    return Math.min(280, Math.max(140, estimatedWidth));
  }, [expenseData]);

  // 深度剖析数据
  const deepDivePayload = useMemo<DeepDivePayload | null>(() => {
    const allRows = matchedData.length ? matchedData : trendFilteredData;
    const trendRows = trendFilteredData.length ? trendFilteredData : allRows;
    if (!allRows.length) return null;
    return buildDeepDivePayload('expenseRatio', {
      allRows,
      trendRows,
      filters,
      timePeriod,
    });
  }, [matchedData, trendFilteredData, filters, timePeriod]);

  // 深度剖析状态
  const [deepDiveSortState, setDeepDiveSortState] = useState<Record<string, 'asc' | 'desc'>>({});
  const [isDeepDiveAnalyzing, setIsDeepDiveAnalyzing] = useState(false);
  const [deepDiveAnalysis, setDeepDiveAnalysis] = useState<string>('');

  const expenseTableRows = useMemo(
    () =>
      expenseData.map((item) => {
        const actualPct = (item.actualRate * 100).toFixed(2);
        const deltaPct = item.deltaRate * 100;
        const contributionWan = item.contribution / 10000;
        const signedWan = item.signedPremium / 10000;
        return {
          dimension: item.dimension,
          actualRate: `${actualPct}%`,
          deltaRate: `${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(2)}%`,
          contribution: `${Math.round(contributionWan).toLocaleString('zh-CN')}万`,
          signedPremium: `${Math.round(signedWan).toLocaleString('zh-CN')}万`,
        };
      }),
    [expenseData],
  );

  const isExpenseTable = expenseViewMode === 'table';
  const canCopyExpense = expenseTableRows.length > 0;

  useEffect(() => {
    if (!expenseData.length) {
      setExpenseViewMode('chart');
    }
  }, [expenseData.length]);

  const expenseInsight = useMemo(() => {
    if (!expenseData.length) return "暂无可用数据";
    const item = expenseData[0];
    if (item.contribution === 0) return `${item.dimension}的费用结余为 0`;
    const amountText = `${formatValue(Math.abs(item.contribution))}万`;
    const gap = Math.abs(item.deltaRate * 100).toFixed(2);
    const gapText = gap === '0.0' ? '' : `，较基准${item.deltaRate < 0 ? '低' : '高'}${gap}%`;
    if (item.contribution > 0) {
      const descriptor = expenseSortOrder === 'desc' ? '贡献最大' : '贡献最小';
      return `${item.dimension}${descriptor}，释放${amountText}${gapText}`;
    }
    const descriptor = expenseSortOrder === 'desc' ? '费用消耗最高' : '费用消耗最轻';
    return `${item.dimension}${descriptor}，吞噬${amountText}${gapText}`;
  }, [expenseData, expenseSortOrder]);

  const expenseDimensionLabel = useMemo(
    () => dimensionConfigs.find((option) => option.value === expenseDimension)?.label ?? '分析维度',
    [expenseDimension],
  );

  const expenseTitle = `各${expenseDimensionLabel}费用结余对比图`;
  const expenseExplanation = '基准费用率为 14%。高于基准表示费用消耗，低于基准表示费用结余。费用结余 = 签单保费 × (基准费用率 - 实际费用率)。';

  const expenseTooltip = useMemo(() => {
    return (
      <RechartsTooltip
        cursor={{ fill: "hsl(var(--muted)/0.35)" }}
        content={({ active, payload }) => {
          if (!active || !payload || payload.length === 0) return null;
          const item = payload[0] as ExpenseTooltipPayload;
          const data = item.payload;
          return (
            <div className="rounded-md border border-border/50 bg-background p-3 text-xs shadow-xl">
              <div className="font-medium text-foreground">{data.dimension}</div>
              <div className="mt-1 space-y-1 text-muted-foreground">
                <div>
                  实际费用率：
                  <span className="text-foreground">{(data.actualRate * 100).toFixed(2)}%</span>
                </div>
                <div>
                  与基准差异：
                  <span className="text-foreground">{(data.deltaRate * 100).toFixed(2)}%</span>
                </div>
                <div>
                  贡献率（基准-实际）：
                  <span className="text-foreground">{(data.contributionRate * 100).toFixed(2)}%</span>
                </div>
                <div>
                  签单保费：
                  <span className="text-foreground">{formatValue(data.signedPremium)}万</span>
                </div>
                <div>
                  贡献/消耗：
                  <span className="text-foreground">{formatValue(data.contribution)}万</span>
                </div>
              </div>
              {data.isClamped ? (
                <div className="mt-1 text-slate-500">已缩放显示以突出对比</div>
              ) : null}
            </div>
          );
        }}
      />
    );
  }, []);

  const handleCopyExpenseTable = async () => {
    if (!isExpenseTable || !canCopyExpense) return;

    const header = ['维度', '实际费用率', '与基准差异', '费用结余', '签单保费'];
    const rows = expenseTableRows.map((row) => [
      row.dimension,
      row.actualRate,
      row.deltaRate,
      row.contribution,
      row.signedPremium,
    ]);

    const content = [header, ...rows]
      .map((line) => line.join('\t'))
      .join('\n');

    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: '表格已复制',
        description: '费用分析数据已复制到剪贴板，可直接粘贴到表格工具中。',
      });
    } catch (error) {
      console.error('复制表格失败', error);
      toast({
        variant: 'destructive',
        title: '复制失败',
        description: '浏览器未授权剪贴板权限，请手动复制。',
      });
    }
  };

  const analyzeChart = async () => {
    const cacheKey = expenseCacheKey;

    if (analysisCache.has(cacheKey)) return;

    setAnalyzingChart('expense');

    try {
      const requestData = {
        chartType: 'expense',
        data: expenseData,
        dimension: expenseDimensionLabel,
      };

      const response = await fetch('/api/analyze-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) throw new Error('分析失败');

      const { analysis, prompt, metadata } = await response.json();

      setAnalysisCache((prev) => {
        const newCache = new Map(prev);
        newCache.set(cacheKey, { analysis, prompt, metadata });
        return newCache;
      });
    } catch (error) {
      console.error('AI分析失败:', error);
      toast({
        variant: 'destructive',
        title: 'AI 分析失败',
        description: '请稍后重试或检查网络连接。',
      });
    } finally {
      setAnalyzingChart(null);
    }
  };

  // 深度剖析相关函数
  const handleCopyDeepDiveJSON = async () => {
    if (!deepDivePayload) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(deepDivePayload, null, 2));
      toast({ title: 'JSON 已复制', description: '已复制深度剖析的AI输入数据。' });
    } catch (e) {
      toast({ variant: 'destructive', title: '复制失败', description: '浏览器未授权剪贴板权限，请手动复制。' });
    }
  };

  const handleCopyDeepDiveTSV = async (dimKey: string) => {
    if (!deepDivePayload) return;
    const dim = deepDivePayload.dimensions.find(d => d.key === dimKey);
    if (!dim) return;
    const header = ['分组', '当前值', '上周值', '变化', '高于平均', '平均值', '状态', '边际贡献率'];
    const rows = dim.items.map(i => [
      i.label,
      formatDeepDiveCell(i.current, deepDivePayload.overall.unit),
      i.previous !== undefined ? formatDeepDiveCell(i.previous, deepDivePayload.overall.unit) : '',
      deepDivePayload.overall.unit === '%' && i.deltaPp !== undefined ? `${i.deltaPp >= 0 ? '+' : ''}${i.deltaPp.toFixed(2)}pp` : (i.changeAbs !== undefined ? `${i.changeAbs >= 0 ? '+' : ''}${Math.round(i.changeAbs).toLocaleString('zh-CN')}` : ''),
      i.aboveAvg ? '是' : '否',
      formatDeepDiveCell(i.avgOfAll, deepDivePayload.overall.unit),
      i.status,
      `${(i.marginalRatePct ?? 0).toFixed(2)}%`,
    ]);
    const content = [header, ...rows].map(r => r.join('\t')).join('\n');
    try {
      await navigator.clipboard.writeText(content);
      toast({ title: '表格已复制', description: `${dim.dimension} 已复制为TSV，可直接粘贴到Excel。` });
    } catch (e) {
      toast({ variant: 'destructive', title: '复制失败', description: '浏览器未授权剪贴板权限，请手动复制。' });
    }
  };

  const requestDeepDiveAI = async () => {
    if (!deepDivePayload) return;
    try {
      setIsDeepDiveAnalyzing(true);
      setDeepDiveAnalysis('');
      const res = await fetch('/api/analyze-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chartType: 'deep-dive',
          metric: 'expenseRatio',
          data: deepDivePayload,
        }),
      });
      if (!res.ok) throw new Error('AI分析请求失败');
      const result = await res.json();
      setDeepDiveAnalysis(result.analysis);
      toast({ title: 'AI分析完成', description: '已生成深度剖析分析报告。' });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'AI分析失败', description: '请稍后重试。' });
    } finally {
      setIsDeepDiveAnalyzing(false);
    }
  };

  function formatDeepDiveCell(value: number, unit: '%' | 'yuan') {
    if (unit === '%') return `${value.toFixed(2)}%`;
    return `${Math.round(value).toLocaleString('zh-CN')}元`;
  }

  if (!effectiveData.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标签切换导航 */}
      <div className="flex items-center gap-2 rounded-full bg-white/60 p-1 shadow-sm backdrop-blur-sm w-fit">
        <Button
          type="button"
          variant={activeTab === 'balance' ? 'default' : 'ghost'}
          size="sm"
          className={cn(
            'rounded-full px-4 py-2 text-xs font-medium transition-all duration-300',
            activeTab === 'balance'
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/70'
          )}
          onClick={() => setActiveTab('balance')}
        >
          成本结余对比图
        </Button>
        <Button
          type="button"
          variant={activeTab === 'multi' ? 'outline' : 'ghost'}
          size="sm"
          className={cn(
            'rounded-full px-4 py-2 text-xs font-medium transition-all duration-300',
            activeTab === 'multi'
              ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white'
              : 'text-muted-foreground hover:text-foreground hover:bg-blue-50'
          )}
          onClick={() => setActiveTab('multi')}
        >
          费用多维分析
        </Button>
        <Button
          type="button"
          variant={activeTab === 'deep-dive' ? 'outline' : 'ghost'}
          size="sm"
          className={cn(
            'rounded-full px-4 py-2 text-xs font-medium transition-all duration-300',
            activeTab === 'deep-dive'
              ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:text-white'
              : 'text-muted-foreground hover:text-foreground hover:bg-blue-50'
          )}
          onClick={() => setActiveTab('deep-dive')}
        >
          费用深度剖析
        </Button>
      </div>

      {/* 标签1：费用结余对比图 */}
      {activeTab === 'balance' && (
        <>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{expenseTitle}</CardTitle>
              <CardDescription>{expenseInsight}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`${CONTROL_WRAPPER_CLASS} lg:grid-cols-[1.05fr_0.9fr_0.9fr_0.9fr]`}>
                <div className={CONTROL_FIELD_CLASS}>
                  <span className="text-xs text-muted-foreground">选择维度</span>
                  <Select value={expenseDimension} onValueChange={(value) => setExpenseDimension(value as DimensionKey)}>
                    <SelectTrigger className={CONTROL_TRIGGER_CLASS}>
                      <SelectValue placeholder="选择维度" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {groupedExpenseOptions.map((group) => (
                        <SelectGroup key={group.label}>
                          <SelectLabel className="pl-3 text-xs font-medium text-muted-foreground/60">
                            {group.label}
                          </SelectLabel>
                          {group.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className={CONTROL_FIELD_CLASS}>
                  <span className="text-xs text-muted-foreground">排序</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full border panel-surface shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition-transform duration-200 [&>svg]:text-muted-foreground"
                    onClick={() => setExpenseSortOrder(expenseSortOrder === 'desc' ? 'asc' : 'desc')}
                    aria-label={expenseSortOrder === 'desc' ? '当前降序，点击切换为升序' : '当前升序，点击切换为降序'}
                    title={expenseSortOrder === 'desc' ? '当前降序，点击切换为升序' : '当前升序，点击切换为降序'}
                  >
                    <ArrowUpDown className={`h-4 w-4 transition-transform ${expenseSortOrder === 'asc' ? 'rotate-180' : ''}`} />
                  </Button>
                </div>
                <div className={CONTROL_FIELD_CLASS}>
                  <span className="text-xs text-muted-foreground">操作</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`${CONTROL_BUTTON_CLASS} w-full justify-center`}
                    onClick={() => setExpenseViewMode((prev) => (prev === 'chart' ? 'table' : 'chart'))}
                  >
                    {isExpenseTable ? '查看图表' : '查看数据'}
                  </Button>
                </div>
                <div className={CONTROL_FIELD_CLASS}>
                  <span className="text-xs text-muted-foreground">AI 分析</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className={`${CONTROL_BUTTON_CLASS} w-full justify-center gap-2`}
                    onClick={() => analyzeChart()}
                    disabled={analyzingChart !== null || expenseData.length === 0}
                  >
                    <Sparkles className="h-4 w-4" />
                    {analyzingChart === 'expense' ? '分析中...' : expenseAnalysis ? '重新分析' : 'AI分析'}
                  </Button>
                </div>
              </div>

              {expenseAnalysis && (
                <AIAnalysisDisplay
                  analysis={expenseAnalysis.analysis}
                  enableSmartIndicators={true}
                  businessType="auto"
                />
              )}

              {isExpenseTable ? (
                expenseTableRows.length === 0 ? (
                  <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                    当前筛选条件下暂无数据
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border/40">
                    <div className="flex items-center justify-between gap-2 border-b border-border/40 bg-muted/40 px-4 py-2">
                      <span className="text-xs font-medium text-muted-foreground">当前数据表</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-3"
                        onClick={handleCopyExpenseTable}
                        disabled={!canCopyExpense || expenseTableRows.length === 0}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        复制数据
                      </Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[140px]">维度</TableHead>
                          <TableHead>实际费用率</TableHead>
                          <TableHead>与基准差异</TableHead>
                          <TableHead>费用结余</TableHead>
                          <TableHead>签单保费</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {expenseTableRows.map((row) => (
                          <TableRow key={row.dimension}>
                            <TableCell className="font-medium">{row.dimension}</TableCell>
                            <TableCell>{row.actualRate}</TableCell>
                            <TableCell>{row.deltaRate}</TableCell>
                            <TableCell>{row.contribution}</TableCell>
                            <TableCell>{row.signedPremium}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              ) : expenseData.length === 0 ? (
                <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
                  当前筛选条件下暂无数据
                </div>
              ) : (
                <div style={{ height: expenseChartHeight }}>
                  <ResponsiveContainer width="100%" height={expenseChartHeight}>
                    <BarChart data={expenseData} layout="vertical" barSize={24} margin={{ top: 5, right: 80, bottom: 5, left: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis
                        type="number"
                        tick={false}
                        tickLine={false}
                        axisLine={false}
                        stroke="hsl(var(--muted-foreground))"
                      />
                      <YAxis
                        type="category"
                        dataKey="dimension"
                        width={expenseYAxisWidth}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      {expenseTooltip}
                      <Bar dataKey="displayContribution" radius={[4, 4, 4, 4]}>
                        <LabelList
                          dataKey="contribution"
                          position="right"
                          fontSize={12}
                          fill="hsl(var(--foreground))"
                          content={(props) => {
                            const { x, y, width, height, value, index } = props;
                            if (
                              typeof value !== 'number' ||
                              typeof x !== 'number' ||
                              typeof y !== 'number' ||
                              typeof width !== 'number' ||
                              typeof height !== 'number' ||
                              typeof index !== 'number'
                            ) {
                              return null;
                            }
                            const actualValue = expenseData[index]?.contribution ?? 0;
                            const formattedValue = Math.round(actualValue / 10000).toLocaleString('zh-CN');
                            const isNegative = actualValue < 0;
                            const labelX = isNegative ? x - 8 : x + width + 8;
                            const labelY = y + height / 2;
                            return (
                              <text
                                x={labelX}
                                y={labelY}
                                fill="hsl(var(--foreground))"
                                fontSize={12}
                                fontWeight="bold"
                                textAnchor={isNegative ? 'end' : 'start'}
                                dominantBaseline="middle"
                              >
                                {formattedValue}
                              </text>
                            );
                          }}
                        />
                        {expenseData.map((item) => (
                          <Cell key={`expense-${item.dimension}`} fill={item.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <p className="text-sm text-muted-foreground/70">{expenseExplanation}</p>
            </CardContent>
          </Card>
        </>
      )}

      {/* 标签2：费用多维分析 */}
      {activeTab === 'multi' && expenseMetrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-emerald-50/80 via-white/70 to-emerald-100/30 border-emerald-100/80">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600">总费用率</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {(expenseMetrics.expenseRatio * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Calculator className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50/80 via-white/70 to-blue-100/30 border-blue-100/80">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">手续费率</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {(expenseMetrics.commissionRatio * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-blue-600">
                      ¥{(expenseMetrics.totalCommission / 10000).toFixed(1)}万
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50/80 via-white/70 to-purple-100/30 border-purple-100/80">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">营业费用率</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {(expenseMetrics.operatingExpenseRatio * 100).toFixed(1)}%
                    </p>
                    <p className="text-xs text-purple-600">
                      ¥{(expenseMetrics.totalOperatingExpense / 10000).toFixed(1)}万
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/80 backdrop-blur-xl border-emerald-100/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <PieChart className="h-5 w-5" />
                费用结构分析
                <Badge variant="secondary" className="ml-auto">结构占比</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(expenseMetrics.expenseStructure).map(([key, item]) => (
                  <div key={key} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        key === 'commission' ? "bg-blue-500" : "bg-purple-500"
                      )} />
                      <span className="font-medium text-sm">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {(item.ratio * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ¥{(item.amount / 10000).toFixed(1)}万
                        </p>
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-3">
                        <div
                          className={cn(
                            "h-3 rounded-full",
                            key === 'commission' ? "bg-gradient-to-r from-blue-500 to-blue-600" :
                            "bg-gradient-to-r from-purple-500 to-purple-600"
                          )}
                          style={{ width: `${Math.min(item.ratio * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl border-emerald-100/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <TrendingUp className="h-5 w-5" />
                渠道费用率分析
                <Badge variant="secondary" className="ml-auto">
                  Top {expenseMetrics.channelAnalysis.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenseMetrics.channelAnalysis.map((item) => {
                  const efficiencyLevel = item.expenseRatio < 0.15 ? 'high' : item.expenseRatio < 0.25 ? 'medium' : 'low';
                  return (
                    <div key={item.channel} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          efficiencyLevel === 'high' ? "bg-green-500" :
                          efficiencyLevel === 'medium' ? "bg-orange-500" :
                          "bg-red-500"
                        )} />
                        <span className="font-medium text-sm truncate">{item.channel}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {(item.expenseRatio * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            手续费 {(item.commissionRatio * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full",
                              efficiencyLevel === 'high' ? "bg-gradient-to-r from-green-500 to-green-600" :
                              efficiencyLevel === 'medium' ? "bg-gradient-to-r from-orange-500 to-orange-600" :
                              "bg-gradient-to-r from-red-500 to-red-600"
                            )}
                            style={{ width: `${Math.min(item.expenseRatio * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-xl border-emerald-100/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <Calculator className="h-5 w-5" />
                险种费用率分析
                <Badge variant="secondary" className="ml-auto">
                  Top {expenseMetrics.insuranceTypeAnalysis.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenseMetrics.insuranceTypeAnalysis.map((item) => {
                  const efficiencyLevel = item.expenseRatio < 0.15 ? 'high' : item.expenseRatio < 0.25 ? 'medium' : 'low';
                  return (
                    <div key={item.type} className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          efficiencyLevel === 'high' ? "bg-green-500" :
                          efficiencyLevel === 'medium' ? "bg-orange-500" :
                          "bg-red-500"
                        )} />
                        <span className="font-medium text-sm truncate">{item.type}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {(item.expenseRatio * 100).toFixed(1)}%
                          </p>
                          <p className="text-xs text-muted-foreground">
                            营业费用 {(item.operatingExpenseRatio * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className={cn(
                              "h-2 rounded-full",
                              efficiencyLevel === 'high' ? "bg-gradient-to-r from-green-500 to-green-600" :
                              efficiencyLevel === 'medium' ? "bg-gradient-to-r from-orange-500 to-orange-600" :
                              "bg-gradient-to-r from-red-500 to-red-600"
                            )}
                            style={{ width: `${Math.min(item.expenseRatio * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50/80 via-white/70 to-teal-100/30 border-emerald-100/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700">
                <Sparkles className="h-5 w-5" />
                AI 费用优化建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-white/60 border border-emerald-100/50">
                  <h4 className="font-semibold text-emerald-900 mb-2">成本控制分析</h4>
                  <ul className="space-y-2 text-sm text-emerald-700">
                    <li className="flex items-start gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0",
                        expenseMetrics.expenseRatio < 0.15 ? "bg-green-500" :
                        expenseMetrics.expenseRatio < 0.25 ? "bg-orange-500" :
                        "bg-red-500"
                      )} />
                      <span>
                        整体费用率为 {(expenseMetrics.expenseRatio * 100).toFixed(1)}%，
                        {expenseMetrics.expenseRatio < 0.15 ? '成本控制良好' :
                         expenseMetrics.expenseRatio < 0.25 ? '成本控制适中，有优化空间' :
                         '成本偏高，需要重点优化'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      <span>
                        手续费占比 {(expenseMetrics.commissionRatio * 100).toFixed(1)}%，
                        营业费用占比 {(expenseMetrics.operatingExpenseRatio * 100).toFixed(1)}%
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      <span>
                        {expenseMetrics.channelAnalysis[0]?.channel} 渠道费用率最高，
                        建议优化渠道成本结构和佣金政策
                      </span>
                    </li>
                  </ul>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  生成费用优化方案
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 标签3：费用深度剖析 */}
      {activeTab === 'deep-dive' && (
        <div className="space-y-6">
          {!deepDivePayload ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  当前筛选下暂无数据。请调整筛选条件后重试。
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* 工具栏 */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold">费用率深度剖析</h3>
                  <p className="text-xs text-muted-foreground">趋势窗口：最近8周；页面数据可直接复制为 JSON/TSV</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopyDeepDiveJSON} className="gap-2">
                    <Copy className="h-4 w-4" /> 复制 JSON
                  </Button>
                  <Button size="sm" variant="default" onClick={requestDeepDiveAI} disabled={isDeepDiveAnalyzing} className="gap-2">
                    <Sparkles className="h-4 w-4" /> {isDeepDiveAnalyzing ? '分析中...' : '生成深度分析'}
                  </Button>
                </div>
              </div>

              {/* 维度对比表格 */}
              {deepDivePayload.dimensions.map((dim) => {
                const order = deepDiveSortState[dim.key] || 'desc';
                const sorted = [...dim.items].sort((a, b) => order === 'desc' ? b.current - a.current : a.current - b.current);
                return (
                  <Card key={dim.key}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-base">{dim.dimension}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1"
                          onClick={() => setDeepDiveSortState((s) => ({ ...s, [dim.key]: (s[dim.key] || 'desc') === 'desc' ? 'asc' : 'desc' }))}
                        >
                          <ArrowUpDown className="h-4 w-4" /> {order === 'desc' ? '降序' : '升序'}
                        </Button>
                        <Button size="sm" variant="ghost" className="gap-2" onClick={() => handleCopyDeepDiveTSV(dim.key)}>
                          <Copy className="h-4 w-4" /> 复制表格
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>分组</TableHead>
                            <TableHead>当前值</TableHead>
                            <TableHead>上周值</TableHead>
                            <TableHead>变化</TableHead>
                            <TableHead>高于平均</TableHead>
                            <TableHead>平均值</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>边际贡献率</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sorted.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="h-20 text-center text-muted-foreground">暂无数据</TableCell>
                            </TableRow>
                          ) : (
                            sorted.map((i) => (
                              <TableRow key={`${dim.key}-${i.key}`}>
                                <TableCell className="font-medium">{i.label}</TableCell>
                                <TableCell>{formatDeepDiveCell(i.current, deepDivePayload.overall.unit)}</TableCell>
                                <TableCell>{i.previous !== undefined ? formatDeepDiveCell(i.previous, deepDivePayload.overall.unit) : '-'}</TableCell>
                                <TableCell>
                                  {deepDivePayload.overall.unit === '%' && i.deltaPp !== undefined
                                    ? `${i.deltaPp >= 0 ? '+' : ''}${i.deltaPp.toFixed(2)}pp`
                                    : i.changeAbs !== undefined
                                      ? `${i.changeAbs >= 0 ? '+' : ''}${Math.round(i.changeAbs).toLocaleString('zh-CN')}`
                                      : '-'}
                                </TableCell>
                                <TableCell>{i.aboveAvg ? '是' : '否'}</TableCell>
                                <TableCell>{formatDeepDiveCell(i.avgOfAll, deepDivePayload.overall.unit)}</TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs" style={{ backgroundColor: `${i.color}22`, color: i.color }}>
                                    {i.status}
                                  </span>
                                </TableCell>
                                <TableCell>{(i.marginalRatePct ?? 0).toFixed(2)}%</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })}

              {/* AI 深度分析 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    AI 深度分析
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {deepDiveAnalysis ? (
                    <AIAnalysisDisplay analysis={deepDiveAnalysis} enableSmartIndicators={true} businessType="auto" />
                  ) : (
                    <div className="text-sm text-muted-foreground">点击"生成深度分析"将依据上述数据生成富文本分析。</div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
}
