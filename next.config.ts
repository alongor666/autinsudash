import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用静态导出模式
  output: 'export',
  
  // 根据环境设置基础路径
  basePath: process.env.NODE_ENV === 'production' ? '/autinsudash' : '',
  
  // 禁用图片优化（静态导出不支持）
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  
  // 忽略构建错误和警告
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 添加尾部斜杠
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
