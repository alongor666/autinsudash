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

type DrilldownDatum = {
  category: string;
  value: number;
  marginalRate: number;
  breakdown?: Record<string, { value: number; marginalRate: number }>;
};

type AnalysisData =
  | SunburstAnalysisDatum[]
  | BarAnalysisDatum[]
  | ExpenseAnalysisDatum[]
  | DrilldownDatum[];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chartType, data, dimension, metrics, fullData } = body;

    // 构建提示词，遵循麦肯锡金字塔原理和车险经营分析最佳实践
    const prompt = buildAnalysisPrompt(chartType, data, dimension, metrics, fullData);

    // 调用Gemini API
    const response = await ai.generate(prompt);

    return NextResponse.json({ analysis: response.text });
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
  fullData?: DrilldownDatum[]
): string {
  const markupGuide = `
**标记语法规范：**
- {metric|标签|数值} - 指标数值（如 {metric|满期边际贡献率|15.5%}，自动根据百分比着色）
- {color|颜色|文本} - 强制颜色（green/blue/yellow/red，如 {color|green|优秀}）
- {change|类型|数值} - 变化标签（rise上升恶化用红色，drop下降优化用绿色）
- {dim|维度|取值} - 维度标签（如 {dim|业务类型|非营客车}）
- {org|类型|名称} - 机构标签（如 {org|三级机构|营业部A}）
- [DRILLDOWN]...[/DRILLDOWN] - 一级下钻区块
- [LEVEL2]...[/LEVEL2] - 二级下钻区块
- [LEVEL3]...[/LEVEL3] - 三级下钻区块

**颜色规则：**
满期边际贡献率：>12%绿色，8-12%蓝色，4-8%黄色，<4%红色
变化趋势：上升/恶化红色，下降/优化绿色`;

  const baseContext = `你是一位资深的车险经营分析专家，擅长运用麦肯锡金字塔原理进行数据洞察。
请基于以下数据，提供简洁、专业的分析报告。

**分析要求：**
1. 遵循金字塔原理：先结论，后论据，层次分明
2. 第一段必须是核心观点（1-2句话），使用标记突出关键指标
3. 第二段展开关键发现（2-3个要点，使用 1. 2. 3. 编号格式）
4. **必须进行三层下钻分析**（如有数据）：
   - 一级：客户类别维度（[DRILLDOWN]块）
   - 二级：业务类型维度（[LEVEL2]块）
   - 三级：三级机构 → 险别组合（[LEVEL3]块）
5. 第三段提供行动建议（1-2个具体建议）
6. 使用车险行业术语，关注经营效益
7. 总字数控制在300字以内（含标记语法）
8. **必须使用标记语法**标注所有关键数据、维度、变化趋势

${markupGuide}

**数据摘要：**
`;

  if (chartType === 'sunburst') {
    const innerLabel = metrics?.inner || '内环指标';
    const outerLabel = metrics?.outer || '外环指标';
    const dimensionLabel = dimension || '维度';

    const summary = (data as SunburstAnalysisDatum[]).slice(0, 5).map(item =>
      `${item.category}: ${innerLabel}=${item.innerValue.toFixed(0)}, ${outerLabel}=${item.outerValue.toFixed(0)}, 边际贡献率=${(item.maturedMarginalContributionRate * 100).toFixed(2)}%`
    ).join('\n');

    return baseContext + `
**图表类型：** ${dimensionLabel}占比图
**分析维度：** ${dimensionLabel}
**指标组合：** 内环=${innerLabel}，外环=${outerLabel}
**TOP5数据：**
${summary}

请基于以上数据，从业务表现、结构特征、优化方向三个角度进行分析。`;
  }

  if (chartType === 'bar') {
    const metricLabel = metrics?.metric || '指标';
    const dimensionLabel = dimension || '维度';

    const summary = (data as BarAnalysisDatum[]).slice(0, 5).map(item =>
      `${item.dimension}: ${item.value.toFixed(0)}, 边际贡献率=${(item.marginalRate * 100).toFixed(2)}%`
    ).join('\n');

    return baseContext + `
**图表类型：** ${dimensionLabel}对比图
**分析维度：** ${dimensionLabel}
**对比指标：** ${metricLabel}
**TOP5数据：**
${summary}

请基于以上数据，从业务分布、差异原因、改进机会三个角度进行分析。`;
  }

  if (chartType === 'expense') {
    const dimensionLabel = dimension || '维度';

    const summary = (data as ExpenseAnalysisDatum[]).slice(0, 5).map(item =>
      `${item.dimension}: 贡献=${(item.contribution / 10000).toFixed(0)}万, 实际费用率=${(item.actualRate * 100).toFixed(2)}%, 与基准差异=${(item.deltaRate * 100).toFixed(2)}%`
    ).join('\n');

    return baseContext + `
**图表类型：** ${dimensionLabel}费用结余图
**分析维度：** ${dimensionLabel}
**基准费用率：** 14%
**TOP5数据：**
${summary}

请基于以上数据，从费用效率、成本管控、优化潜力三个角度进行分析。`;
  }

  return baseContext + '数据格式不支持';
}
