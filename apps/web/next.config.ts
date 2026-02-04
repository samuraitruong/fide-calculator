import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Remove ignoreBuildErrors to catch type issues in CI
  eslint: {
    // Temporarily ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
