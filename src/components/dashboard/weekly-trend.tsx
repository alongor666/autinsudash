"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  Cell,
  LabelList,
} from "recharts";
import type { TooltipProps } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getWeekEndDate, computeDeltaRows } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from "@/contexts/data-context";
import type { RawDataRow } from "@/lib/types";
import {
  DimensionKey,
  dimensionConfigs,
  hasDimensionData,
  shouldSkipMissingDimension,
  getMissingLabel,
  getDimensionValue,
  normalizeLabel,
  dimensionGroups,
} from "@/components/dashboard/customer-performance";
import { getMarginalContributionColor } from "@/lib/color-scale";
import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";
import {
  CONTROL_BUTTON_CLASS,
  CONTROL_FIELD_CLASS,
  CONTROL_TRIGGER_CLASS,
  CONTROL_WRAPPER_CLASS,
} from "./control-styles";

const DEFAULT_DIMENSION: DimensionKey = "customer_category_3";

const LINE_COLOR = "hsl(var(--chart-2))";

const MAX_WEEKS = 12;

type AbsoluteMetricKey =
  | "signedPremium"
  | "maturedPremium"
  | "policyCount"
  | "claimCaseCount"
  | "reportedClaim"
  | "expenseAmount"
  | "commercialPremiumBeforeDiscount"
  | "marginalContributionAmount";

type RateMetricKey =
  | "marginalContributionRate"
  | "maturedLossRatio"
  | "expenseRatio"
  | "variableCostRatio"
  | "incidentRate"
  | "commercialAutonomyCoefficient";

type WeeklyAccumulator = {
  signedPremium: number;
  maturedPremium: number;
  policyCount: number;
  claimCaseCount: number;
  reportedClaim: number;
  expenseAmount: number;
  commercialPremiumBeforeDiscount: number;
  marginalContributionAmount: number;
};

type AbsoluteMetricDefinition = {
  key: AbsoluteMetricKey;
  label: string;
  unit: string;
  compute: (acc: WeeklyAccumulator) => number;
  format: (value: number) => string;
  tickFormatter?: (value: number) => string;
};

type RateMetricDefinition = {
  key: RateMetricKey;
  label: string;
  unit: string;
  compute: (acc: WeeklyAccumulator) => number;
  format: (value: number) => string;
  tickFormatter?: (value: number) => string;
};

const absoluteMetricDefinitions: Record<AbsoluteMetricKey, AbsoluteMetricDefinition> = {
  signedPremium: {
    key: "signedPremium",
    label: "签单保费（万元）",
    unit: "万",
    compute: (acc) => acc.signedPremium / 10000,
    format: (value) => Math.round(value).toLocaleString("zh-CN"),
  },
  maturedPremium: {
    key: "maturedPremium",
    label: "满期保费（万元）",
    unit: "万",
    compute: (acc) => acc.maturedPremium / 10000,
    format: (value) => Math.round(value).toLocaleString("zh-CN"),
  },
  policyCount: {
    key: "policyCount",
    label: "保单件数（件）",
    unit: "件",
    compute: (acc) => acc.policyCount,
    format: (value) => Math.round(value).toLocaleString("zh-CN"),
    tickFormatter: (value) => Math.round(value).toLocaleString("zh-CN"),
  },
  claimCaseCount: {
    key: "claimCaseCount",
    label: "赔案件数（件）",
    unit: "件",
    compute: (acc) => acc.claimCaseCount,
    format: (value) => Math.round(value).toLocaleString("zh-CN"),
    tickFormatter: (value) => Math.round(value).toLocaleString("zh-CN"),
  },
  reportedClaim: {
    key: "reportedClaim",
    label: "已报告赔款（万元）",
    unit: "万",
    compute: (acc) => acc.reportedClaim / 10000,
    format: (value) => Math.round(value).toLocaleString("zh-CN"),
  },
  expenseAmount: {
    key: "expenseAmount",
    label: "费用金额（万元）",
    unit: "万",
    compute: (acc) => acc.expenseAmount / 10000,
    format: (value) => Math.round(value).toLocaleString("zh-CN"),
  },
  commercialPremiumBeforeDiscount: {
    key: "commercialPremiumBeforeDiscount",
    label: "商业险折前保费（万元）",
    unit: "万",
    compute: (acc) => acc.commercialPremiumBeforeDiscount / 10000,
    format: (value) => Math.round(value).toLocaleString("zh-CN"),
  },
  marginalContributionAmount: {
    key: "marginalContributionAmount",
    label: "满期边际贡献额（万元）",
    unit: "万",
    compute: (acc) => acc.marginalContributionAmount / 10000,
    format: (value) => Math.round(value).toLocaleString("zh-CN"),
  },
};

