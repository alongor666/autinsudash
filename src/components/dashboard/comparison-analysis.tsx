"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Copy, Sparkles } from "lucide-react";
import {
  CONTROL_BUTTON_CLASS,
  CONTROL_FIELD_CLASS,
  CONTROL_TRIGGER_CLASS,
  CONTROL_WRAPPER_CLASS,
} from "./control-styles";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Cell,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useData } from "@/contexts/data-context";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getMarginalContributionColor } from "@/lib/color-scale";
import { normalizeEnergyType, normalizeTransferStatus, convertTextToHtml } from "@/lib/utils";
import type { RawDataRow } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  type DimensionKey,
  dimensionConfigs,
  getMissingLabel,
  shouldSkipMissingDimension,
  normalizeLabel,
} from "./customer-performance";

type NumericField =
  | "signed_premium_yuan"
  | "matured_premium_yuan"
  | "policy_count"
  | "claim_case_count"
  | "reported_claim_payment_yuan"
  | "expense_amount_yuan"
  | "commercial_premium_before_discount_yuan"
  | "marginal_contribution_amount_yuan";

type MetricKey =
  | "signedPremium"
  | "maturedLossRatio"
  | "expenseRatio"
  | "marginalContributionRate"
  | "maturedPremium"
  | "policyCount"
  | "claimCaseCount"
  | "variableCostRatio"
  | "incidentRate"
  | "averagePremium"
  | "averageClaim"
  | "marginalContributionAmount"
  | "commercialPremiumBeforeDiscount"
  | "commercialAutonomyCoefficient"
  | "reportedClaim"
  | "expenseAmount";

type MetricDefinition = {
  key: MetricKey;
  label: string;
  description: string;
  unitLabel: string;
  compute: (rows: RawDataRow[]) => number;
  format: (value: number) => string;
  tickFormatter?: (value: number) => string;
};

type BarDatum = {
  dimension: string;
  value: number;
  displayValue: number;
  color: string;
  marginalRate: number;
  isClamped: boolean;
};

type BarTooltipPayload = {
  payload: BarDatum;
  value: number;
};

function sumNumericField(rows: RawDataRow[], field: NumericField) {
  return rows.reduce((total, row) => total + (row[field] ?? 0), 0);
}

function getDimensionValue(row: RawDataRow, key: DimensionKey) {
  const rawValue = row[key as keyof RawDataRow];

  if (rawValue === null || rawValue === undefined) {
    if (key === "large_truck_score" || key === "small_truck_score") {
      return "未评分";
    }
    if (key === "customer_category_3") {
      return "未分类";
    }
    return "未填写";
  }

  if (typeof rawValue === "number") {
    return rawValue.toString();
  }

  const stringValue = String(rawValue);

  if (key === "is_new_energy_vehicle") {
    return normalizeEnergyType(stringValue);
  }

  if (key === "is_transferred_vehicle") {
    return normalizeTransferStatus(stringValue);
  }

  return stringValue;
}

function getMetricUnit(unitLabel: string) {
  return unitLabel.replace("单位：", "");
}

function getMetricShortLabel(label: string) {
  return label.replace(/（.*?）/g, "");
}

function formatMetricWithUnit(metric: MetricDefinition, value: number) {
  const formatted = metric.format(value);
  const unit = getMetricUnit(metric.unitLabel);
  if (!unit) {
    return formatted;
  }
  return formatted.includes(unit) ? formatted : `${formatted}${unit}`;
}

