'use client';

// 标记是否为静态导出环境（例如 GitHub Pages）
// 优先使用 NEXT_PUBLIC_* 以确保在客户端可见
export const isStaticExport: boolean =
  process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true' ||
  process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true' ||
  process.env.GITHUB_PAGES === 'true';