const rateMetricDefinitions: Record<RateMetricKey, RateMetricDefinition> = {
  marginalContributionRate: {
    key: "marginalContributionRate",
    label: "满期边际贡献率",
    unit: "%",
    compute: (acc) => (acc.maturedPremium === 0 ? 0 : (acc.marginalContributionAmount / acc.maturedPremium) * 100),
    format: (value) => value.toFixed(2),
    tickFormatter: (value) => value.toFixed(2),
  },
  maturedLossRatio: {
    key: "maturedLossRatio",
    label: "满期赔付率",
    unit: "%",
    compute: (acc) => (acc.maturedPremium === 0 ? 0 : (acc.reportedClaim / acc.maturedPremium) * 100),
    format: (value) => value.toFixed(2),
    tickFormatter: (value) => value.toFixed(2),
  },
  expenseRatio: {
    key: "expenseRatio",
    label: "费用率",
    unit: "%",
    compute: (acc) => (acc.signedPremium === 0 ? 0 : (acc.expenseAmount / acc.signedPremium) * 100),
    format: (value) => value.toFixed(2),
    tickFormatter: (value) => value.toFixed(2),
  },
  variableCostRatio: {
    key: "variableCostRatio",
    label: "变动成本率",
    unit: "%",
    compute: (acc) => {
      const expensePart = acc.signedPremium === 0 ? 0 : acc.expenseAmount / acc.signedPremium;
      const claimPart = acc.maturedPremium === 0 ? 0 : acc.reportedClaim / acc.maturedPremium;
      return (expensePart + claimPart) * 100;
    },
    format: (value) => value.toFixed(2),
    tickFormatter: (value) => value.toFixed(2),
  },
  incidentRate: {
    key: "incidentRate",
    label: "满期出险率",
    unit: "%",
    compute: (acc) => {
      if (acc.policyCount === 0 || acc.signedPremium === 0) {
        return 0;
      }
      const firstFactor = acc.claimCaseCount / acc.policyCount;
      const secondFactor = acc.signedPremium === 0 ? 0 : acc.maturedPremium / acc.signedPremium;
      return firstFactor * secondFactor * 100;
    },
    format: (value) => value.toFixed(2),
    tickFormatter: (value) => value.toFixed(2),
  },
  commercialAutonomyCoefficient: {
    key: "commercialAutonomyCoefficient",
    label: "商业险自主系数",
    unit: "",
    compute: (acc) => (acc.commercialPremiumBeforeDiscount === 0 ? 0 : acc.signedPremium / acc.commercialPremiumBeforeDiscount),
    format: (value) => value.toFixed(3),
    tickFormatter: (value) => value.toFixed(3),
  },
};

type ChartDatum = {
  week: number;
  year: number;
  weekLabel: string;
  barValue: number;
  lineValue: number;
  marginalContributionRate: number;
  barColor: string;
};

type DimensionOption = {
  value: DimensionKey;
  label: string;
};

type DimensionValueOption = {
  value: string;
  label: string;
};

