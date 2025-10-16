import type { RawDataRow } from './types';
import { METRICS_CONFIG, type MetricsConfig, type MetricMode } from './metrics-config';

type AggregatedValues = Record<string, number>;

function getLatestWeek(rows: RawDataRow[]): number | null {
  if (!rows.length) return null;
  // 避免使用展开/apply 传递超大参数导致 RangeError
  let latest: number | null = null;
  for (const r of rows) {
    const w = r.week_number;
    if (Number.isFinite(w)) {
      if (latest === null || (w as number) > (latest as number)) {
        latest = w as number;
      }
    }
  }
  return latest;
}

function sumColumn(rows: RawDataRow[], column: keyof RawDataRow): number {
  return rows.reduce((acc, row) => acc + Number(row[column] ?? 0), 0);
}

function sanitizeExpression(expr: string): string {
  const allowed = /[0-9+\-*/().\s]/;
  let sanitized = '';
  for (const ch of expr) {
    if (allowed.test(ch)) sanitized += ch;
  }
  return sanitized;
}

export class MetricsEngine {
  private config: MetricsConfig;

  constructor(config: MetricsConfig = METRICS_CONFIG) {
    this.config = config;
  }

  updateConfig(next: MetricsConfig) {
    this.config = next;
  }

  aggregateBase(rows: RawDataRow[], mode: MetricMode): AggregatedValues {
    const results: AggregatedValues = {};
    if (!Array.isArray(rows) || rows.length === 0) return results;

    let targetRows: RawDataRow[] = rows;
    if (mode === 'ytd') {
      const latest = getLatestWeek(rows);
      if (latest !== null) {
        targetRows = rows.filter((r) => r.week_number === latest);
      }
    }

    for (const [measureName, def] of Object.entries(this.config.base_measures)) {
      const col = def.source_column as keyof RawDataRow;
      results[measureName] = sumColumn(targetRows, col);
    }
    return results;
  }

  calculate(metricName: string, rows: RawDataRow[], mode: MetricMode): number | null {
    const baseValues = this.aggregateBase(rows, mode);

    const def =
      this.config.ratio_metrics[metricName] ||
      this.config.derived_measures[metricName] ||
      this.config.composite_metrics[metricName];

    if (!def) {
      // 允许直接返回基础度量
      if (metricName in baseValues) return baseValues[metricName];
      return null;
    }

    // 构建替换映射：基础度量 + 依赖指标（递归计算）
    const replacements: Record<string, number> = { ...baseValues };

    const dependencyNames: string[] = Array.isArray((def as any).dependencies)
      ? ((def as any).dependencies as string[])
      : [];

    const visited = new Set<string>([metricName]);
    const computeDependency = (name: string): number | null => {
      if (visited.has(name)) return null; // 防止循环依赖
      visited.add(name);
      const depDef =
        this.config.ratio_metrics[name] ||
        this.config.derived_measures[name] ||
        this.config.composite_metrics[name];
      if (!depDef) {
        // 如果依赖的是基础度量，已在 baseValues 中
        return name in baseValues ? baseValues[name] : null;
      }
      // 递归计算依赖指标
      const val = this.calculate(name, rows, mode);
      return val ?? null;
    };

    for (const dep of dependencyNames) {
      const val = computeDependency(dep);
      if (val !== null) {
        replacements[dep] = val;
      }
    }

    // 进行字符串替换：先替换依赖指标名，再替换基础度量名
    let expr = def.formula;
    for (const [name, value] of Object.entries(replacements)) {
      const re = new RegExp(`\\b${name}\\b`, 'g');
      expr = expr.replace(re, String(value));
    }

    const safe = sanitizeExpression(expr);
    try {
      const fn = new Function(`return (${safe});`);
      const result = fn();
      if (result === undefined || result === null || !Number.isFinite(result)) {
        return null;
      }
      return Number(result);
    } catch {
      return null;
    }
  }

  format(value: number | null, metricName: string): string {
    if (value === null) return this.config.formatting_rules.null_placeholder;

    const def =
      this.config.ratio_metrics[metricName] ||
      this.config.derived_measures[metricName] ||
      this.config.composite_metrics[metricName];

    const isPercentage = Boolean(def && def.format === 'percentage_2');
    if (isPercentage) {
      const rule = this.config.formatting_rules.percentage_2;
      return rule.format_string.replace('{:.2f}%', `${(value * rule.multiplier).toFixed(2)}%`);
    }
    const rule = this.config.formatting_rules.integer_with_comma;
    const rounded = Math.round(value);
    return rule.format_string.replace('{:,.0f}', rounded.toLocaleString('zh-CN'));
  }
}

export const metricsEngine = new MetricsEngine();