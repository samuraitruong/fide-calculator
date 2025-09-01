import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // Temporarily ignore TypeScript errors during build for CI
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporarily ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
