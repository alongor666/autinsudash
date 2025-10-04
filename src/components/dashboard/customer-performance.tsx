"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
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
import { ArrowUp, ArrowDown } from "lucide-react";
import { getExpenseContributionColor, getMarginalContributionColor } from "@/lib/color-scale";
import type { RawDataRow } from "@/lib/types";

type DimensionKey =
  | "customer_category_3"
  | "chengdu_branch"
  | "third_level_organization"
  | "business_type_category"
  | "insurance_type"
  | "is_new_energy_vehicle"
  | "coverage_type"
  | "is_transferred_vehicle"
  | "renewal_status"
  | "terminal_source"
  | "vehicle_insurance_grade"
  | "large_truck_score"
  | "small_truck_score";

type NumericField =
  | "signed_premium_yuan"
  | "matured_premium_yuan"
  | "policy_count"
  | "claim_case_count"
  | "reported_claim_payment_yuan"
  | "expense_amount_yuan"
  | "commercial_premium_before_discount_yuan"
  | "marginal_contribution_amount_yuan";

type SunburstDatum = {
  key: string;
  category: string;
  innerValue: number;
  outerValue: number;
  innerShare: number;
  outerShare: number;
  maturedMarginalContributionRate: number;
  color: string;
};

const sunburstMetricKeys = [
  "signedPremium",
  "maturedPremium",
  "policyCount",
  "claimCaseCount",
  "commercialPremiumBeforeDiscount",
  "reportedClaim",
  "expenseAmount",
] as const;

type SunburstMetricKey = (typeof sunburstMetricKeys)[number];

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

const dimensionConfigs: { value: DimensionKey; label: string }[] = [
  { value: "customer_category_3", label: "客户类别" },
  { value: "chengdu_branch", label: "机构层级" },
  { value: "third_level_organization", label: "三级机构" },
  { value: "business_type_category", label: "业务类型" },
  { value: "insurance_type", label: "险种类型" },
  { value: "is_new_energy_vehicle", label: "是否新能源" },
  { value: "coverage_type", label: "险别组合" },
  { value: "is_transferred_vehicle", label: "是否过户车" },
  { value: "renewal_status", label: "新续转状态" },
  { value: "terminal_source", label: "终端来源" },
  { value: "vehicle_insurance_grade", label: "车险分等级" },
  { value: "large_truck_score", label: "大货车评分" },
  { value: "small_truck_score", label: "小货车评分" },
];

const dimensionOptions = dimensionConfigs;

const expenseDimensionOptions = dimensionConfigs;

