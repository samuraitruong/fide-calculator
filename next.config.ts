import { NextConfig } from 'next';

const basePath = process.env.BASE_PATH;

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