function getAvailableDimensionOptions(dataset: RawDataRow[]): DimensionOption[] {
  if (!dataset.length) {
    return dimensionConfigs;
  }
  const options = dimensionConfigs.filter((option) => hasDimensionData(dataset, option.value));
  return options.length ? options : dimensionConfigs;
}

function summarizeRows(rows: RawDataRow[]): Map<number, WeeklyAccumulator> {
  const map = new Map<number, WeeklyAccumulator>();

  rows.forEach((row) => {
    const week = row.week_number;
    const current = map.get(week) ?? {
      signedPremium: 0,
      maturedPremium: 0,
      policyCount: 0,
      claimCaseCount: 0,
      reportedClaim: 0,
      expenseAmount: 0,
      commercialPremiumBeforeDiscount: 0,
      marginalContributionAmount: 0,
    };

    current.signedPremium += row.signed_premium_yuan ?? 0;
    current.maturedPremium += row.matured_premium_yuan ?? 0;
    current.policyCount += row.policy_count ?? 0;
    current.claimCaseCount += row.claim_case_count ?? 0;
    current.reportedClaim += row.reported_claim_payment_yuan ?? 0;
    current.expenseAmount += row.expense_amount_yuan ?? 0;
    current.commercialPremiumBeforeDiscount += row.commercial_premium_before_discount_yuan ?? 0;
    current.marginalContributionAmount += row.marginal_contribution_amount_yuan ?? 0;

    map.set(week, current);
  });

  return map;
}

function buildDimensionValueOptions(
  dataset: RawDataRow[],
  dimension: DimensionKey,
): DimensionValueOption[] {
  if (!dataset.length) {
    return [{ value: "ALL", label: "全部" }];
  }

  const counts = new Map<string, { label: string; count: number }>();
  const fallback = getMissingLabel(dimension);

  dataset.forEach((row) => {
    const raw = getDimensionValue(row, dimension);
    const { key, label } = normalizeLabel(raw, fallback);
    if (shouldSkipMissingDimension(dimension) && label === fallback) {
      return;
    }
    const current = counts.get(key);
    if (current) {
      current.count += 1;
    } else {
      counts.set(key, { label, count: 1 });
    }
  });

  const sorted = Array.from(counts.entries())
    .sort((a, b) => {
      if (b[1].count !== a[1].count) {
        return b[1].count - a[1].count;
      }
      return a[1].label.localeCompare(b[1].label, "zh-CN");
    })
    .map(([value, meta]) => ({ value, label: meta.label }));

  return [{ value: "ALL", label: "全部" }, ...sorted];
}

function formatUnit(value: number, unit: string, formatter: (value: number) => string) {
  const content = formatter(value);
  if (!unit) {
    return content;
  }
  return `${content}${unit}`;
}

function buildWeeklyDeltaRows(rows: RawDataRow[]): RawDataRow[] {
  if (!rows.length) {
    return [];
  }
  const rowsByWeek = rows.reduce((acc, row) => {
    const list = acc.get(row.week_number) ?? [];
    list.push(row);
    acc.set(row.week_number, list);
    return acc;
  }, new Map<number, RawDataRow[]>());

  const orderedWeeks = Array.from(rowsByWeek.keys()).sort((a, b) => a - b);
  const result: RawDataRow[] = [];

  orderedWeeks.forEach((week, index) => {
    const currentRows = rowsByWeek.get(week) ?? [];
    if (!currentRows.length) {
      return;
    }
    if (index === 0) {
      result.push(...currentRows);
      return;
    }
    const previousWeek = orderedWeeks[index - 1];
    const previousRows = rowsByWeek.get(previousWeek) ?? [];
    const deltaRows = computeDeltaRows(currentRows, previousRows);
    result.push(...deltaRows);
  });

  return result;
}

