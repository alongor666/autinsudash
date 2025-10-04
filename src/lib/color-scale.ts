function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function interpolateChannel(start: number, end: number, factor: number) {
  return Math.round(start + (end - start) * factor);
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

export function interpolateColor(start: string, end: string, factor: number) {
  const startRgb = hexToRgb(start);
  const endRgb = hexToRgb(end);
  const r = interpolateChannel(startRgb.r, endRgb.r, factor);
  const g = interpolateChannel(startRgb.g, endRgb.g, factor);
  const b = interpolateChannel(startRgb.b, endRgb.b, factor);
  return rgbToHex(r, g, b);
}

/**
 * 根据满期边际贡献率获取颜色
 * 颜色规范：
 * - 绿色系：> 12%，数值越大颜色越深
 * - 蓝色系：8%-12% 区间，数值越大颜色越深
 * - 黄色系：4%-8% 区间，数值越小颜色越深
 * - 红色系：< 4% 区间，数值越小颜色越深
 */
export function getMarginalContributionColor(rate: number) {
  if (!Number.isFinite(rate)) {
    return '#d1d5db'; // 灰色，表示无效数据
  }

  // 绿色系：> 12%，数值越大颜色越深
  if (rate > 0.12) {
    const minimum = 0.12;
    const maximum = 0.3; // 假设最大值为30%
    const factor = clamp((rate - minimum) / (maximum - minimum), 0, 1);
    return interpolateColor('#bbf7d0', '#166534', factor); // 浅绿到深绿
  }

  // 蓝色系：8%-12% 区间，数值越大颜色越深
  if (rate >= 0.08 && rate <= 0.12) {
    const minimum = 0.08;
    const maximum = 0.12;
    const factor = clamp((rate - minimum) / (maximum - minimum), 0, 1);
    return interpolateColor('#dbeafe', '#1d4ed8', factor); // 浅蓝到深蓝
  }

  // 黄色系：4%-8% 区间，数值越小颜色越深
  if (rate >= 0.04 && rate < 0.08) {
    const minimum = 0.04;
    const maximum = 0.08;
    const factor = clamp((maximum - rate) / (maximum - minimum), 0, 1); // 注意：数值越小颜色越深
    return interpolateColor('#fef3c7', '#d97706', factor); // 浅黄到深黄
  }

  // 红色系：< 4% 区间，数值越小颜色越深
  if (rate < 0.04) {
    const minimum = -0.1; // 假设最小值为-10%
    const maximum = 0.04;
    const factor = clamp((maximum - rate) / (maximum - minimum), 0, 1); // 注意：数值越小颜色越深
    return interpolateColor('#fecaca', '#991b1b', factor); // 浅红到深红
  }

  // 默认情况（理论上不应该到达这里）
  return '#d1d5db';
}

export function getExpenseContributionColor(delta: number) {
  if (!Number.isFinite(delta) || delta === 0) {
    return '#cbd5f5';
  }

  const maxDelta = 0.2;
  const factor = clamp(Math.abs(delta) / maxDelta, 0, 1);

  if (delta > 0) {
    return interpolateColor('#fecaca', '#991b1b', factor);
  }

  return interpolateColor('#bbf7d0', '#166534', factor);
}
