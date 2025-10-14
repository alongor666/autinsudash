/**
 * AI 分析报告标记语法解析器
 *
 * 支持的标记：
 * - {metric|label|value} - 指标数值（根据边际贡献率自动着色）
 * - {color|type|text} - 强制颜色（green/blue/yellow/red）
 * - {change|type|value} - 变化标签（rise 红色恶化，drop 绿色优化）
 * - {dim|label|value} - 维度标签（中性蓝色）
 * - {org|type|name} - 机构标签（特殊样式）
 */


/**
 * 根据满期边际贡献率获取文本颜色样式类
 */
function getRateColorClass(rate: number): string {
  if (!Number.isFinite(rate)) {
    return 'text-gray-600 bg-gray-50';
  }

  if (rate > 12) return 'text-green-700 bg-green-50 border-green-200';
  if (rate >= 8) return 'text-blue-700 bg-blue-50 border-blue-200';
  if (rate >= 4) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

/**
 * 获取变化类型的颜色样式
 */
function getChangeColorClass(type: string): string {
  if (type === 'rise' || type === 'up' || type === '上升' || type === '恶化') {
    return 'text-red-600 bg-red-50 border-red-200';
  }
  if (type === 'drop' || type === 'down' || type === '下降' || type === '优化') {
    return 'text-green-600 bg-green-50 border-green-200';
  }
  return 'text-gray-600 bg-gray-50 border-gray-200';
}

/**
 * 获取强制颜色样式
 */
function getForceColorClass(color: string): string {
  const colorMap: Record<string, string> = {
    green: 'text-green-700 bg-green-50 border-green-200',
    blue: 'text-blue-700 bg-blue-50 border-blue-200',
    yellow: 'text-yellow-700 bg-yellow-50 border-yellow-200',
    red: 'text-red-700 bg-red-50 border-red-200',
    gray: 'text-gray-600 bg-gray-50 border-gray-200',
  };
  return colorMap[color.toLowerCase()] || colorMap.gray;
}

/**
 * 解析 {metric|label|value} 标签
 * 根据 value 中的百分比数值判断边际贡献率区间
 */
function parseMetricTag(label: string, value: string): string {
  // 尝试从 value 中提取百分比数值
  const percentMatch = value.match(/([-+]?\d+\.?\d*)%/);
  let colorClass = 'text-gray-600 bg-gray-50 border-gray-200';

  if (percentMatch) {
    const rate = parseFloat(percentMatch[1]);
    colorClass = getRateColorClass(rate);
  } else {
    // 非百分比值，使用中性色
    colorClass = 'text-blue-700 bg-blue-50 border-blue-200';
  }

  return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-semibold ${colorClass}">${label} ${value}</span>`;
}

/**
 * 解析 {color|type|text} 标签
 */
function parseColorTag(color: string, text: string): string {
  const colorClass = getForceColorClass(color);
  return `<span class="inline-flex items-center px-2 py-0.5 rounded-md border font-semibold ${colorClass}">${text}</span>`;
}

/**
 * 解析 {change|type|value} 标签
 */
function parseChangeTag(type: string, value: string): string {
  const colorClass = getChangeColorClass(type);
  const icon = type === 'rise' || type === 'up' || type === '上升' || type === '恶化'
    ? '↑'
    : '↓';
  return `<span class="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md border font-semibold ${colorClass}">${icon} ${value}</span>`;
}

/**
 * 解析 {dim|label|value} 标签
 */
function parseDimTag(label: string, value: string): string {
  return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium text-indigo-700 bg-indigo-50 border-indigo-200">${label}: ${value}</span>`;
}

/**
 * 解析 {org|type|name} 标签
 */
function parseOrgTag(type: string, name: string): string {
  return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium text-purple-700 bg-purple-50 border-purple-200">🏢 ${name}</span>`;
}

/**
 * 转义 HTML 特殊字符
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 解析单行文本中的所有标签
 */
function parseInlineTags(text: string): string {
  let result = escapeHtml(text);

  // 解析各类标签（注意：在转义后的文本上操作，所以使用转义后的字符）
  // 但标签本身用原始字符匹配
  result = text
    // 先转义 HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    // 解析 {metric|label|value}
    .replace(/\{metric\|([^|]+)\|([^}]+)\}/g, (_, label, value) => {
      return parseMetricTag(label, value);
    })
    // 解析 {color|type|text}
    .replace(/\{color\|([^|]+)\|([^}]+)\}/g, (_, color, text) => {
      return parseColorTag(color, text);
    })
    // 解析 {change|type|value}
    .replace(/\{change\|([^|]+)\|([^}]+)\}/g, (_, type, value) => {
      return parseChangeTag(type, value);
    })
    // 解析 {dim|label|value}
    .replace(/\{dim\|([^|]+)\|([^}]+)\}/g, (_, label, value) => {
      return parseDimTag(label, value);
    })
    // 解析 {org|type|name}
    .replace(/\{org\|([^|]+)\|([^}]+)\}/g, (_, type, name) => {
      return parseOrgTag(type, name);
    })
    // 解析粗体 **text**
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  return result;
}


/**
 * 主解析函数：将 AI 标记文本转换为 HTML
 */
export function parseAIMarkup(text: string): string {
  if (!text) return '';

  // 1. 按双换行符分段
  const paragraphs = text.split(/\n\n+/);

  const htmlParagraphs = paragraphs.map((para) => {
    const trimmed = para.trim();
    if (!trimmed) return '';

    // 处理普通段落和列表
    const lines = trimmed.split('\n').map(line => line.trim());

    // 检查是否为列表项
    const isListItem = (line: string) => /^(?:\d+\.|[-•●])/.test(line);

    if (lines.every(line => !line || isListItem(line))) {
      // 全是列表项
      const isOrdered = /^\d+\./.test(lines[0]);
      const tag = isOrdered ? 'ol' : 'ul';
      const listClass = isOrdered
        ? 'list-decimal list-inside space-y-1.5 text-sm'
        : 'list-disc list-inside space-y-1.5 text-sm';

      const items = lines
        .filter(line => line)
        .map(line => {
          // 去除序号/符号前缀
          const content = line.replace(/^(?:\d+\.|[-•●])\s*/, '');
          const parsed = parseInlineTags(content);
          return `<li class="leading-relaxed">${parsed}</li>`;
        })
        .join('');

      return `<${tag} class="${listClass}">${items}</${tag}>`;
    } else {
      // 普通段落
      const content = lines.map(line => {
        const parsed = parseInlineTags(line);
        return parsed;
      }).join('<br>');

      return `<p class="leading-relaxed text-sm">${content}</p>`;
    }
  });

  return htmlParagraphs.filter(p => p).join('');
}
