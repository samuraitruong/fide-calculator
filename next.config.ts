import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/fide-calculator',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
