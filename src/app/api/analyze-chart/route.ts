import { NextRequest, NextResponse } from 'next/server';
import { ai } from '@/ai/genkit';

type SunburstAnalysisDatum = {
  category: string;
  innerValue: number;
  outerValue: number;
  maturedMarginalContributionRate: number;
};

type BarAnalysisDatum = {
  dimension: string;
  value: number;
  marginalRate: number;
};

type ExpenseAnalysisDatum = {
  dimension: string;
  contribution: number;
  actualRate: number;
  deltaRate: number;
};


type AnalysisData =
  | SunburstAnalysisDatum[]
  | BarAnalysisDatum[]
  | ExpenseAnalysisDatum[]
  | TrendAnalysisDatum[];

type TrendAnalysisDatum = {
  week: number;
  weekLabel: string;
  barValue: number;
  lineValue: number;
  marginalContributionRate: number;
  barColor?: string;
};

type TrendMetricInfo = {
  key: string;
  label: string;
  unit?: string;
  precision?: number;
};

type TrendContext = {
  dimensionLabel?: string;
  dimensionValue?: string;
  dimensionValueLabel?: string;
  barMetric?: TrendMetricInfo;
  lineMetric?: TrendMetricInfo;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      chartType,
      data,
      dimension,
      metrics,
      dimensionLabel,
      dimensionValue,
      dimensionValueLabel,
      barMetric,
      lineMetric,
    } = body;

    // 构建提示词，遵循麦肯锡金字塔原理和车险经营分析最佳实践
    const prompt = buildAnalysisPrompt(
      chartType,
      data,
      dimension,
      metrics,
      {
        dimensionLabel,
        dimensionValue,
        dimensionValueLabel,
        barMetric,
        lineMetric,
      },
    );

    // 调用Gemini API
    const response = await ai.generate(prompt);

    return NextResponse.json({
      analysis: response.text,
      prompt,
      metadata: {
        chartType,
        dimension,
        dimensionLabel,
        dimensionValue,
        dimensionValueLabel,
        metrics,
      }
    });
  } catch (error) {
    console.error('AI分析失败:', error);
    return NextResponse.json(
      { error: '分析失败，请稍后重试' },
      { status: 500 }
    );
  }
}

