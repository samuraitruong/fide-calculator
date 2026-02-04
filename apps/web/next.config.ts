import type { NextConfig } from 'next';

const basePath =
  process.env.BASE_PATH && process.env.BASE_PATH !== '/' ? process.env.BASE_PATH : '';

const isExport = process.env.NEXT_OUTPUT_EXPORT === 'true';

const nextConfig: NextConfig = {
  ...(isExport
    ? {
      output: 'export',
      basePath,
      assetPrefix: basePath ? `${basePath}/` : undefined,
      trailingSlash: true,
      images: { unoptimized: true },
    }
    : {}),
  // Remove ignoreBuildErrors to catch type issues in CI
  eslint: {
    // Temporarily ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
