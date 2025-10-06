import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { RawDataRow, Kpi, KPIKey, ChartDataPoint, Filters } from './types';
import { kpiData as defaultKpiData } from './data';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number, unit: 'yuan' | 'ten_thousand' = 'ten_thousand') {
  const valueInUnit = unit === 'yuan' ? value : value / 10000;
  return Math.round(valueInUnit).toLocaleString('zh-CN');
}

export function formatPercentage(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

const ENERGY_TYPE_ALIASES: Record<string, string> = {
  '是': '新能源',
  '否': '燃油',
  '新能源车': '新能源',
  '燃油车': '燃油',
  '新能源': '新能源',
  '燃油': '燃油',
  'true': '新能源',
  'false': '燃油',
  '1': '新能源',
  '0': '燃油',
};

const TRANSFER_STATUS_ALIASES: Record<string, string> = {
  '是': '过户',
  '否': '非过户',
  '过户车': '过户',
  '未过户': '非过户',
  '过户': '过户',
  '非过户': '非过户',
  'true': '过户',
  'false': '非过户',
  '1': '过户',
  '0': '非过户',
};

export const ENERGY_TYPE_ORDER: readonly string[] = ['新能源', '燃油'] as const;
export const TRANSFER_STATUS_ORDER: readonly string[] = ['过户', '非过户'] as const;

function normalizeWithAliases(value: string | boolean | null | undefined, aliases: Record<string, string>) {
  if (value === null || value === undefined) {
    return '';
  }

  const raw = typeof value === 'boolean' ? (value ? 'true' : 'false') : value;
  const trimmed = typeof raw === 'string' ? raw.trim() : String(raw);

  if (!trimmed) {
    return trimmed;
  }

  if (aliases[trimmed]) {
    return aliases[trimmed];
  }

  const lowerKey = trimmed.toLowerCase();
  if (aliases[lowerKey]) {
    return aliases[lowerKey];
  }

  return trimmed;
}

export function normalizeEnergyType(value: string | boolean | null | undefined) {
  return normalizeWithAliases(value, ENERGY_TYPE_ALIASES);
}

export function normalizeTransferStatus(value: string | boolean | null | undefined) {
  return normalizeWithAliases(value, TRANSFER_STATUS_ALIASES);
}

export function normalizeVehicleAttributes(row: RawDataRow): RawDataRow {
  return {
    ...row,
    is_new_energy_vehicle: normalizeEnergyType(row.is_new_energy_vehicle),
    is_transferred_vehicle: normalizeTransferStatus(row.is_transferred_vehicle),
  };
}

export function normalizeRawDataRows(rows: RawDataRow[]): RawDataRow[] {
  return rows.map((row) => normalizeVehicleAttributes(row));
}

export function sortByPreferredOrder(values: string[], preferredOrder: readonly string[]) {
  return [...values].sort((a, b) => {
    const indexA = preferredOrder.indexOf(a);
    const indexB = preferredOrder.indexOf(b);

    if (indexA === -1 && indexB === -1) {
      return a.localeCompare(b, 'zh-CN');
    }
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });
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
        return `${sign}${(change * 100).toFixed(2)}%`;
    }
    return 'N/A';
  };

  const hasPrevious = previousData.length > 0;

  const signedPremiumChange = getChange(currentMetrics.signedPremium, previousMetrics.signedPremium);
  const signedPremiumDiff = currentMetrics.signedPremium - previousMetrics.signedPremium;

  const maturedLossRatioRelativeChange = getChange(currentMetrics.maturedLossRatio, previousMetrics.maturedLossRatio);
  const maturedLossRatioDiff = (currentMetrics.maturedLossRatio - previousMetrics.maturedLossRatio) * 100;

  const expenseRatioRelativeChange = getChange(currentMetrics.expenseRatio, previousMetrics.expenseRatio);
  const expenseRatioDiff = (currentMetrics.expenseRatio - previousMetrics.expenseRatio) * 100;

  const maturedMarginalContributionRateRelativeChange = getChange(
    currentMetrics.maturedMarginalContributionRate,
    previousMetrics.maturedMarginalContributionRate
  );
  const maturedMarginalContributionRateDiff =
    (currentMetrics.maturedMarginalContributionRate - previousMetrics.maturedMarginalContributionRate) * 100;

  const formatDiffAmount = (diff: number) => `${diff >= 0 ? '+' : ''}${Math.round(diff / 10000).toLocaleString('zh-CN')}万`;
  const formatDiffPoint = (diff: number) => `${diff >= 0 ? '+' : ''}${diff.toFixed(2)}pp`;

  return {
    signedPremium: {
      value: `${formatCurrency(currentMetrics.signedPremium, 'ten_thousand')}万`,
      change: formatChange(signedPremiumChange),
      changeType: signedPremiumChange >= 0 ? 'increase' : 'decrease',
      description: '较上周',
      previousValue: hasPrevious ? `${formatCurrency(previousMetrics.signedPremium, 'ten_thousand')}万` : undefined,
      changeValue: hasPrevious ? formatDiffAmount(signedPremiumDiff) : undefined,
      currentRawValue: currentMetrics.signedPremium,
      previousRawValue: hasPrevious ? previousMetrics.signedPremium : undefined,
    },
    maturedLossRatio: {
      value: formatPercentage(currentMetrics.maturedLossRatio),
      change: formatChange(maturedLossRatioRelativeChange),
      changeType: maturedLossRatioDiff >= 0 ? 'increase' : 'decrease',
      description: '较上周',
      previousValue: hasPrevious ? formatPercentage(previousMetrics.maturedLossRatio) : undefined,
      changeValue: hasPrevious ? formatDiffPoint(maturedLossRatioDiff) : undefined,
      currentRawValue: currentMetrics.maturedLossRatio * 100,
      previousRawValue: hasPrevious ? previousMetrics.maturedLossRatio * 100 : undefined,
    },
    expenseRatio: {
      value: formatPercentage(currentMetrics.expenseRatio),
      change: formatChange(expenseRatioRelativeChange),
      changeType: expenseRatioDiff >= 0 ? 'increase' : 'decrease',
      description: '较上周',
      previousValue: hasPrevious ? formatPercentage(previousMetrics.expenseRatio) : undefined,
      changeValue: hasPrevious ? formatDiffPoint(expenseRatioDiff) : undefined,
      currentRawValue: currentMetrics.expenseRatio * 100,
      previousRawValue: hasPrevious ? previousMetrics.expenseRatio * 100 : undefined,
    },
    maturedMarginalContributionRate: {
      value: formatPercentage(currentMetrics.maturedMarginalContributionRate),
      change: formatChange(maturedMarginalContributionRateRelativeChange),
      changeType: maturedMarginalContributionRateDiff >= 0 ? 'increase' : 'decrease',
      description: '较上周',
      previousValue: hasPrevious ? formatPercentage(previousMetrics.maturedMarginalContributionRate) : undefined,
      changeValue: hasPrevious ? formatDiffPoint(maturedMarginalContributionRateDiff) : undefined,
      currentRawValue: currentMetrics.maturedMarginalContributionRate * 100,
      previousRawValue: hasPrevious ? previousMetrics.maturedMarginalContributionRate * 100 : undefined,
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

export function formatFilterContext(filters: Filters) {
  const region = filters.region ?? '四川分公司';
  const parts: string[] = [];

  if (filters.year) {
    parts.push(`${filters.year}年`);
  }

  if (filters.weekNumber && filters.weekNumber.length) {
    const weekNumbers = Array.from(new Set<string>(filters.weekNumber)).sort(
      (a, b) => parseInt(a, 10) - parseInt(b, 10),
    );
    if (weekNumbers.length === 1) {
      parts.push(`第${weekNumbers[0]}周`);
    } else {
      parts.push(`第${weekNumbers[0]}-${weekNumbers[weekNumbers.length - 1]}周`);
    }
  }

  if (filters.customerCategories && filters.customerCategories.length) {
    const categories = filters.customerCategories;
    const preview = categories.slice(0, 2).join('、');
    const suffix = categories.length > 2 ? '等' : '';
    parts.push(`${preview}${suffix}`);
  }

  const summary = parts.join(' ');
  return summary ? `${region} ${summary}` : `${region} 全量`;
}

/**
 * 将 AI 分析文本转换为 HTML 格式
 * 支持的格式：
 * - 段落（双换行符分隔）
 * - 粗体（**文本**）
 * - 列表项（以 1. 2. - • 开头的行）
 * - 单个换行符转为 <br>
 */
/**
 * 根据周序号计算对应的统计截止日期（周六）
 * @param year - 年份
 * @param weekNumber - 周序号（1-52）
 * @returns 格式化的日期字符串，如 "2025年10月4日"
 */
export function getWeekEndDate(year: number, weekNumber: number): string {
  // ISO 8601 标准：一年的第一周是包含该年第一个星期四的那一周
  // 计算该年第一周的起始日期（周一）
  const jan4 = new Date(year, 0, 4); // 1月4日必定在第一周
  const jan4DayOfWeek = jan4.getDay() || 7; // 周日为0，转为7
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - jan4DayOfWeek + 1);

  // 计算目标周的周六（统计截止日期）
  const targetSaturday = new Date(firstMonday);
  targetSaturday.setDate(firstMonday.getDate() + (weekNumber - 1) * 7 + 5); // +5 天到周六

  const month = targetSaturday.getMonth() + 1;
  const day = targetSaturday.getDate();
  const displayYear = targetSaturday.getFullYear();

  return `${displayYear}年${month}月${day}日`;
}

export function convertTextToHtml(text: string): string {
  if (!text) return '';

  // 1. 先转义 HTML 特殊字符（防止 XSS）
  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  let escaped = escapeHtml(text);

  // 2. 处理粗体 **文本** -> <strong>文本</strong>
  escaped = escaped.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // 3. 按双换行符分割段落
  const paragraphs = escaped.split(/\n\n+/);

  const htmlParagraphs = paragraphs.map((para) => {
    const trimmed = para.trim();
    if (!trimmed) return '';

    const lines = trimmed.split('\n').map((line) => line.trim());

    // 检查是否为列表项（以数字+点、短横线、圆点开头）
    const isListItem = (line: string) => /^(?:\d+\.|[-•])/.test(line);

    if (lines.every((line) => !line || isListItem(line))) {
      // 全是列表项，渲染为 <ul> 或 <ol>
      const isOrdered = /^\d+\./.test(lines[0]);
      const tag = isOrdered ? 'ol' : 'ul';
      const items = lines
        .filter((line) => line)
        .map((line) => {
          // 去除序号/符号前缀
          const content = line.replace(/^(?:\d+\.|[-•])\s*/, '');
          return `<li>${content}</li>`;
        })
        .join('');
      return `<${tag} class="list-disc list-inside space-y-1">${items}</${tag}>`;
    } else {
      // 普通段落，单个换行转为 <br>
      const content = lines.join('<br>');
      return `<p class="leading-relaxed">${content}</p>`;
    }
  });

  return htmlParagraphs.filter((p) => p).join('');
}
