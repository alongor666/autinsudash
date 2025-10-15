import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用静态导出模式
  output: 'export',
  
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
  
  // 禁用服务端功能
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 静态导出配置
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