function clampAbsoluteMax<T>(
  items: T[],
  getValue: (item: T) => number,
  applyDisplay: (item: T, displayValue: number, isClamped: boolean) => T,
  ratio = 2,
) {
  if (items.length === 0) {
    return [] as T[];
  }

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

const dimensionGroups: { label: string; values: DimensionKey[] }[] = [
  {
    label: "车辆属性",
    values: [
      "customer_category_3",
      "renewal_status",
      "is_transferred_vehicle",
      "is_new_energy_vehicle",
      "business_type_category",
    ],
  },
  {
    label: "业务来源",
    values: ["chengdu_branch", "third_level_organization", "terminal_source"],
  },
  {
    label: "保障类型",
    values: ["insurance_type", "coverage_type"],
  },
  {
    label: "风险评分",
    values: ["vehicle_insurance_grade", "large_truck_score", "small_truck_score"],
  },
];

const metricDefinitions: MetricDefinition[] = [
  {
    key: "signedPremium",
    label: "签单保费（万元）",
    description: "签单保费求和",
    unitLabel: "单位：万元",
    compute: (rows) => sumNumericField(rows, "signed_premium_yuan") / 10000,
    format: (value) => Math.round(value).toLocaleString("zh-CN"),
    tickFormatter: (value) => Math.round(value).toLocaleString("zh-CN"),
  },
  {
    key: "maturedLossRatio",
    label: "满期赔付率（%）",
    description: "已报告赔款总额 ÷ 满期保费总额 × 100",
    unitLabel: "单位：%",
    compute: (rows) => {
      const reported = sumNumericField(rows, "reported_claim_payment_yuan");
      const matured = sumNumericField(rows, "matured_premium_yuan");
      if (matured === 0) return 0;
      return (reported / matured) * 100;
    },
    format: (value) => `${value.toFixed(2)}%`,
    tickFormatter: (value) => value.toFixed(2),
  },
  {
    key: "expenseRatio",
    label: "费用率（%）",
    description: "费用金额总额 ÷ 签单保费总额 × 100",
    unitLabel: "单位：%",
    compute: (rows) => {
      const expense = sumNumericField(rows, "expense_amount_yuan");
      const signed = sumNumericField(rows, "signed_premium_yuan");
      if (signed === 0) return 0;
      return (expense / signed) * 100;
    },
    format: (value) => `${value.toFixed(2)}%`,
    tickFormatter: (value) => value.toFixed(2),
  },
  {
    key: "marginalContributionRate",
    label: "满期边际贡献率（%）",
    description: "满期边际贡献额总额 ÷ 满期保费总额 × 100",
    unitLabel: "单位：%",
    compute: (rows) => {
      const marginal = sumNumericField(rows, "marginal_contribution_amount_yuan");
      const matured = sumNumericField(rows, "matured_premium_yuan");
      if (matured === 0) return 0;
      return (marginal / matured) * 100;
    },
    format: (value) => `${value.toFixed(2)}%`,
    tickFormatter: (value) => value.toFixed(2),
  },
  {
    key: "maturedPremium",
    label: "满期保费（万元）",
    description: "满期保费求和",
    unitLabel: "单位：万元",
    compute: (rows) => sumNumericField(rows, "matured_premium_yuan") / 10000,
    format: (value) => Math.round(value).toLocaleString("zh-CN"),
    tickFormatter: (value) => Math.round(value).toLocaleString("zh-CN"),
  },
  {
    key: "policyCount",
    label: "保单件数（件）",
    description: "保单件数求和",
    unitLabel: "单位：件",
    compute: (rows) => sumNumericField(rows, "policy_count"),
    format: (value) => Math.round(value).toLocaleString("zh-CN"),
    tickFormatter: (value) => Math.round(value).toString(),
  },
  {
    key: "claimCaseCount",
    label: "赔案件数（件）",
    description: "赔案件数求和",
    unitLabel: "单位：件",
    compute: (rows) => sumNumericField(rows, "claim_case_count"),
    format: (value) => Math.round(value).toLocaleString("zh-CN"),
    tickFormatter: (value) => Math.round(value).toString(),
  },
  {
    key: "variableCostRatio",
    label: "变动成本率（%）",
    description:
      "（费用金额总额 ÷ 签单保费总额）+（已报告赔款总额 ÷ 满期保费总额）后再 × 100",
    unitLabel: "单位：%",
    compute: (rows) => {
      const expense = sumNumericField(rows, "expense_amount_yuan");
      const signed = sumNumericField(rows, "signed_premium_yuan");
      const reported = sumNumericField(rows, "reported_claim_payment_yuan");
      const matured = sumNumericField(rows, "matured_premium_yuan");
      const expenseRatio = signed === 0 ? 0 : expense / signed;
      const claimRatio = matured === 0 ? 0 : reported / matured;
      return (expenseRatio + claimRatio) * 100;
    },
    format: (value) => `${value.toFixed(2)}%`,
    tickFormatter: (value) => value.toFixed(2),
  },
  {
    key: "incidentRate",
    label: "满期出险率（%）",
    description:
      "（赔案件数总额 ÷ 保单件数总额）×（满期保费总额 ÷ 签单保费总额）× 100",
    unitLabel: "单位：%",
    compute: (rows) => {
      const claims = sumNumericField(rows, "claim_case_count");
      const policies = sumNumericField(rows, "policy_count");
      const matured = sumNumericField(rows, "matured_premium_yuan");
      const signed = sumNumericField(rows, "signed_premium_yuan");
      if (policies === 0 || signed === 0) return 0;
      const firstFactor = claims / policies;
      const secondFactor = signed === 0 ? 0 : matured / signed;
      return firstFactor * secondFactor * 100;
    },
    format: (value) => `${value.toFixed(2)}%`,
    tickFormatter: (value) => value.toFixed(2),
  },
  {
    key: "averagePremium",
    label: "单均保费（元）",
    description: "签单保费总额 ÷ 保单件数总额",
    unitLabel: "单位：元",
    compute: (rows) => {
      const signed = sumNumericField(rows, "signed_premium_yuan");
      const policies = sumNumericField(rows, "policy_count");
      if (policies === 0) return 0;
      return signed / policies;
    },
    format: (value) => `${Math.round(value).toLocaleString("zh-CN")} 元`,
    tickFormatter: (value) => Math.round(value).toLocaleString("zh-CN"),
  },
  {
    key: "averageClaim",
    label: "案均赔款（元）",
    description: "已报告赔款总额 ÷ 赔案件数总额",
    unitLabel: "单位：元",
    compute: (rows) => {
      const reported = sumNumericField(rows, "reported_claim_payment_yuan");
      const claims = sumNumericField(rows, "claim_case_count");
      if (claims === 0) return 0;
      return reported / claims;
    },
    format: (value) => `${Math.round(value).toLocaleString("zh-CN")} 元`,
    tickFormatter: (value) => Math.round(value).toLocaleString("zh-CN"),
  },
  {
    key: "marginalContributionAmount",
    label: "满期边际贡献额（万元）",
    description: "满期边际贡献额求和",
    unitLabel: "单位：万元",
    compute: (rows) => sumNumericField(rows, "marginal_contribution_amount_yuan") / 10000,
    format: (value) => Math.round(value).toLocaleString("zh-CN"),
    tickFormatter: (value) => Math.round(value).toLocaleString("zh-CN"),
  },
  {
    key: "commercialPremiumBeforeDiscount",
    label: "商业险折前保费（万元）",
    description: "商业险折前保费求和",
    unitLabel: "单位：万元",
    compute: (rows) =>
      sumNumericField(rows, "commercial_premium_before_discount_yuan") / 10000,
    format: (value) => Math.round(value).toLocaleString("zh-CN"),
    tickFormatter: (value) => Math.round(value).toLocaleString("zh-CN"),
  },
  {
    key: "commercialAutonomyCoefficient",
    label: "商业险自主系数",
    description: "签单保费总额 ÷ 商业险折前保费总额",
    unitLabel: "单位：系数",
    compute: (rows) => {
      const signed = sumNumericField(rows, "signed_premium_yuan");
      const commercial = sumNumericField(rows, "commercial_premium_before_discount_yuan");
      if (commercial === 0) return 0;
      return signed / commercial;
    },
    format: (value) => value.toFixed(3),
    tickFormatter: (value) => value.toFixed(3),
  },
  {
    key: "reportedClaim",
    label: "已报告赔款（万元）",
    description: "已报告赔款求和",
    unitLabel: "单位：万元",
    compute: (rows) => sumNumericField(rows, "reported_claim_payment_yuan") / 10000,
    format: (value) => Math.round(value).toLocaleString("zh-CN"),
    tickFormatter: (value) => Math.round(value).toLocaleString("zh-CN"),
  },
  {
    key: "expenseAmount",
    label: "费用金额（万元）",
    description: "费用金额求和",
    unitLabel: "单位：万元",
    compute: (rows) => sumNumericField(rows, "expense_amount_yuan") / 10000,
    format: (value) => Math.round(value).toLocaleString("zh-CN"),
    tickFormatter: (value) => Math.round(value).toLocaleString("zh-CN"),
  },
];

const metricOptions = metricDefinitions.map((metric) => ({
  value: metric.key,
  label: metric.label,
}));

export function ComparisonAnalysisChart() {
  const { filteredData, rawData } = useData();
  const { toast } = useToast();
  const [dimension, setDimension] = useState<DimensionKey>("customer_category_3");
  const [metricKey, setMetricKey] = useState<MetricKey>("signedPremium");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [barAnalysis, setBarAnalysis] = useState<string>('');
  const [analyzingChart, setAnalyzingChart] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const metric = metricDefinitions.find((item) => item.key === metricKey) ?? metricDefinitions[0];

  const datasetForOptions = useMemo(() => (filteredData.length ? filteredData : rawData), [filteredData, rawData]);

  const availableDimensionOptions = useMemo(() => {
    if (!datasetForOptions.length) {
      return dimensionConfigs;
    }
    return dimensionConfigs;
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

  const barData: BarDatum[] = useMemo(() => {
    if (!filteredData.length) {
      return [];
    }
    const selectedMetric = metricDefinitions.find((item) => item.key === metricKey) ?? metricDefinitions[0];
    const grouped = filteredData.reduce((acc, row) => {
      const rawDimension = getDimensionValue(row, dimension);
      const fallback = getMissingLabel(dimension);
      const { key, label } = normalizeLabel(rawDimension, fallback);
      if (shouldSkipMissingDimension(dimension) && label === fallback) {
        return acc;
      }
      const current = acc.get(key) ?? { label, rows: [] as RawDataRow[] };
      current.label = label;
      current.rows.push(row);
      acc.set(key, current);
      return acc;
    }, new Map<string, { label: string; rows: RawDataRow[] }>());

    const aggregated = Array.from(grouped.values()).map(({ label, rows }) => {
      const value = selectedMetric.compute(rows);
      const marginalContribution = sumNumericField(rows, "marginal_contribution_amount_yuan");
      const maturedPremium = sumNumericField(rows, "matured_premium_yuan");
      const marginalRate = maturedPremium === 0 ? 0 : marginalContribution / maturedPremium;
      const color = getMarginalContributionColor(marginalRate);
      return {
        dimension: label,
        value,
        displayValue: value,
        color,
        marginalRate,
        isClamped: false,
      };
    });

    aggregated.sort((a, b) => (sortOrder === 'desc' ? b.value - a.value : a.value - b.value));

    return clampAbsoluteMax(
      aggregated,
      (item) => item.value,
      (item, displayValue, isClamped) => ({
        ...item,
        displayValue,
        isClamped,
      }),
    );
  }, [filteredData, dimension, metricKey, sortOrder]);

  const yAxisWidth = useMemo(() => {
    if (!barData.length) {
      return 120;
    }
    const longestLabel = barData.reduce((max, item) => Math.max(max, item.dimension.length), 0);
    const estimatedWidth = longestLabel * 16;
    return Math.min(260, Math.max(120, estimatedWidth));
  }, [barData]);

  const chartHeight = useMemo(() => {
    if (!barData.length) {
      return 320;
    }
    const perItem = 32;
    return Math.max(320, barData.length * perItem);
  }, [barData]);

  const barTooltip = useMemo(() => {
    return (
      <RechartsTooltip
        cursor={{ fill: "hsl(var(--muted)/0.35)" }}
        content={({ active, payload }) => {
          if (!active || !payload || payload.length === 0) {
            return null;
          }
          const item = payload[0] as BarTooltipPayload;
          const actual = item.payload.value;
          const clamped = item.payload.isClamped;
          return (
            <div className="rounded-md border border-border/50 bg-background p-3 text-xs shadow-xl">
              <div className="font-medium text-foreground">{item.payload.dimension}</div>
              <div className="mt-1 text-muted-foreground">
                {metric.label}：
                <span className="font-medium text-foreground">
                  {formatMetricWithUnit(metric, actual)}
                </span>
              </div>
              {clamped ? (
                <div className="mt-1 text-slate-500">已缩放显示以突出对比</div>
              ) : null}
            </div>
          );
        }}
      />
    );
  }, [metric]);

  const tableRows = useMemo(
    () =>
      barData.map((item) => ({
        dimension: item.dimension,
        value: formatMetricWithUnit(metric, item.value),
        marginalRate: `${(item.marginalRate * 100).toFixed(2)}%`,
      })),
    [barData, metric],
  );

  const isTableMode = viewMode === 'table';
  const canCopyTable = tableRows.length > 0;

  useEffect(() => {
    setBarAnalysis('');
  }, [dimension, metricKey, sortOrder]);

  useEffect(() => {
    if (!barData.length) {
      setViewMode('chart');
      setBarAnalysis('');
    }
  }, [barData.length]);

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'chart' ? 'table' : 'chart'));
  };

  const handleCopyTable = async () => {
    if (!isTableMode || !canCopyTable) {
      return;
    }

    const header = ['维度', metric.label, '满期边际贡献率'];
    const rows = tableRows.map((row) => [row.dimension, row.value, row.marginalRate]);
    const content = [header, ...rows]
      .map((line) => line.join('\t'))
      .join('\n');

    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: '表格已复制',
        description: '对比分析数据已复制到剪贴板，可直接粘贴到表格工具中。',
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

  const barInsight = useMemo(() => {
    if (!barData.length) {
      return "暂无可用数据";
    }
    const target = barData[0];
    const shortLabel = getMetricShortLabel(metric.label);
    const valueText = formatMetricWithUnit(metric, target.value);
    if (sortOrder === 'desc') {
      return `${target.dimension}的${shortLabel}最高，达到${valueText}`;
    }
    return `${target.dimension}的${shortLabel}最低，仅有${valueText}`;
  }, [barData, metric, sortOrder]);

  const dimensionLabel = useMemo(
    () => dimensionConfigs.find((option) => option.value === dimension)?.label ?? '客户维度',
    [dimension],
  );
  const barMetricShortLabel = useMemo(() => getMetricShortLabel(metric.label), [metric.label]);

  const barTitle = `各${dimensionLabel}${barMetricShortLabel}对比图`;
  const barExplanation = `${metric.description}。`;

  // AI分析函数
  const analyzeChart = async () => {
    setAnalyzingChart(true);

    try {
      const requestData = {
        chartType: 'bar',
        data: barData,
        dimension: dimensionLabel,
        metrics: {
          metric: barMetricShortLabel,
        },
      };

      const response = await fetch('/api/analyze-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error('分析失败');
      }

      const { analysis } = await response.json();
      setBarAnalysis(analysis);
    } catch (error) {
      console.error('AI分析失败:', error);
    } finally {
      setAnalyzingChart(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{barTitle}</CardTitle>
        <CardDescription>
          {barInsight}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`${CONTROL_WRAPPER_CLASS} lg:grid-cols-[1.05fr_1.05fr_0.9fr_0.9fr_0.9fr]`}>
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
            <span className="text-xs text-muted-foreground">选择指标</span>
            <Select value={metricKey} onValueChange={(value) => setMetricKey(value as MetricKey)}>
              <SelectTrigger className={CONTROL_TRIGGER_CLASS}>
                <SelectValue placeholder="选择指标" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {metricOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
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
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              aria-label={sortOrder === 'desc' ? '当前降序，点击切换为升序' : '当前升序，点击切换为降序'}
              title={sortOrder === 'desc' ? '当前降序，点击切换为升序' : '当前升序，点击切换为降序'}
            >
              <ArrowUpDown className={`h-4 w-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
            </Button>
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
              onClick={analyzeChart}
              disabled={analyzingChart || !barData.length}
            >
              <Sparkles className="h-4 w-4" />
              {analyzingChart ? '分析中...' : barAnalysis ? '重新分析' : 'AI分析'}
            </Button>
          </div>
        </div>
        {isTableMode ? (
          tableRows.length === 0 ? (
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
                    <TableHead className="w-[140px]">维度</TableHead>
                    <TableHead>{metric.label}</TableHead>
                    <TableHead>满期边际贡献率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableRows.map((row) => (
                    <TableRow key={row.dimension}>
                      <TableCell className="font-medium">{row.dimension}</TableCell>
                      <TableCell>{row.value}</TableCell>
                      <TableCell>{row.marginalRate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : barData.length === 0 ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
            当前筛选条件下暂无数据
          </div>
        ) : (
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart data={barData} layout="vertical" barSize={24} margin={{ top: 5, right: 80, bottom: 5, left: 5 }}>
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
                  width={yAxisWidth}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                {barTooltip}
                <Bar dataKey="displayValue" radius={[4, 4, 4, 4]}>
                  <LabelList
                    dataKey="value"
                    position="right"
                    fontSize={12}
                    fill="hsl(var(--foreground))"
                    content={(props) => {
                      const { x, y, width, height, value, index } = props;
                      if (typeof value !== 'number' || typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number' || typeof index !== 'number') {
                        return null;
                      }
                      const actualValue = barData[index]?.value ?? 0;
                      const formattedValue = metric.format(actualValue);
                      const isNegative = actualValue < 0;
                      const labelX = isNegative ? x - 8 : x + width + 8;
                      const labelY = y + height / 2;
                      return (
                        <text
                          x={labelX}
                          y={labelY}
                          fill="hsl(var(--foreground))"
                          fontSize={12}
                          textAnchor={isNegative ? 'end' : 'start'}
                          dominantBaseline="middle"
                        >
                          {formattedValue}
                        </text>
                      );
                    }}
                  />
                  {barData.map((item) => (
                    <Cell key={`bar-${item.dimension}`} fill={item.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground/70">{barExplanation}</p>
          {barAnalysis && (
            <div className="rounded-md bg-muted/50 p-3 text-sm leading-relaxed space-y-2">
              <div dangerouslySetInnerHTML={{ __html: convertTextToHtml(barAnalysis) }} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
