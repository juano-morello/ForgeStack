import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Note: 'standalone' output is used for Docker deployments
  // Uncomment when building for production Docker images
  // output: 'standalone',
  transpilePackages: ['@forgestack/ui', '@forgestack/shared', '@forgestack/db'],
  serverExternalPackages: ['pg'],
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Enable Turbopack file system caching for faster dev server startup
    turbopackFileSystemCacheForDev: true,
  },
};

export default nextConfig;

