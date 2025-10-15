'use client';
import { kpiMeta } from '@/lib/data';
import { KpiMetricCard } from './kpi-metric-card';
import { useData } from '@/contexts/data-context';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMemo, useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DimensionKey,
  dimensionConfigs,
  hasDimensionData,
  getMissingLabel,
  getDimensionValue,
  normalizeLabel,
  dimensionGroups,
} from './customer-performance';
import { calculateKPIs } from '@/lib/utils';
import type { RawDataRow } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Copy, Sparkles } from 'lucide-react';
import {
  CONTROL_BUTTON_CLASS,
  CONTROL_FIELD_CLASS,
  CONTROL_TRIGGER_CLASS,
  CONTROL_WRAPPER_CLASS,
} from './control-styles';
import { AIDeteriorationAnalysis } from './ai-deterioration-analysis';

const DEFAULT_DIMENSION: DimensionKey = "customer_category_3";

type MetricData = {
  label: string;
  value: string;
  change?: string;
  changeValue?: string;
  changeType?: 'increase' | 'decrease';
  previousValue?: string;
};

function calculateSecondaryMetrics(currentData: RawDataRow[], previousData: RawDataRow[]) {
  const calcMetrics = (data: RawDataRow[]) => {
    const totalSigned = data.reduce((acc, row) => acc + (row.signed_premium_yuan || 0), 0);
    const totalMatured = data.reduce((acc, row) => acc + (row.matured_premium_yuan || 0), 0);
    const totalClaim = data.reduce((acc, row) => acc + (row.reported_claim_payment_yuan || 0), 0);
    const totalExpense = data.reduce((acc, row) => acc + (row.expense_amount_yuan || 0), 0);
    const totalMarginal = data.reduce((acc, row) => acc + (row.marginal_contribution_amount_yuan || 0), 0);
    const totalPolicies = data.reduce((acc, row) => acc + (row.policy_count || 0), 0);
    const totalClaims = data.reduce((acc, row) => acc + (row.claim_case_count || 0), 0);

    return {
      totalSigned,
      totalMatured,
      totalClaim,
      totalExpense,
      totalMarginal,
      totalPolicies,
      totalClaims,
      avgPremium: totalPolicies > 0 ? totalSigned / totalPolicies : 0,
      avgClaim: totalClaims > 0 ? totalClaim / totalClaims : 0,
      avgExpense: totalPolicies > 0 ? totalExpense / totalPolicies : 0,
      incidentRate: totalPolicies > 0 ? (totalClaims / totalPolicies) * 100 : 0,
      lossRatio: totalMatured > 0 ? (totalClaim / totalMatured) * 100 : 0,
      expenseRatio: totalSigned > 0 ? (totalExpense / totalSigned) * 100 : 0,
      marginalRate: totalMatured > 0 ? (totalMarginal / totalMatured) * 100 : 0,
      variableCostRatio: 0,
      ultimateMarginalContribution: 0,
    };
  };

  const current = calcMetrics(currentData);
  const previous = previousData.length > 0 ? calcMetrics(previousData) : null;

  current.variableCostRatio = current.lossRatio + current.expenseRatio;
  current.ultimateMarginalContribution = current.totalSigned * (current.marginalRate / 100);

  if (previous) {
    previous.variableCostRatio = previous.lossRatio + previous.expenseRatio;
    previous.ultimateMarginalContribution = previous.totalSigned * (previous.marginalRate / 100);
  }

  const formatMetric = (
    label: string,
    currentValue: number,
    previousValue: number | null,
    formatter: (val: number) => string,
    isRate: boolean = false
  ): MetricData => {
    const result: MetricData = {
      label,
      value: formatter(currentValue),
    };

    if (previousValue !== null && previousValue !== 0) {
      result.previousValue = formatter(previousValue);
      const diff = currentValue - previousValue;
      const pct = (diff / previousValue) * 100;
      result.change = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
      result.changeType = diff >= 0 ? 'increase' : 'decrease';

      if (isRate) {
        result.changeValue = `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}pp`;
      } else {
        result.changeValue = `${diff >= 0 ? '+' : ''}${Math.round(diff / 10000).toLocaleString('zh-CN')}万`;
      }
    }

    return result;
  };

  const formatCountMetric = (
    label: string,
    currentValue: number,
    previousValue: number | null,
  ): MetricData => {
    const result: MetricData = {
      label,
      value: Math.round(currentValue).toLocaleString('zh-CN'),
    };

    if (previousValue !== null && previousValue !== 0) {
      result.previousValue = Math.round(previousValue).toLocaleString('zh-CN');
      const diff = currentValue - previousValue;
      const pct = (diff / previousValue) * 100;
      result.change = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
      result.changeType = diff >= 0 ? 'increase' : 'decrease';
      result.changeValue = `${diff >= 0 ? '+' : ''}${Math.round(diff).toLocaleString('zh-CN')}件`;
    }

    return result;
  };

  const formatAmountMetric = (
    label: string,
    currentValue: number,
    previousValue: number | null,
  ): MetricData => {
    const result: MetricData = {
      label,
      value: `${Math.round(currentValue).toLocaleString('zh-CN')}元`,
    };

    if (previousValue !== null && previousValue !== 0) {
      result.previousValue = `${Math.round(previousValue).toLocaleString('zh-CN')}元`;
      const diff = currentValue - previousValue;
      const pct = (diff / previousValue) * 100;
      result.change = `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
      result.changeType = diff >= 0 ? 'increase' : 'decrease';
      result.changeValue = `${diff >= 0 ? '+' : ''}${Math.round(diff).toLocaleString('zh-CN')}元`;
    }

    return result;
  };

  return {
    // 签单保费行
    maturedPremium: formatMetric('满期保费', current.totalMatured, previous?.totalMatured ?? null, (v) => `${Math.round(v / 10000).toLocaleString('zh-CN')}万`, false),
    policyCount: formatCountMetric('保单件数', current.totalPolicies, previous?.totalPolicies ?? null),
    avgPremium: formatAmountMetric('单均保费', current.avgPremium, previous?.avgPremium ?? null),

    // 满期赔付率行
    reportedClaim: formatMetric('已报告赔款', current.totalClaim, previous?.totalClaim ?? null, (v) => `${Math.round(v / 10000).toLocaleString('zh-CN')}万`, false),
    avgClaim: formatAmountMetric('案均赔款', current.avgClaim, previous?.avgClaim ?? null),
    incidentRate: formatMetric('满期出险率', current.incidentRate, previous?.incidentRate ?? null, (v) => `${v.toFixed(2)}%`, true),

    // 费用率行
    expenseAmount: formatMetric('费用金额', current.totalExpense, previous?.totalExpense ?? null, (v) => `${Math.round(v / 10000).toLocaleString('zh-CN')}万`, false),
    avgExpense: formatAmountMetric('单均费用', current.avgExpense, previous?.avgExpense ?? null),

    // 满期边际贡献率行
    variableCostRatio: formatMetric('变动成本率', current.variableCostRatio, previous?.variableCostRatio ?? null, (v) => `${v.toFixed(2)}%`, true),
    marginalContribution: formatMetric('满期边际贡献额', current.totalMarginal, previous?.totalMarginal ?? null, (v) => `${Math.round(v / 10000).toLocaleString('zh-CN')}万`, false),
    ultimateMarginalContribution: formatMetric('终极边际贡献额', current.ultimateMarginalContribution, previous?.ultimateMarginalContribution ?? null, (v) => `${Math.round(v / 10000).toLocaleString('zh-CN')}万`, false),
  };
}

export function KpiGrid() {
  const { filteredData, rawData, highlightedKpis, filters } = useData();
  const { toast } = useToast();
  const [dimension, setDimension] = useState<DimensionKey>(DEFAULT_DIMENSION);
  const [dimensionValue, setDimensionValue] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showAIAnalysis, setShowAIAnalysis] = useState<boolean>(false);

  const datasetForOptions = useMemo(() => (filteredData.length ? filteredData : rawData), [filteredData, rawData]);

  const availableDimensionOptions = useMemo(() => {
    if (!datasetForOptions.length) {
      return dimensionConfigs;
    }
    const options = dimensionConfigs.filter((option) => hasDimensionData(datasetForOptions, option.value));
    return options.length ? options : dimensionConfigs;
  }, [datasetForOptions]);

  const groupedDimensionOptions = useMemo(() => {
    const availableSet = new Set(availableDimensionOptions.map((option) => option.value));
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
  }, [availableDimensionOptions]);

  useEffect(() => {
    if (availableDimensionOptions.length === 0) {
      return;
    }
    if (!availableDimensionOptions.some((option) => option.value === dimension)) {
      setDimension(availableDimensionOptions[0].value);
    }
  }, [availableDimensionOptions, dimension]);

  const cleanedRows = useMemo(() => {
    if (!filteredData.length) {
      return [];
    }
    const fallback = getMissingLabel(dimension);
    return filteredData.filter((row) => {
      const { label } = normalizeLabel(getDimensionValue(row, dimension), fallback);
      return label !== fallback;
    });
  }, [filteredData, dimension]);

  const dimensionValueOptions = useMemo(() => {
    if (!cleanedRows.length) {
      return [];
    }
    const fallback = getMissingLabel(dimension);
    const valuesSet = new Set<string>();
    cleanedRows.forEach((row) => {
      const { label } = normalizeLabel(getDimensionValue(row, dimension), fallback);
      valuesSet.add(label);
    });
    return Array.from(valuesSet).sort();
  }, [cleanedRows, dimension]);

  useEffect(() => {
    setDimensionValue("ALL");
  }, [dimension]);

  // 获取本周和上周数据
  const { currentWeekData, previousWeekData } = useMemo(() => {
    if (!rawData.length) {
      return { currentWeekData: [], previousWeekData: [] };
    }

    // 使用rawData应用当前的筛选条件（除了周数）来获取基础数据集
    const baseFilteredData = rawData.filter((row) => {
      const yearMatch = !filters.year || row.policy_start_year.toString() === filters.year;
      const regionMatch = !filters.region || filters.region.includes(row.third_level_organization);
      const typeMatch = !filters.insuranceTypes || filters.insuranceTypes.includes(row.insurance_type);
      const customerCategoryMatch = !filters.customerCategories || filters.customerCategories.includes(row.customer_category_3);
      const energyTypeMatch = !filters.energyTypes || filters.energyTypes.includes(row.is_new_energy_vehicle);
      const transferredStatusMatch = !filters.transferredStatus || filters.transferredStatus.includes(row.is_transferred_vehicle);
      const coverageTypeMatch = !filters.coverageTypes || filters.coverageTypes.includes(row.coverage_type);

      return yearMatch && regionMatch && typeMatch && customerCategoryMatch && energyTypeMatch && transferredStatusMatch && coverageTypeMatch;
    });

    // 应用维度过滤
    let dataToUse = baseFilteredData;
    if (dimensionValue !== "ALL") {
      const fallback = getMissingLabel(dimension);
      dataToUse = baseFilteredData.filter((row) => {
        const { key } = normalizeLabel(getDimensionValue(row, dimension), fallback);
        return key === dimensionValue;
      });
    }

    const weeks = Array.from(new Set(dataToUse.map(row => row.week_number))).sort((a, b) => a - b);
    const latestWeek = weeks[weeks.length - 1];
    const prevWeek = latestWeek - 1;

    const current = dataToUse.filter(row => row.week_number === latestWeek);
    const previous = dataToUse.filter(row => row.week_number === prevWeek);

    return { currentWeekData: current, previousWeekData: previous };
  }, [rawData, filters, dimension, dimensionValue]);

  const kpiData = useMemo(() => {
    if (!currentWeekData.length) {
      return calculateKPIs([], []);
    }
    return calculateKPIs(currentWeekData, previousWeekData);
  }, [currentWeekData, previousWeekData]);

  // 判断是否有足够的数据进行AI分析
  const hasAIData = useMemo(() => {
    return currentWeekData.length > 0 && previousWeekData.length > 0;
  }, [currentWeekData, previousWeekData]);

  const secondaryMetrics = useMemo(() => {
    return calculateSecondaryMetrics(currentWeekData, previousWeekData);
  }, [currentWeekData, previousWeekData]);

  const tableRows = useMemo(() => {
    const sections = [
      {
        group: '签单保费',
        metrics: [
          kpiData.signedPremium,
          secondaryMetrics.maturedPremium,
          secondaryMetrics.policyCount,
          secondaryMetrics.avgPremium,
        ],
      },
      {
        group: '满期赔付率',
        metrics: [
          kpiData.maturedLossRatio,
          secondaryMetrics.reportedClaim,
          secondaryMetrics.avgClaim,
          secondaryMetrics.incidentRate,
        ],
      },
      {
        group: '费用率',
        metrics: [
          kpiData.expenseRatio,
          secondaryMetrics.expenseAmount,
          secondaryMetrics.avgExpense,
        ],
      },
      {
        group: '满期边际贡献率',
        metrics: [
          kpiData.maturedMarginalContributionRate,
          secondaryMetrics.variableCostRatio,
          secondaryMetrics.marginalContribution,
          secondaryMetrics.ultimateMarginalContribution,
        ],
      },
    ];

    return sections.flatMap((section) =>
      section.metrics
        .filter((metric): metric is MetricData => Boolean(metric))
        .map((metric) => ({
          group: section.group,
          label: metric.label,
          value: metric.value,
          previousValue: metric.previousValue ?? '—',
          change: metric.change ?? '—',
          changeValue: metric.changeValue ?? '—',
        })),
    );
  }, [kpiData, secondaryMetrics]);

  const kpiInsight = useMemo(() => {
    if (!currentWeekData.length) {
      return "当前无数据可分析";
    }

    // 计算本周指标
    const calcMetrics = (data: typeof currentWeekData) => {
      const totalSigned = data.reduce((acc, row) => acc + (row.signed_premium_yuan || 0), 0);
      const totalMatured = data.reduce((acc, row) => acc + (row.matured_premium_yuan || 0), 0);
      const totalClaim = data.reduce((acc, row) => acc + (row.reported_claim_payment_yuan || 0), 0);
      const totalExpense = data.reduce((acc, row) => acc + (row.expense_amount_yuan || 0), 0);
      const totalMarginal = data.reduce((acc, row) => acc + (row.marginal_contribution_amount_yuan || 0), 0);

      return {
        lossRatio: totalMatured > 0 ? (totalClaim / totalMatured) * 100 : 0,
        expenseRatio: totalSigned > 0 ? (totalExpense / totalSigned) * 100 : 0,
        marginalRate: totalMatured > 0 ? (totalMarginal / totalMatured) * 100 : 0,
      };
    };

    const current = calcMetrics(currentWeekData);
    const previous = previousWeekData.length > 0 ? calcMetrics(previousWeekData) : null;

    if (!previous) {
      return "本周数据正常运行中";
    }

    // 计算变化
    const lossRatioChange = current.lossRatio - previous.lossRatio;
    const expenseRatioChange = current.expenseRatio - previous.expenseRatio;
    const marginalRateChange = current.marginalRate - previous.marginalRate;

    // 判断恶化
    const issues = [];
    if (lossRatioChange > 1) {
      issues.push(`满期赔付率上升${lossRatioChange.toFixed(2)}pp`);
    }
    if (expenseRatioChange > 0.5) {
      issues.push(`费用率上升${expenseRatioChange.toFixed(2)}pp`);
    }
    if (marginalRateChange < -0.5) {
      issues.push(`满期边际贡献率下降${Math.abs(marginalRateChange).toFixed(2)}pp`);
    }

    if (issues.length > 0) {
      return `经营效率出现恶化：${issues.join("，")}`;
    }

    // 判断改善
    const improvements = [];
    if (lossRatioChange < -1) {
      improvements.push(`满期赔付率下降${Math.abs(lossRatioChange).toFixed(2)}pp`);
    }
    if (expenseRatioChange < -0.5) {
      improvements.push(`费用率下降${Math.abs(expenseRatioChange).toFixed(2)}pp`);
    }
    if (marginalRateChange > 0.5) {
      improvements.push(`满期边际贡献率提升${marginalRateChange.toFixed(2)}pp`);
    }

    if (improvements.length > 0) {
      return `经营效率持续改善：${improvements.join("，")}`;
    }

    return "经营指标保持稳定";
  }, [currentWeekData, previousWeekData]);

  const isTableMode = viewMode === 'table';
  const canCopyTable = tableRows.length > 0;

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'card' ? 'table' : 'card'));
  };

  const handleCopyTable = async () => {
    if (!canCopyTable) {
      return;
    }

    const header = ['分组', '指标', '本周值', '上周值', '环比', '绝对变化'];
    const rows = tableRows.map((row) => [row.group, row.label, row.value, row.previousValue, row.change, row.changeValue]);
    const content = [header, ...rows]
      .map((line) => line.join('\t'))
      .join('\n');

    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: '表格已复制',
        description: '指标数据已复制到剪贴板，可直接粘贴到表格工具中。',
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>KPI看板：{kpiInsight}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`${CONTROL_WRAPPER_CLASS} lg:grid-cols-[1.05fr_1.05fr_0.9fr_0.9fr]`}>
            <div className={CONTROL_FIELD_CLASS}>
              <span className="text-xs text-muted-foreground">选择维度</span>
              <Select value={dimension} onValueChange={(value) => setDimension(value as DimensionKey)}>
                <SelectTrigger className={CONTROL_TRIGGER_CLASS}>
                  <SelectValue placeholder="选择维度" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {groupedDimensionOptions.map((group) => (
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
              <span className="text-xs text-muted-foreground">筛选取值</span>
              <Select value={dimensionValue} onValueChange={setDimensionValue}>
                <SelectTrigger className={CONTROL_TRIGGER_CLASS}>
                  <SelectValue placeholder="选择取值" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="ALL">全部</SelectItem>
                  {dimensionValueOptions.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={CONTROL_FIELD_CLASS}>
              <span className="text-xs text-muted-foreground">操作</span>
              <Button
                size="sm"
                variant="outline"
                className={`${CONTROL_BUTTON_CLASS} w-full justify-center`}
                onClick={toggleViewMode}
              >
                {isTableMode ? '查看图表' : '查看数据'}
              </Button>
            </div>
            <div className={CONTROL_FIELD_CLASS}>
              <span className="text-xs text-muted-foreground">AI 分析</span>
              <Button
                size="sm"
                variant="outline"
                className={`${CONTROL_BUTTON_CLASS} w-full justify-center gap-2`}
                onClick={() => setShowAIAnalysis((prev) => !prev)}
                disabled={!hasAIData}
              >
                <Sparkles className="h-4 w-4" />
                {showAIAnalysis ? '收起AI' : 'AI归因'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isTableMode ? (
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between gap-2 border-b border-border/40 px-6 py-4">
              <span className="text-sm font-medium text-muted-foreground">数据明细</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-3"
                onClick={handleCopyTable}
                disabled={tableRows.length === 0 || !canCopyTable}
              >
                <Copy className="mr-2 h-4 w-4" />
                复制数据
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">分组</TableHead>
                  <TableHead>指标</TableHead>
                  <TableHead>本周值</TableHead>
                  <TableHead>上周值</TableHead>
                  <TableHead>环比</TableHead>
                  <TableHead>绝对变化</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      当前筛选条件下暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  tableRows.map((row) => (
                    <TableRow key={`${row.group}-${row.label}`}>
                      <TableCell className="font-medium">{row.group}</TableCell>
                      <TableCell>{row.label}</TableCell>
                      <TableCell>{row.value}</TableCell>
                      <TableCell>{row.previousValue}</TableCell>
                      <TableCell>{row.change}</TableCell>
                      <TableCell>{row.changeValue}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <KpiMetricCard
              label="签单保费"
              value={kpiData.signedPremium.value}
              change={kpiData.signedPremium.change}
              changeType={kpiData.signedPremium.changeType}
              previousValue={kpiData.signedPremium.previousValue}
              isPrimary
              highlighted={highlightedKpis.includes(kpiMeta.signedPremium.title)}
              changeValue={kpiData.signedPremium.changeValue}
              variant="signedPremium"
            />
            <KpiMetricCard {...secondaryMetrics.maturedPremium} variant="signedPremium" />
            <KpiMetricCard {...secondaryMetrics.policyCount} variant="signedPremium" />
            <KpiMetricCard {...secondaryMetrics.avgPremium} variant="signedPremium" />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <KpiMetricCard
              label="满期赔付率"
              value={kpiData.maturedLossRatio.value}
              change={kpiData.maturedLossRatio.change}
              changeType={kpiData.maturedLossRatio.changeType}
              previousValue={kpiData.maturedLossRatio.previousValue}
              isPrimary
              highlighted={highlightedKpis.includes(kpiMeta.maturedLossRatio.title)}
              changeValue={kpiData.maturedLossRatio.changeValue}
              variant="lossRatio"
            />
            <KpiMetricCard {...secondaryMetrics.reportedClaim} variant="lossRatio" />
            <KpiMetricCard {...secondaryMetrics.avgClaim} variant="lossRatio" />
            <KpiMetricCard {...secondaryMetrics.incidentRate} variant="lossRatio" />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <KpiMetricCard
              label="费用率"
              value={kpiData.expenseRatio.value}
              change={kpiData.expenseRatio.change}
              changeType={kpiData.expenseRatio.changeType}
              previousValue={kpiData.expenseRatio.previousValue}
              isPrimary
              highlighted={highlightedKpis.includes(kpiMeta.expenseRatio.title)}
              changeValue={kpiData.expenseRatio.changeValue}
              variant="expenseRatio"
            />
            <KpiMetricCard {...secondaryMetrics.expenseAmount} variant="expenseRatio" />
            <KpiMetricCard {...secondaryMetrics.avgExpense} variant="expenseRatio" />
            <div />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <KpiMetricCard
              label="满期边际贡献率"
              value={kpiData.maturedMarginalContributionRate.value}
              change={kpiData.maturedMarginalContributionRate.change}
              changeType={kpiData.maturedMarginalContributionRate.changeType}
              previousValue={kpiData.maturedMarginalContributionRate.previousValue}
              isPrimary
              highlighted={highlightedKpis.includes(kpiMeta.maturedMarginalContributionRate.title)}
              changeValue={kpiData.maturedMarginalContributionRate.changeValue}
              variant="marginal"
            />
            <KpiMetricCard {...secondaryMetrics.variableCostRatio} variant="marginal" />
            <KpiMetricCard {...secondaryMetrics.marginalContribution} variant="marginal" />
            <KpiMetricCard {...secondaryMetrics.ultimateMarginalContribution} variant="marginal" />
          </div>
        </>
      )}

      {showAIAnalysis && hasAIData && (
        <AIDeteriorationAnalysis
          currentWeekData={currentWeekData}
          previousWeekData={previousWeekData}
        />
      )}
    </div>
  );
}
