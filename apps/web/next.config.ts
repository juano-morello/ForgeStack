import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker deployments
  // This creates a minimal production build with all dependencies bundled
  output: 'standalone',
  transpilePackages: ['@forgestack/ui', '@forgestack/shared', '@forgestack/db'],
  serverExternalPackages: ['pg'],
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Enable Turbopack file system caching for faster dev server startup
    turbopackFileSystemCacheForDev: true,
  },
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
});

export default withMDX(nextConfig);

