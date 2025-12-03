import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker deployments
  // This creates a minimal production build with all dependencies bundled
  output: 'standalone',
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

