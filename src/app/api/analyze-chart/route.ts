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

[DRILLDOWN]
{dim|客户类别|私家车}细分：
- {dim|业务类型|非营客车}: {metric|签单保费|800万}，{metric|边际贡献率|16.5%}
- {dim|业务类型|单位客车}: {metric|签单保费|450万}，{metric|边际贡献率|14.2%}
[/DRILLDOWN]

[LEVEL2]
{dim|业务类型|非营客车}机构分布：
- {org|三级机构|营业部A}: {metric|签单保费|320万}，{metric|边际贡献率|18.5%}
- {org|三级机构|营业部B}: {metric|签单保费|280万}，{metric|边际贡献率|15.2%}
[/LEVEL2]

[LEVEL3]
{org|三级机构|营业部A}险别结构：
- {dim|险别组合|车损险+三者险}: {metric|签单保费|180万}，{metric|边际贡献率|20.1%}
- {dim|险别组合|单三者险}: {metric|签单保费|140万}，{metric|边际贡献率|16.8%}
[/LEVEL3]

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

[DRILLDOWN]
{dim|${dimensionLabel}|排名第一}客户类别细分：
- {dim|客户类别|私家车}: {metric|${metricLabel}|800万}，{metric|边际贡献率|16.5%}
- {dim|客户类别|单位客车}: {metric|${metricLabel}|450万}，{metric|边际贡献率|14.2%}
[/DRILLDOWN]

[LEVEL2]
{dim|客户类别|私家车}业务类型分布：
- {dim|业务类型|非营客车}: {metric|${metricLabel}|520万}，{metric|边际贡献率|17.8%}
- {dim|业务类型|其他}: {metric|${metricLabel}|280万}，{metric|边际贡献率|15.2%}
[/LEVEL2]

[LEVEL3]
{dim|业务类型|非营客车}机构与险别：
- {org|三级机构|营业部A} {dim|险别|车损+三者}: {metric|${metricLabel}|180万}，{metric|边际贡献率|19.5%}
- {org|三级机构|营业部B} {dim|险别|单三者}: {metric|${metricLabel}|140万}，{metric|边际贡献率|16.8%}
[/LEVEL3]

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

[DRILLDOWN]
{dim|${dimensionLabel}|费用超标项}客户类别分析：
- {dim|客户类别|货运车辆}: {metric|费用率|22.5%}，主要是{dim|费用类型|手续费}过高
- {dim|客户类别|私家车}: {metric|费用率|15.8%}，{dim|费用类型|宣传费}偏高
[/DRILLDOWN]

[LEVEL2]
{dim|客户类别|货运车辆}业务类型细分：
- {dim|业务类型|营业货运}: {metric|费用率|25.2%}，{change|rise|严重超标}
- {dim|业务类型|非营货车}: {metric|费用率|19.8%}，{change|rise|中度超标}
[/LEVEL2]

[LEVEL3]
{dim|业务类型|营业货运}机构与险别：
- {org|三级机构|营业部C} {dim|险别|车损+三者}: {metric|费用率|28.5%}，{color|red|需重点整改}
- {org|三级机构|营业部D} {dim|险别|单三者}: {metric|费用率|22.8%}，手续费率过高
[/LEVEL3]

请严格按照上述格式和标记语法输出分析报告。`;
  }

  return baseContext + '数据格式不支持';
}
