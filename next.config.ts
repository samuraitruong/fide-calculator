import { NextConfig } from 'next';

const basePath = process.env.BASE_PATH;

const nextConfig: NextConfig = {
  basePath,
  images: {
    unoptimized: true,
  },
  ...(process.env.NEXT_OUTPUT_EXPORT === 'true' ? { output: 'export' } : {}),
};

export default nextConfig;
