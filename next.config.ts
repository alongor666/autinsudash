import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';
// For GitHub Pages project site, set BASE_PATH="/autinsudash" and ASSET_PREFIX="/autinsudash"
const basePath = process.env.BASE_PATH || '';
const assetPrefix = process.env.ASSET_PREFIX || '';

const nextConfig: NextConfig = {
  // Enable static export for GitHub Pages
  output: 'export',
  // Apply basePath/assetPrefix when provided (useful for GitHub Pages under /autinsudash)
  ...(basePath ? { basePath } : {}),
  ...(assetPrefix ? { assetPrefix } : {}),

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // Disable image optimization for static export
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