function buildAnalysisPrompt(
  chartType: string,
  data: AnalysisData,
  dimension?: string,
  metrics?: { inner?: string; outer?: string; metric?: string },
  trendContext?: TrendContext,
): string {
  const markupGuide = `
**标记语法规范：**
- {metric|标签|数值} - 指标数值（如 {metric|满期边际贡献率|15.5%}，自动根据百分比着色）
- {color|颜色|文本} - 强制颜色（green/blue/yellow/red，如 {color|green|优秀}）
- {change|类型|数值} - 变化标签（rise上升恶化用红色，drop下降优化用绿色）
- {dim|维度|取值} - 维度标签（如 {dim|业务类型|非营客车}）
- {org|类型|名称} - 机构标签（如 {org|三级机构|营业部A}）

**颜色规则：**
满期边际贡献率：>12%绿色，8-12%蓝色，4-8%黄色，<4%红色
变化趋势：上升/恶化红色，下降/优化绿色`;

  const baseContext = `你是一位资深的车险经营分析专家，擅长运用麦肯锡金字塔原理进行数据洞察。
请基于以下数据，提供简洁、专业的分析报告。

**分析要求：**
1. 遵循金字塔原理：先结论，后论据，层次分明
2. 第一段必须是核心观点（1-2句话），使用标记突出关键指标
3. 第二段展开关键发现（2-3个要点，使用 1. 2. 3. 编号格式）
4. 第三段提供行动建议（1-2个具体建议）
5. 使用车险行业术语，关注经营效益
6. 总字数控制在200字以内（含标记语法）
7. **必须使用标记语法**标注所有关键数据、维度、变化趋势

${markupGuide}

**数据摘要：**
`;

  if (chartType === 'sunburst') {
    const innerLabel = metrics?.inner || '内环指标';
    const outerLabel = metrics?.outer || '外环指标';
    const dimensionLabel = dimension || '维度';

    const summary = (data as SunburstAnalysisDatum[]).slice(0, 10).map(item =>
      `${item.category}: ${innerLabel}=${item.innerValue.toFixed(0)}, ${outerLabel}=${item.outerValue.toFixed(0)}, 边际贡献率=${(item.maturedMarginalContributionRate * 100).toFixed(2)}%`
    ).join('\n');

    return baseContext + `
**图表类型：** ${dimensionLabel}占比图
**分析维度：** ${dimensionLabel}
**指标组合：** 内环=${innerLabel}，外环=${outerLabel}
**TOP10数据：**
${summary}

**输出示例：**
{dim|客户类别|私家车}以{metric|签单保费|1250万}占比最高，{metric|满期边际贡献率|15.5%}表现{color|green|优秀}。

关键发现：
1. {dim|客户类别|私家车}规模领先，但{dim|业务类型|非营客车}的{metric|边际贡献率|18.2%}更具盈利性
2. {dim|客户类别|货运车辆}的{metric|边际贡献率|3.8%}处于{color|red|红色预警区间}
3. 建议重点发展高边际贡献率业务，优化低盈利产品结构

请严格按照上述格式和标记语法输出分析报告。`;
  }

  if (chartType === 'bar') {
    const metricLabel = metrics?.metric || '指标';
    const dimensionLabel = dimension || '维度';

    const summary = (data as BarAnalysisDatum[]).slice(0, 10).map(item =>
      `${item.dimension}: ${item.value.toFixed(0)}, 边际贡献率=${(item.marginalRate * 100).toFixed(2)}%`
    ).join('\n');

    return baseContext + `
**图表类型：** ${dimensionLabel}对比图
**分析维度：** ${dimensionLabel}
**对比指标：** ${metricLabel}
**TOP10数据：**
${summary}

**输出示例：**
{dim|${dimensionLabel}|排名第一}的{metric|${metricLabel}|1250万}领先，{metric|满期边际贡献率|15.5%}处于{color|green|绿色优秀区间}，较第二名{change|rise|+350万}。

关键发现：
1. 前三名贡献了总量的65%，但{metric|边际贡献率|差异达10pp}
2. 排名靠后的{dim|${dimensionLabel}|某项}虽规模小但{metric|边际贡献率|18.2%}{color|green|盈利性强}
3. 建议聚焦头部优质资源，同时关注高盈利性细分市场

请严格按照上述格式和标记语法输出分析报告。`;
  }

  if (chartType === 'expense') {
    const dimensionLabel = dimension || '维度';

    const summary = (data as ExpenseAnalysisDatum[]).slice(0, 10).map(item =>
      `${item.dimension}: 贡献=${(item.contribution / 10000).toFixed(0)}万, 实际费用率=${(item.actualRate * 100).toFixed(2)}%, 与基准差异=${(item.deltaRate * 100).toFixed(2)}%`
    ).join('\n');

    return baseContext + `
**图表类型：** ${dimensionLabel}费用结余图
**分析维度：** ${dimensionLabel}
**基准费用率：** 14%
**TOP10数据：**
${summary}

**输出示例：**
{dim|${dimensionLabel}|排名第一}的{metric|费用率|12.5%}低于基准线{change|drop|-1.5pp}，{metric|边际贡献率|16.8%}表现{color|green|优秀}，费用管控{color|green|有效}。

关键发现：
1. 有3个${dimensionLabel}超基准线，其中{dim|${dimensionLabel}|某项}{metric|费用率|18.2%}{change|rise|+4.2pp}
2. {dim|${dimensionLabel}|表现优秀项}费用率仅{metric|费用率|10.5%}，可作为标杆
3. 建议对超标项实施费用管控措施，学习标杆经验降低费用率

请严格按照上述格式和标记语法输出分析报告。`;
  }

  if (chartType === 'trend') {
    const trendData = (data as TrendAnalysisDatum[]).slice(-12);
    if (!trendData.length) {
      return baseContext + '暂无可用的趋势数据';
    }

    const dimensionLabel = trendContext?.dimensionLabel || dimension || '分析维度';
    const dimensionValueLabel =
      trendContext?.dimensionValueLabel || trendContext?.dimensionValue || '全部';
    const barMetricLabel = trendContext?.barMetric?.label || '柱状指标';
    const lineMetricLabel = trendContext?.lineMetric?.label || '折线指标';

    const barUnit = trendContext?.barMetric?.unit ?? '';
    const lineUnit = trendContext?.lineMetric?.unit ?? '';
    const barPrecision = trendContext?.barMetric?.precision ?? 0;
    const linePrecision = trendContext?.lineMetric?.precision ?? (lineUnit === '%' ? 2 : 3);

    const formatMetricValue = (value: number, precision: number, unit?: string) => {
      let formatted: string;
      if (precision === 0) {
        formatted = Math.round(value).toLocaleString('zh-CN');
      } else {
        formatted = value.toFixed(precision);
      }
      return unit ? `${formatted}${unit}` : formatted;
    };

    const formatMarginalRate = (value: number) => `${(value * 100).toFixed(2)}%`;

    const summary = trendData
      .map((item) => {
        const barText = formatMetricValue(item.barValue, barPrecision, barUnit);
        const lineText = formatMetricValue(item.lineValue, linePrecision, lineUnit);
        const marginalText = formatMarginalRate(item.marginalContributionRate);
        return `${item.weekLabel}: ${barMetricLabel}=${barText}, ${lineMetricLabel}=${lineText}, 满期边际贡献率=${marginalText}`;
      })
      .join('\n');

    const latest = trendData[trendData.length - 1];
    const latestBar = formatMetricValue(latest.barValue, barPrecision, barUnit);
    const latestLine = formatMetricValue(latest.lineValue, linePrecision, lineUnit);
    const latestMarginal = formatMarginalRate(latest.marginalContributionRate);

    const peakBar = trendData.reduce((max, item) => (item.barValue > max.barValue ? item : max), trendData[0]);
    const troughBar = trendData.reduce((min, item) => (item.barValue < min.barValue ? item : min), trendData[0]);
    const peakLine = trendData.reduce((max, item) => (item.lineValue > max.lineValue ? item : max), trendData[0]);

    const peakBarText = `${peakBar.weekLabel}${barMetricLabel}=${formatMetricValue(peakBar.barValue, barPrecision, barUnit)}`;
    const troughBarText = `${troughBar.weekLabel}${barMetricLabel}=${formatMetricValue(troughBar.barValue, barPrecision, barUnit)}`;
    const peakLineText = `${peakLine.weekLabel}${lineMetricLabel}=${formatMetricValue(peakLine.lineValue, linePrecision, lineUnit)}`;

    return baseContext + `
**图表类型：** 最近12周趋势对比图
**分析维度：** ${dimensionLabel}
**筛选取值：** ${dimensionValueLabel}
**柱状指标：** ${barMetricLabel}
**折线指标：** ${lineMetricLabel}
**最新周概览：** 第${latest.week}周，${barMetricLabel}=${latestBar}，${lineMetricLabel}=${latestLine}，满期边际贡献率=${latestMarginal}
**峰值与低谷：** ${peakBarText}；${troughBarText}；${peakLineText}
**周度数据：**
${summary}

**输出示例：**
{dim|${dimensionLabel}|${dimensionValueLabel}}近12周{metric|${barMetricLabel.replace(/（.*?）/g, '')}|${latestBar}}冲高，{metric|${lineMetricLabel.replace(/（.*?）/g, '')}|${latestLine}}与{metric|满期边际贡献率|${latestMarginal}}{color|blue|联动上行}。

关键发现：
1. 最近三周{metric|${barMetricLabel.replace(/（.*?）/g, '')}|连续抬升}，带动{metric|满期边际贡献率|${latestMarginal}}
2. ${peakBar.weekLabel}{dim|${dimensionLabel}|${dimensionValueLabel}}达到阶段峰值，但${peakLineText}未同步走强
3. ${troughBar.weekLabel}{metric|${barMetricLabel.replace(/（.*?）/g, '')}|下探}，需重点监测费用与赔付释放
4. 建议稳定保费规模，优化费用率和赔付率以提升边际贡献率

请严格按照上述格式和标记语法输出分析报告。`;
  }

  return baseContext + '数据格式不支持';
}