export function WeeklyTrendChart() {
  const { trendFilteredData, rawData, timePeriod } = useData();
  const { toast } = useToast();

  const [dimension, setDimension] = useState<DimensionKey>(DEFAULT_DIMENSION);
  const [dimensionValue, setDimensionValue] = useState<string>("ALL");
  const [barMetricKey, setBarMetricKey] = useState<AbsoluteMetricKey>("signedPremium");
  const [lineMetricKey, setLineMetricKey] = useState<RateMetricKey>("marginalContributionRate");
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const effectiveTrendRows = useMemo(
    () => (timePeriod === 'weekly' ? buildWeeklyDeltaRows(trendFilteredData) : trendFilteredData),
    [trendFilteredData, timePeriod],
  );

  const datasetForOptions = useMemo(
    () => (effectiveTrendRows.length ? effectiveTrendRows : rawData),
    [effectiveTrendRows, rawData],
  );

  const availableDimensionOptions = useMemo(
    () => getAvailableDimensionOptions(datasetForOptions),
    [datasetForOptions],
  );

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
    if (!availableDimensionOptions.length) {
      return;
    }
    if (!availableDimensionOptions.some((option) => option.value === dimension)) {
      setDimension(availableDimensionOptions[0].value);
      setDimensionValue("ALL");
    }
  }, [availableDimensionOptions, dimension]);

  const dimensionValueOptions = useMemo(
    () => buildDimensionValueOptions(datasetForOptions, dimension),
    [datasetForOptions, dimension],
  );

  useEffect(() => {
    setDimensionValue("ALL");
  }, [dimension]);

  useEffect(() => {
    if (!dimensionValueOptions.some((option) => option.value === dimensionValue)) {
      setDimensionValue("ALL");
    }
  }, [dimensionValue, dimensionValueOptions]);

  const cleanedRows = useMemo(() => {
    if (!effectiveTrendRows.length) {
      return [] as RawDataRow[];
    }
    const fallback = getMissingLabel(dimension);
    return effectiveTrendRows.filter((row) => {
      if (!shouldSkipMissingDimension(dimension)) {
        return true;
      }
      const { label } = normalizeLabel(getDimensionValue(row, dimension), fallback);
      return label !== fallback;
    });
  }, [effectiveTrendRows, dimension]);

  const dimensionFilteredRows = useMemo(() => {
    if (dimensionValue === "ALL") {
      return cleanedRows;
    }
    const fallback = getMissingLabel(dimension);
    return cleanedRows.filter((row) => {
      const { key } = normalizeLabel(getDimensionValue(row, dimension), fallback);
      return key === dimensionValue;
    });
  }, [cleanedRows, dimension, dimensionValue]);

  const barMetric = absoluteMetricDefinitions[barMetricKey];
  const lineMetric = rateMetricDefinitions[lineMetricKey];

  const chartData = useMemo(() => {
    if (!dimensionFilteredRows.length) {
      return [] as ChartDatum[];
    }

    const summary = summarizeRows(dimensionFilteredRows);
    const weeks = Array.from(summary.keys()).sort((a, b) => a - b);
    const lastWeeks = weeks.slice(-MAX_WEEKS);

    return lastWeeks.map((week) => {
      const accumulator = summary.get(week)!;
      const marginalContributionRate = accumulator.maturedPremium === 0
        ? 0
        : accumulator.marginalContributionAmount / accumulator.maturedPremium;
      const barColor = getMarginalContributionColor(marginalContributionRate);

      // 从对应周的数据行中获取年份
      const yearForWeek = dimensionFilteredRows.find((row) => row.week_number === week)?.policy_start_year || new Date().getFullYear();

      return {
        week,
        year: yearForWeek,
        weekLabel: `第${week}周`,
        barValue: barMetric.compute(accumulator),
        lineValue: lineMetric.compute(accumulator),
        marginalContributionRate,
        barColor,
      };
    });
  }, [dimensionFilteredRows, barMetric, lineMetric]);

  const barMax = useMemo(() => {
    if (!chartData.length) {
      return 0;
    }
    return chartData.reduce((max, datum) => Math.max(max, datum.barValue), 0);
  }, [chartData]);

  const lineExtent = useMemo(() => {
    if (!chartData.length) {
      return { min: 0, max: 0 };
    }
    return chartData.reduce(
      (acc, datum) => ({
        min: Math.min(acc.min, datum.lineValue),
        max: Math.max(acc.max, datum.lineValue),
      }),
      { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY },
    );
  }, [chartData]);

  const barDomain = useMemo(() => {
    if (barMax <= 0) {
      return [0, 1];
    }
    const padding = barMax * 0.15;
    return [0, Math.ceil(barMax + padding)];
  }, [barMax]);

  const lineDomain = useMemo(() => {
    if (!chartData.length) {
      return [0, 1];
    }
    const { min, max } = lineExtent;
    if (!isFinite(min) || !isFinite(max)) {
      return [0, 1];
    }
    if (min === max) {
      if (min === 0) {
        return [0, 1];
      }
      const padding = Math.abs(min) * 0.2;
      return [min - padding, max + padding];
    }
    const padding = Math.max(Math.abs(min), Math.abs(max)) * 0.15;
    const lower = Math.min(min, max) - padding;
    const upper = Math.max(min, max) + padding;
    return [lower, upper];
  }, [chartData, lineExtent]);

  const barTickFormatter = useMemo(() => {
    return barMetric.tickFormatter ?? ((value: number) => Math.round(value).toLocaleString("zh-CN"));
  }, [barMetric]);

  const lineTickFormatter = useMemo(() => {
    if (lineMetric.tickFormatter) {
      return lineMetric.tickFormatter;
    }
    return (value: number) => value.toFixed(lineMetric.unit === "%" ? 1 : 3);
  }, [lineMetric]);

  const insight = useMemo(() => {
    if (!chartData.length) {
      return "暂无可用数据";
    }
    const latest = chartData[chartData.length - 1];
    const barText = formatUnit(latest.barValue, barMetric.unit, barMetric.format);
    const lineText = formatUnit(
      latest.lineValue,
      lineMetric.unit,
      lineMetric.format,
    );
    const dimensionText = dimensionValueOptions.find((option) => option.value === dimensionValue)?.label ?? "全部";
    return `${dimensionText}在第${latest.week}周的${barMetric.label.replace(/（.*?）/g, "")}${barMetric.unit ? "为" : ""}${barText}，${lineMetric.label}${lineMetric.unit ? "为" : ""}${lineText}`;
  }, [chartData, barMetric, lineMetric, dimensionValue, dimensionValueOptions]);

  const customTooltip = useMemo(
    () =>
      function TooltipContent({ active, payload }: TooltipProps<number, string>) {
        if (!active || !payload || payload.length === 0) {
          return null;
        }
        const datum = (payload[0]?.payload ?? null) as ChartDatum | null;
        if (!datum) {
          return null;
        }
        const endDate = getWeekEndDate(datum.year, datum.week);
        return (
          <div className="rounded-md border border-border/50 bg-background/90 p-3 text-xs shadow-xl backdrop-blur">
            <div className="font-medium text-foreground">
              {datum.weekLabel}
              <span className="ml-2 text-muted-foreground">（截至{endDate}）</span>
            </div>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <div>
                {barMetric.label}：
                <span className="ml-1 font-medium text-foreground">
                  {formatUnit(datum.barValue, barMetric.unit, barMetric.format)}
                </span>
              </div>
              <div>
                {lineMetric.label}：
                <span className="ml-1 font-medium text-foreground">
                  {formatUnit(datum.lineValue, lineMetric.unit, lineMetric.format)}
                </span>
              </div>
            </div>
          </div>
        );
      },
    [barMetric, lineMetric],
  );

  const tableRows = useMemo(
    () =>
      chartData.map((item) => ({
        week: item.weekLabel,
        barValue: formatUnit(item.barValue, barMetric.unit, barMetric.format),
        lineValue: formatUnit(item.lineValue, lineMetric.unit, lineMetric.format),
      })),
    [chartData, barMetric, lineMetric],
  );

  const isTableMode = viewMode === 'table';
  const canCopyTable = tableRows.length > 0;

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'chart' ? 'table' : 'chart'));
  };

  const handleCopyTable = async () => {
    if (!isTableMode || !canCopyTable) {
      return;
    }

    const header = ['周序号', barMetric.label, lineMetric.label];
    const rows = tableRows.map((row) => [row.week, row.barValue, row.lineValue]);
    const content = [header, ...rows]
      .map((line) => line.join('\t'))
      .join('\n');

    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: '表格已复制',
        description: '趋势数据已复制到剪贴板，可直接粘贴到表格工具中。',
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
    <Card>
      <CardHeader>
        <CardTitle>最近12周趋势对比图</CardTitle>
        <CardDescription>{insight}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={`${CONTROL_WRAPPER_CLASS} lg:grid-cols-[1.05fr_1.05fr_1.05fr_1.05fr_0.9fr]`}>
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
                {dimensionValueOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={CONTROL_FIELD_CLASS}>
            <span className="text-xs text-muted-foreground">柱状指标</span>
            <Select value={barMetricKey} onValueChange={(value) => setBarMetricKey(value as AbsoluteMetricKey)}>
              <SelectTrigger className={CONTROL_TRIGGER_CLASS}>
                <SelectValue placeholder="选择柱状指标" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {Object.values(absoluteMetricDefinitions).map((metric) => (
                  <SelectItem key={metric.key} value={metric.key}>
                    {metric.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={CONTROL_FIELD_CLASS}>
            <span className="text-xs text-muted-foreground">折线指标</span>
            <Select value={lineMetricKey} onValueChange={(value) => setLineMetricKey(value as RateMetricKey)}>
              <SelectTrigger className={CONTROL_TRIGGER_CLASS}>
                <SelectValue placeholder="选择折线指标" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {Object.values(rateMetricDefinitions).map((metric) => (
                  <SelectItem key={metric.key} value={metric.key}>
                    {metric.label}
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
        </div>

        {isTableMode ? (
          tableRows.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
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
                  onClick={handleCopyTable}
                  disabled={!canCopyTable || tableRows.length === 0}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  复制数据
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">周序号</TableHead>
                    <TableHead>{barMetric.label}</TableHead>
                    <TableHead>{lineMetric.label}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((row) => (
                    <TableRow key={row.week}>
                      <TableCell className="font-medium">{row.week}</TableCell>
                      <TableCell>{row.barValue}</TableCell>
                      <TableCell>{row.lineValue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : chartData.length === 0 ? (
          <div className="flex h-[360px] items-center justify-center text-sm text-muted-foreground">
            当前筛选条件下暂无数据
          </div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 32, right: 24, bottom: 8, left: 24 }}>
                <XAxis
                  dataKey="weekLabel"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  yAxisId="left"
                  domain={barDomain as [number, number]}
                  tickFormatter={barTickFormatter}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={lineDomain as [number, number]}
                  tickFormatter={lineTickFormatter}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <RechartsTooltip content={customTooltip} cursor={{ fill: "hsl(var(--muted)/0.3)" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  name={barMetric.label}
                  yAxisId="left"
                  dataKey="barValue"
                  barSize={18}
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList
                    dataKey="barValue"
                    position="top"
                    fontSize={12}
                    fill="hsl(var(--foreground))"
                    formatter={(value: number) => barMetric.format(value)}
                  />
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.barColor} />
                  ))}
                </Bar>
                <Line
                  name={lineMetric.label}
                  yAxisId="right"
                  type="monotone"
                  dataKey="lineValue"
                  stroke={LINE_COLOR}
                  strokeWidth={2.4}
                  dot={{ r: 3.5, strokeWidth: 1.5, stroke: LINE_COLOR, fill: "hsl(var(--background))" }}
                  activeDot={{ r: 5, strokeWidth: 1.5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