const dimensionGroups: { label: string; values: DimensionKey[] }[] = [
  {
    label: "客户结构",
    values: ["customer_category_3", "renewal_status", "is_transferred_vehicle"],
  },
  {
    label: "机构与渠道",
    values: ["chengdu_branch", "third_level_organization", "terminal_source"],
  },
  {
    label: "业务类型",
    values: ["business_type_category", "insurance_type", "coverage_type"],
  },
  {
    label: "车辆属性",
    values: ["is_new_energy_vehicle", "vehicle_insurance_grade"],
  },
  {
    label: "风险评分",
    values: ["large_truck_score", "small_truck_score"],
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
    format: (value) => `${value.toFixed(1)}%`,
    tickFormatter: (value) => value.toFixed(1),
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
    format: (value) => `${value.toFixed(1)}%`,
    tickFormatter: (value) => value.toFixed(1),
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
    format: (value) => `${value.toFixed(1)}%`,
    tickFormatter: (value) => value.toFixed(1),
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
    format: (value) => `${value.toFixed(1)}%`,
    tickFormatter: (value) => value.toFixed(1),
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
    format: (value) => `${value.toFixed(1)}%`,
    tickFormatter: (value) => value.toFixed(1),
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

const sunburstMetricDefinitions = metricDefinitions.filter(
  (metric): metric is MetricDefinition & { key: SunburstMetricKey } =>
    sunburstMetricKeys.includes(metric.key as SunburstMetricKey),
);

type SunburstMetricMeta = {
  definition: (typeof sunburstMetricDefinitions)[number];
  shortLabel: string;
  unit: string;
};

const sunburstMetricMap = sunburstMetricDefinitions.reduce(
  (acc, metric) => {
    acc[metric.key] = {
      definition: metric,
      shortLabel: getMetricShortLabel(metric.label),
      unit: getMetricUnit(metric.unitLabel),
    };
    return acc;
  },
  {} as Record<SunburstMetricKey, SunburstMetricMeta>,
);

const sunburstMetricOptions = sunburstMetricDefinitions.map((metric) => ({
  value: metric.key,
  label: metric.label,
}));

const skipMissingDimensions = new Set<DimensionKey>([
  "vehicle_insurance_grade",
  "large_truck_score",
  "small_truck_score",
]);

function getMissingLabel(key: DimensionKey) {
  if (key === "customer_category_3") {
    return "未分类";
  }
  if (key === "large_truck_score" || key === "small_truck_score") {
    return "未评分";
  }
  return "未填写";
}

function shouldSkipMissingDimension(key: DimensionKey) {
  return skipMissingDimensions.has(key);
}

function sumNumericField(rows: RawDataRow[], field: NumericField) {
  return rows.reduce((total, row) => total + (row[field] ?? 0), 0);
}

function normalizeLabel(value: unknown, fallback: string) {
  if (value === null || value === undefined) {
    return { key: fallback, label: fallback };
  }

  if (typeof value === "number" || typeof value === "boolean") {
    const normalizedValue = String(value);
    return { key: normalizedValue, label: normalizedValue };
  }

  if (typeof value !== "string") {
    return { key: fallback, label: fallback };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { key: fallback, label: fallback };
  }

  const normalized = trimmed
    .normalize("NFKC")
    .replace(/[\s\u00A0\u3000]+/g, "")
    .toLowerCase();

  return { key: normalized, label: trimmed };
}

function getRawDimensionValue(row: RawDataRow, key: DimensionKey) {
  switch (key) {
    case "customer_category_3":
      return row.customer_category_3;
    case "chengdu_branch":
      return row.chengdu_branch;
    case "third_level_organization":
      return row.third_level_organization;
    case "business_type_category":
      return row.business_type_category;
    case "insurance_type":
      return row.insurance_type;
    case "terminal_source":
      return row.terminal_source;
    case "coverage_type":
      return row.coverage_type;
    case "is_new_energy_vehicle":
      return row.is_new_energy_vehicle;
    case "is_transferred_vehicle":
      return row.is_transferred_vehicle;
    case "renewal_status":
      return row.renewal_status;
    case "vehicle_insurance_grade":
      return row.vehicle_insurance_grade;
    case "large_truck_score":
      return row.large_truck_score;
    case "small_truck_score":
      return row.small_truck_score;
    default:
      return undefined;
  }
}

function getDimensionValue(row: RawDataRow, key: DimensionKey) {
  const rawValue = getRawDimensionValue(row, key);

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

  return String(rawValue);
}

function hasDimensionData(rows: RawDataRow[], key: DimensionKey) {
  const keyExists = rows.some((row) => Object.prototype.hasOwnProperty.call(row, key));
  if (!keyExists) {
    return false;
  }
  return rows.some((row) => {
    const rawValue = getRawDimensionValue(row, key);
    if (rawValue === null || rawValue === undefined) {
      return false;
    }
    if (typeof rawValue === "string") {
      return rawValue.trim() !== "";
    }
    return true;
  });
}

function formatValue(value: number) {
  return Math.round(value / 10000).toLocaleString("zh-CN");
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

function formatSunburstValue(meta: SunburstMetricMeta, value: number) {
  const formatted = meta.definition.format(value);
  if (!meta.unit) {
    return formatted;
  }
  return formatted.includes(meta.unit) ? formatted : `${formatted}${meta.unit}`;
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

type ExpenseDimensionKey = DimensionKey;

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

export function CustomerPerformanceCharts() {
  const { filteredData, rawData } = useData();
  const [dimension, setDimension] = useState<DimensionKey>("customer_category_3");
  const [metricKey, setMetricKey] = useState<MetricKey>("signedPremium");
  const [sunburstDimension, setSunburstDimension] = useState<DimensionKey>("customer_category_3");
  const [innerMetricKey, setInnerMetricKey] = useState<SunburstMetricKey>("signedPremium");
  const [outerMetricKey, setOuterMetricKey] = useState<SunburstMetricKey>("maturedPremium");
  const [expenseDimension, setExpenseDimension] = useState<ExpenseDimensionKey>("customer_category_3");
  // 排序状态：'desc' 降序（默认），'asc' 升序
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expenseSortOrder, setExpenseSortOrder] = useState<'asc' | 'desc'>('desc');

  const metric = metricDefinitions.find((item) => item.key === metricKey) ?? metricDefinitions[0];

  const datasetForOptions = useMemo(() => (filteredData.length ? filteredData : rawData), [filteredData, rawData]);

  const availableDimensionOptions = useMemo(() => {
    if (!datasetForOptions.length) {
      return dimensionOptions;
    }
    const options = dimensionOptions.filter((option) => hasDimensionData(datasetForOptions, option.value));
    return options.length ? options : dimensionOptions;
  }, [datasetForOptions]);

  const availableExpenseOptions = useMemo(() => {
    if (!datasetForOptions.length) {
      return expenseDimensionOptions;
    }
    const options = expenseDimensionOptions.filter((option) => hasDimensionData(datasetForOptions, option.value));
    return options.length ? options : expenseDimensionOptions;
  }, [datasetForOptions]);

  const groupedDimensionOptions = useMemo(() => {
    const availableSet = new Set(availableDimensionOptions.map((option) => option.value));
    return dimensionGroups
      .map((group) => ({
        label: group.label,
        options: group.values
          .map((value) => dimensionConfigs.find((config) => config.value === value))
          .filter((option): option is { value: DimensionKey; label: string } =>
            Boolean(option) && availableSet.has(option.value),
          ),
      }))
      .filter((group) => group.options.length > 0);
  }, [availableDimensionOptions]);

  const groupedExpenseOptions = useMemo(() => {
    const availableSet = new Set(availableExpenseOptions.map((option) => option.value));
    return dimensionGroups
      .map((group) => ({
        label: group.label,
        options: group.values
          .map((value) => dimensionConfigs.find((config) => config.value === value))
          .filter((option): option is { value: DimensionKey; label: string } =>
            Boolean(option) && availableSet.has(option.value),
          ),
      }))
      .filter((group) => group.options.length > 0);
  }, [availableExpenseOptions]);

  useEffect(() => {
    if (availableDimensionOptions.length === 0) {
      return;
    }
    if (!availableDimensionOptions.some((option) => option.value === dimension)) {
      setDimension(availableDimensionOptions[0].value);
    }
  }, [availableDimensionOptions, dimension]);

  useEffect(() => {
    if (availableExpenseOptions.length === 0) {
      return;
    }
    if (!availableExpenseOptions.some((option) => option.value === expenseDimension)) {
      setExpenseDimension(availableExpenseOptions[0].value);
    }
  }, [availableExpenseOptions, expenseDimension]);

  useEffect(() => {
    if (availableExpenseOptions.length === 0) {
      return;
    }
    if (!availableExpenseOptions.some((option) => option.value === sunburstDimension)) {
      setSunburstDimension(availableExpenseOptions[0].value);
    }
  }, [availableExpenseOptions, sunburstDimension]);

  const innerMetricMeta = sunburstMetricMap[innerMetricKey];
  const outerMetricMeta = sunburstMetricMap[outerMetricKey];
  const innerMetricDefinition = innerMetricMeta.definition;
  const outerMetricDefinition = outerMetricMeta.definition;

  const {
    sunburstData,
    categoryColors,
    hasNegativeValue,
    innerTotal,
    outerTotal,
  } = useMemo(() => {
    if (!filteredData.length) {
      return {
        sunburstData: [] as SunburstDatum[],
        categoryColors: {} as Record<string, string>,
        hasNegativeValue: false,
        innerTotal: 0,
        outerTotal: 0,
      };
    }

    const grouped = filteredData.reduce(
      (acc, row) => {
        const rawDimension = getDimensionValue(row, sunburstDimension);
        const fallback = sunburstDimension === "customer_category_3" ? "未分类" : "未填写";
        const { key, label } = normalizeLabel(rawDimension, fallback);
        const current = acc.get(key);
        if (current) {
          current.rows.push(row);
          current.signedPremium += row.signed_premium_yuan ?? 0;
          current.marginalContribution += row.marginal_contribution_amount_yuan ?? 0;
          current.maturedPremium += row.matured_premium_yuan ?? 0;
        } else {
          acc.set(key, {
            displayName: label,
            rows: [row],
            signedPremium: row.signed_premium_yuan ?? 0,
            marginalContribution: row.marginal_contribution_amount_yuan ?? 0,
            maturedPremium: row.matured_premium_yuan ?? 0,
          });
        }
        return acc;
      },
      new Map<
        string,
        {
          displayName: string;
          rows: RawDataRow[];
          signedPremium: number;
          marginalContribution: number;
          maturedPremium: number;
        }
      >(),
    );

    let innerTotal = 0;
    let outerTotal = 0;
    let hasNegativeValue = false;

    const data: SunburstDatum[] = Array.from(grouped.entries()).map(([key, values]) => {
      const innerValue = innerMetricDefinition.compute(values.rows);
      const outerValue = outerMetricDefinition.compute(values.rows);
      if (innerValue < 0 || outerValue < 0) {
        hasNegativeValue = true;
      }
      innerTotal += innerValue;
      outerTotal += outerValue;

      const maturedRate = values.maturedPremium === 0 ? 0 : values.marginalContribution / values.maturedPremium;
      const color = getMarginalContributionColor(maturedRate);

      return {
        key,
        category: values.displayName,
        innerValue,
        outerValue,
        innerShare: 0,
        outerShare: 0,
        maturedMarginalContributionRate: maturedRate,
        color,
      };
    });

    data.sort((a, b) => b.outerValue - a.outerValue);

    data.forEach((item) => {
      item.innerShare = innerTotal === 0 ? 0 : item.innerValue / innerTotal;
      item.outerShare = outerTotal === 0 ? 0 : item.outerValue / outerTotal;
    });

    const colors = data.reduce<Record<string, string>>((acc, item) => {
      acc[item.key] = item.color;
      return acc;
    }, {});

    return {
      sunburstData: data,
      categoryColors: colors,
      hasNegativeValue,
      innerTotal,
      outerTotal,
    };
  }, [filteredData, innerMetricDefinition, outerMetricDefinition, sunburstDimension]);

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
      const color = dimension === sunburstDimension
        ? categoryColors[normalizeLabel(label, label).key] ?? getMarginalContributionColor(marginalRate)
        : getMarginalContributionColor(marginalRate);
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
  }, [filteredData, dimension, metricKey, categoryColors, sortOrder, sunburstDimension]);

  const expenseData: ExpenseContributionDatum[] = useMemo(() => {
    if (!filteredData.length) {
      return [];
    }

    const baseline = 0.14;

    const grouped = filteredData.reduce((acc, row) => {
      const rawValue = getDimensionValue(row, expenseDimension);
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
        const deltaRate = actualRate - baseline; // 正值表示高于基准
        const contributionRate = baseline - actualRate; // 正值表示贡献
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
  }, [filteredData, expenseDimension, expenseSortOrder]);

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

  const expenseChartHeight = useMemo(() => {
    if (!expenseData.length) {
      return 320;
    }
    const perItem = 32;
    return Math.max(320, expenseData.length * perItem);
  }, [expenseData]);

  const expenseYAxisWidth = useMemo(() => {
    if (!expenseData.length) {
      return 140;
    }
    const longestLabel = expenseData.reduce((max, item) => Math.max(max, item.dimension.length), 0);
    const estimatedWidth = longestLabel * 16;
    return Math.min(280, Math.max(140, estimatedWidth));
  }, [expenseData]);

  const sunburstTooltip = useMemo(() => (
    <RechartsTooltip
      content={({ active, payload }) => {
        if (!active || !payload || payload.length === 0) {
          return null;
        }
        const item = payload[0].payload as SunburstDatum;
        const innerShareText = innerTotal > 0 ? `（${(item.innerShare * 100).toFixed(1)}%）` : "";
        const outerShareText = outerTotal > 0 ? `（${(item.outerShare * 100).toFixed(1)}%）` : "";
        return (
          <div className="rounded-md border border-border/50 bg-background p-3 text-xs shadow-xl">
            <div className="font-medium" style={{ color: item.color }}>{item.category}</div>
            <div className="mt-1 space-y-1 text-muted-foreground">
              <div>
                {innerMetricMeta.shortLabel}：
                <span className="font-medium text-foreground">
                  {formatSunburstValue(innerMetricMeta, item.innerValue)}
                </span>
                {innerShareText}
              </div>
              <div>
                {outerMetricMeta.shortLabel}：
                <span className="font-medium text-foreground">
                  {formatSunburstValue(outerMetricMeta, item.outerValue)}
                </span>
                {outerShareText}
              </div>
              <div>
                满期边际贡献率：
                <span className="font-medium text-foreground">
                  {(item.maturedMarginalContributionRate * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        );
      }}
    />
  ), [innerMetricMeta, innerTotal, outerMetricMeta, outerTotal]);

  const sunburstInsight = useMemo(() => {
    if (!sunburstData.length) {
      return "暂无可用数据";
    }
    if (outerTotal <= 0 && innerTotal <= 0) {
      return "所选指标总量为 0";
    }

    const focusOnOuter = outerTotal > 0;
    const focusMetric = focusOnOuter ? outerMetricMeta : innerMetricMeta;
    const total = focusOnOuter ? outerTotal : innerTotal;

    const sorted = [...sunburstData].sort((a, b) => {
      const aValue = focusOnOuter ? a.outerValue : a.innerValue;
      const bValue = focusOnOuter ? b.outerValue : b.innerValue;
      return bValue - aValue;
    });

    const topItem = sorted[0];
    if (!topItem || total === 0) {
      return `${focusMetric.shortLabel}总量为 0`;
    }

    const value = focusOnOuter ? topItem.outerValue : topItem.innerValue;
    const share = focusOnOuter ? topItem.outerShare : topItem.innerShare;
    const valueText = formatSunburstValue(focusMetric, value);
    const shareText = share > 0 ? `，占比${(share * 100).toFixed(1)}%` : "";
    const descriptor = focusOnOuter ? "位居第一" : "领先";
    return `${topItem.category}的${focusMetric.shortLabel}${descriptor}，达到${valueText}${shareText}`;
  }, [innerMetricMeta, innerTotal, outerMetricMeta, outerTotal, sunburstData]);

  const dimensionLabel = useMemo(
    () => dimensionConfigs.find((option) => option.value === dimension)?.label ?? '客户维度',
    [dimension],
  );
  const sunburstDimensionLabel = useMemo(
    () => dimensionConfigs.find((option) => option.value === sunburstDimension)?.label ?? '客户维度',
    [sunburstDimension],
  );
  const expenseDimensionLabel = useMemo(
    () => dimensionConfigs.find((option) => option.value === expenseDimension)?.label ?? '分析维度',
    [expenseDimension],
  );
  const barMetricShortLabel = useMemo(() => getMetricShortLabel(metric.label), [metric.label]);

  const sunburstTitle = hasNegativeValue
    ? `各${sunburstDimensionLabel}${outerMetricMeta.shortLabel}条形对比图`
    : `各${sunburstDimensionLabel}${outerMetricMeta.shortLabel}与${innerMetricMeta.shortLabel}占比图`;
  const sunburstExplanation = hasNegativeValue
    ? '存在负值时以条形图形式展示，深蓝代表内环，橙色代表外环。'
    : '颜色按满期边际贡献率区间划分。';

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

  const barTitle = `各${dimensionLabel}${barMetricShortLabel}对比图`;
  const barExplanation = `${metric.description}。`;

  const expenseTooltip = useMemo(() => {
    return (
      <RechartsTooltip
        cursor={{ fill: "hsl(var(--muted)/0.35)" }}
        content={({ active, payload }) => {
          if (!active || !payload || payload.length === 0) {
            return null;
          }
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

  const expenseInsight = useMemo(() => {
    if (!expenseData.length) {
      return "暂无可用数据";
    }
    const item = expenseData[0];
    if (item.contribution === 0) {
      return `${item.dimension}的费用贡献为 0`;
    }
    const amountText = `${formatValue(Math.abs(item.contribution))}万`;
    const gap = Math.abs(item.deltaRate * 100).toFixed(1);
    const gapText = gap === '0.0' ? '' : `，较基准${item.deltaRate < 0 ? '低' : '高'}${gap}%`;
    if (item.contribution > 0) {
      const descriptor = expenseSortOrder === 'desc' ? '贡献最大' : '贡献最小';
      return `${item.dimension}${descriptor}，释放${amountText}${gapText}`;
    }
    const descriptor = expenseSortOrder === 'desc' ? '费用消耗最高' : '费用消耗最轻';
    return `${item.dimension}${descriptor}，吞噬${amountText}${gapText}`;
  }, [expenseData, expenseSortOrder]);

  const expenseTitle = `各${expenseDimensionLabel}费用贡献对比图`;
  const expenseExplanation = '基准费用率为 14%。高于基准表示费用消耗，低于基准表示费用贡献。';

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{sunburstTitle}</CardTitle>
          <CardDescription>
            {sunburstInsight}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2 md:grid-cols-3 max-w-3xl">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">选择维度</span>
              <Select value={sunburstDimension} onValueChange={(value) => setSunburstDimension(value as DimensionKey)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="选择维度" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {availableExpenseOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">内环指标</span>
              <Select value={innerMetricKey} onValueChange={(value) => setInnerMetricKey(value as SunburstMetricKey)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="选择内环指标" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {sunburstMetricOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">外环指标</span>
              <Select value={outerMetricKey} onValueChange={(value) => setOuterMetricKey(value as SunburstMetricKey)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="选择外环指标" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {sunburstMetricOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {sunburstData.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
              当前筛选条件下暂无数据
            </div>
          ) : hasNegativeValue ? (
            <div style={{ height: Math.max(320, sunburstData.length * 48) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sunburstData} layout="vertical" barSize={16}>
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
                    dataKey="category"
                    width={120}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <RechartsTooltip
                    cursor={{ fill: "hsl(var(--muted)/0.35)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) {
                        return null;
                      }
                      const item = payload[0].payload as SunburstDatum;
                      return (
                        <div className="rounded-md border border-border/50 bg-background p-3 text-xs shadow-xl">
                          <div className="font-medium" style={{ color: item.color }}>{item.category}</div>
                          <div className="mt-1 space-y-1 text-muted-foreground">
                            <div>
                              {innerMetricMeta.shortLabel}：
                              <span className="font-medium text-foreground">
                                {formatSunburstValue(innerMetricMeta, item.innerValue)}
                              </span>
                            </div>
                            <div>
                              {outerMetricMeta.shortLabel}：
                              <span className="font-medium text-foreground">
                                {formatSunburstValue(outerMetricMeta, item.outerValue)}
                              </span>
                            </div>
                            <div>
                              满期边际贡献率：
                              <span className="font-medium text-foreground">
                                {(item.maturedMarginalContributionRate * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="innerValue" fill="#1d4ed8" radius={[4, 4, 4, 4]}>
                    <LabelList
                      dataKey="innerValue"
                      position="right"
                      fontSize={12}
                      formatter={(value: number) => formatSunburstValue(innerMetricMeta, value)}
                    />
                  </Bar>
                  <Bar dataKey="outerValue" fill="#f59e0b" radius={[4, 4, 4, 4]}>
                    <LabelList
                      dataKey="outerValue"
                      position="right"
                      fontSize={12}
                      formatter={(value: number) => formatSunburstValue(outerMetricMeta, value)}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={sunburstData}
                    dataKey="innerValue"
                    nameKey="category"
                    innerRadius="35%"
                    outerRadius="60%"
                    paddingAngle={2}
                  >
                    {sunburstData.map((item) => (
                      <Cell key={`inner-${item.key}`} fill={item.color} fillOpacity={0.8} />
                    ))}
                  </Pie>
                  <Pie
                    data={sunburstData}
                    dataKey="outerValue"
                    nameKey="category"
                    innerRadius="65%"
                    outerRadius="85%"
                    paddingAngle={2}
                  >
                    {sunburstData.map((item) => (
                      <Cell key={`outer-${item.key}`} fill={item.color} />
                    ))}
                  </Pie>
                  {sunburstTooltip}
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-sm text-muted-foreground/70">{sunburstExplanation}</p>
        </CardContent>
      </Card>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{barTitle}</CardTitle>
          <CardDescription>
            {barInsight}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">选择维度</span>
              <Select value={dimension} onValueChange={(value) => setDimension(value as DimensionKey)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="选择维度" />
                </SelectTrigger>
                <SelectContent>
                  {availableDimensionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">选择指标</span>
              <Select value={metricKey} onValueChange={(value) => setMetricKey(value as MetricKey)}>
                <SelectTrigger className="h-9">
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
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">排序方式</span>
              <Button
                variant="outline"
                size="sm"
                className="h-9 justify-start"
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              >
                {sortOrder === 'desc' ? (
                  <>
                    <ArrowDown className="mr-2 h-4 w-4" />
                    降序
                  </>
                ) : (
                  <>
                    <ArrowUp className="mr-2 h-4 w-4" />
                    升序
                  </>
                )}
              </Button>
            </div>
          </div>
          {barData.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
              当前筛选条件下暂无数据
            </div>
          ) : (
            <div style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={barData} layout="vertical" barSize={24}>
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
                      formatter={(value: number) => metric.format(value)}
                    />
                    {barData.map((item) => (
                      <Cell key={`bar-${item.dimension}`} fill={item.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="text-sm text-muted-foreground/70">{barExplanation}</p>
        </CardContent>
      </Card>
      <Card className="h-full lg:col-span-2">
        <CardHeader>
          <CardTitle>{expenseTitle}</CardTitle>
          <CardDescription>
            {expenseInsight}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-2 max-w-lg">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">选择维度</span>
              <Select value={expenseDimension} onValueChange={(value) => setExpenseDimension(value as ExpenseDimensionKey)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="选择维度" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {availableExpenseOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">排序方式</span>
              <Button
                variant="outline"
                size="sm"
                className="h-9 justify-start"
                onClick={() => setExpenseSortOrder(expenseSortOrder === 'desc' ? 'asc' : 'desc')}
              >
                {expenseSortOrder === 'desc' ? (
                  <>
                    <ArrowDown className="mr-2 h-4 w-4" />
                    降序
                  </>
                ) : (
                  <>
                    <ArrowUp className="mr-2 h-4 w-4" />
                    升序
                  </>
                )}
              </Button>
            </div>
          </div>
          {expenseData.length === 0 ? (
            <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
              当前筛选条件下暂无数据
            </div>
          ) : (
            <div style={{ height: expenseChartHeight }}>
              <ResponsiveContainer width="100%" height={expenseChartHeight}>
                <BarChart data={expenseData} layout="vertical" barSize={24}>
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
                      formatter={(value: number) => Math.round(value / 10000).toLocaleString("zh-CN")}
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
    </div>
  );
}
